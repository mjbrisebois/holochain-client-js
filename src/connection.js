
const { encode, decode }		= require('@msgpack/msgpack');
const { PromiseTimeout }		= require('@whi/promise-timeout');

const { log,
	set_tostringtag,
	str_eclipse_end,
	str_eclipse_start }		= require('./utils.js');
const { READY_STATES }			= require('./constants.js');
const { ...ErrorTypes }			= require('./errors.js');
const { ConductorError,
	DeserializationError,
	DnaReadError,
	RibosomeError,
	RibosomeDeserializeError,
	ActivateAppError,
	ZomeCallUnauthorizedError }	= ErrorTypes;


const uri_scheme_regexp			= /^[A-Za-z0-9.\-+]+\:\/\//;

const DEFAULT_CONNECTION_OPTIONS	= {
    "timeout": 15_000,
    "host": "localhost",
    "secure": false,
};

let connection_id			= 0;

class Connection {
    constructor ( address, options = {} ) {
	this.options			= Object.assign( {}, DEFAULT_CONNECTION_OPTIONS, options );

	const uri_scheme		= this.options.secure === true ? "wss://" : "ws://";
	// `address` could be
	//
	//   1. `<port>` using options.host as host
	//   2. `"<host>:<port>"`
	//   3. `"<full address>"`
	//
	// Where the scheme will be prepended for 1 and 2 as "ws://"
	// - or "wss://" if options.secure is true)
	//
	if ( typeof address === "number" ) {
	    if ( ! (address > 0 && address < 65_536) )
		throw new SyntaxError("Invalid port: ${address}; must be between 1..65536");

	    this._uri			= uri_scheme + `${this.options.host}:${address}`;
	}
	else if ( typeof address === "string" ) {
	    if ( uri_scheme_regexp.test( address ) )
		this._uri		= address;
	    else
		this._uri		= uri_scheme + address;
	}
	else
	    throw new TypeError("Invalid address input: ${typeof address}; expected number or string");

	new URL( this._uri ); // Check if valid URI

	this._conn_id			= connection_id++;
	this.name			= this.options.name ? `${this._conn_id}:` + this.options.name : String( this._conn_id );

	this._msg_count			= 0;
	this._pending			= {};
	this._socket			= null;

	this._opened			= false;
	this._open			= new Promise( (f,r) => {
	    this._open_f		= f;
	    this._open_r		= r;
	});

	this._closed			= false;
	this._close			= new Promise( f => {
	    this._close_f		= f;
	});

	try {
	    log.debug && this._log("Opening connection to: %s", this._uri );
	    this._socket		= new WebSocket( this._uri );
	    this._socket.binaryType	= "arraybuffer";

	    this._socket.onerror	= ( event ) => {
		if ( this._opened === false )
		    this._open_r( event.error );
		else {
		    console.error(`${this} socket error:`, event.error );
		    // this.emit("error", event.error );
		}
	    };

	    this._socket.onopen		= () => {
		log.debug && this._log("Received 'open' event");
		this._opened		= true;
		this._open_f();
	    };

	    this._socket.onclose	= ( event ) => {
		log.debug && this._log("Received 'close' event (code: %s): %s", event.code, event.reason );
		this._closed		= true;
		this._close_f( event.code );
	    };

	    this._socket.onmessage	= ( event ) => {
		this._message_handler( event.data );
	    };
	} catch (err) {
	    console.error(err);
	    this._open_r(err);
	}

	log.debug && this._log("Initialized new Connection()");
    }

    open ( timeout ) {
	if ( timeout === undefined )
	    timeout			= this.options.timeout;

	return new PromiseTimeout( this._open.then.bind(this._open), timeout, "open WebSocket" );
    }

    close ( timeout ) {
	if ( timeout === undefined )
	    timeout			= this.options.timeout;

	log.debug && this._log("Closing connection on puprose");
	this._socket.close( 1000, "I'm done with this socket" );

	return new PromiseTimeout( this._close.then.bind(this._close), timeout, "close WebSocket" );
    }

    send ( type, payload, id ) {
	if ( this._socket === null )
	    throw new Error(`Cannot send message until socket is open: ${this}`);

	const msg			= {
	    "type":	type,
	    "data":	encode( payload ),
	};

	if ( id !== undefined )
	    msg.id			= id;

	const packed_msg		= encode( msg );

	log.debug && this._log("Ready state '%s'", this._socket.readyState );
	if ( this._socket.readyState !== this._socket.OPEN ) {
	    throw new Error(`${this} => Socket is not open`);
	}

	this._socket.send( packed_msg );
    }

    request ( method, args = null, timeout ) {
	if ( timeout === undefined )
	    timeout			= this.options.timeout;

	const payload			= {
	    "type": method,
	    "data": args,
	};

	const stack			= (new Error("")).stack.split("\n").slice(1).join("\n");

	return new PromiseTimeout( (f,r) => {
	    const id			= this._msg_count++;

	    this._pending[id]		= {
		method,
		args,
		"resolve": f,
		"reject": r,
		stack,
	    };

	    this.send( "Request", payload, id );
	}, timeout, `get response for request '${method}'` );
    }

    _log ( msg, ...args ) {
	log(`${this} => ${msg}`, ...args );
    }

    async _message_handler ( packed_msg ) {
	try {
	    log.debug && this._log("WebSocket message: %s bytes", packed_msg.byteLength );
	    let msg			= decode( packed_msg );

	    log.debug && this._log("Message type '%s': { %s }", msg.type, Object.keys(msg).join(", ") );

	    if ( msg.type === "Response" )
		await this._handle_response( msg );
	    else if ( msg.type === "Signal" )
		await this._handle_signal( msg );
	    else
		console.error("Unknown message type:", msg.type, msg );
	} catch (err) {
	    console.error(err);
	}
    }

    async _handle_response ( response ) {
	const id			= response.id;
	const request			= this._pending[id];

	delete this._pending[id];

	if ( [ null, undefined ].includes( response.data ) )
	    throw new Error(`Response cancelled by Conductor`);

	if ( request.resolve === undefined )
	    throw new Error(`There is no pending request for response ID: ${id}`);

	if ( typeof request.resolve !== "function" )
	    throw new Error(`Broken state: pending request value is not a function: ${typeof f}`);

	const payload			= decode( response.data );
	log.debug && this._log("Response payload type '%s': { %s }", payload.type, Object.keys(payload).join(", ") );

	if ( payload.type === "error" ) {
	    const type			= payload.data.type;
	    const message		= payload.data.data;
	    log.debug && this._log("Response error type '%s': { %s }", type, Object.keys(payload.data).join(", ") );

	    let err			= new Error( message );
	    if ( type === "internal_error" ) {
		err			= new ConductorError( message );
	    }
	    else if ( type === "deserialization" ) {
		err			= new DeserializationError( message );
	    }
	    else if ( type === "dna_read_error" ) {
		err			= new DnaReadError( message );
	    }
	    else if ( type === "ribosome_error" ) {
		if ( message.includes("Wasm error while working with Ribosome: Deserialize") )
		    err			= new RibosomeDeserializeError( message, request.args );
		else
		    err			= new RibosomeError( message );
	    }
	    else if ( type === "activate_app" ) {
		err			= new ActivateAppError( message );
	    }
	    else if ( type === "zome_call_unauthorized" ) {
		err			= new ZomeCallUnauthorizedError( message );
	    }
	    else {
		// Unknown
		console.error("Unknown error type: %s", type );
	    }

	    err.stack			= err.stack.split("\n")[0] + "\n" + request.stack;

	    log.debug && this._log("Calling reject for request %s: %s", id, String(err) );
	    return request.reject( err );
	}
	else {
	    return request.resolve( payload.data );
	}
    }

    toJSON () {
	return this.toString();
    }

    toString () {
	let ctx				= this._socket ? `[${ READY_STATES[this._socket.readyState] }]` : "[N/A]";
	return `${ str_eclipse_end( this.name, 8 ) } ${ str_eclipse_start( this._uri, 25 ) } ${ ctx.padStart(12) }`;
    }
}
set_tostringtag( Connection, "Connection" );


module.exports = {
    Connection,
};
