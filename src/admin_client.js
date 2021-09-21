
const { decode }			= require('@msgpack/msgpack');
const { HoloHash,
	HeaderHash,
	EntryHash,
	AgentPubKey,
	DnaHash }			= require('@whi/holo-hash');

const { log,
	set_tostringtag }		= require('./utils.js');
const { DeprecationNotice }		= require('./errors.js');
const { Connection }			= require('./connection.js');


function deprecation_notice ( msg ) {
    const err				= new DeprecationNotice( msg );
    console.error( err );
}

function reformat_app_info ( app_info ) {
    log.debug && log("Reformatting app info: %s", app_info.installed_app_id );

    app_info.slots			= {};
    for ( let slot of Object.values( app_info.cell_data ) ) {
	app_info.slots[slot.cell_nick] = {
	    "cell_id": reformat_cell_id( slot.cell_id ),
	};
    }
    delete app_info.cell_data;

    return app_info;
}

function reformat_cell_id ( cell_id ) {
    return [
	new DnaHash(	 cell_id[0] ),
	new AgentPubKey( cell_id[1] ),
    ];
}

function reformat_cell_errors ( cell_errors ) {
    log.debug && log("Reformatting cell %s errors", cell_errors.length );

    for ( let i in cell_errors ) {
	let [ cell_id, error ]		= cell_errors[i];
	cell_errors[i]			= {
	    "cell_id": reformat_cell_id( cell_id ),
	    "error": error,
	}
    }

    return cell_errors;
}

class AdminClient {
    static APPS_ENABLED			= "Enabled";
    static APPS_DISABLED		= "Disabled";
    static APPS_RUNNING			= "Running";
    static APPS_STOPPED			= "Stopped";
    static APPS_PAUSED			= "Paused";

    constructor ( connection ) {
	this._conn			= connection instanceof Connection
	    ? port
	    : new Connection( connection, { "name": "admin" });
    }

    async _request ( ...args ) {
	if ( this._conn._opened === false ) {
	    log.debug && log("Opening connection '%s' for AdminClient", this._conn.name );
	    await this._conn.open();
	}

	return await this._conn.request( ...args );
    }

    async attachAppInterface ( port ) {
	let resp			= await this._request("attach_app_interface", {
	    "port": port,
	});
	return resp;
    }

    async addAdminInterface ( port ) {
	return await this.addAdminInterfaces( port );
    }

    async addAdminInterfaces ( ...ports ) {
	let resp			= await this._request("add_admin_interfaces", ports.map( port => {
	    return {
		"driver": {
		    "type": "websocket",
		    "port": port,
		},
	    };
	}) );
	return resp;
    }

    async generateAgent () {
	return new AgentPubKey( await this._request("generate_agent_pub_key") );
    }

    async registerDna ( path ) {
	return new DnaHash( await this._request("register_dna", {
	    "path": path,
	}) );
    }

    async installApp ( app_id, agent_hash, dnas ) {
	let installation		= await this._request("install_app", {
	    "installed_app_id": app_id,
	    "agent_key": new AgentPubKey(agent_hash),
	    "dnas": Object.entries( dnas ).map( ([dna_nick, dna_hash]) => {
		return {
		    "hash": new DnaHash(dna_hash),
		    "nick": dna_nick,
		};
	    }),
	});

	return reformat_app_info( installation );
    }

    async uninstallApp ( app_id ) { // -> undefined (expected)
	return await this._request("uninstall_app", {
	    "installed_app_id": app_id,
	});
    }

    async activateApp ( app_id ) { // -> undefined (on purpose for legacy support and to promote 'enableApp'
	deprecation_notice("Holochain admin interface 'activateApp()' is deprecated; use 'enableApp()' instead");

	return await this._request("activate_app", {
	    "installed_app_id": app_id,
	});
    }

    async enableApp ( app_id ) {
	let resp			= await this._request("enable_app", {
	    "installed_app_id": app_id,
	});

	resp.app			= reformat_app_info( resp.app );
	resp.errors			= reformat_cell_errors( resp.errors );

	return resp;
    }

    async disableApp ( app_id ) { // -> undefined (expected)
	return await this._request("disable_app", {
	    "installed_app_id": app_id,
	});
    }

    async startApp ( app_id ) { // -> bool
	return await this._request("start_app", {
	    "installed_app_id": app_id,
	});
    }

    async createCloneCell ( app_id, slot_id, dna_hash, agent_pubkey, options = {} ) { // -> bool
	let cell_id			= await this._request("create_clone_cell", {
	    "installed_app_id":	app_id,
	    "slot_id":		slot_id,
	    "dna_hash":		dna_hash,
	    "agent_key":	agent_pubkey,
	    "properties":	options.properties || null,
	    "membrane_proof":	options.membrane_proof || null,
	});
	return reformat_cell_id( cell_id );
    }

    async listDnas () {
	const dnas			= await this._request("list_dnas");

	dnas.forEach( (dna, i) => {
	    dnas[i]			= new DnaHash( dna );
	});

	log.debug && log("DNAs (%s): %s", dnas.length, dnas );
	return dnas;
    }

    async listCells () {
	const cells			= await this._request("list_cell_ids");

	cells.forEach( (cell, i) => {
	    cells[i]			= [ new DnaHash( cell[0] ), new AgentPubKey( cell[1] ) ];
	});

	log.debug && log("Cells (%s): %s", cells.length, JSON.stringify( cells ) );
	return cells;
    }

    async listApps ( status = "Running" ) { // Holochain's default is 'Running'
	// Enabled,
	// Disabled,
	// Running,
	// Stopped,
	// Paused,
	const apps			= await this._request("list_apps", {
	    "status_filter": {
		[status]: null,
	    },
	});

	log.debug && log("Apps (%s): %s", apps.length, apps.map( x => x.installed_app_id ).join(", ") );
	return apps.map( reformat_app_info );
    }

    async listAppInterfaces () {
	const ifaces			= await this._request("list_app_interfaces");

	log.debug && log("Interfaces (%s): %s", ifaces.length, ifaces );
	return ifaces;
    }

    async listAgents () {
	const agent_infos			= await this.requestAgentInfo();
	const cell_agents			= agent_infos.map( info => info.agent );

	return [ ...new Set( cell_agents ) ];
    }

    async cellState ( dna_hash, agent_hash ) {
	const state_json		= await this._request("dump_state", {
	    "cell_id": [
		new DnaHash( dna_hash ),
		new AgentPubKey( agent_hash ),
	    ],
	});
	const state_resp		= JSON.parse( state_json );
	const state			= state_resp[0];
	const state_summary		= state_resp[1]; // string

	// state.peer_dump.this_agent_info.kitsune_agent
	// state.peer_dump.this_agent_info.kitsune_space
	// state.peer_dump.this_agent_info.dump
	// state.peer_dump.this_dna[0]
	// state.peer_dump.this_dna[1]
	// state.peer_dump.this_agent[0]
	// state.peer_dump.this_agent[1]
	// state.peer_dump.peers[]
	// state.source_chain_dump.elements[0].signature
	// state.source_chain_dump.elements[0].header_address
	// state.source_chain_dump.elements[0].header.type
	// state.source_chain_dump.elements[0].header.author
	// state.source_chain_dump.elements[0].header.timestamp[0]
	// state.source_chain_dump.elements[0].header.timestamp[1]
	// state.source_chain_dump.elements[0].header.hash
	// state.source_chain_dump.elements[0].header.header_seq
	// state.source_chain_dump.elements[0].header.prev_header
	// state.source_chain_dump.elements[0].header.entry_type{App?}
	// state.source_chain_dump.elements[0].header.entry_hash
	// state.source_chain_dump.elements[0].entry.entry_type = "App"
	// state.source_chain_dump.elements[0].entry.entry
	function agent_info ( agent_info ) {
	    return {
		"agent": new Uint8Array( agent_info.kitsune_agent ),
		"space": new Uint8Array( agent_info.kitsune_space ),
	    };
	}

	state.kitsune			= agent_info( state.peer_dump.this_agent_info );
	state.cell			= {
	    "agent": new AgentPubKey(	new Uint8Array(state.peer_dump.this_agent[0]) ),
	    "dna":   new DnaHash(	new Uint8Array(state.peer_dump.this_dna[0])   ),
	};
	state.peers			= state.peer_dump.peers.map( (peer_agent_info) => {
	    return agent_info( peer_agent_info );
	});

	delete state.peer_dump;

	state.source_chain_dump.elements.forEach( (element, i) => {
	    element.signature			= new Uint8Array( element.signature );
	    element.header_address		= new HeaderHash(  new Uint8Array(element.header_address) );
	    element.header.author		= new AgentPubKey( new Uint8Array(element.header.author) );

	    if ( element.header.hash )
		element.header.hash		= new HoloHash(    new Uint8Array(element.header.hash) );

	    if ( element.header.prev_header )
		element.header.prev_header	= new HeaderHash(  new Uint8Array(element.header.prev_header) );

	    if ( element.header.entry_hash ) {
		element.header.entry_hash	= new EntryHash(   new Uint8Array(element.header.entry_hash) );
		try {
		    element.entry.entry		= decode( element.entry.entry );
		} catch (err) {
		    element.entry.entry		= new Uint8Array( element.entry.entry );
		}
	    }
	});

	state.published_ops_count		= state.source_chain_dump.published_ops_count;
	state.source_chain			= state.source_chain_dump.elements;

	delete state.source_chain_dump;

	return state;
    }

    async requestAgentInfo ( cell_id = null ) {
	const infos			= await this._request("request_agent_info", {
	    "cell_id": cell_id,
	});

	infos.forEach( (info, i) => {
	    info.agent			= new AgentPubKey( info.agent );
	    info.signature		= new Uint8Array( info.signature );
	    info.agent_info		= decode( info.agent_info );

	    info.agent_info.agent	= new Uint8Array( info.agent_info.agent );
	    info.agent_info.space	= new Uint8Array( info.agent_info.space );
	    info.agent_info.meta_info	= decode( info.agent_info.meta_info );
	});

	log.debug && log("Infos (%s): %s", infos.length, infos );
	return infos;
    }

    async close ( timeout ) {
	return await this._conn.close( timeout );
    }

    toString () {
	return "AdminClient" + String( this._conn );
    }
}
set_tostringtag( AdminClient, "AdminClient" );


module.exports = {
    AdminClient,
};
