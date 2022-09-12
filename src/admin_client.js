
const { decode }			= require('@msgpack/msgpack');
const { HoloHash,
	ActionHash,
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
	app_info.slots[slot.role_id] = {
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

function deep_compare ( a, b ) {
    for ( let i in a ) {
	if ( a[i] === b[i] )
	    continue;

	const c				= a[i];
	const d				= b[i];

	if ( typeof c === "object" ) {
	    if ( typeof d !== "object" ) // object's have a higher value than primitives
		return 1;

	    const sub_sort		= deep_compare( c, d );

	    if ( sub_sort === 0 )
		continue;
	    else
		return sub_sort;
	}

	if ( typeof d === "object" )
	    return -1;

	if ( c > d )
	    return 1;
	else
	    return -1;
    }

    return 0;
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
	// The response value is 'undefined' but we return it anyway in case Conductor starts
	// sending feedback.
	return resp;
    }

    async generateAgent () {
	return new AgentPubKey( await this._request("generate_agent_pub_key") );
    }

    async registerDna ( path, options ) {
	options				= Object.assign( {}, {
	    "properties": null,
	    "network_seed": null, // overrite bundle DNAs
	}, options );

	let input			= {
	    "properties": options.properties,
	    "network_seed": options.network_seed,
	};

	if ( path instanceof HoloHash )
	    input.hash			= path;
	else
	    input.path			= path;

	return new DnaHash( await this._request("register_dna", input ) );
    }

    async installApp ( app_id = null, agent_hash, dnas ) {
	if ( !app_id )
	    app_id			= ( Math.random() * 1e17 ).toString(16).slice(-8);

	let installation		= await this._request("install_app", {
	    "installed_app_id": app_id,
	    "agent_key": new AgentPubKey(agent_hash),
	    "dnas": Object.entries( dnas ).map( ([role_id, dna_hash]) => {
		return {
		    "hash": new DnaHash(dna_hash),
		    "role_id": role_id,
		};
	    }),
	});

	return reformat_app_info( installation );
    }

    async installAppBundle ( app_id = null, agent_hash, path, options ) {
	options				= Object.assign( {}, {
	    "membrane_proofs": {},
	    "network_seed": null, // overrite bundle DNAs
	}, options );

	if ( app_id === "*" )
	    app_id			= ( Math.random() * 1e17 ).toString(16).slice(0,8);

	let installation		= await this._request("install_app_bundle", {
	    "installed_app_id": app_id,
	    "path": path,
	    "agent_key": new AgentPubKey(agent_hash),
	    "membrane_proofs": options.membrane_proofs,
	    "network_seed": options.network_seed,
	});

	return reformat_app_info( installation );
    }

    async uninstallApp ( app_id ) { // -> undefined (expected)
	return await this._request("uninstall_app", {
	    "installed_app_id": app_id,
	});
    }

    // DEPRECATED in Holochain
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

    // Even if no properties change, the Conductor will generate a network seed so that it does not
    // conflict with the Cell being cloned.
    async createCloneCell ( app_id, slot_id, dna_hash, agent_pubkey, options = {} ) { // -> bool
	const input			= {
	    "installed_app_id":	app_id,				// where to put new cell
	    "role_id":		slot_id,			// role ID for new cell
	    "dna_hash":		dna_hash,			// DNA to be cloned
	    "agent_key":	agent_pubkey,			// Agent for cell
	    "properties":	options.properties || null,	// new properties
	    "membrane_proof":	options.membrane_proof || null, // proof for DNA, if required
	};
	let cell_id			= await this._request("create_clone_cell", input );

	return reformat_cell_id( cell_id );
    }

    async listDnas () {
	const dnas			= await this._request("list_dnas");

	dnas.forEach( (dna, i) => {
	    dnas[i]			= new DnaHash( dna );
	});
	dnas.sort( deep_compare );

	log.debug && log("DNAs (%s): %s", dnas.length, dnas );
	return dnas;
    }

    async listCells () {
	const cells			= await this._request("list_cell_ids");

	cells.forEach( (cell, i) => {
	    cells[i]			= [ new DnaHash( cell[0] ), new AgentPubKey( cell[1] ) ];
	});
	cells.sort( deep_compare );

	log.debug && log("Cells (%s): %s", cells.length, JSON.stringify( cells ) );
	return cells;
    }

    async listApps ( status = "Running" ) { // Holochain's default is 'Running'
	// Enabled,
	// Disabled,
	// Running,
	// Stopped,
	// Paused,
	status				= status.charAt(0).toUpperCase() + status.slice(1);
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
	ifaces.sort();

	log.debug && log("Interfaces (%s): %s", ifaces.length, ifaces );
	return ifaces;
    }

    async listAgents () {
	const agent_infos			= await this.requestAgentInfo();
	const cell_agents			= agent_infos.map( info => info.agent.toString() );

	const unique_agents			= [ ...new Set( cell_agents ) ]
	      .map( hash => new AgentPubKey(hash) );
	unique_agents.sort( deep_compare );

	return unique_agents;
    }

    async cellState ( dna_hash, agent_hash, start, end ) {
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
	// state.source_chain_dump.records[0].signature
	// state.source_chain_dump.records[0].action_address
	// state.source_chain_dump.records[0].action.type
	// state.source_chain_dump.records[0].action.author
	// state.source_chain_dump.records[0].action.timestamp[0]
	// state.source_chain_dump.records[0].action.timestamp[1]
	// state.source_chain_dump.records[0].action.hash
	// state.source_chain_dump.records[0].action.action_seq
	// state.source_chain_dump.records[0].action.prev_action
	// state.source_chain_dump.records[0].action.entry_type{App?}
	// state.source_chain_dump.records[0].action.entry_hash
	// state.source_chain_dump.records[0].entry.entry_type = "App"
	// state.source_chain_dump.records[0].entry.entry
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

	if ( start || end ) {
	    state.source_chain_dump.records	= state.source_chain_dump.records.slice( start, end );
	}

	state.source_chain_dump.records.forEach( (record, i) => {
	    record.signature			= new Uint8Array( record.signature );
	    record.action_address		= new ActionHash(  new Uint8Array(record.action_address) );
	    record.action.author		= new AgentPubKey( new Uint8Array(record.action.author) );

	    if ( record.action.hash )
		record.action.hash		= new HoloHash(    new Uint8Array(record.action.hash) );

	    if ( record.action.prev_action )
		record.action.prev_action	= new ActionHash(  new Uint8Array(record.action.prev_action) );

	    if ( record.action.entry_hash ) {
		record.action.entry_hash	= new EntryHash(   new Uint8Array(record.action.entry_hash) );
		try {
		    const length		= record.entry.entry.length;
		    record.entry.entry		= decode( record.entry.entry );
		    record.entry.length	= length;
		} catch (err) {
		    record.entry.entry		= new Uint8Array( record.entry.entry );
		}
	    }

	    // CreateLink properties
	    if ( record.action.base_address )
		record.action.base_address	= new EntryHash(   new Uint8Array(record.action.base_address) );
	    if ( record.action.target_address )
		record.action.target_address	= new EntryHash(   new Uint8Array(record.action.target_address) );

	    if ( record.action.tag ) {
		const prefix			= record.action.tag.slice(0,8).map( n => String.fromCharCode(n) ).join("");

		if ( prefix === "hdk.path" ) {
		    const bytes			= record.action.tag.slice(11);
		    const segments		= [];
		    let segment			= [];
		    let uint32			= [];
		    bytes.forEach( (n, i) => {
			// If we are at the start of a new byte
			if ( n !== 0
			     && bytes[i-1] === 0
			     && bytes[i-2] === 0
			     && bytes[i-3] === 0 ) {
			    // If the length is greater than 4, then we want to reset the segment as
			    // well as the uint32
			    if ( uint32.length > 4 ) {
				segments.push( new Uint8Array(segment) );

				segment		= [];
				segment.push( ...uint32.slice(-4) );

				uint32		= [];
			    }
			    else {
				segment.push( ...uint32 );
				uint32		= [];
			    }
			}

			uint32.push( n );
		    });

		    segment.push( ...uint32 );
		    segments.push( new Uint8Array(segment) );


		    segments.forEach( (seg, i) => {
			const codes		= new Uint32Array( seg.buffer, seg.byteOffset, seg.byteLength / 4 );
			segments[i]		= [].map.call( codes, n => String.fromCharCode(n) ).join("");
		    });

		    record.action.tag_string	= segments.join(".");
		}
		else {
		    record.action.tag_string	= "hdk.path(" + record.action.tag.map( n => String.fromCharCode(n) ).join("") + ")";
		}

		record.action.tag		= new Uint8Array( record.action.tag );
	    }
	});

	state.published_ops_count		= state.source_chain_dump.published_ops_count;
	state.source_chain			= state.source_chain_dump.records;

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
