[back to API.md](./API.md)


# API Reference for `AgentClient` class

## `AgentClient.createFromAppInfo( app_id, connection, timeout, opts )`
Create a client using the data fetched via an app info request.

- `app_id` - (*required*) the installed App ID
- `connection` - (*required*) either
  - an instance of `Connection`
  - or, it is used as the input for `new Connection( connection )`
- `timeout` - (*optional*) timeout used for fetching app info
- `opts` - (*optional*) optional parameters passed through to `new AgentClient( _, _, _, opts )`

Example
```javascript
const client = await AgentClient.createFromAppInfo( "my-app-bundle", 45678 );
```


## `new AgentClient( agent, schema, connection, options )`
A class for communicating with Conductor's App interface with a specific Agent.

- `agent` - (*required*) a 39 byte `Uint8Array` that is an `AgentPubKey`
- `schema` - (*required*) either
  - an instance of `AppSchema`
  - or, it is used as the input for `new AppSchema( schema )`
- `connection` - (*required*) either
  - an instance of `Connection`
  - or, it is used as the input for `new Connection( connection )`
- `options` - optional parameters
- `options.timeout` - timeout in milliseconds used as the default for requests via this client

Example
```javascript
const agent_hash = new HoloHash("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");

const client = new AgentClient( agent_hash, {
    "memory": dna_hash,
}, 45678 );
```


### `<AgentClient>.addProcessor( event, fn ) -> Promise<*>`
Add a callback function for processing call input/output.

- `event` - (*required*) the point when this processor should run
  - options are: `input`, `output`
- `fn` - (*required*) the processor callback function
  - called with `fn.call( request_context, subject, request_context )`


#### Request Context
Values are from `this.call( ... )` arguments
```javascript
{
    "start": Date(),
    "end": null || Date(),
    "dna": dna,
    "zome": zome,
    "func": func,
    "input": payload,
    "timeout": timeout,
    duration () => milliseconds
}
```

Example
```javascript
await client.addProcessor("post", function (result) {
    console.log("Response for request:", this );

    result.created_at = new Date( result.created_at );
    result.bytes = new Uint8Array( result.bytes );
    return result;
});
```


### `<AgentClient>.call( dna, zome, func, payload, timeout ) -> Promise<*>`
Call a DNA's zome function as this Client's agent.

- `dna` - (*required*) the DNA role name matching one in this Client's `AppSchema`
- `zome` - (*required*) the zome name
- `func` - (*required*) the zome function name
- `payload` - (*optional*) the payload corresponding to the zome name and function
- `timeout` - (*optional*) raise `TimeoutError` after # milliseconds
  - defaults to `this.options.timeout`

Returns a Promise that resolves with the zome call response

Example
```javascript
await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```


### `<AgentClient>.close( timeout ) -> Promise<undefined>`
Initiate closing this client's connection.

Returns a Promise that resolves when the Connection has closed.
