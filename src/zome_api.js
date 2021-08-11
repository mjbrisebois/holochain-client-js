
const { encode, decode }		= require('@msgpack/msgpack');

const { log,
	set_tostringtag }		= require('./utils.js');


class ZomeApi {
    constructor ( name, methods = [], tranformers = {} ) {
	this._name			= name;
	this._methods			= methods;
    }

    async call ( connection, agent, dna, func, payload ) {
	if ( this._methods.includes( func ) ) {
	    // check for transformers
	}
	else if ( this._methods !== null && this._methods.length !== 0 ) {
	    throw new Error(`Unknown Zome function: ${func}; expected one of ${ this._methods }`);
	}
	const resp			= await connection.request("zome_call_invocation", {
	    "cap":		null,
	    "cell_id":		[ dna, agent ],
	    "zome_name":	this._name,	// if the zome doesn't exist it never responds
	    "fn_name":		func,		// if the function doesn't exist it is RibosomeError
	    "payload":		encode( payload ),
	    "provenance":	agent,
	});

	return decode( resp );
    }
}
set_tostringtag( ZomeApi, "ZomeApi" );


module.exports = {
    ZomeApi,
};
