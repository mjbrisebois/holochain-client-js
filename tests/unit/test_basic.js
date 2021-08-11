const path				= require('path');
const log				= require('@whi/stdlog')(path.basename( __filename ), {
    level: process.env.LOG_LEVEL || 'fatal',
});

const expect				= require('chai').expect;
const { DnaHash }			= require('@whi/holo-hash');
const { DnaSchema,
	...hc_client }			= require('../../src/index.js');

if ( process.env.LOG_LEVEL )
    hc_client.logging();


const dna_hash			= new DnaHash("uhC0kC-2aGmIBCe4XuVa8WbL2xtXqLCSolY0wEGQkLm0EPcA0rA1Q");

function dna_schema_tests () {
    it("should create schema", async function () {
	let dna_schema			= new DnaSchema( dna_hash, [ "mere_memory" ] );
	let zome_api			= dna_schema.zome("mere_memory");

	expect( zome_api		).to.be.a( "ZomeApi" );
    });
}

function errors_tests () {
}

describe("Holochain Client", () => {

    describe("DNA Schema", dna_schema_tests );

});
