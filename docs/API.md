[back to README.md](../README.md)

# API Reference

Examples assume that the following dependencies are loaded
```javascript
const {
    AdminClient,
    AgentClient,

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


## [`new AppSchema( ... )`](./API_AppSchema.md)
A class for defining an App's DNA architecture.


## [`new DnaSchema( ... )`](./API_DnaSchema.md)
A class for defining a DNA's zome architecture.


## [`new ZomeApi( ... )`](./API_ZomeApi.md)
A class for defining and calling a Zome's API interface.


## Module exports
```javascript
{
    AdminClient,
    AgentClient,

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
