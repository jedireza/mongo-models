# API reference

- [Properties](#properties)
    - [`_idClass`](#_idclass)
    - [`collection`](#collection)
    - [`ObjectId`](#objectid)
    - [`schema`](#schema)
- [Methods](#methods)
    - [`connect(uri, options, callback)`](#connectconfig-callback)
    - [`aggregate(pipeline, [options], callback)`](#aggregatepipeline-options-callback)
    - [`count(filter, [options], callback)`](#countfilter-options-callback)
    - [`createIndexes(indexSpecs, [callback])`](#createindexesindexspecs-callback)
    - [`deleteMany(filter, [options], callback)`](#deletemanyfilter-options-callback)
    - [`deleteOne(filter, [options], callback)`](#deleteonefilter-options-callback)
    - [`disconnect()`](#disconnect)
    - [`distinct(field, [filter], callback)`](#distinctfield-filter-callback)
    - [`fieldsAdapter(fields)`](#fieldsadapterfields)
    - [`find(filter, [options], callback)`](#findfilter-options-callback)
    - [`findById(id, [options], callback)`](#findbyidid-options-callback)
    - [`findByIdAndDelete(id, callback)`](#findbyidanddeleteid-callback)
    - [`findByIdAndUpdate(id, update, [options], callback)`](#findbyidandupdateid-update-options-callback)
    - [`findOne(filter, [options], callback)`](#findonefilter-options-callback)
    - [`findOneAndDelete(filter, [options], callback)`](#findoneanddeletefilter-options-callback)
    - [`findOneAndUpdate(filter, update, [options], callback)`](#findoneandupdatefilter-options-callback)
    - [`insertMany(docs, [options], callback)`](#insertmanydocs-options-callback)
    - [`insertOne(doc, [options], callback)`](#insertonedoc-options-callback)
    - [`pagedFind(filter, fields, sort, limit, page, callback)`](#pagedfindfilter-fields-sort-limit-page-callback)
    - [`replaceOne(filter, doc, [options], callback)`](#replaceonefilter-doc-options-callback)
    - [`sortAdapter(sorts)`](#sortadaptersorts)
    - [`updateMany(filter, update, [options], callback)`](#updatemanyfilter-update-options-callback)
    - [`updateOne(filter, update, [options], callback)`](#updateonefilter-update-options-callback)
    - [`validate(callback)`](#validatecallback)
    - [`validate(input, callback)`](#validateinput-callback)


## Properties

### `_idClass`

The type used to cast `_id` properties. Defaults to
[`MongoDB.ObjectId`](http://docs.mongodb.org/manual/reference/object-id/).

If you wanted to use plain strings for your document `_id` properties you could:

```js
Kitten._idClass = String;
```

When you define a custom `_idClass` property for your model you just need to
pass an `_id` parameter of that type when you create new documents.

```js
const data = {
    _id: 'captain-cute',
    name: 'Captain Cute'
};

Kitten.insert(data, (err, results) => {

    // handle response
});
```

### `collection`

The name of the collection in MongoDB.

```js
Kitten.collection = 'kittens';
```

### `ObjectId`

An alias to `MongoDB.ObjectId`.

### `schema`

A `joi` object schema. See: https://github.com/hapijs/joi

```js
Kitten.schema = Joi.object().keys({
    _id: Joi.string(),
    name: Joi.string().required(),
    email: Joi.string().required()
});
```


## Methods

### `connect(uri, options, callback)`

Connects to a MongoDB server where:

 - `uri` - the connection string passed to `MongoClient.connect`.
 - `options` - an optional object passed to `MongoClient.connect`.
 - `callback` - the callback method using the signature `function (err, db)`
    where:
    - `err` - if the connection failed, the error reason, otherwise `null`.
    - `db` - if the connection succeeded, the initialized db object.

### `aggregate(pipeline, [options], callback)`

Calculates aggregate values for the data in a collection where:

 - `pipeline` - A sequence of data aggregation operations or stages.
 - `options` - an options object passed to MongoDB's native
   [`aggregate`](https://docs.mongodb.com/manual/reference/method/db.collection.aggregate/)
   method.
 - `callback` - the callback method using the signature `function (err, results)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `results` - if the query succeeded, an array of documents return from
      the aggregation.

### `count(filter, [options], callback)`

Counts documents matching a `filter` where:

 - `filter` - a filter object used to select the documents to count.
 - `options` - an options object passed to MongoDB's native
   [`count`](https://docs.mongodb.com/manual/reference/method/db.collection.count/)
   method.
 - `callback` - the callback method using the signature `function (err, count)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `count` - if the query succeeded, a number indicating how many documents
      matched the `filter`.

### `createIndexes(indexSpecs, [callback])`

Note: `createIndexes` is called during plugin registration for each model when
the `autoIndex` option is set to `true`.

Creates multiple indexes in the collection where:

 - `indexSpecs` - an array of objects containing index specifications to be
   created.
 - `callback` - the callback method using the signature `function (err, result)`
    where:
    - `err` - if creating the indexes failed, the error reason, otherwise `null`.
    - `result` - if creating the indexes succeeded, the result object.

Indexes are defined as a static property on your models like:

```js
Kitten.indexes = [
    { key: { name: 1 } },
    { key: { email: -1 } }
];
```

For details on all the options an index specification may have see:

https://docs.mongodb.org/manual/reference/command/createIndexes/

### `deleteMany(filter, [options], callback)`

Deletes multiple documents and returns the count of deleted documents where:

 - `filter` - a filter object used to select the documents to delete.
 - `options` - an options object passed to MongoDB's native
   [`deleteMany`](https://docs.mongodb.com/manual/reference/method/db.collection.deleteMany/)
   method.
 - `callback` - the callback method using the signature `function (err, count)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `count` - if the query succeeded, a number indicating how many documents
      were deleted.

### `deleteOne(filter, [options], callback)`

Deletes a document and returns the count of deleted documents where:

 - `filter` - a filter object used to select the document to delete.
 - `options` - an options object passed to MongoDB's native
   [`deleteOne`](https://docs.mongodb.com/manual/reference/method/db.collection.deleteOne/)
   method.
 - `callback` - the callback method using the signature `function (err, count)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `count` - if the query succeeded, a number indicating how many documents
      were deleted.

### `disconnect()`

Closes the current db connection.

### `distinct(field, [filter], callback)`

Finds the distinct values for the specified `field`.

 - `field` - a string representing the field for which to return distinct values.
 - `filter` - an optional filter object used to limit the documents distinct applies to.
 - `callback` - the callback method using the signature `function (err, values)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `values` - if the query succeeded, an array of values representing the
      distinct values for the specified `field`.

### `fieldsAdapter(fields)`

A helper method to create a fields object suitable to use with MongoDB queries
where:

 - `fields` - a string with space separated field names. Fields may be prefixed
   with `-` to indicate exclusion instead of inclusion.

Returns a MongoDB friendly fields object.

```js
Kitten.fieldsAdapter('name -email');

// { name: true, email: false }
```

### `find(filter, [options], callback)`

Finds documents where:

 - `filter` - a filter object used to select the documents.
 - `options` - an options object passed to MongoDB's native
   [`find`](https://docs.mongodb.com/manual/reference/method/db.collection.find/)
   method.
 - `callback` - the callback method using the signature `function (err, results)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `results` - if the query succeeded, an array of documents as class
      instances.

### `findById(id, [options], callback)`

Finds a document by `_id` where:

 - `id` - is a string value of the `_id` to find. It will be casted to the type
    of `_idClass`.
 - `options` - an options object passed to MongoDB's native
   [`findOne`](https://docs.mongodb.com/manual/reference/method/db.collection.findOne/)
   method.
 - `callback` - the callback method using the signature `function (err, result)`
    where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `result` - if the query succeeded, a document as a class instance.

### `findByIdAndDelete(id, callback)`

Finds a document by `_id`, deletes it and returns it where:

 - `id` - is a string value of the `_id` to find. It will be casted to the type
   of `_idClass`.
 - `callback` - the callback method using the signature `function (err, result)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `result` - if the query succeeded, a document as a class instance.

### `findByIdAndUpdate(id, update, [options], callback)`

Finds a document by `_id`, updates it and returns it where:

 - `id` - is a string value of the `_id` to find. It will be casted to the type
   of `_idClass`.
 - `update` - an object containing the fields/values to be updated.
 - `options` - an optional options object passed to MongoDB's native
   [`findOneAndUpdate`](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/)
   method. Defaults to `{ returnOriginal: false }`.
 - `callback` - the callback method using the signature `function (err, result)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `result` - if the query succeeded, a document as a class instance.

### `findOne(filter, [options], callback)`

Finds one document matching a `filter` where:

 - `filter` - a filter object used to select the document.
 - `options` - an options object passed to MongoDB's native
   [`findOne`](https://docs.mongodb.com/manual/reference/method/db.collection.findOne/)
   method.
 - `callback` - the callback method using the signature `function (err, result)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `result` - if the query succeeded, a document as a class instance.

### `findOneAndDelete(filter, [options], callback)`

Finds one document matching a `filter`, deletes it and returns it where:

 - `filter` - a filter object used to select the document to delete.
 - `options` - an options object passed to MongoDB's native
   [`findOneAndDelete`](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndDelete/)
   method.
 - `callback` - the callback method using the signature `function (err, result)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `result` - if the query succeeded, a document as a class instance.

### `findOneAndUpdate(filter, update, [options], callback)`

Finds one document matching a `filter`, updates it and returns it where:

 - `filter` - a filter object used to select the document to update.
 - `update` - an object containing the fields/values to be updated.
 - `options` - an options object passed to MongoDB's native
   [`findOneAndUpdate`](https://docs.mongodb.com/manual/reference/method/db.collection.findOneAndUpdate/)
   method. Defaults to `{ returnOriginal: false }`.
 - `callback` - the callback method using the signature `function (err, result)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `result` - if the command succeeded, a document as a class instance.

### `insertMany(docs, [options], callback)`

Inserts multiple documents and returns them where:

 - `docs` - an array of document objects to insert.
 - `options` - an options object passed to MongoDB's native
   [`insertMany`](https://docs.mongodb.com/manual/reference/method/db.collection.insertMany/)
   method.
 - `callback` - the callback method using the signature `function (err, results)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `results` - if the command succeeded, an array of documents as a class
      instances.

### `insertOne(doc, [options], callback)`

Inserts a document and returns the new document where:

 - `doc` - a document object to insert.
 - `options` - an options object passed to MongoDB's native
   [`insertOne`](https://docs.mongodb.com/manual/reference/method/db.collection.insertOne/)
   method.
 - `callback` - the callback method using the signature `function (err, results)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `results` - if the command succeeded, an array of documents as a class
      instances.

### `pagedFind(filter, fields, sort, limit, page, callback)`

Finds documents with paginated results where:

 - `filter` - a filter object used to select the documents.
 - `fields` - indicates which fields should be included in the response
    (default is all). Can be a string with space separated field names.
 - `sort` - indicates how to sort documents. Can be a string with space
    separated fields. Fields may be prefixed with `-` to indicate decending
    sort order.
 - `limit` - a number indicating how many results should be returned.
 - `page` - a number indicating the current page.
 - `callback` - is the callback method using the signature `function (err,
    results)` where:
    - `err` - if the query failed, the error reason, otherwise null.
    - `results` - the results object where:
        - `data` - an array of documents from the query as class instances.
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

### `replaceOne(filter, doc, [options], callback)`

Replaces a document and returns the count of modified documents where:

 - `filter` - a filter object used to select the document to replace.
 - `doc` - the document that replaces the matching document.
 - `options` - an options object passed to MongoDB's native
   [`replaceOne`](https://docs.mongodb.com/manual/reference/method/db.collection.replaceOne/)
   method.
 - `callback` - the callback method using the signature `function (err, count)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `count` - if the query succeeded, a number indicating how many documents
      were modified.

### `sortAdapter(sorts)`

A helper method to create a sort object suitable to use with MongoDB queries
where:

 - `sorts` - a string with space separated field names. Fields may be prefixed
   with `-` to indicate decending sort order.

Returns a MongoDB friendly sort object.

```js
Kitten.sortAdapter('name -email');

// { name: 1, email: -1 }
```

### `updateMany(filter, update, [options], callback)`

Updates multiple documents and returns the count of modified documents where:

 - `filter` - a filter object used to select the documents to update.
 - `update` - the update operations object.
 - `options` - an options object passed to MongoDB's native
   [`updateMany`](https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/)
   method.
 - `callback` - the callback method using the signature `function (err, count)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `count` - if the command succeeded, a number indicating how many documents
      were modified.

### `updateOne(filter, update, [options], callback)`

Updates a document and returns the count of modified documents where:

 - `filter` - a filter object used to select the document to update.
 - `update` - the update operations object.
 - `options` - an options object passed to MongoDB's native
   [`updateOne`](https://docs.mongodb.com/manual/reference/method/db.collection.updateOne/)
   method.
 - `callback` - the callback method using the signature `function (err, count)`
   where:
    - `err` - if the query failed, the error reason, otherwise `null`.
    - `count` - if the command succeeded, a number indicating how many documents
      were modified.

### `validate(callback)`

Uses `joi` validation using the static `schema` object property of a model
class to validate the instance data of a model where:

 - `callback` - is the callback method using the signature `function (err,
    value)` where:
    - `err` - if validation failed, the error reason, otherwise null.
    - `value` - the validated value with any type conversions and other
       modifiers applied.

```js
const cc = new Kitten({
    name: 'Captain Cute'
});

cc.validate((err, value) => {

    // handle results
});
```

See: https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback

### `validate(input, callback)`

Uses `joi` validation using the static `schema` object property of a model
class to validate `input` where:

 - `input` - is the object to validate.
 - `callback` - is the callback method using the signature `function (err,
    value)` where:
    - `err` - if validation failed, the error reason, otherwise null.
    - `value` - the validated value with any type conversions and other
       modifiers applied.

```js
const data = {
    name: 'Captain Cute'
};

Kitten.validate(data, (err, value) => {

    // handle results
});
```

See: https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback
