[![](https://img.shields.io/npm/v/@whi/holochain-client/latest?style=flat-square)](http://npmjs.com/package/@whi/holochain-client)

# Holochain Client
A Javascript library for communicating with [Holochain](https://holochain.org) Conductor APIs.

[![](https://img.shields.io/github/issues-raw/mjbrisebois/holochain-client-js?style=flat-square)](https://github.com/mjbrisebois/holochain-client-js/issues)
[![](https://img.shields.io/github/issues-closed-raw/mjbrisebois/holochain-client-js?style=flat-square)](https://github.com/mjbrisebois/holochain-client-js/issues?q=is%3Aissue+is%3Aclosed)
[![](https://img.shields.io/github/issues-pr-raw/mjbrisebois/holochain-client-js?style=flat-square)](https://github.com/mjbrisebois/holochain-client-js/pulls)


## Overview
This client is guided by the interfaces defined in the [Holochain](https://github.com/holochain/holochain) project.


### Holochain Version Map
For information on which versions of this package work for each Holochain release, see
[docs/Holochain_Version_Map.md](docs/Holochain_Version_Map.md)


### Features

- [`new AgentClient(...)`](https://www.npmjs.com/package/@whi/holochain-agent-client) -
  a Javascript client for communicating with Holochain's App Interface API
- [`new AdminClient(...)`](https://www.npmjs.com/package/@whi/holochain-admin-client) -
  a Javascript client for communicating with Holochain's Admin Interface API


## Install

```bash
npm i @whi/holochain-client
```

## Basic Usage

```javascript
import { AgentClient, AdminClient } from '@whi/holochain-client';
```

Access full default exports for each sub-package
```javascript
import {
    HolochainAgentClient,
    HolochainAdminClient,
} from '@whi/holochain-client';

const { AgentClient } = HolochainAgentClient;
const { AdminClient } = HolochainAdminClient;
```


### API Reference

See [docs/API.md](docs/API.md)

### Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
