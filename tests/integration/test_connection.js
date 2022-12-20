const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

global.WebSocket			= require('ws');

const why				= require('why-is-node-running');
const expect				= require('chai').expect;
const nacl				= require('tweetnacl');
const { encode, decode }		= require('@msgpack/msgpack');
const { HoloHash, AgentPubKey }		= require('@whi/holo-hash');
const { Holochain }			= require('@whi/holochain-backdrop');
const { hashZomeCall }			= require('@whi/holochain-zome-call-hashing');

const { expect_reject }			= require('./utils.js');
const { Connection,

	DeserializationError,
	TimeoutError,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_HAPP_PATH			= path.join( __dirname, "../packs/storage.happ" );
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
	this.timeout( 10_000 );

	agent_hash			= new HoloHash( await conn.request("generate_agent_pub_key") );
	log.normal("Agent response: %s", agent_hash );

	let installation		= await conn.request("install_app", {
	    "installed_app_id": TEST_APP_ID,
	    "agent_key": agent_hash,
	    "membrane_proofs": {},
	    "path": TEST_HAPP_PATH,
	});
	log.normal("Installed app '%s'", installation.installed_app_id );

	for ( let role_name in installation.cell_info ) {
	    let cells			= installation.cell_info[ role_name ];
	    log.silly("  - %s [ %s::%s ] (provisioned: %s) - %s clones", () => [
		role_name,
		new HoloHash( cells[0].Provisioned.cell_id[0] ),
		new HoloHash( cells[0].Provisioned.cell_id[1] ),
		!!cells[0].Provisioned, cells.length - 1
	    ]);
	}

	dna_hash			= installation.cell_info.storage[0].Provisioned.cell_id[0];

	await conn.request("enable_app", {
	    "installed_app_id": TEST_APP_ID,
	});
	log.normal("Enable app");
    });

    it("should grant unrestricted zome calling for all functions", async function () {
	const cap_grant			= await conn.request("grant_zome_call_capability", {
	    "cell_id": [ dna_hash, agent_hash ],
	    "cap_grant": {
		"tag": "unrestricted-zome-calling",
		"functions": [
		    [ "mere_memory", "save_bytes" ],
		],
		"access": {
		    "Unrestricted": null,
		},
	    },
	});
    });

    it("should call zome function via app interface", async function () {
	const key_pair			= nacl.sign.keyPair();
	const zome_call_request		= {
	    "cap":		null,
	    "cell_id":		[ dna_hash, agent_hash ],
	    "zome_name":	"mere_memory", // if the zome doesn't exist it never responds
	    "fn_name":		"save_bytes", // if the function doesn't exist it is RibosomeError
	    "payload":		encode( Buffer.from("Super important bytes") ),
	    "provenance":	new AgentPubKey( key_pair.publicKey ),
	    "nonce":		nacl.randomBytes( 32 ),
	    "expires_at":	(Date.now() + (5 * 60 * 1_000)) * 1_000,
	};
	const zome_call_hash		= await hashZomeCall( zome_call_request );

	zome_call_request.signature	= nacl.sign( zome_call_hash, key_pair.secretKey )
	    .subarray( 0, nacl.sign.signatureLength );

	const app			= new Connection( app_port );
	await app.open();

	try {
	    let resp			= await app.request("call_zome", zome_call_request );
	    let essence			= decode( resp );
	    let result			= new HoloHash( essence.payload );
	    log.normal("Save bytes response: %s", result );
	} finally {
	    await app.close();
	}
    });
}

function errors_tests () {
    it("should fail to connect because invalid connection input", async function () {
	await expect_reject( async () => {
	    let conn			= new Connection( 83283728 );
	    try {
		await conn.open();
	    } finally {
		await conn.close();
	    }
	}, SyntaxError, "Invalid port" );

	await expect_reject( async () => {
	    let conn			= new Connection( "localhost:37287" );
	    try {
		await conn.open();
	    } finally {
		await conn.close();
	    }
	}, Error, "Failed to open WebSocket" );

	await expect_reject( async () => {
	    let conn			= new Connection( "example.com:37287", {
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
	this.timeout( 10_000 );

	await expect_reject( async () => {
	    await conn.request("invalid_api_endpoint");
	}, DeserializationError, "expected one of" );
    });

    // Connection: undefined payload for type Request
}

describe("Integration: Connection", () => {

    before(async () => {
	conductor			= new Holochain();

	conductor.on("conductor:stdout", line => {
	    log.silly("Conductor STDOUT => %s", line );
	});
	conductor.on("conductor:stderr", line => {
	    if ( line.includes("func_translator") )
		return;

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
