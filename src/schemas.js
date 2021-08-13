
const { log,
	set_tostringtag }		= require('./utils.js');
const { ZomeApi }			= require('./zome_api.js');


class AppSchema {
    constructor ( structure = {} ) {
	this._dnas			= {};

	if ( Array.isArray( structure ) ) {
	    structure			= structure.reduce( (acc, dna_nick) => {
		acc[dna_nick]		= null;
		return acc;
	    }, {} );
	}

	for ( let [dna_nick, dna_input] of Object.entries(structure) ) {
	    let dna_hash		= dna_input;
	    let dna_struct		= {};

	    if ( Array.isArray( dna_input ) ) {
		dna_hash		= dna_input[0];
		dna_struct		= dna_input[1];
	    }

	    this._dnas[dna_nick]	= new DnaSchema( dna_hash, dna_struct );
	}

	this._dna_nicknames		= Object.keys( this._dnas );
    }

    dna ( nickname ) {
	if ( this._dnas[ nickname ] === undefined )
	    throw new Error(`Unknown DNA nickname: ${nickname}; expected one of ${ this._dna_nicknames }`);

	return this._dnas[ nickname ];
    }
}
set_tostringtag( AppSchema, "AppSchema" );


class DnaSchema {
    constructor ( hash, structure = {} ) {
	this._hash			= hash;
	this._zomes			= {};

	if ( Array.isArray( structure ) ) {
	    structure			= structure.reduce( (acc, zome_name) => {
		acc[zome_name]		= null;
		return acc;
	    }, {} );
	}

	for ( let [zome_name, zome_funcs] of Object.entries(structure) ) {
	    this._zomes[zome_name]	= new ZomeApi( zome_name, zome_funcs );
	}

	this._zome_names		= Object.keys( this._zomes );
    }

    zome ( name ) {
	if ( this._zome_names.length === 0 )
	    return new ZomeApi( name );

	if ( !this._zome_names.includes( name ) )
	    throw new Error(`Unknown Zome name: ${name}; expected one of ${ this._zome_names }`);

	return this._zomes[ name ];
    }

    hash () {
	return this._hash;
    }
}
set_tostringtag( DnaSchema, "DnaSchema" );


module.exports = {
    AppSchema,
    DnaSchema,
};
