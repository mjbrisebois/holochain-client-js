[![](https://img.shields.io/npm/v/@whi/holochain-client/latest?style=flat-square)](http://npmjs.com/package/@whi/holochain-client)

# Holochain Client
A Javascript library for communicating with Holochain Conductor APIs.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/js-holochain-client?style=flat-square)](https://github.com/mjbrisebois/js-holochain-client/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/js-holochain-client?style=flat-square)](https://github.com/mjbrisebois/js-holochain-client/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/js-holochain-client?style=flat-square)](https://github.com/mjbrisebois/js-holochain-client/pulls)


## Overview
This module is intended to provide Javascript classes for...

### Features

- Construct from a 32-byte raw hash

## Install

```bash
npm i @whi/holochain-client
```

## Basic Usage

#### Example of the most straightforward way to call a zome function
```javascript
const { AgentClient } = require('@whi/holochain-client');

const client = new AgentClient( agent_hash, {
    "memory": dna_hash,
}, 12345 );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of using `AgentClient` with designated zomes
```javascript
const { AgentClient, DnaSchema } = require('@whi/holochain-client');

const client = new AgentClient( agent_hash, {
    "memory": new DnaSchema( dna_hash, [ "mere_memory" ] ),
}, 12345 );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of using `AgentClient` with designated zomes and functions
```javascript
const { AgentClient, DnaSchema } = require('@whi/holochain-client');

const client = new AgentClient( agent_hash, {
    "memory": new DnaSchema( dna_hash, {
        "mere_memory": [ "save_bytes", "retrieve_bytes" ],
    }),
}, 12345 );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of defining `AppSchema` and then creating an `AgentClient`
```javascript
const { AppSchema } = require('@whi/holochain-client');

const app_schema = new AppSchema({
    "memory": [ dna_hash, {
        "mere_memory": [ "save_bytes", "retrieve_bytes" ],
    }],
});

const client = app_schema.client( agent_hash, 12345 );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example
```javascript
const { AppSchema } = require('@whi/holochain-client');

const schema = new AppSchema({
    "memory": [ dna_hash, {
        "mere_memory": {
            "save_bytes": [ "uint8array" ],
            "retrieve_bytes": [ "entryhash" ],
        },
    }],
});

schema.dna("memory").zome("mere_memory").transformer("save_bytes", resp => {
    return new Uint8Array( resp );
});

const client = await schema.client( agent, 12345 );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

### API Reference

See [docs/API.md](docs/API.md)

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
