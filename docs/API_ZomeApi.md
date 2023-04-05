[back to API.md](./API.md)


# API Reference for `ZomeApi` class

## `new ZomeApi( name, methods )`
A class for defining and calling a Zome's API interface.

- `name` - (*required*) the Zome name
- `methods` - (*optional*) an array of zome function names
  - defaults to any function name is allowed

Example
```javascript
const zome_api = new ZomeApi( "mere_memory" );
```

Example with defined methods
```javascript
const zome_api = new ZomeApi( "mere_memory", [
    "save_bytes",
    "retrieve_bytes",
]);
```


### `<ZomeApi>.call( connection, agent, dna, zome, func, payload, timeout ) -> Promise<*>`
Make an "App interface" `zome_call` via the given `connection` class.

- `connection` - (*required*) an instance of [`Connection`](https://npmjs.com/package/@whi/holochain-websocket)
- `agent` - (*required*) a 39 byte `Uint8Array` that is an `AgentPubKey`
- `dna` - (*required*) a 39 byte `Uint8Array` that is a `DnaHash`
- `zome` - (*required*) the zome name
- `func` - (*required*) the zome function name
- `payload` - (*optional*) the payload corresponding to the zome name and function
- `timeout` - (*optional*) raise `TimeoutError` after # milliseconds
  - defaults to the timeout set in the `Connection` class

Returns a Promise that resolves with the zome call response

Example
```javascript
const conn = new Connection( 45678 );
const agent_hash = new HoloHash("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");

await zome_api.call(
    conn,
    agent_hash,
    dna_hash,
    "mere_memory",
    "save_bytes",
    Buffer.from("Hello World")
);
// Uint8Array(39) [
//   132,  33,  36, 147,   5,  83, 188, 155,
//   170,  41,  27, 108, 144, 237,  66,  65,
//   169,  49, 231,  95, 214,  63, 206, 135,
//   101, 224, 147, 122, 238, 179, 185, 106,
//   178, 101, 117,  43, 244, 136,  88
// ]
```
