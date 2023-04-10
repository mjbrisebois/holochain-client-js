[back to README.md](README.md)

# Contributing

## Overview
This package simply couples the agent/admin clients into a single import.

- [`@whi/holochain-agent-client`](https://www.npmjs.com/package/@whi/holochain-agent-client)
- [`@whi/holochain-admin-client`](https://www.npmjs.com/package/@whi/holochain-admin-client)


## Development

See [docs/API.md](docs/API.md) for detailed API References

### `logging()`
Turns on debugging logs.

```javascript
import { logging } from '@whi/holochain-client';

logging(); // show debug logs
```

### Environment

- Developed using Node.js `v18.14.2`
- Enter `nix develop` for development environment dependencies.

### Building
No build is required for Node.

Bundling with Webpack is supported for web
```
npx webpack
```

### Testing

To run all tests with logging
```
make test-debug
```

- `make test-unit-debug` - **Unit tests only**
- `make test-integration-debug` - **Integration tests only**

> **NOTE:** remove `-debug` to run tests without logging
