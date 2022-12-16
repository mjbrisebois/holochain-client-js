const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

global.WebSocket			= require('ws');

const why				= require('why-is-node-running');
const expect				= require('chai').expect;
const { Holochain }			= require('@whi/holochain-backdrop');
const { HoloHash }			= require('@whi/holo-hash');

const { expect_reject }			= require('./utils.js');
const { AdminClient,
	AgentClient,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_HAPP_PATH			= path.join( __dirname, "../packs/storage.happ" );
const TEST_APP_ID			= "test-app";

let conductor;
let dna_hash;
let cell_agent_hash;
let app_port;


function agent_client_tests () {
    it("should create AgentClient with existing connection", async function () {
	const app			= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port );

	try {
	    let essence			= await app.call(
		"memory", "mere_memory", "save_bytes", Buffer.from("Super important bytes")
	    );

	    let result			= new HoloHash( essence.payload );
	    log.normal("Save bytes response: %s", result );
	} finally {
	    await app.close();
	}
    });
}

function errors_tests () {
}

describe("Integration: Holochain Client", () => {

    before(async function () {
	this.timeout( 5_000 );

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
	const admin			= new AdminClient( port );
	cell_agent_hash			= await admin.generateAgent();;

	let installation		= await admin.installApp( TEST_APP_ID, cell_agent_hash, TEST_HAPP_PATH );
	await admin.enableApp( TEST_APP_ID );

	dna_hash			= installation.roles.storage.cell_id[0];

	await admin.grantUnrestrictedCapability( "allow-all-for-testing", cell_agent_hash, dna_hash, [
	    [ "mere_memory", "save_bytes" ],
	]);

	let app_iface			= await admin.attachAppInterface();
	app_port			= app_iface.port;

	await admin.close();
    });

    describe("Agent Client",	agent_client_tests );
    describe("Errors",		errors_tests );

    after(async () => {
	await conductor.destroy();

	// setTimeout( () => why(), 1000 );
    });

});
