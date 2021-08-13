[back to README.md](README.md)

# Contributing

## Overview
This package is designed to match Holochain's `holo_hash` crate (https://crates.io/crates/holo_hash)

### Class Context Hierarchy

- `new DnaSchema( dna_hash )` - defines DNA and available zomes
  - `new ZomeApi( _, name, methods, transformers )` - defines Zome and available functions
  - `new AgentClient( agent, connection )` - manages Zome interactions for a specific Agent
    - `new Connection( port, host )` - manages transport context.
- `new AppSchema( dnas )` - manages several `DnaSchema` instances


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

### Building

Bundled with Webpack
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
