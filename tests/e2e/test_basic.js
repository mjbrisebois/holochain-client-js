import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-basic", process.env.LOG_LEVEL );

import why				from 'why-is-node-running';

import path				from 'path';
import { expect }			from 'chai';

import puppeteer			from 'puppeteer';
import http				from '@whi/http';

import { Holochain }			from '@whi/holochain-backdrop';

import {
    AdminClient,
    AgentClient,
    HoloHashes,
    logging,
}					from '../../src/index.js';

const { HoloHash }			= HoloHashes;

if ( process.env.LOG_LEVEL === "trace" )
    logging();


const TEST_HAPP_PATH			= new URL( "../packs/storage.happ", import.meta.url ).pathname;
console.log( TEST_HAPP_PATH );
const TEST_APP_ID			= "test-app";
const HTTP_PORT				= 2222;

let conductor;
let dna_hash;
let cell_agent_hash;
let app_port;

let browser;
let server;
let page;


async function create_page ( url ) {
    const page				= await browser.newPage();

    page.on("console", async ( msg ) => {
	let args			= await Promise.all( msg.args().map( async (jshandle) => await jshandle.jsonValue() ) );
	if ( args.length === 0 )
	    log.error("\x1b[90mPuppeteer console.log( \x1b[31m%s \x1b[90m)\x1b[0m", msg.text() );
	else {
	    log.trace("\x1b[90mPuppeteer console.log( \x1b[37m"+ args.shift() +" \x1b[90m)\x1b[0m", ...args );
	}
    });

    log.info("Go to: %s", url );
    await page.goto( url, { "waitUntil": "networkidle0" } );

    return page;
}


function agent_client_tests () {
    it("should make request using AgentClient", async function () {
	let result			= await page.evaluate(async function ( agent_hash, dna_hash, app_port ) {
	    const { HoloHash }		= HoloHashes;
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
	}, cell_agent_hash, dna_hash, app_port );

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

	conductor			= new Holochain({
	    "default_loggers": process.env.LOG_LEVEL === "trace",
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

	browser				= await puppeteer.launch();
	server				= new http.server();
	server.serve_local_assets( new URL( "../..", import.meta.url ).pathname );
	server.listen( HTTP_PORT );

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
