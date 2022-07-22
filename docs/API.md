[back to README.md](../README.md)

# API Reference

Examples assume that the following dependencies are loaded
```javascript
const {
    AdminClient,
    AgentClient,

    Connection,

    AppSchema,
    DnaSchema,
    ZomeApi,

    HoloHashTypes,
} = require('@whi/holochain-client');
const { HoloHash, AgentPubKey, ActionHash, EntryHash, DnaHash } = HoloHashTypes;
```

## [`new AgentClient( ... )`](./API_AgentClient.md)
A class for communicating with Conductor's App interface with a specific Agent.


## [`new AdminClient( ... )`](./API_AdminClient.md)
A class for communicating with Conductor's Admin interface.


## [`new Connection( ... )`](./API_Connection.md)
A class for communicating with Holochain Conductor's WebSocket.


## [`new AppSchema( ... )`](./API_AppSchema.md)
A class for defining an App's DNA architecture.


## [`new DnaSchema( ... )`](./API_DnaSchema.md)
A class for defining a DNA's zome architecture.


## [`new ZomeApi( ... )`](./API_ZomeApi.md)
A class for defining and calling a Zome's API interface.



## Failure modes

Error class hierarchy

- `HolochainClientError`
  - `ConductorError`
  - `DeserializationError`
  - `DnaReadError`
  - `RibosomeError`
  - `RibosomeDeserializeError`
  - `ActivateAppError`
  - `ZomeCallUnauthorizedError`

### `throw new ConductorError( message )`
This error will occur when Conductor returns an error with type `internal_error`.

Example
```
[ConductorError( IO error: ffs::IoError at path './non-existent.dna': No such file or directory (os error 2) )]
```

### `throw new DeserializationError( message )`
This error will occur when Conductor returns an error with type `deserialization`.

Example
```
[DeserializationError( Deserialize("invalid type: map, expected unit variant AdminRequest::ListActiveApps")) )]
```

### `throw new DnaReadError( message )`
This error will occur when Conductor returns an error with type `dna_read_error`.

### `throw new RibosomeError( message )`
This error will occur when Conductor returns an error with type `ribosome_error`.

### `throw new RibosomeDeserializeError( message, zome_call_args )`
This error will occur when Conductor returns an error with type `ribosome_error` and the message
includes `Wasm error while working with Ribosome: Deserialize`.

### `throw new ActivateAppError( message )`
This error will occur when Conductor returns an error with type `activate_app`.

### `throw new ZomeCallUnauthorizedError( message )`
This error will occur when Conductor returns an error with type `zome_call_unauthorized`.


## Module exports
```javascript
{
    AdminClient,
    AgentClient,

    Connection,

    AppSchema,
    DnaSchema,
    ZomeApi,

    HoloHash: require('@whi/holo-hash').HoloHash,
    HoloHashTypes: require('@whi/holo-hash'),

    // Error classes
    TimeoutError,

    HolochainClientError,

    ConductorError,
    DeserializationError,
    DnaReadError,
    RibosomeError,
    RibosomeDeserializeError,
    ActivateAppError,
    ZomeCallUnauthorizedError,
}
```
