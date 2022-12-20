[back to API.md](./API.md)


# API Reference for `AgentClient` class

## `AgentClient.appInfo( app_id, connection, timeout ) -> Promise<object>`
Create a client using the data fetched via an app info request.

- `app_id` - (*required*) the installed App ID
- `connection` - (*required*) either
  - an instance of `Connection`
  - or, it is used as the input for `new Connection( connection )`
- `timeout` - (*optional*) timeout used for fetching app info

Example
```javascript
const app_info = await AgentClient.appInfo( "my-app", 45678 );

// Example response
// {
//     "installed_app_id": "my-app",
//     "status": {
//         "running": null
//     },
//     "roles": {
//         "memory": {
//             "name": "memory",
//             "cell_id": [ dna_hash, agent_hash ],
//             "dna_modifiers": {
//                 "network_seed": "",
//                 "properties": null,
//                 "origin_time": 1658361600000000,
//                 "quantum_time": {
//                     "secs": 300,
//                     "nanos": 0
//                 }
//             },
//             "provisioned": true,
//             "enabled": false
//             "cloned": [],
//         }
//     }
// }

```

## `AgentClient.createFromAppInfo( app_id, connection, timeout, opts ) -> Promise<AgentClient>`
Create a client using the data fetched via an app info request.

- `app_id` - (*required*) the installed App ID
- `connection` - (*required*) either
  - an instance of `Connection`
  - or, it is used as the input for `new Connection( connection )`
- `timeout` - (*optional*) timeout used for fetching app info
- `opts` - (*optional*) optional parameters passed through to `new AgentClient( _, _, _, opts )`

Example
```javascript
const client = await AgentClient.createFromAppInfo( "my-app", 45678 );
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
- `options.capability_agent` - a 39 byte `Uint8Array` that will be set as the signing agent
- `options.signing_handler` - a function for signing zome call input (see
  [`setCapabilityAgent()`](#agentclientsetcapabilityagent-agent-handler-))

Example
```javascript
const agent_hash = new HoloHash("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");

const client = new AgentClient( agent_hash, {
    "memory": dna_hash,
}, 45678 );
```

### `<AgentClient>.appInfo( app_id ) -> Promise<object>`
Alias for `AgentClient.appInfo( app_id, connection )` where this Client's connection will be
automatically used.

### `<AgentClient>.cellAgent( agent )`
Get or set the Cell Agent used as the `AgentPubKey` in Cell IDs.

- `agent` - (*optional*) a 39 byte `Uint8Array` that is an `AgentPubKey`

### `<AgentClient>.capabilityAgent( agent )`
Get or set the Capability Agent used as the signing Agent.

- `agent` - (*optional*) a 39 byte `Uint8Array` that is an `AgentPubKey`

### `<AgentClient>.setSigningHandler( handler )`
Register a handler for signing zome calls.

- `handler` - (*required*) a function that receives the zome call input and returns the modified
  zome call input.

Example use-case for the Holochain Launcher
```javascript
const { invoke } = require('@tauri-apps/api/tauri');

client.setSigningHandler( async zome_call_request => {
    zome_call_request.provenance = Array.from( zome_call_request.provenance );
    zome_call_request.cell_id = [
        Array.from( zome_call_request.cell_id[0] ),
        Array.from( zome_call_request.cell_id[1] ),
    ];
    zome_call_request.payload = Array.from( zome_call_request.payload );
    zome_call_request.nonce = Array.from( zome_call_request.nonce );

    const signedZomeCall = await invoke("sign_zome_call", {
        "zomeCallUnsigned": zome_call_request,
    });

    signedZomeCall.cap_secret = null;
    signedZomeCall.provenance = Uint8Array.from( signedZomeCall.provenance );
    signedZomeCall.cell_id = [
        Uint8Array.from( signedZomeCall.cell_id[0] ),
        Uint8Array.from( signedZomeCall.cell_id[1] ),
    ];
    signedZomeCall.payload = Uint8Array.from( signedZomeCall.payload );
    signedZomeCall.signature = Uint8Array.from( signedZomeCall.signature || [] );
    signedZomeCall.nonce = Uint8Array.from( signedZomeCall.nonce );

    return signedZomeCall;
});
```

### `<AgentClient>.setCapabilityAgent( agent, handler )`
Register a handler for signing zome calls.

- `agent` - (*required*) a 39 byte `Uint8Array` that is an `AgentPubKey`
- `handler` - (*required*) a function that receives the zome call input and returns the modified
  zome call input.

```javascript
const nacl = require('tweetnacl');
const key_pair = nacl.sign.keyPair();
const { hashZomeCall } = require('@whi/holochain-zome-call-hashing');

client.setCapabilityAgent(
    new AgentPubKey( key_pair.publicKey ),
    async zome_call_request => {
        const zome_call_hash = await hashZomeCall( zome_call_request );

        zome_call_request.signature	= nacl.sign( zome_call_hash, key_pair.secretKey )
            .subarray( 0, nacl.sign.signatureLength );

        return zome_call_request;
    }
});
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
