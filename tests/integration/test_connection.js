const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

global.WebSocket			= require('ws');

const why				= require('why-is-node-running');
const expect				= require('chai').expect;
const { encode, decode }		= require('@msgpack/msgpack');
const { Holochain }			= require('@whi/holochain-backdrop');
const { HoloHash }			= require('@whi/holo-hash');

const { expect_reject }			= require('./utils.js');
const { Connection,
	AdminClient,
	AgentClient,

	ConductorError,
	DeserializationError,
        DnaReadError,
	RibosomeError,
	ActivateAppError,
	ZomeCallUnauthorizedError,
	TimeoutError,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_DNA_PATH			= path.join( __dirname, "../dnas/memory.dna" );
const TEST_APP_ID			= "test-app";

let conductor;
let conn;
let dna_hash;
let agent_hash;
let app_port;


function connection_tests () {
    it("should call admin API method", async function () {
	log.silly("Sending 'attach app interface'");
	let resp			= await conn.request("attach_app_interface", {} );
	log.info("Awaited 'app interface': %s", resp );

	app_port			= resp.port;
    });

    it("should install app and activate", async function () {
	agent_hash			= new HoloHash( await conn.request("generate_agent_pub_key") );
	log.normal("Agent response: %s", agent_hash );

	dna_hash			= new HoloHash( await conn.request("register_dna", {
	    "path": TEST_DNA_PATH,
	}) );
	log.normal("Register response: %s", dna_hash );

	let installation		= await conn.request("install_app", {
	    "installed_app_id": TEST_APP_ID,
	    "agent_key": agent_hash,
	    "dnas": [
		{
		    "hash": dna_hash,
		    "nick": "memory",
		}
	    ],
	});
	log.normal("Installed app '%s'", installation.installed_app_id );
	for ( let dna_nick in installation.slots ) {
	    let slot			= installation.slots[dna_nick];
	    log.silly("  - %s [ %s::%s ] (provisioned: %s) - %s clones (limit: %s) ", () => [
		dna_nick,
		new HoloHash( slot.base_cell_id[0] ),
		new HoloHash( slot.base_cell_id[1] ),
		slot.is_provisioned, slot.clones.length, slot.clone_limit
	    ]);
	}

	await conn.request("activate_app", {
	    "installed_app_id": TEST_APP_ID,
	});
	log.normal("Activated app");
    });

    it("should call zome function via app interface", async function () {
	const zome_call_request		= {
	    "cap":		null,
	    "cell_id":		[ dna_hash, agent_hash ],
	    "zome_name":	"mere_memory", // if the zome doesn't exist it never responds
	    "fn_name":		"save_bytes", // if the function doesn't exist it is RibosomeError
	    "payload":		encode( Buffer.from("Super important bytes") ),
	    "provenance":	agent_hash,
	};
	const app			= new Connection( app_port );
	await app.open();

	try {
	    let resp			= await app.request("zome_call_invocation", zome_call_request );
	    let essence			= decode( resp );
	    let result			= new HoloHash( essence.payload );
	    log.normal("Save bytes response: %s", result );
	} finally {
	    await app.close();
	}
    });
}

function errors_tests () {
    it("should fail to connect because ", async function () {
	await expect_reject( async () => {
	    let conn			= new Connection();
	    try {
		await conn.open();
	    } finally {
		await conn.close();
	    }
	}, SyntaxError, "Invalid port" );

	await expect_reject( async () => {
	    let conn			= new Connection( 37287, "localhost" );
	    try {
		await conn.open();
	    } finally {
		await conn.close();
	    }
	}, Error, "ECONNREFUSED" );

	await expect_reject( async () => {
	    let conn			= new Connection( 37287, "example.com", {
		"timeout": 100,
	    });
	    try {
		await conn.open();
	    } finally {
		await conn.close();
	    }
	}, TimeoutError );
    });

    it("should call invalid API method", async function () {
	await expect_reject( async () => {
	    await conn.request("invalid_api_endpoint");
	}, DeserializationError, "expected one of" );
    });

    // Connection: undefined payload for type Request
}

describe("Connection", () => {

    before(async () => {
	conductor			= new Holochain();

	conductor.on("conductor:stdout", line => {
	    log.silly("Conductor STDOUT => %s", line );
	});
	conductor.on("conductor:stderr", line => {
	    log.silly("Conductor STDERR => %s", line );
	});

	await conductor.start();

	const port			= conductor.adminPorts()[0];
	conn				= new Connection( port );

	await conn.open();
	log.silly("%s => Connection is open", conn.toString() );
    });

    describe("Connection",	connection_tests );
    describe("Errors",		errors_tests );

    after(async () => {
	await conn.close();
	log.silly("%s => Connection is closed", conn.toString() );

	await conductor.destroy();

	// setTimeout( () => why(), 1000 );
    });

});
