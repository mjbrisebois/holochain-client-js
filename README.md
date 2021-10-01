[![](https://img.shields.io/npm/v/@whi/holochain-client/latest?style=flat-square)](http://npmjs.com/package/@whi/holochain-client)

# Holochain Client
A Javascript library for communicating with [Holochain](https://holochain.org) Conductor APIs.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/js-holochain-client?style=flat-square)](https://github.com/mjbrisebois/js-holochain-client/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/js-holochain-client?style=flat-square)](https://github.com/mjbrisebois/js-holochain-client/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/js-holochain-client?style=flat-square)](https://github.com/mjbrisebois/js-holochain-client/pulls)


## Overview
This client is guided by the interfaces defined in the [Holochain](https://github.com/holochain/holochain) project.

- Holochain Conductor's [Admin Interface](https://github.com/holochain/holochain/blob/HEAD/crates/holochain_conductor_api/src/admin_interface.rs)
- Holochain Conductor's [App Interface](https://github.com/holochain/holochain/blob/HEAD/crates/holochain_conductor_api/src/app_interface.rs)


### Holochain Version Map
For information on which versions of this package work for each Holochain release, see
[docs/HolochainVersionMap.md](docs/HolochainVersionMap.md)


### Features

- a Client for Conductor's app interface
- a Client for Conductor's admin interface

## Install

```bash
npm i @whi/holochain-client
```

## Basic Usage

### App Interface

Each example assumes this code is present
```javascript
const { HoloHashTypes } = require('@whi/holochain-client');
const { AgentPubKey, DnaHash } = HoloHashTypes;

const agent_hash = new AgentPubKey("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new DnaHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const app_interface_port = 45678;
```

#### Example

```javascript
const { AgentClient } = require('@whi/holochain-client');

const client = new AgentClient( agent_hash, {
    "memory": dna_hash,
}, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of using `AgentClient` with defined zomes

```javascript
const { AgentClient } = require('@whi/holochain-client');

const client = new AgentClient( agent_hash, {
    "memory": [ dna_hash, [ "mere_memory" ] ],
}, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

#### Example of using `AgentClient` with defined zomes and functions

```javascript
const { AgentClient } = require('@whi/holochain-client');

const client = new AgentClient( agent_hash, {
    "memory": [ dna_hash, {
        "mere_memory": [ "save_bytes", "retrieve_bytes" ],
    }],
}, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```

### Admin Interface

#### Example

```javascript
const { AdminClient } = require('@whi/holochain-client');
const admin_interface_port = 12345;

const admin = new AdminClient( admin_interface_port );

await admin.generateAgent();
```


### API Reference

See [docs/API.md](docs/API.md)

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
