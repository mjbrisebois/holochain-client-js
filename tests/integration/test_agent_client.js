const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

global.WebSocket			= require('ws');

const why				= require('why-is-node-running');
const expect				= require('chai').expect;
const nacl				= require('tweetnacl');
const { encode, decode }		= require('@msgpack/msgpack');
const { Holochain }			= require('@whi/holochain-backdrop');
const { HoloHash, AgentPubKey }		= require('@whi/holo-hash');

const { expect_reject }			= require('./utils.js');
const { Connection,
	AdminClient,
	AgentClient,

	ConductorError,
	DeserializationError,
        DnaReadError,
	RibosomeError,
	RibosomeDeserializeError,
	ActivateAppError,
	ZomeCallUnauthorizedError,
	TimeoutError,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_HAPP_PATH			= path.join( __dirname, "../packs/storage.happ" );
const TEST_APP_ID			= "test-app";

const TEST_HAPP_CLONES_PATH		= path.join( __dirname, "../packs/storage_with_clones.happ" );
const TEST_APP_CLONES_ID		= `${TEST_APP_ID}-bundle-clones`;

let conductor;
let dna_hash;
let cell_agent_hash;
let app_port;


function basic_tests () {
    it("should create AgentClient with existing connection", async function () {
	this.timeout( 5_000 );

	const conn			= new Connection( app_port );
	const app			= new AgentClient( cell_agent_hash, {
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
	const app			= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port );

	const app_info			= await app.appInfo( TEST_APP_ID );

	expect( app_info.installed_app_id		).to.equal( TEST_APP_ID );
	expect( app_info.roles.storage.provisioned	).to.be.true;
	expect( app_info.roles.storage.cloned		).to.have.length( 0 );

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

    it("should create AgentClient with app info", async function () {
	const app			= await AgentClient.createFromAppInfo( TEST_APP_ID, app_port );

	try {
	    expect( Object.keys(app._app_schema._dnas) ).to.have.length( 1 );
	} finally {
	    await app.close();
	}
    });

    it("should create AgentClient with input/ouput processors", async function () {
	const app			= await AgentClient.createFromAppInfo( TEST_APP_ID, app_port );

	app.addProcessor("output", function (essence) {
	    expect( this.dna		).to.equal("storage");
	    expect( this.zome		).to.equal("mere_memory");
	    expect( this.func		).to.equal("save_bytes");

	    expect( this.start		).to.be.a("Date");
	    expect( this.end		).to.be.null;
	    expect( this.duration()	).to.be.a("number")

	    return new HoloHash( essence.payload );
	});

	try {
	    let result			= await app.call(
		"storage", "mere_memory", "save_bytes", Buffer.from("Super important bytes")
	    );

	    log.normal("Save bytes response: %s", result );
	    expect( result		).to.be.an("EntryHash");
	} finally {
	    await app.close();
	}
    });

    it("should create AgentClient with custom agent/signing", async function () {
	const key_pair			= nacl.sign.keyPair();
	const app			= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port, {
	    "agent": new AgentPubKey( key_pair.publicKey ),
	    "signingHandler": async ( zome_call_request ) => {
		const { hashZomeCall }	= await import('@holochain/serialization');
		const zome_call_hash	= await hashZomeCall( zome_call_request );

		zome_call_request.signature	= nacl.sign( zome_call_hash, key_pair.secretKey )
		    .subarray( 0, nacl.sign.signatureLength );

		return zome_call_request;
	    },
	});

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

    it("should create AgentClient then set capability agent", async function () {
	const key_pair			= nacl.sign.keyPair();
	const app			= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port );

	app.setCapabilityAgent(
	    new AgentPubKey( key_pair.publicKey ),
	    async ( zome_call_request ) => {
		const { hashZomeCall }	= await import('@holochain/serialization');
		const zome_call_hash	= await hashZomeCall( zome_call_request );

		zome_call_request.signature	= nacl.sign( zome_call_hash, key_pair.secretKey )
		    .subarray( 0, nacl.sign.signatureLength );

		return zome_call_request;
	    }
	);

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

    it("should create clone cell", async function () {
	this.skip();

	const app			= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port );

	const cell_id			= await app.createCloneCell(
	    TEST_APP_CLONES_ID, "storage", dna_hash, cell_agent_hash, {
		"properties": {
		    "admin": String(cell_agent_hash),
		},
	    }
	);
	console.log( json.debug(cell_id) );

	expect( cell_id[0]		).to.not.deep.equal( dna_hash );
	expect( cell_id[1]		).to.deep.equal( cell_agent_hash );
    });
}

function errors_tests () {
    let app;

    beforeEach(async () => {
	log.info("Creating AgentClient for error tests");
	app				= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port );
    });

    // non-existent zome
    it("should fail because non-existent zome", async function () {
	await expect_reject( async () => {
	    await app.call("memory", "nonexistent", "oops", {}, 10 );
	}, ConductorError, "Zome 'nonexistent' not found" );
    });

    // non-existent zome function
    it("should fail because non-existent zome function", async function () {
	await expect_reject( async () => {
	    await app.call("memory", "mere_memory", "nonexistent");
	}, RibosomeError, "zome function that doesn't exist" );
    });

    // zome function not granted
    it("should fail because zome function not in grant", async function () {
	await expect_reject( async () => {
	    await app.call("memory", "mere_memory", "notgranted", {}, 10 );
	}, ZomeCallUnauthorizedError, "not authorized with reason BadCapGrant" );
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

    // fail cloning
    it("should fail to clone cell because clone limit", async function () {
	this.skip();

	const app			= new AgentClient( cell_agent_hash, {
	    "memory": dna_hash,
	}, app_port );

	await expect_reject( async () => {
	    const result		= await app.createCloneCell(
		TEST_APP_CLONES_ID, "storage", {
		    "network_seed": "different",
		}
	    );
	    console.log( result );
	}, ConductorError, "CloneLimitExceeded" );
    });

}

describe("Integration: Agent Client", () => {

    before(async function () {
	this.timeout( 15_000 );

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

	let installation		= await admin.installApp( TEST_APP_ID, cell_agent_hash, TEST_HAPP_PATH, {
	    "network_seed": Math.random().toString(),
	});
	await admin.enableApp( TEST_APP_ID );

	dna_hash			= installation.roles.storage.cell_id[0];

	let app_info			= await admin.installApp( TEST_APP_CLONES_ID, cell_agent_hash, TEST_HAPP_CLONES_PATH, {
	    "network_seed": Math.random().toString(),
	});
	log.normal("Installed app '%s' [state: %s]", app_info.installed_app_id, app_info.status );

	await admin.grantUnrestrictedCapability( "allow-all-for-testing", cell_agent_hash, dna_hash, {
	    "mere_memory": [
		"save_bytes",
		"nonexistent",
	    ],
	});

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
