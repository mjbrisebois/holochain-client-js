const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

global.WebSocket			= require('ws');

const why				= require('why-is-node-running');
const expect				= require('chai').expect;
const { Holochain }			= require('@whi/holochain-backdrop');
const { HoloHash }			= require('@whi/holo-hash');

const { AdminClient,
	AgentClient,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_DNA_PATH			= path.join( __dirname, "../dnas/memory.dna" );
const TEST_APP_ID			= "test-app";

let conductor;
let dna_hash;
let agent_hash;
let app_port;


function agent_client_tests () {
    it("should create AgentClient with existing connection", async function () {
	const app			= new AgentClient( agent_hash, {
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
	const admin			= new AdminClient( port );
	agent_hash			= await admin.generateAgent();;
	dna_hash			= await admin.registerDna( TEST_DNA_PATH );
	let installation		= await admin.installApp( TEST_APP_ID, agent_hash, {
	    "memory": dna_hash,
	});
	await admin.activateApp( TEST_APP_ID );

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
