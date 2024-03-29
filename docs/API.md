[back to README.md](../README.md)

# API Reference

## [`@whi/holochain-agent-client`](https://github.com/mjbrisebois/holochain-agent-client-js/blob/master/docs/API.md)
A Javascript client for communicating with Holochain's App Interface API.


## [`@whi/holochain-admin-client`](https://github.com/mjbrisebois/holochain-admin-client-js/blob/master/docs/API.md)
A Javascript client for communicating with Holochain's Admin Interface API.


## Module exports
```javascript
{
    HolochainAgentClient, // default export from @whi/holochain-agent-client
    HolochainAdminClient, // default export from @whi/holochain-admin-client
    logging,

    // Forwarded from @whi/holochain-admin-client
    AdminClient,
    DeprecationNotice,

    // Forwarded from @whi/holochain-agent-client
    AgentClient,
    AppSchema,
    DnaSchema,
    ZomeApi,

    sha512,
    hash_secret,
    reformat_app_info,
    reformat_cell_id,

    // Forwarded from @whi/holochain-serialization
    hashZomeCall,

    // Forwarded from @whi/holo-hash
    HoloHashes,

    // Forwarded from @whi/holochain-websocket
    HolochainWebsocket,
}
```
