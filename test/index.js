'use strict';
const Joi = require('joi');
const Lab = require('lab');
const MongoModels = require('../index');
const Mongodb = require('mongodb');


const lab = exports.lab = Lab.script();
const config = {
    connection: {
        uri: 'mongodb://localhost:27017',
        db: 'mongo-models-test'
    },
    options: {}
};


lab.experiment('Connections', () => {

    lab.test('it connects and disconnects the database', async () => {

        const db = await MongoModels.connect(config.connection, config.options);

        lab.expect(db).to.be.an.instanceof(Mongodb.Db);
        lab.expect(db.serverConfig.isConnected()).to.equal(true);

        MongoModels.disconnect();

        lab.expect(db.serverConfig.isConnected()).to.equal(false);
    });


    lab.test('it throws when the db connection fails', async () => {

        const connection = {
            uri: 'mongodb://poison',
            db: 'pill'
        };

        await lab.expect(MongoModels.connect(connection)).to.reject();
    });


    lab.test('it connects to multiple databases', async () => {

        const connection2 = {
            uri: config.connection.uri,
            db: `${config.connection.db}2`
        };
        const db = await MongoModels.connect(config.connection, config.options);
        const db2 = await MongoModels.connect(connection2, config.options, 'alt');

        lab.expect(db).to.be.an.instanceof(Mongodb.Db);
        lab.expect(db2).to.be.an.instanceof(Mongodb.Db);
        lab.expect(db.serverConfig.isConnected()).to.equal(true);
        lab.expect(db2.serverConfig.isConnected()).to.equal(true);

        MongoModels.disconnect('alt');
        MongoModels.disconnect();

        lab.expect(db.serverConfig.isConnected()).to.equal(false);
        lab.expect(db2.serverConfig.isConnected()).to.equal(false);
    });


    lab.test('it throws when trying to close a named db connection that misses', () => {

        lab.expect(MongoModels.disconnect.bind(MongoModels, 'poison')).to.throw();
    });


    lab.test('it binds db functions to a named connection using `with` and caches for subsequent use', async () => {

        const db = await MongoModels.connect(config.connection, config.options, 'named');

        lab.expect(db).to.be.an.instanceof(Mongodb.Db);
        lab.expect(db.serverConfig.isConnected()).to.equal(true);

        class DummyModel extends MongoModels {};

        DummyModel.collectionName = 'dummies';

        const count = await DummyModel.with('named').count({});

        lab.expect(count).to.be.a.number();

        const count2 = await DummyModel.with('named').count({});

        lab.expect(count2).to.be.a.number();

        MongoModels.disconnect('named');

        lab.expect(db.serverConfig.isConnected()).to.equal(false);
    });


    lab.test('it throws when trying to use `with` and the named db misses', () => {

        class DummyModel extends MongoModels {};

        lab.expect(DummyModel.with.bind(DummyModel, 'poison')).to.throw();
    });
});


lab.experiment('Instance construction', () => {

    lab.test('it constructs an instance using the schema', () => {

        class DummyModel extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            name: Joi.string().required(),
            stuff: Joi.object().keys({
                foo: Joi.string().default('foozball'),
                bar: Joi.string().default('barzball'),
                baz: Joi.string().default('bazzball')
            }).default(() => {

                return {
                    foo: 'llabzoof',
                    bar: 'llabzrab',
                    baz: 'llabzzab'
                };
            }, 'default stuff')
        });

        const instance1 = new DummyModel({
            name: 'Stimpson J. Cat'
        });

        lab.expect(instance1.name).to.equal('Stimpson J. Cat');
        lab.expect(instance1.stuff).to.be.an.object();
        lab.expect(instance1.stuff.foo).to.equal('llabzoof');
        lab.expect(instance1.stuff.bar).to.equal('llabzrab');
        lab.expect(instance1.stuff.baz).to.equal('llabzzab');

        const instance2 = new DummyModel({
            name: 'Stimpson J. Cat',
            stuff: {
                foo: 'customfoo'
            }
        });

        lab.expect(instance2.name).to.equal('Stimpson J. Cat');
        lab.expect(instance2.stuff).to.be.an.object();
        lab.expect(instance2.stuff.foo).to.equal('customfoo');
        lab.expect(instance2.stuff.bar).to.equal('barzball');
        lab.expect(instance2.stuff.baz).to.equal('bazzball');
    });


    lab.test('it throws if schema validation fails when creating an instance using the schema', () => {

        class DummyModel extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        const blamo = function () {

            return new DummyModel({});
        };

        lab.expect(blamo).to.throw();

        const hello = new DummyModel({
            name: 'World'
        });

        lab.expect(hello).to.be.an.instanceof(DummyModel);
    });
});


lab.experiment('Validation', () => {

    lab.test('it returns the Joi validation results of a SubClass', () => {

        class DummyModel extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        lab.expect(DummyModel.validate()).to.be.an.object();
    });


    lab.test('it returns the Joi validation results of a SubClass instance', () => {

        class DummyModel extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        const dummy = new DummyModel({ name: 'Stimpy' });

        lab.expect(dummy.validate()).to.be.an.object();
    });
});


lab.experiment('Result factory', () => {

    let DummyModel;


    lab.before(() => {

        DummyModel = class extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            _id: Joi.string(),
            name: Joi.string().required()
        });
    });


    lab.test('it returns an instance for a single document result', () => {

        const input = {
            _id: '54321',
            name: 'Stimpy'
        };
        const result = DummyModel.resultFactory(input);

        lab.expect(result).to.be.an.instanceof(DummyModel);
    });


    lab.test('it returns an array of instances for a `writeOpResult` object', () => {

        const input = {
            ops: [
                { name: 'Ren' },
                { name: 'Stimpy' }
            ]
        };
        const result = DummyModel.resultFactory(input);

        lab.expect(result).to.be.an.array();

        result.forEach((item) => {

            lab.expect(item).to.be.an.instanceof(DummyModel);
        });
    });


    lab.test('it returns a instance for a `findOpResult` object', () => {

        const input = {
            value: {
                _id: 'ren',
                name: 'Ren'
            }
        };
        const result = DummyModel.resultFactory(input);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it returns undefined for a `findOpResult` object that missed', () => {

        const input = {
            value: null
        };

        const result = DummyModel.resultFactory(input);

        lab.expect(result).to.not.exist();
    });


    lab.test('it does not convert an object into an instance without an _id property', () => {

        const input = {
            name: 'Ren'
        };
        const result = DummyModel.resultFactory(input);

        lab.expect(result).to.be.an.object();
        lab.expect(result).to.not.be.an.instanceOf(DummyModel);
    });
});


lab.experiment('Indexes', () => {

    let DummyModel;


    lab.before(async () => {

        DummyModel = class extends MongoModels {};

        DummyModel.collectionName = 'dummies';

        await MongoModels.connect(config.connection, config.options);
    });


    lab.after(() => {

        MongoModels.disconnect();
    });


    lab.test('it successfully creates indexes', async () => {

        const indexes = [{ key: { username: 1 } }];
        const result = await DummyModel.createIndexes(indexes);

        lab.expect(result).to.be.an.object();
    });
});


lab.experiment('Helpers', () => {

    lab.before(async () => {

        await MongoModels.connect(config.connection, config.options);
    });

    lab.after(() => {

        MongoModels.disconnect();
    });


    lab.test('it creates a fields document from a string', () => {

        const fields = MongoModels.fieldsAdapter('one -two three');

        lab.expect(fields).to.be.an.object();
        lab.expect(fields.one).to.equal(true);
        lab.expect(fields.two).to.equal(false);
        lab.expect(fields.three).to.equal(true);

        const fields2 = MongoModels.fieldsAdapter('');

        lab.expect(Object.keys(fields2)).to.have.length(0);
    });


    lab.test('it creates a sort document from a string', () => {

        const sort = MongoModels.sortAdapter('one -two three');

        lab.expect(sort).to.be.an.object();
        lab.expect(sort.one).to.equal(1);
        lab.expect(sort.two).to.equal(-1);
        lab.expect(sort.three).to.equal(1);

        const sort2 = MongoModels.sortAdapter('');

        lab.expect(Object.keys(sort2)).to.have.length(0);
    });


    lab.test('it returns the raw mongodb collection', () => {

        class DummyModel extends MongoModels {};

        DummyModel.collectionName = 'dummies';

        const collection = DummyModel.collection();

        lab.expect(collection).to.be.an.instanceof(Mongodb.Collection);
    });
});


lab.experiment('Paged find', () => {

    let DummyModel;


    lab.before(async () => {

        DummyModel = class extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            _id: Joi.object(),
            name: Joi.string().required()
        });

        DummyModel.collectionName = 'dummies';

        await MongoModels.connect(config.connection, config.options);
    });


    lab.after(() => {

        MongoModels.disconnect();
    });


    lab.afterEach(async () => {

        await DummyModel.deleteMany({});
    });


    lab.test('it throws when an error occurs', async () => {

        const realCount = DummyModel.count;

        DummyModel.count = function () {

            throw new Error('count failed');
        };

        const filter = {};
        const limit = 10;
        const page = 1;
        const options = {
            sort: { _id: -1 }
        };

        await lab.expect(
            DummyModel.pagedFind(filter, limit, page, options)
        ).to.reject();

        DummyModel.count = realCount;
    });


    lab.test('it returns paged results', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const filter = {};
        const limit = 10;
        const page = 1;
        const options = {
            sort: { _id: -1 }
        };
        const result = await DummyModel.pagedFind(
            filter, limit, page, options
        );

        lab.expect(result).to.be.an.object();
    });


    lab.test('it returns paged results where end item is less than total', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const filter = {};
        const limit = 2;
        const page = 1;
        const options = {
            sort: { _id: -1 }
        };
        const result = await DummyModel.pagedFind(
            filter, limit, page, options
        );

        lab.expect(result).to.be.an.object();
    });


    lab.test('it returns paged results where begin item is less than total', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const filter = { 'role.special': { $exists: true } };
        const limit = 2;
        const page = 1;
        const options = {
            sort: { _id: -1 }
        };
        const result = await DummyModel.pagedFind(
            filter, limit, page, options
        );

        lab.expect(result).to.be.an.object();
    });
});


lab.experiment('Proxy methods', () => {

    let DummyModel;


    lab.before(async () => {

        DummyModel = class extends MongoModels {};

        DummyModel.schema = Joi.object().keys({
            _id: Joi.object(),
            count: Joi.number(),
            group: Joi.string(),
            isCool: Joi.boolean(),
            name: Joi.string().required()
        });

        DummyModel.collectionName = 'dummies';

        await MongoModels.connect(config.connection, config.options);
    });


    lab.after(() => {

        MongoModels.disconnect();
    });


    lab.afterEach(async () => {

        await DummyModel.deleteMany({});
    });


    lab.test('it inserts one document and returns the result', async () => {

        const document = {
            name: 'Horse'
        };
        const results = await DummyModel.insertOne(document);

        lab.expect(results).to.be.an.array();
        lab.expect(results.length).to.equal(1);
    });


    lab.test('it inserts many documents and returns the results', async () => {

        const documents = [
            { name: 'Toast' },
            { name: 'Space' }
        ];
        const results = await DummyModel.insertMany(documents);

        lab.expect(results).to.be.an.array();
        lab.expect(results.length).to.equal(2);
    });


    lab.test('it updates a document and returns the results', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];
        const testDocs = await DummyModel.insertMany(documents);
        const filter = {
            _id: testDocs[0]._id
        };
        const update = {
            $set: { isCool: true }
        };
        const result = await DummyModel.updateOne(filter, update);

        lab.expect(result).to.be.an.object();
    });


    lab.test('it updates a document and returns the results', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];
        const testDocs = await DummyModel.insertMany(documents);
        const filter = {
            _id: testDocs[0]._id
        };
        const update = {
            $set: { isCool: true }
        };
        const options = { upsert: true };
        const result = await DummyModel.updateOne(filter, update, options);

        lab.expect(result).to.be.an.object();
    });


    lab.test('it updates many documents and returns the results', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const filter = {};
        const update = { $set: { isCool: true } };
        const result = await DummyModel.updateMany(filter, update);

        lab.expect(result).to.be.an.object();
    });


    lab.test('it updates many documents and returns the results (with options)', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const filter = {};
        const update = { $set: { isCool: true } };
        const options = { upsert: true };
        const result = await DummyModel.updateMany(filter, update, options);

        lab.expect(result).to.be.an.object();
    });


    lab.test('it returns aggregate results from a collection', async () => {

        const documents = [
            { name: 'Ren', group: 'Friend', count: 100 },
            { name: 'Stimpy', group: 'Friend', count: 10 },
            { name: 'Yak', group: 'Foe', count: 430 }
        ];

        await DummyModel.insertMany(documents);

        const pipeline = [
            { $match: {} },
            { $group: { _id: '$group', total: { $sum: '$count' } } },
            { $sort: { total: -1 } }
        ];
        const result = await DummyModel.aggregate(pipeline);

        lab.expect(result[0].total).to.equal(430);
        lab.expect(result[1].total).to.equal(110);
    });


    lab.test('it returns a collection count', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const result = await DummyModel.count({});

        lab.expect(result).to.equal(3);
    });


    lab.test('it returns distinct results from a collection', async () => {

        const documents = [
            { name: 'Ren', group: 'Friend' },
            { name: 'Stimpy', group: 'Friend' },
            { name: 'Yak', group: 'Foe' }
        ];

        await DummyModel.insertMany(documents);

        const result = await DummyModel.distinct('group');

        lab.expect(result).to.be.an.array();
        lab.expect(result.length).to.equal(2);
    });


    lab.test('it returns a result array', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const results = await DummyModel.find({});

        lab.expect(results).to.be.an.array();

        results.forEach((result) => {

            lab.expect(result).to.be.an.instanceOf(DummyModel);
        });
    });


    lab.test('it returns a single result', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const result = await DummyModel.findOne({});

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it returns a single result via id', async () => {

        const document = {
            name: 'Ren'
        };
        const testDocs = await DummyModel.insertOne(document);
        const id = testDocs[0]._id;
        const result = await DummyModel.findById(id);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it updates a single document via findByIdAndUpdate', async () => {

        const document = {
            name: 'Ren'
        };
        const testDocs = await DummyModel.insertOne(document);
        const id = testDocs[0]._id;
        const update = {
            name: 'New Name'
        };
        const result = await DummyModel.findByIdAndUpdate(id, update);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it updates a single document via id (with options)', async () => {

        const document = {
            name: 'Ren'
        };
        const testDocs = await DummyModel.insertOne(document);
        const id = testDocs[0]._id;
        const update = {
            name: 'New Name'
        };
        const options = {
            returnOriginal: false
        };
        const result = await DummyModel.findByIdAndUpdate(id, update, options);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it updates a single document via findOneAndUpdate', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = { name: 'Ren' };
        const update = { name: 'New Name' };
        const result = await DummyModel.findOneAndUpdate(filter, update);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it updates a single document via findOneAndUpdate (with options)', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = { name: 'Ren' };
        const update = { name: 'New Name' };
        const options = { returnOriginal: true };
        const result = await DummyModel.findOneAndUpdate(filter, update, options);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it replaces a single document via findOneAndReplace', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = {
            name: 'Ren'
        };
        const newDocument = {
            name: 'Stimpy'
        };
        const result = await DummyModel.findOneAndReplace(filter, newDocument);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it replaces a single document via findOneAndReplace (with options)', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = {
            name: 'Ren'
        };
        const doc = {
            isCool: true
        };
        const options = {
            returnOriginal: true
        };
        const result = await DummyModel.findOneAndReplace(filter, doc, options);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it replaces one document and returns the result', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = {
            name: 'Ren'
        };
        const newDocument = {
            name: 'Stimpy'
        };
        const result = await DummyModel.replaceOne(filter, newDocument);

        lab.expect(result).to.be.an.array();
        lab.expect(result[0]).to.be.an.instanceof(DummyModel);
    });


    lab.test('it replaces one document and returns the result (with options)', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = {
            name: 'Ren'
        };
        const doc = {
            name: 'Stimpy'
        };
        const options = {
            upsert: true
        };
        const result = await DummyModel.replaceOne(filter, doc, options);

        lab.expect(result).to.be.an.array();
        lab.expect(result[0]).to.be.an.instanceof(DummyModel);
    });


    lab.test('it deletes a document via findOneAndDelete', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const filter = {
            name: 'Ren'
        };

        const result = await DummyModel.findOneAndDelete(filter);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it deletes a document via findByIdAndDelete', async () => {

        const document = {
            name: 'Ren'
        };
        const testDocs = await DummyModel.insertOne(document);

        const id = testDocs[0]._id;

        const result = await DummyModel.findByIdAndDelete(id);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it deletes a single document via findByIdAndDelete (with options)', async () => {

        const document = {
            name: 'Ren'
        };
        const testDocs = await DummyModel.insertOne(document);
        const id = testDocs[0]._id;
        const options = {
            projection: {
                name: 1
            }
        };
        const result = await DummyModel.findByIdAndDelete(id, options);

        lab.expect(result).to.be.an.instanceOf(DummyModel);
    });


    lab.test('it deletes one document via deleteOne', async () => {

        const document = {
            name: 'Ren'
        };

        await DummyModel.insertOne(document);

        const result = await DummyModel.deleteOne({});

        lab.expect(result).to.be.an.object();
    });


    lab.test('it deletes multiple documents and returns the count via deleteMany', async () => {

        const documents = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        await DummyModel.insertMany(documents);

        const result = await DummyModel.deleteMany({});

        lab.expect(result).to.be.an.object();
    });
});
