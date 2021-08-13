[back to README.md](../README.md)

# API Reference

### Module exports
```javascript
{
    Connection,
    AgentClient,

    AppSchema,
    DnaSchema,
    ZomeApi,
}
```


## `new Connection( port, host, name )`
A class for communicating with Holochain Conductor's WebSocket.

- `port` - (*required*) the TCP port for WebSocket connection to Conductor API
- `host` - (*optional*) the TCP address for WebSocket connection to Conductor API
  - defaults to `localhost`
- `name` - (*optional*) a unique name for this Connection instance
  - defaults to the connection counter


### `<Connection>.open( timeout ) -> TimeoutPromise<undefined>`
Wait for the WebSocket to be open.

Returns a Promise that resolves when the WebSocket 'open' event has occurred.

Example
```javascript
let conn = new Connection( 12345 );

await conn.open();
```


### `<Connection>.close( timeout ) -> TimeoutPromise<code>`
Initiate closing the WebSocket and wait for the WebSocket to be closed.

- `timeout` - (*optional*) raise `TimeoutError` after # milliseconds
  - defaults to `this.options.timeout`

Returns a Promise that resolves with the status code when the WebSocket 'close' event has occurred.

Example
```javascript
let conn = new Connection( 12345 );

await conn.open();

await conn.close();
```


### `<Connection>.send( type, payload, id ) -> undefined`
Send a `Request` type message and a await for the corresponding `Response` message.

- `type` - (*required*) the message type (`Request`, `Response`, `Signal`)
- `payload` - (*optional*) data corresponding to the message type
  - defaults to `undefined`
- `timeout` - (*optional*) raise `TimeoutError` after # milliseconds
  - defaults to `this.options.timeout`

Returns a Promise that resolves with the status code when the WebSocket 'close' event has occurred.

Example
```javascript
let conn = new Connection( 12345 );

await conn.open();

conn.send("Request", {
    "id": 0,
    "type": "register_dna",
    "args": {
        "path": "/path/to/some.dna",
    },
});
```


### `<Connection>.request( method, args, timeout ) -> TimeoutPromise<code>`
Send a `Request` type message and a await for the corresponding `Response` message.

- `method` - (*required*) the Conductor API method name
- `args` - (*optional*) input corresponding to the given `method`
  - defaults to `null`
- `timeout` - (*optional*) raise `TimeoutError` after # milliseconds
  - defaults to `this.options.timeout`

Returns a Promise that resolves with the response payload when the corresponding `Response` message is received.

Example
```javascript
let conn = new Connection( 12345 );

await conn.open();

let dna_hash = await conn.request("register_dna", {
    "path": "/path/to/some.dna",
});
```



## `new AppSchema( dnas )`
A class for 



## `new DnaSchema( dna_hash )`
A class for 



## `new ZomeApi( connection, name, methods, transformers )`
A class for 



## `new AgentClient( agent, port, host, dnas )`
A class for communicating with Conductor's App interface for a specific Agent.

- `port` - (*required*) the TCP port for WebSocket connection to Conductor API
- `host` - (*optional*) the TCP address for WebSocket connection to Conductor API
  - defaults to `localhost`
- `name` - (*optional*) a unique name for this Connection instance
  - defaults to the connection counter

```javascript
new AgentClient( agent_hash, 12345 );
```



## Failure modes

### `ConductorError`
This error will occur when 

Example
```javascript
// [ConductorError(  )]
//     at 
```
