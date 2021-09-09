[back to API.md](./API.md)


# API Reference for `DnaSchema` class

## `new DnaSchema( hash, structure )`
A class for defining a DNA's zome architecture.

- `hash` - (*required*) a 39 byte `Uint8Array` that is a `DnaHash`
- `structure` - (*optional*) either
  - an array of zome names
  - an object of key/values that correspond to
    - `key` - a zome name
    - `value` - an array of zome function names

Example
```javascript
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const schema = new DnaSchema( dna_hash, [
    "mere_memory",
]);
```

Example with defined zome functions
```javascript
const dna_hash = new HoloHash("uhC0kzbVYMh7gso8s-O26hL4PfDTajGqHFkljyL8mdtokzoL-gRdd");
const schema = new DnaSchema( dna_hash, [
    "mere_memory": [ "save_bytes", "retrieve_bytes" ],
]);
```


### `<DnaSchema>.zome( name ) -> ZomeApi`
Get an instance of `ZomeAPi`.

- `name` - (*required*) the Zome name

> *If `structure` was defined, the `name` must match one of the defined zome names*

Returns an instance of [ZomeApi](./API_ZomeApi.md)

Example
```javascript
const zome_api = schema.zome("mere_memory");
```
