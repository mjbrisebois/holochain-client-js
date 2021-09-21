const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

global.WebSocket			= require('ws');

const why				= require('why-is-node-running');
const expect				= require('chai').expect;
const puppeteer				= require('puppeteer');
const http				= require('@whi/http');
const { Holochain }			= require('@whi/holochain-backdrop');
const { HoloHash }			= require('@whi/holo-hash');

const { Connection,
	AdminClient,
	AgentClient,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const TEST_DNA_PATH			= path.join( __dirname, "../dnas/memory.dna" );
const TEST_APP_ID			= "test-app";
const HTTP_PORT				= 2222;

let conductor;
let dna_hash;
let agent_hash;
let app_port;

let browser;
let server;
let page;


async function create_page ( url ) {
    const page				= await browser.newPage();

    page.on("console", async ( msg ) => {
	let args			= await Promise.all( msg.args().map( async (jshandle) => await jshandle.jsonValue() ) );
	if ( args.length === 0 )
	    log.error("\033[90mPuppeteer console.log( \033[31m%s \033[90m)\033[0m", msg.text() );
	else {
	    log.silly("\033[90mPuppeteer console.log( \033[37m"+ args.shift() +" \033[90m)\033[0m", ...args );
	}
    });

    log.info("Go to: %s", url );
    await page.goto( url, { "waitUntil": "networkidle0" } );

    return page;
}


function agent_client_tests () {
    it("should create AgentClient with existing connection", async function () {
	let result			= await page.evaluate(async function ( agent_hash, dna_hash, app_port ) {
	    let { AgentClient,
		  HoloHash,
		  logging }		= HolochainClient;

	    logging();

	    const app			= new AgentClient( agent_hash, {
		"memory": dna_hash,
	    }, app_port );

	    try {
		let essence		= await app.call(
		    "memory", "mere_memory", "save_bytes", new Uint8Array([
			 83, 117, 112, 101, 114,  32,
			105, 109, 112, 111, 114, 116,
			 97, 110, 116,  32,  98, 121,
			116, 101, 115
		    ]),
		);

		return String( new HoloHash( essence.payload ) );
	    } finally {
		await app.close();
	    }
	}, agent_hash, dna_hash, app_port );

	log.normal("Save bytes response: %s", result );
	expect( result			).to.be.a("string");

	new HoloHash( result );
    });
}

function errors_tests () {
}

describe("E2E: Holochain Client", () => {

    before(async function () {
	this.timeout( 10_000 );

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
	agent_hash			= await admin.generateAgent();;
	dna_hash			= await admin.registerDna( TEST_DNA_PATH );
	let installation		= await admin.installApp( TEST_APP_ID, agent_hash, {
	    "memory": dna_hash,
	});
	await admin.enableApp( TEST_APP_ID );

	let app_iface			= await admin.attachAppInterface();
	app_port			= app_iface.port;

	await admin.close();

	browser				= await puppeteer.launch();
	server				= new http.server();
	server.serve_local_assets( path.resolve( __dirname, "../../" ) );
	server.listen( HTTP_PORT )

	const test_url			= `http://localhost:${HTTP_PORT}/tests/e2e/index.html`;
	page				= await create_page( test_url );
    });

    describe("Agent Client",	agent_client_tests );
    describe("Errors",		errors_tests );

    after(async () => {
	await conductor.destroy();

	server.close();
	await page.close();
	await browser.close();

	// setTimeout( () => why(), 1000 );
    });

});
