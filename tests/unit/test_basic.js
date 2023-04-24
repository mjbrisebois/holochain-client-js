import { Logger }			from '@whi/weblogger';
const log				= new Logger("test-basic", process.env.LOG_LEVEL );

import { expect }			from 'chai';
import {
    DnaSchema,
    HoloHashes,
    logging,
}					from '../../src/index.js';

const { DnaHash }			= HoloHashes;

if ( process.env.LOG_LEVEL )
    logging();


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

describe("Unit: Holochain Client", () => {

    describe("DNA Schema", dna_schema_tests );

});
