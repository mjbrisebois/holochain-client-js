[back to API.md](./API.md)


# API Reference for `AdminClient` class

## `new AdminClient( connection )`
A class for communicating with Conductor's Admin interface.

- `connection` - (*required*) either
  - an instance of `Connection`
  - or, it is used as the input for `new Connection( connection )`

Example
```javascript
const admin = new AdminClient( 12345 );
```


### `<AdminClient>.attachAppInterface( port ) -> Promise<object>`
Open a port where the Conductor's App Interface will listen for requests.

- `port` - (*optional*) the TCP port

Returns a Promise that resolves with the interface info

Example
```javascript
await admin.attachAppInterface();
// {
//     "port": 46487
// }
```

Example with specific port
```javascript
await admin.attachAppInterface( 45678 );
// {
//     "port": 45678
// }
```


### `<AdminClient>.generateAgent() -> Promise<AgentPubKey>`
Create a new Agent in the Lair Keystore

Returns a Promise that resolves with the new `AgentPubKey`

Example
```javascript
await admin.generateAgent();
// AgentPubKey(39) [
//   132,  32,  36,  93, 157,  91,  70, 192,
//    29, 186,  89, 144, 229,  56, 240, 230,
//   179,  73,  61, 117, 238, 116,  69, 113,
//    50, 248, 106,  16, 195, 217, 180,  44,
//   178, 161, 236, 152, 235, 202, 199
// ]
```


### `<AdminClient>.registerDna( path ) -> Promise<DnaHash>`
Register a DNA package.

- `path` - (*required*) file path to DNA package

Returns a Promise that resolves with the `DnaHash`

Example
```javascript
await admin.registerDna("./mere_memory.dna");
// DnaHash(39) [
//   132,  45,  36,  25,   6, 246, 151, 222,  37,
//   222, 187, 136, 196, 181, 162, 197,  76, 167,
//   100,   6, 228,  69, 215, 165,  11,  11, 224,
//    52,  98, 189, 155,  85, 193, 233, 186,  54,
//   227, 224,  62
// ]
```


### `<AdminClient>.installApp( app_id, agent_hash, dnas ) -> Promise<object>`
Create a new App installation for the given Agent using the given DNAs.

- `app_id` - (*required*) specify a unique ID for this installed App
- `agent_hash` - (*required*) a 39 byte `Uint8Array` that is an `AgentPubKey`
- `dnas` - (*required*) an object of key/values that correspond to
  - `key` - a DNA nickname for this DNA
  - `value` - a 39 byte `Uint8Array` that is a registered `DnaHash`

Returns a Promise that resolves with the installation details

Example
```javascript
const agent_hash = new HoloHash("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new HoloHash("uhC0kGQb2l94l3ruIxLWixUynZAbkRdelCwvgNGK9m1XB6bo24-A-");

await admin.installApp( "my-app", agent_hash, {
    "memory": dna_hash,
});
// {
//     "installed_app_id": "my-app",
//     "slots": {
//         "memory": {
//             "base_cell_id": [ dna_hash, agent_hash ],
//             "is_provisioned": true,
//             "clone_limit": 0,
//             "clones": []
//         }
//     }
// }
```


### `<AdminClient>.activateApp( app_id ) -> Promise<undefined>`
Activate an installed App.

- `app_id` - (*optional*) an installed App ID

Returns a Promise that resolves when complete.

Example
```javascript
await admin.activateApp( "my-app" );
```


### `<AdminClient>.listDnas() -> Promise<array<DnaHash>>`
Get the list of registered DNAs.

Returns a Promise that resolves with the list of DNA hashes

Example
```javascript
await admin.listDnas();
// [
//     DnaHash(39) [
//       132,  45,  36,  25,   6, 246, 151, 222,  37,
//       222, 187, 136, 196, 181, 162, 197,  76, 167,
//       100,   6, 228,  69, 215, 165,  11,  11, 224,
//        52,  98, 189, 155,  85, 193, 233, 186,  54,
//       227, 224,  62
//     ],
// ]
```


### `<AdminClient>.listCells() -> Promise<array<(DnaHash, AgentPubKey)>>`
Get the list of cells.

Returns a Promise that resolves with the list of cell IDs

Example
```javascript
await admin.listCells();
// [
//     [
//         DnaHash(39) [
//           132,  45,  36,  25,   6, 246, 151, 222,  37,
//           222, 187, 136, 196, 181, 162, 197,  76, 167,
//           100,   6, 228,  69, 215, 165,  11,  11, 224,
//            52,  98, 189, 155,  85, 193, 233, 186,  54,
//           227, 224,  62
//         ],
//         AgentPubKey(39) [
//           132,  32,  36,  93, 157,  91,  70, 192,
//            29, 186,  89, 144, 229,  56, 240, 230,
//           179,  73,  61, 117, 238, 116,  69, 113,
//            50, 248, 106,  16, 195, 217, 180,  44,
//           178, 161, 236, 152, 235, 202, 199
//         ],
//     ],
// ]
```


### `<AdminClient>.listApps() -> Promise<array<string>>`
Get the list of installed Apps.

Returns a Promise that resolves with the list of app IDs

Example
```javascript
await admin.listApps();
// [
//     "my-app",
// ]
```


### `<AdminClient>.listAppInterfaces() -> Promise<array<number>>`
Get the list of app interfaces.

Returns a Promise that resolves with the list of TCP ports

Example
```javascript
await admin.listAppInterfaces();
// [
//     46487,
//     45678,
// ]
```


### `<AdminClient>.listAgents() -> Promise<array<AgentPubKey>>`
Get the list of active Agents.

Returns a Promise that resolves with the list of Agent pubkeys

Example
```javascript
await admin.listAgents();
// [
//     AgentPubKey(39) [
//       132,  32,  36,  93, 157,  91,  70, 192,
//        29, 186,  89, 144, 229,  56, 240, 230,
//       179,  73,  61, 117, 238, 116,  69, 113,
//        50, 248, 106,  16, 195, 217, 180,  44,
//       178, 161, 236, 152, 235, 202, 199
//     ],
// ]
```


### `<AdminClient>.cellState( dna_hash, agent_hash ) -> Promise<object>`
Get the full state dump for a specific cell.

- `dna_hash` - (*required*) a 39 byte `Uint8Array` that is a registered `DnaHash`
- `agent_hash` - (*required*) a 39 byte `Uint8Array` that is a `AgentPubKey`

Returns a Promise that resolves with the state dump response

Example
```javascript
await admin.cellState( dna_hash, agent_hash );
{
    "integration_dump": {
        "validation_limbo": 0,
        "integration_limbo": 0,
        "integrated": 15
    },
    "kitsune": {
        "agent": Uint8Array { 7, 101, 137 ... 83, 65, 31 },
        "space": Uint8Array { 169, 104, 195 ... 122, 104, 135 }
    },
    "cell": {
        "agent": new AgentPubKey("uhCAkB2WJ6MDICYuakSxNbWm2yzf93WQLMHwbAJksVu2uFTD9U0Ef"),
        "dna": new DnaHash("uhC0kqWjDntQ1RSseTq5bn5U7Lv102V2iLnqnmIs-RxMtdRXCemiH")
    },
    "peers": [],
    "published_ops_count": 15,
    "source_chain": [
        {
            "signature": Uint8Array { 147, 39, 135 ... 4, 74, 245 ... 14 more bytes },
            "header_address": new HeaderHash("uhCkkqfbahbSj7uMfVgiaTX5VONUWBycfy5qPKPRgrgbbGfqkTvrr"),
            "header": {
                "type": "Create",
                "author": new AgentPubKey("uhCAkB2WJ6MDICYuakSxNbWm2yzf93WQLMHwbAJksVu2uFTD9U0Ef"),
                "timestamp": [
                    1631125015,
                    117028920
                ],
                "header_seq": 5,
                "prev_header": new HeaderHash("uhCkk6FU6LNO3nEnrqkI-tBUf_Wgyld7cRx3sAbm--CMIebAqAYbF"),
                "entry_type": {
                    "App": {
                        "id": 0,
                        "zome_id": 0,
                        "visibility": "Public"
                    }
                },
                "entry_hash": new EntryHash("uhCEkkwVTvJuqKRtskO1CQakx51_WP86HZeCTeu6zuWqyZXUr9IhY")
            },
            "entry": {
                "entry_type": "App",
                "entry": {
                    "author": Uint8Array { 132, 32, 36 ... 83, 65, 31 },
                    "published_at": 1631125015115,
                    "memory_size": 21,
                    "block_addresses": [
                        Uint8Array { 132, 33, 36 ... 165, 75, 52 }
                    ]
                }
            }
        },
    ],
    ...
}
```


### `<AdminClient>.requestAgentInfo( cell_id ) -> Promise<array<object>>`
Get a list of agent-info objects.

- `cell_id` - (*optional*) filter by cell ID (eg. `[ DnaHash, AgentPubKey ]`)
  - defaults to `null` to get all agents

Returns a Promise that resolves with the list of objects

Example
```javascript
await admin.requestAgentInfo();
// [
//     {
//         "agent": new AgentPubKey("uhCAkB2WJ6MDICYuakSxNbWm2yzf93WQLMHwbAJksVu2uFTD9U0Ef"),
//         "signature": Uint8Array { 181, 227, 182 ... 129, 137, 118 ... 14 more bytes },
//         "agent_info": {
//             "space": Uint8Array { 169, 104, 195 ... 122, 104, 135 },
//             "agent": Uint8Array { 65, 242, 107 ... 246, 230, 51 },
//             "urls": [
//                 "kitsune-quic://192.168.0.62:35756"
//             ],
//             "signed_at_ms": 1631139896037,
//             "expires_after_ms": 1200000,
//             "meta_info": {
//                 "dht_storage_arc_half_length": 0
//             }
//         }
//     }
// ]
```


### `<AdminClient>.close() -> Promise<>`
Initiate closing this client's connection.

Returns a Promise that resolves when the Connection has closed.
