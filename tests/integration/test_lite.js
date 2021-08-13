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
const { AdminClient }			= require('../../src/index.js');
const { Connection,
	AgentClient,

	RibosomeError,
	RibosomeDeserializeError,
	TimeoutError,
	...hc_client }			= require('../../lite.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_DNA_PATH			= path.join( __dirname, "../dnas/memory.dna" );
const TEST_APP_ID			= "test-app";

let conductor;
let dna_hash;
let agent_hash;
let app_port;


function basic_tests () {
    it("should create AgentClient with existing connection", async function () {
	const conn			= new Connection( app_port );
	const app			= new AgentClient( agent_hash, {
	    "memory": dna_hash,
	}, conn );

	try {
	    let essence			= await app.call(
		"memory", "mere_memory", "save_bytes", Buffer.from("Super important bytes")
	    );

	    let result			= new HoloHash( essence.payload );
	    log.normal("Save bytes response: %s", result );
	} finally {
	    await conn.close();
	}
    });

    it("should create AgentClient with new connection", async function () {
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
    let app;

    beforeEach(async () => {
	log.info("Creating AgentClient for error tests");
	app				= new AgentClient( agent_hash, {
	    "memory": dna_hash,
	}, app_port );
    });

    // non-existent zome
    it("should fail because non-existent zome", async function () {
	await expect_reject( async () => {
	    await app.call("memory", "nonexistent", "oops", {}, 10 );
	}, TimeoutError, "get response for request 'zome_call'" );
    });

    // non-existent zome function
    it("should fail because non-existent zome function", async function () {
	await expect_reject( async () => {
	    await app.call("memory", "mere_memory", "nonexistent");
	}, RibosomeError, "zome function that doesn't exist" );
    });

    // zome function invalid input
    it("should fail because non-existent zome function", async function () {
	await expect_reject( async () => {
	    await app.call("memory", "mere_memory", "save_bytes", [ "wrong_input".repeat(4) ] );
	}, RibosomeDeserializeError, "Failed to deserialize input for 'mere_memory->save_bytes'" );
    });

    afterEach(async () => {
	log.info("Closing AgentClient for error tests");
	await app.close();
    });

    // fail capability check
}

describe("Integration: Agent Client (Lite)", () => {

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

    describe("Basic",		basic_tests );
    describe("Errors",		errors_tests );

    after(async () => {
	await conductor.destroy();

	// setTimeout( () => why(), 1000 );
    });

});
