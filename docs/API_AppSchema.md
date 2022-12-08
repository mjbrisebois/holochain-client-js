[back to API.md](./API.md)


# API Reference for `AppSchema` class

## `new AppSchema( structure )`
A class for defining an App's DNA architecture.

- `structure` - (*required*) an object of key/values that correspond to
  - `key` - a DNA role name for this DNA
  - `value` - either
    - a 39 byte `Uint8Array` that is a registered `DnaHash`
    - or, an instance of `DnaSchema`
    - or, it is used as the input for `new DnaSchema( ...value )`

Example
```javascript
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const schema = new AppSchema({
    "memory": dna_hash,
});
```

Example with an instance of `DnaSchema`
```javascript
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const dna_schema = new DnaSchema( dna_hash, [
    "mere_memory", // zome name
]);
const schema = new AppSchema({
    "memory": dna_schema,
});
```

Example with `DnaSchema` input
```javascript
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const schema = new AppSchema({
    "memory": [ dna_hash, [
	"mere_memory", // zome name
    ]],
});
```

Example of defining `AppSchema` and then creating an `AgentClient`
```javascript
const { AgentClient, AppSchema } = require('@whi/holochain-client');

const agent_hash = new AgentPubKey("uhCAkXZ1bRsAdulmQ5Tjw5rNJPXXudEVxMvhqEMPZtCyyoeyY68rH");
const dna_hash = new DnaHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const app_interface_port = 45678;

const app_schema = new AppSchema({
    "memory": [ dna_hash, {
        "mere_memory": [ "save_bytes", "retrieve_bytes" ],
    }],
});

const client = new AgentClient( agent_hash, app_schema, app_interface_port );

await client.call("memory", "mere_memory", "save_bytes", Buffer.from("Hello World") );
```


### `<AppSchema>.dna( role_name ) -> DnaSchema`
Get a defined instance of `DnaSchema`.

- `role_name` - (*required*) the DNA role name matching one in this `AppSchema`

Returns an instance of [DnaSchema](./API_DnaSchema.md)

Example
```javascript
const dna_schema = schema.dna("memory");
```
