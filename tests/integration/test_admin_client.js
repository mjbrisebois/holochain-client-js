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
const json				= require('@whi/json');

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
let admin;
let dna_hash;
let agent_hash;
let app_port;


function basic_tests () {
    it("should attach app interface", async function () {
	let resp			= await admin.attachAppInterface();
	log.info("Attach App Interface response: %s", resp );
	app_port			= resp.port;
    });

    it("should generate agent", async function () {
	agent_hash			= await admin.generateAgent();;
	log.normal("Agent response: %s", agent_hash );
    });

    it("should register DNA", async function () {
	dna_hash			= await admin.registerDna( TEST_DNA_PATH );
	log.normal("Register response: %s", dna_hash );
    });

    it("should install app", async function () {
	let installation		= await admin.installApp( TEST_APP_ID, agent_hash, {
	    "memory": dna_hash,
	});
	log.normal("Installed app '%s'", installation.installed_app_id );

	Object.entries( installation.slots ).forEach( ([nick, slot]) => {
	    log.silly("  %s => %s (provisioned: %s) - %s clones (limit: %s) ", () => [
		nick.padEnd(15), slot.base_cell_id,
		slot.is_provisioned, slot.clones.length, slot.clone_limit
	    ]);
	});
    });

    it("should activate app", async function () {
	await admin.activateApp( TEST_APP_ID );
	log.normal("Activated app");
    });

    it("should list DNAs", async function () {
	const dnas			= await admin.listDnas();

	expect( dnas			).to.have.length( 1 );
	expect( dnas[0]			).to.deep.equal( dna_hash );
    });

    it("should list cells", async function () {
	const cells			= await admin.listCells();

	expect( cells			).to.have.length( 1 );
	expect( cells[0][0]		).to.deep.equal( dna_hash );
	expect( cells[0][1]		).to.deep.equal( agent_hash );
    });

    it("should list apps", async function () {
	const apps			= await admin.listApps( admin.APPS_ENABLED );

	expect( apps			).to.have.length( 1 );
	expect( apps[0]			).to.equal( TEST_APP_ID );
    });

    it("should list app interfaces", async function () {
	const ifaces			= await admin.listAppInterfaces();

	expect( ifaces			).to.have.length( 1 );
	expect( ifaces[0]		).to.be.a("number");
    });

    it("should list agents", async function () {
	const agents			= await admin.listAgents();

	expect( agents			).to.have.length( 1 );
	expect( agents[0]		).to.deep.equal( agent_hash );
    });

    it("should request agent info", async function () {
	const agents			= await admin.requestAgentInfo();

	expect( agents			).to.have.length( 1 );
	expect( agents[0].agent		).to.deep.equal( agent_hash );
    });

    it("should call zome function", async function () {
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

    it("should get cell state", async function () {
	const state			= await admin.cellState( dna_hash, agent_hash );

	// log.silly("Cell state dump => %s", json.debug( state ) );

	expect( state.source_chain	).to.have.length.gte( 3 );
    });
}

function errors_tests () {
    it("should call admin API method with invalid args", async function () {
	await expect_reject( async () => {
	    await admin.attachAppInterface( 1 );
	}, ConductorError, "Permission denied" );
    });

    // register: non-existent DNA path
    it("should fail to register because bad path", async function () {
	await expect_reject( async () => {
	    await admin.registerDna( "./non-existent.dna" );
	}, ConductorError, "No such file or directory" );
    });

    // install: non-existent DNA hash
    it("should fail to register because bad path", async function () {
	await expect_reject( async () => {
	    let bad_hash		= dna_hash.getHash();
	    bad_hash[0]			= 0;

	    await admin.installApp( "failed-install", agent_hash, {
		"bad": bad_hash,
	    });
	}, DnaReadError, "has not been registered" );
    });

    // activate: non-existent app ID
    it("should fail to activate because invalid app ID", async function () {
	await expect_reject( async () => {
	    await admin.activateApp( "invalid-app-id" );
	}, ConductorError, "AppNotInstalled" );
    });
}

describe("Admin Client", () => {

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

	admin				= new AdminClient( port );
    });

    describe("Basic",		basic_tests );
    describe("Errors",		errors_tests );

    after(async () => {
	await admin.close();
	log.silly("%s => Connection is closed", admin.toString() );

	await conductor.destroy();

	// setTimeout( () => why(), 1000 );
    });

});
