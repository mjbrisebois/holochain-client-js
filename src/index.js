
const { TimeoutError }			= require('@whi/promise-timeout');
const { HoloHash,
	HeaderHash,
	EntryHash,
	AgentPubKey,
	DnaHash,
	base64 }			= require('@whi/holo-hash');

const { log,
	set_tostringtag }		= require('./utils.js');
const { ...ErrorTypes }			= require('./errors.js');
const { AppSchema, DnaSchema }		= require('./schemas.js');
const { Connection }			= require('./connection.js');
const { ZomeApi }			= require('./zome_api.js');
const { AdminClient }			= require('./admin_client.js');



class AgentClient {
    constructor ( agent, app_schema, ...args ) {
	this._agent			= agent;
	this._app_schema		= app_schema instanceof AppSchema
	    ? app_schema
	    : new AppSchema( app_schema );

	if ( args[0] instanceof Connection ) {
	    let [ conn ] = args;
	    this._conn			= conn;
	}
	else if ( typeof args[0] === "number" ) {
	    let [ port, host ] = args;
	    this._conn			= new Connection( port, host );
	}
	else {
	    throw new TypeError(`Invalid arguments for AgentClient: ${ args.map(a => typeof a) }`)
	}
    }

    async call ( dna_nickname, zome, func, payload ) {
	if ( this._conn._opened === false ) {
	    log.debug && log("Opening connection '%s' for AgentClient", this._conn.name );
	    await this._conn.open();
	}

	let dna_schema			= this._app_schema.dna( dna_nickname );
	let zome_api			= dna_schema.zome( zome );

	return await zome_api.call(
	    this._conn,
	    this._agent,
	    dna_schema.hash(),
	    func,
	    payload
	);
    }

    async close ( timeout ) {
	return await this._conn.close( timeout );
    }
}
set_tostringtag( AgentClient, "AgentClient" );



module.exports = {
    Connection,

    AppSchema,
    DnaSchema,

    AdminClient,
    AgentClient,

    ZomeApi,

    ...ErrorTypes,
    TimeoutError,

    HoloHash,

    logging () {
	log.debug			= true;
    },
};
