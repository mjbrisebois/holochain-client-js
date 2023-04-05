[back to README.md](README.md)

# Contributing

## Overview
This package is designed to work with Holochain's Conductor API interfaces.

### Class Context Hierarchy

- `new AdminClient( ... )` - manages administrative requests
- `new AgentClient( ... )` - manages Zome interactions for a specific Agent
  - `new AppSchema( ... )` - defines a set of `DnaSchema` instances
    - `new DnaSchema( ... )` - defines a set of `ZomeApi` instances
      - `new ZomeApi( ... )` - manages calling zome functions


## Development

See [docs/API.md](docs/API.md) for detailed API References

### `logging()`
Turns on debugging logs.

```javascript
const { logging } = require('@whi/holochain-client');

logging(); // show debug logs
```

### Environment

- Developed using Node.js `v14.17.3`
- Enter `nix-shell` for other development environment dependencies.

### Building
No build is required for Node.

Bundling with Webpack is supported for web
```
npm run build
```

#### Optimizations

- Using `@msgpack/msgpack` instead of `msgpack-lite` because "lite" only reduced the compressed size
  by 3kb (57kb -> 54kb).  It also caused tests to fail and has less support than the official
  library.

### Testing

To run all tests with logging
```
make test-debug
```

- `make test-unit-debug` - **Unit tests only**
- `make test-integration-debug` - **Integration tests only**

> **NOTE:** remove `-debug` to run tests without logging
