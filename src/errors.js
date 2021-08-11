
const { set_tostringtag }		= require('./utils.js');

class CustomError extends Error {
    static [Symbol.toPrimitive] ( hint ) {
	return hint === "number" ? null : `[${this.name} {}]`;
    }

    constructor( ...params ) {
	super( ...params );

	if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, this.constructor);
	}

	this.name		= this.constructor.name;
    }

    [Symbol.toPrimitive] ( hint ) {
	return hint === "number" ? null : this.toString();
    }

    toString () {
	return `[${this.constructor.name}( ${this.message} )]`;
    }

    toJSON ( debug = false ) {
	return {
	    "error":	this.name,
	    "message":	this.message,
	    "stack":	debug === true
		? typeof this.stack === "string" ? this.stack.split("\n") : this.stack
		: undefined,
	};
    }
}
set_tostringtag( CustomError );

class Warning extends CustomError {}
set_tostringtag( Warning, "Warning" );

class HolochainClientError extends CustomError {}
set_tostringtag( HolochainClientError, "HolochainClientError" );

// InternalError(String)
class ConductorError extends HolochainClientError {}
set_tostringtag( ConductorError, "ConductorError" );

// Deserialization(String)
class DeserializationError extends HolochainClientError {}
set_tostringtag( DeserializationError, "DeserializationError" );

// DnaReadError(String),
class DnaReadError extends HolochainClientError {}
set_tostringtag( DnaReadError, "DnaReadError" );

// RibosomeError(String),
class RibosomeError extends HolochainClientError {}
set_tostringtag( RibosomeError, "RibosomeError" );

// ActivateApp(String),
class ActivateAppError extends HolochainClientError {}
set_tostringtag( ActivateAppError, "ActivateAppError" );

// ZomeCallUnauthorized(String),
class ZomeCallUnauthorizedError extends HolochainClientError {}
set_tostringtag( ZomeCallUnauthorizedError, "ZomeCallUnauthorizedError" );


module.exports = {
    HolochainClientError,
    Warning,

    ConductorError,
    DeserializationError,
    DnaReadError,
    RibosomeError,
    ActivateAppError,
    ZomeCallUnauthorizedError,
};
