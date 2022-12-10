
const { encode, decode }		= require('@msgpack/msgpack');

const { log,
	set_tostringtag }		= require('./utils.js');


function randomBytes ( length ) {
    if ( typeof window === "object" )
	return window.crypto.getRandomValues(new Uint8Array(32));

    const bytes				= [];
    let i = 0;
    while (i < length) {
	try {
	    bytes.push( Math.floor(Math.random()*256) )
	} finally {
	    i++;
	}
    }
    return new Uint8Array( bytes );
}


class ZomeApi {
    constructor ( name, methods = [] ) {
	this._name			= name;
	this._methods			= methods;
	this._timeout;
    }

    async call ( connection, agent, dna, func, payload, signing_handler, timeout ) {
	if ( this._methods.includes( func ) ) {
	    // TODO: implement transformers
	}
	else if ( this._methods !== null && this._methods.length !== 0 ) {
	    throw new Error(`Unknown Zome function: ${func}; expected one of ${ this._methods }`);
	}

	const zomeCall		= {
	    "provenance":	agent,
	    "cell_id":		[ dna, agent ],
	    "zome_name":	this._name,
	    "fn_name":		func,
	    "payload":		encode( payload ),
	    "nonce":		randomBytes( 32 ),
	    "expires_at":	(Date.now() + (5 * 60 * 1000)) * 1000,
	};
	const signedZomeCall		= await signing_handler( zomeCall );

	if ( !signedZomeCall.signature )
	    log.debug && log("WARNING: Signed zome call is missing the signature property");

	const resp			= await connection.request("zome_call", signedZomeCall, timeout || this._timeout );

	return decode( resp );
    }
}
set_tostringtag( ZomeApi, "ZomeApi" );


module.exports = {
    ZomeApi,
};
