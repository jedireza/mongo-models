# API reference

<!-- toc -->

- [Properties](#properties)
  - [`_idClass`](#_idclass)
  - [`collectionName`](#collectionname)
  - [`indexes`](#indexes)
  - [`ObjectID`](#objectid)
  - [`schema`](#schema)
- [Methods](#methods)
  - [`constructor(data)`](#constructordata)
  - [`async aggregate(pipeline, [options])`](#async-aggregatepipeline-options)
  - [`collection()`](#collection)
  - [`async connect(connection, [options], [name])`](#async-connectconnection-options-name)
  - [`async count(query, [options])`](#async-countquery-options)
  - [`async createIndexes(indexSpecs, [options])`](#async-createindexesindexspecs-options)
  - [`async deleteMany(filter, [options])`](#async-deletemanyfilter-options)
  - [`async deleteOne(filter, [options])`](#async-deleteonefilter-options)
  - [`disconnect([name])`](#disconnectname)
  - [`async distinct(key, query, [options])`](#async-distinctkey-query-options)
  - [`fieldsAdapter(fields)`](#fieldsadapterfields)
  - [`async find(query, [options])`](#async-findquery-options)
  - [`async findById(id, [options])`](#async-findbyidid-options)
  - [`async findByIdAndDelete(id)`](#async-findbyidanddeleteid)
  - [`async findByIdAndUpdate(id, update, [options])`](#async-findbyidandupdateid-update-options)
  - [`async findOne(query, [options])`](#async-findonequery-options)
  - [`async findOneAndDelete(filter, [options])`](#async-findoneanddeletefilter-options)
  - [`async findOneAndReplace(filter, replacement, [options])`](#async-findoneandreplacefilter-replacement-options)
  - [`async findOneAndUpdate(filter, update, [options])`](#async-findoneandupdatefilter-update-options)
  - [`async insertMany(docs, [options])`](#async-insertmanydocs-options)
  - [`async insertOne(doc, [options])`](#async-insertonedoc-options)
  - [`async pagedFind(filter, page, limit, [options])`](#async-pagedfindfilter-page-limit-options)
  - [`async replaceOne(filter, doc, [options])`](#async-replaceonefilter-doc-options)
  - [`sortAdapter(sorts)`](#sortadaptersorts)
  - [`async updateMany(filter, update, [options])`](#async-updatemanyfilter-update-options)
  - [`async updateOne(filter, update, [options])`](#async-updateonefilter-update-options)
  - [`validate()`](#validate)
  - [`validate(input)`](#validateinput)
  - [`with(name)`](#withname)

<!-- tocstop -->

## Properties

### `_idClass`

The type used to cast `_id` properties. Defaults to
[`MongoDB.ObjectID`](https://mongodb.github.io/node-mongodb-native/3.0/api/ObjectID.html).

If you wanted to use plain strings for your document `_id` properties you could:

```js
Customer._idClass = String;
```

When you define a custom `_idClass` property for your model you need to pass an
`_id` parameter of that type when you create new documents.

```js
const document = new Customer({
    _id: 'stephen-colbert',
    name: 'Stephen Colbert'
});

const customers = await Customer.insertOne(data);
```

### `collectionName`

The name of the collection in MongoDB.

```js
Customer.collectionName = 'customers';
```

### `indexes`

An array of index specifications for this model. [See the index
specification](http://docs.mongodb.org/manual/reference/command/createIndexes/).

```js
Customer.indexes = [
    { key: { name: 1 } },
    { key: { email: -1 } }
];
```

Note: These are just the definitions, the [`async createIndexes(indexSpecs,
[options])`](#async-createindexesindexspecs-options) method doesn't
automatically use this property. You could pass this property to that method
though:

```js
const result = await Customer.createIndexes(Customer.indexes);
```

### `ObjectID`

An alias to
[`MongoDB.ObjectID`](https://mongodb.github.io/node-mongodb-native/3.0/api/ObjectID.html).

### `schema`

A `joi` object schema. See: https://github.com/hapijs/joi

```js
Customer.schema = Joi.object({
    _id: Joi.string(),
    name: Joi.string().required(),
    email: Joi.string().required()
});
```

## Methods

### `constructor(data)`

Constructs a new instance of your class using the data provided where:

- `data` - an object containing the fields and values of the model instance.
  Internally `data` is passed to the `validate` function, throwing an error if
  present or assigning the value (the validated value with any type conversions
  and other modifiers applied) to the object as properties.

### `async aggregate(pipeline, [options])`

Execute an aggregation framework pipeline against the collection.

- `pipeline` - an array containing all the aggregation framework commands.
- `options` - an optional object passed to MongoDB's native
  [`Collection.aggregate`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#aggregate)
  method.

### `collection()`

Returns the underlying
[`MongoDB.Collection`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html).

### `async connect(connection, [options], [name])`

Connects to a MongoDB server and returns the
[`MongoDB.Db`](https://mongodb.github.io/node-mongodb-native/3.0/api/Db.html)
where:

- `connection` - an object where:
    - `uri` - the uri of the database. [See uri string
      docs](https://docs.mongodb.com/manual/reference/connection-string/).
    - `db` - the name of the database.
- `options` - an optional object passed to `MongoClient.connect`.
- `name` - an optional string to identify the connection. Used to support
  multiple connections along with the [`with(name)`](#withname) method.
  Defaults to `default`.

### `async count(query, [options])`

Returns the number of documents matching a `query` where:

- `query` - a filter object used to select the documents to count.
- `options` - an optional object passed to the native
  [`Collection.count`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#count)
  method.

### `async createIndexes(indexSpecs, [options])`

Creates multiple indexes in the collection and returns the result where:

- `indexSpecs` - an array of objects containing index specifications to be
  created. [See the index
  specification](http://docs.mongodb.org/manual/reference/command/createIndexes/).
- `options` - an optional object passed to the native
  [`Collection.createIndexes`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#createIndexes)
  method.

Indexes are defined as a static property on your models like:

```js
Customer.indexes = [
    { key: { name: 1 } },
    { key: { email: -1 } }
];
```

### `async deleteMany(filter, [options])`

Deletes multiple documents and returns the
[`Collection.deleteWriteOpResult`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#~deleteWriteOpResult)
where:

- `filter` - a filter object used to select the documents to delete.
- `options` - an optional object passed to MongoDB's native
  [`Collection.deleteMany`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#deleteMany)
  method.

### `async deleteOne(filter, [options])`

Deletes a document and returns the
[`Collection.deleteWriteOpResult`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#~deleteWriteOpResult)
where:

- `filter` - a filter object used to select the document to delete.
- `options` - an optional object passed to MongoDB's native
  [`Collection.deleteOne`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#deleteOne)
  method.

### `disconnect([name])`

Closes a specific connection by name or all connections if no name is specified.

### `async distinct(key, query, [options])`

Returns a list of distinct values for the given key across a collection where:

- `key` - a string representing the field for which to return distinct values.
- `query` - an optional query object used to limit the documents distinct
  applies to.

### `fieldsAdapter(fields)`

A helper method to create a fields object suitable to use with MongoDB queries
where:

- `fields` - a string with space separated field names. Fields may be prefixed
  with `-` to indicate exclusion instead of inclusion.

Returns a MongoDB friendly fields object.

```js
Customer.fieldsAdapter('name -email');

// { name: true, email: false }
```

### `async find(query, [options])`

Finds documents and returns an array of model instances where:

- `query` - a query object used to select the documents.
- `options` - an optional object passed to MongoDB's native
  [`Collection.find`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find)
  method.

### `async findById(id, [options])`

Finds a document by `_id` and returns a model instance where:

- `id` - a string value of the `_id` to find. The `id` will be casted to the
  type of `_idClass`.
- `options` - an optional object passed to MongoDB's native
  [`Collection.findOne`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOne)
  method.

### `async findByIdAndDelete(id)`

Finds a document by `_id`, deletes it and returns a model instance where:

- `id` - a string value of the `_id` to find. The `id` will be casted to the
  type of `_idClass`.

### `async findByIdAndUpdate(id, update, [options])`

Finds a document by `_id`, updates it and returns a model instance where:

- `id` - a string value of the `_id` to find. The `id` will be casted to the
  type of `_idClass`.
- `update` - an object containing the fields/values to be updated.
- `options` - an optional object passed to MongoDB's native
  [`Collection.findOneAndUpdate`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndUpdate)
  method. Defaults to `{ returnOriginal: false }`.

### `async findOne(query, [options])`

Finds one document matching the `query` and returns a model intance where:

- `query` - a filter object used to select the document.
- `options` - an optional object passed to MongoDB's native
  [`Collection.findOne`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOne)
  method.

### `async findOneAndDelete(filter, [options])`

Finds one document matching a `filter`, deletes it and returns a model instance
where:

- `filter` - a filter object used to select the document to delete.
- `options` - an optional object passed to MongoDB's native
  [`Collection.findOneAndDelete`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndDelete)
  method.

### `async findOneAndReplace(filter, replacement, [options])`

Finds one document matching a `filter`, deletes it and returns a model instance
where:

- `filter` - a filter object used to select the document to delete.
- `replacement` - the document replacing the matching document.
- `options` - an optional object passed to MongoDB's native
  [`Collection.findOneAndReplace`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndReplace)
  method. Defaults to `{ returnOriginal: false }`.

### `async findOneAndUpdate(filter, update, [options])`

Finds one document matching a `filter`, updates it and returns a model instance
where:

- `filter` - a filter object used to select the document to update.
- `update` - an object containing the fields/values to be updated.
- `options` - an optional object passed to MongoDB's native
  [`Collection.findOneAndUpdate`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#findOneAndUpdate)
  method. Defaults to `{ returnOriginal: false }`.

### `async insertMany(docs, [options])`

Inserts multiple documents and returns and array of model instances where:

- `docs` - an array of document objects to insert.
- `options` - an optional object passed to MongoDB's native
  [`Collection.insertMany`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#insertMany)
  method.

### `async insertOne(doc, [options])`

Inserts a document and returns a model instance where:

- `doc` - a document object to insert.
- `options` - an optional object passed to MongoDB's native
  [`Collection.insertOne`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#insertOne)
  method.

### `async pagedFind(filter, page, limit, [options])`

Finds documents and returns the results where:

- `filter` - a filter object used to select the documents.
- `page` - a number indicating the current page.
- `limit` - a number indicating how many results should be returned.
- `options` - an optional object passed to MongoDB's native
  [`Collection.find`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#find)
  method.

The returned value is an object where:

- `data` - an array of model instances.
- `pages` - an object where:
  - `current` - a number indicating the current page.
  - `prev` - a number indicating the previous page.
  - `hasPrev` - a boolean indicating if there is a previous page.
  - `next` - a number indicating the next page.
  - `hasNext` - a boolean indicating if there is a next page.
  - `total` - a number indicating the total number of pages.
- `items` - an object where:
  - `limit` - a number indicating the how many results should be returned.
  - `begin` - a number indicating what item number the results begin with.
  - `end` - a number indicating what item number the results end with.
  - `total` - a number indicating the total number of matching results.

### `async replaceOne(filter, doc, [options])`

Replaces a document and returns a
[`Collection.updateWriteOpResult`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#~updateWriteOpResult)
where:

- `filter` - a filter object used to select the document to replace.
- `doc` - the document that replaces the matching document.
- `options` - an optional object passed to MongoDB's native
  [`Collection.replaceOne`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#replaceOne)
  method.

### `sortAdapter(sorts)`

A helper method to create a sort object suitable to use with MongoDB queries
where:

- `sorts` - a string with space separated field names. Fields may be prefixed
  with `-` to indicate decending sort order.

Returns a MongoDB friendly sort object.

```js
Customer.sortAdapter('name -email');

// { name: 1, email: -1 }
```

### `async updateMany(filter, update, [options])`

Updates multiple documents and returns a
[`Collection.updateWriteOpResult`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#~updateWriteOpResult)
where:

- `filter` - a filter object used to select the documents to update.
- `update` - the update operations object.
- `options` - an optional object passed to MongoDB's native
  [`Collection.updateMany`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#updateMany)
  method.

### `async updateOne(filter, update, [options])`

Updates a document and returns a
[`Collection.updateWriteOpResult`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#~updateWriteOpResult)
where:

- `filter` - a filter object used to select the document to update.
- `update` - the update operations object.
- `options` - an optional object passed to MongoDB's native
  [`Collection.updateOne`](https://mongodb.github.io/node-mongodb-native/3.0/api/Collection.html#updateOne)
  method.

### `validate()`

Uses `joi` validation internally with the static `schema` property of the model
to validate the instance data and returns the validated value where:

```js
const stephen = new Customer({
    name: 'Stephen Colbert'
});

const result = stephen.validate();
```

See: https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback

### `validate(input)`

Uses `joi` validation internally with the static `schema` property of the model
to validate the `input` data and returns the validated value where:

- `input` - is the object to validate.

```js
const data = {
    name: 'Stephen Colbert'
};

const result = Customer.validate(data);
```

See: https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback

### `with(name)`

For use with multiple named connections (See: [`connect(connection, [options],
[name])`](#async-connectconnection-options-name)).

Returns an object containing a subset of the model's methods bound to the named
connection.

Available methods include:
 - `aggregate`
 - `collection`
 - `count`
 - `createIndexes`
 - `deleteMany`
 - `deleteOne`
 - `distinct`
 - `find`
 - `findById`
 - `findByIdAndDelete`
 - `findByIdAndUpdate`
 - `findOne`
 - `findOneAndDelete`
 - `findOneAndReplace`
 - `findOneAndUpdate`
 - `insertMany`
 - `insertOne`
 - `pagedFind`
 - `replaceOne`
 - `updateMany`
 - `updateOne`

```js
await MongoModels.connect(config.connection, config.options, 'alt');

// ...

const count = await Customer.with('alt').count({});
```
