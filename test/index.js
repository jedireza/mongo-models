'use strict';
const Async = require('async');
const Code = require('code');
const Config = require('./config');
const Joi = require('joi');
const Lab = require('lab');
const Proxyquire = require('proxyquire');


const lab = exports.lab = Lab.script();
const stub = {
    mongodb: {}
};
const MongoModels = Proxyquire('../index', {
    mongodb: stub.mongodb
});


lab.experiment('MongoModels DB Connection', () => {

    lab.test('it connects and disconnects the database', (done) => {

        MongoModels.connect(Config.mongodb.uri, Config.mongodb.options, (err, db) => {

            Code.expect(err).to.not.exist();
            Code.expect(db).to.be.an.object();

            Code.expect(MongoModels.db.serverConfig.isConnected()).to.equal(true);
            MongoModels.disconnect();
            Code.expect(MongoModels.db.serverConfig.isConnected()).to.equal(false);

            done();
        });
    });


    lab.test('it returns an error when the db connection fails', (done) => {

        const realMongoClient = stub.mongodb.MongoClient;

        stub.mongodb.MongoClient = {
            connect: function (uri, settings, callback) {

                callback(new Error('mongodb is gone'));
            }
        };

        MongoModels.connect(Config.mongodb.uri, Config.mongodb.options, (err, db) => {

            Code.expect(err).to.be.an.object();
            Code.expect(db).to.not.exist();

            stub.mongodb.MongoClient = realMongoClient;

            done();
        });
    });
});


lab.experiment('MongoModels Validation', () => {

    lab.test('it returns the Joi validation results of a SubClass', (done) => {

        const SubModel = class extends MongoModels {};

        SubModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        Code.expect(SubModel.validate()).to.be.an.object();

        done();
    });


    lab.test('it returns the Joi validation results of a SubClass instance', (done) => {

        const SubModel = class extends MongoModels {};

        SubModel.schema = Joi.object().keys({
            name: Joi.string().required()
        });

        const myModel = new SubModel({ name: 'Stimpy' });

        Code.expect(myModel.validate()).to.be.an.object();

        done();
    });
});


lab.experiment('MongoModels Result Factory', () => {

    let SubModel;


    lab.before((done) => {

        SubModel = class extends MongoModels {};

        done();
    });


    lab.test('it returns early when an error is present', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.be.an.object();
            Code.expect(result).to.not.exist();

            done();
        };

        SubModel.resultFactory(callback, new Error('it went boom'), undefined);
    });


    lab.test('it returns an instance for a single document result', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.instanceOf(SubModel);

            done();
        };
        const document = {
            _id: '54321',
            name: 'Stimpy'
        };

        SubModel.resultFactory(callback, undefined, document);
    });


    lab.test('it returns an array of instances for a `writeOpResult` object', (done) => {

        const callback = function (err, docs) {

            Code.expect(err).to.not.exist();
            Code.expect(docs).to.be.an.array();

            docs.forEach((result) => {

                Code.expect(result).to.be.an.instanceOf(SubModel);
            });

            done();
        };
        const docs = {
            ops: [
                { name: 'Ren' },
                { name: 'Stimpy' }
            ]
        };

        SubModel.resultFactory(callback, undefined, docs);
    });


    lab.test('it returns a instance for a `findOpResult` object', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();
            Code.expect(result).to.be.an.instanceOf(SubModel);

            done();
        };
        const result = {
            value: { _id: 'ren', name: 'Ren' }
        };

        SubModel.resultFactory(callback, undefined, result);
    });


    lab.test('it returns undefined for a `findOpResult` object that missed', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.not.exist();

            done();
        };
        const result = {
            value: null
        };

        SubModel.resultFactory(callback, undefined, result);
    });


    lab.test('it does not convert an object into an instance without an _id property', (done) => {

        const callback = function (err, result) {

            Code.expect(err).to.not.exist();
            Code.expect(result).to.be.an.object();
            Code.expect(result).to.not.be.an.instanceOf(SubModel);

            done();
        };
        const document = { name: 'Ren' };

        SubModel.resultFactory(callback, undefined, document);
    });
});


lab.experiment('MongoModels Indexes', () => {

    let SubModel;


    lab.before((done) => {

        SubModel = class extends MongoModels {};

        SubModel.collection = 'submodels';

        MongoModels.connect(Config.mongodb.uri, Config.mongodb.options, (err, db) => {

            done(err);
        });
    });


    lab.after((done) => {

        MongoModels.disconnect();
        done();
    });


    lab.test('it successfully creates indexes', (done) => {

        SubModel.createIndexes([{ key: { username: 1 } }], (err, results) => {

            Code.expect(err).to.not.exist();
            Code.expect(results).to.be.an.object();

            done();
        });
    });
});


lab.experiment('MongoModels Helpers', () => {

    lab.test('it returns expected results for the fields adapter', (done) => {

        const fieldsDoc = MongoModels.fieldsAdapter('one -two three');
        Code.expect(fieldsDoc).to.be.an.object();
        Code.expect(fieldsDoc.one).to.equal(true);
        Code.expect(fieldsDoc.two).to.equal(false);
        Code.expect(fieldsDoc.three).to.equal(true);

        const fieldsDoc2 = MongoModels.fieldsAdapter('');
        Code.expect(Object.keys(fieldsDoc2)).to.have.length(0);

        done();
    });


    lab.test('it returns expected results for the sort adapter', (done) => {

        const sortDoc = MongoModels.sortAdapter('one -two three');
        Code.expect(sortDoc).to.be.an.object();
        Code.expect(sortDoc.one).to.equal(1);
        Code.expect(sortDoc.two).to.equal(-1);
        Code.expect(sortDoc.three).to.equal(1);

        const sortDoc2 = MongoModels.sortAdapter('');
        Code.expect(Object.keys(sortDoc2)).to.have.length(0);

        done();
    });
});


lab.experiment('MongoModels Paged Find', () => {

    let SubModel;


    lab.beforeEach((done) => {

        SubModel = class extends MongoModels {};

        SubModel.collection = 'submodels';

        MongoModels.connect(Config.mongodb.uri, Config.mongodb.options, (err, db) => {

            done(err);
        });
    });


    lab.after((done) => {

        MongoModels.disconnect();
        done();
    });


    lab.afterEach((done) => {

        SubModel.deleteMany({}, (err, result) => {

            done(err);
        });
    });


    lab.test('it returns early when an error occurs', (done) => {

        const realCount = SubModel.count;
        SubModel.count = function (filter, callback) {

            callback(new Error('count failed'));
        };

        const filter = {};
        let fields;
        const limit = 10;
        const page = 1;
        const sort = { _id: -1 };

        SubModel.pagedFind(filter, fields, sort, limit, page, (err, docs) => {

            Code.expect(err).to.be.an.object();
            Code.expect(docs).to.not.exist();

            SubModel.count = realCount;

            done();
        });
    });


    lab.test('it returns paged results', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = {};
            let fields;
            const limit = 10;
            const page = 1;
            const sort = { _id: -1 };

            SubModel.pagedFind(filter, fields, sort, limit, page, (err, docs) => {

                Code.expect(err).to.not.exist();
                Code.expect(docs).to.be.an.object();

                done(err);
            });
        });
    });


    lab.test('it returns paged results where end item is less than total', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = {};
            let fields;
            const limit = 2;
            const page = 1;
            const sort = { _id: -1 };

            SubModel.pagedFind(filter, fields, sort, limit, page, (err, docs) => {

                Code.expect(err).to.not.exist();
                Code.expect(docs).to.be.an.object();

                done(err);
            });
        });
    });


    lab.test('it returns paged results where begin item is less than total', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { 'role.special': { $exists: true } };
            let fields;
            const limit = 2;
            const page = 1;
            const sort = { _id: -1 };

            SubModel.pagedFind(filter, fields, sort, limit, page, (err, docs) => {

                Code.expect(err).to.not.exist();
                Code.expect(docs).to.be.an.object();

                done(err);
            });
        });
    });
});


lab.experiment('MongoModels Proxied Methods', () => {

    let SubModel;


    lab.before((done) => {

        SubModel = class extends MongoModels {};

        SubModel.collection = 'submodels';

        MongoModels.connect(Config.mongodb.uri, Config.mongodb.options, (err, db) => {

            done(err);
        });
    });


    lab.after((done) => {

        MongoModels.disconnect();
        done();
    });


    lab.afterEach((done) => {

        SubModel.deleteMany({}, (err, result) => {

            done(err);
        });
    });


    lab.test('it inserts data and returns the results', (done) => {

        const testDocs = [
            { name: 'Ren' },
            { name: 'Stimpy' },
            { name: 'Yak' }
        ];

        SubModel.insertMany(testDocs, (err, docs) => {

            Code.expect(err).to.not.exist();
            Code.expect(docs).to.be.an.array();
            Code.expect(docs.length).to.equal(3);

            done(err);
        });
    });


    lab.test('it inserts one document and returns the result', (done) => {

        const testDoc = { name: 'Horse' };

        SubModel.insertOne(testDoc, (err, docs) => {

            Code.expect(err).to.not.exist();
            Code.expect(docs).to.be.an.array();

            done(err);
        });
    });


    lab.test('it inserts many documents and returns the results', (done) => {

        const testDocs = [
            { name: 'Toast' },
            { name: 'Space' }
        ];

        SubModel.insertMany(testDocs, (err, docs) => {

            Code.expect(err).to.not.exist();
            Code.expect(docs).to.be.an.array();
            Code.expect(docs.length).to.equal(2);

            done(err);
        });
    });


    lab.test('it updates a document and returns the results', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = {
                _id: results.setup[0]._id
            };
            const update = {
                $set: { isCool: true }
            };

            SubModel.updateOne(filter, update, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(1);

                done(err);
            });
        });
    });


    lab.test('it updates a document and returns the results (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = {
                _id: results.setup[0]._id
            };
            const update = {
                $set: { isCool: true }
            };
            const options = { upsert: true };

            SubModel.updateOne(filter, update, options, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(1);

                done(err);
            });
        });
    });


    lab.test('it returns an error when updateOne fails', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const realCollection = MongoModels.db.collection;
            MongoModels.db.collection = function () {

                return {
                    updateOne: function (filter, update, options, callback) {

                        callback(new Error('Whoops!'));
                    }
                };
            };

            const filter = {};
            const update = { $set: { isCool: true } };

            SubModel.updateOne(filter, update, (err, count) => {

                Code.expect(err).to.exist();
                Code.expect(count).to.not.exist();

                MongoModels.db.collection = realCollection;
                done();
            });
        });
    });


    lab.test('it updates many documents and returns the results', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = {};
            const update = { $set: { isCool: true } };

            SubModel.updateMany(filter, update, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(3);

                done(err);
            });
        });
    });


    lab.test('it updates many documents and returns the results (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = {};
            const update = { $set: { isCool: true } };
            const options = { upsert: true };

            SubModel.updateMany(filter, update, options, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(3);

                done(err);
            });
        });
    });


    lab.test('it returns an error when updateMany fails', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const realCollection = MongoModels.db.collection;
            MongoModels.db.collection = function () {

                return {
                    updateMany: function (filter, update, options, callback) {

                        callback(new Error('Whoops!'));
                    }
                };
            };

            const filter = {};
            const update = { $set: { isCool: true } };

            SubModel.updateMany(filter, update, (err, count) => {

                Code.expect(err).to.exist();
                Code.expect(count).to.not.exist();

                MongoModels.db.collection = realCollection;
                done();
            });
        });
    });


    lab.test('it returns aggregate results from a collection', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren', group: 'Friend', count: 100 },
                    { name: 'Stimpy', group: 'Friend', count: 10 },
                    { name: 'Yak', group: 'Foe', count: 430 }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err) => {

            if (err) {
                return done(err);
            }

            const pipeline = [
                { $match: {} },
                { $group: { _id: '$group', total: { $sum: '$count' } } },
                { $sort: { total: -1 } }
            ];

            SubModel.aggregate(pipeline, (err, results) => {

                Code.expect(err).to.not.exist();
                Code.expect(results[0].total).to.equal(430);
                Code.expect(results[1].total).to.equal(110);

                done();
            });
        });
    });


    lab.test('it returns a collection count', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            SubModel.count({}, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.a.number();
                Code.expect(result).to.equal(3);

                done();
            });
        });
    });


    lab.test('it returns distinct results from a collection', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren', group: 'Friend' },
                    { name: 'Stimpy', group: 'Friend' },
                    { name: 'Yak', group: 'Foe' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            SubModel.distinct('group', (err, values) => {

                Code.expect(err).to.not.exist();
                Code.expect(values).to.be.an.array();
                Code.expect(values.length).to.equal(2);

                done();
            });
        });
    });


    lab.test('it returns a result array', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' },
                    { name: 'Yak' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            SubModel.find({}, (err, docs) => {

                Code.expect(err).to.not.exist();
                Code.expect(docs).to.be.an.array();

                docs.forEach((result) => {

                    Code.expect(result).to.be.an.instanceOf(SubModel);
                });

                done();
            });
        });
    });


    lab.test('it returns a single result', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            SubModel.findOne({}, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it returns a single result via id', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const id = results.setup[0]._id;

            SubModel.findById(id, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it returns and error when id casting fails during findById', (done) => {

        SubModel.findById('NOTVALIDOBJECTID', (err, result) => {

            Code.expect(err).to.exist();
            done();
        });
    });


    lab.test('it updates a single document via findByIdAndUpdate', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const id = results.setup[0]._id;
            const update = { name: 'New Name' };

            SubModel.findByIdAndUpdate(id, update, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it returns an error when casting fails during findByIdAndUpdate', (done) => {

        SubModel.findByIdAndUpdate('NOTVALIDOBJECTID', {}, (err, result) => {

            Code.expect(err).to.exist();
            done();
        });
    });


    lab.test('it updates a single document via id (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const id = results.setup[0]._id;
            const update = { name: 'New Name' };
            const options = { returnOriginal: false };

            SubModel.findByIdAndUpdate(id, update, options, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it updates a single document via findOneAndUpdate', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };
            const update = { name: 'New Name' };

            SubModel.findOneAndUpdate(filter, update, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it updates a single document via findOneAndUpdate (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };
            const update = { name: 'New Name' };
            const options = { returnOriginal: true };

            SubModel.findOneAndUpdate(filter, update, options, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it replaces a single document via findOneAndReplace', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };
            const doc = { isCool: true };

            SubModel.findOneAndReplace(filter, doc, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it replaces a single document via findOneAndReplace (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };
            const doc = { isCool: true };
            const options = { returnOriginal: true };

            SubModel.findOneAndReplace(filter, doc, options, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it replaces one document and returns the result', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };
            const doc = { isCool: true };

            SubModel.replaceOne(filter, doc, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(1);

                done(err);
            });
        });
    });


    lab.test('it replaces one document and returns the result (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };
            const doc = { isCool: true };
            const options = { upsert: true };

            SubModel.replaceOne(filter, doc, options, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(1);

                done(err);
            });
        });
    });


    lab.test('it returns an error when replaceOne fails', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const realCollection = MongoModels.db.collection;
            MongoModels.db.collection = function () {

                return {
                    replaceOne: function (filter, doc, options, callback) {

                        callback(new Error('Whoops!'));
                    }
                };
            };

            const filter = { name: 'Ren' };
            const doc = { isCool: true };

            SubModel.replaceOne(filter, doc, (err, count) => {

                Code.expect(err).to.exist();
                Code.expect(count).to.not.exist();

                MongoModels.db.collection = realCollection;
                done();
            });
        });
    });


    lab.test('it deletes a document via findOneAndDelete', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const filter = { name: 'Ren' };

            SubModel.findOneAndDelete(filter, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it deletes a document via findByIdAndDelete', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const id = results.setup[0]._id;

            SubModel.findByIdAndDelete(id, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it deletes a single document via findByIdAndDelete (with options)', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const id = results.setup[0]._id;
            const options = {
                projection: {
                    name: 1
                }
            };

            SubModel.findByIdAndDelete(id, options, (err, result) => {

                Code.expect(err).to.not.exist();
                Code.expect(result).to.be.an.object();
                Code.expect(result).to.be.an.instanceOf(SubModel);

                done();
            });
        });
    });


    lab.test('it returns an error when id casting fails during findByIdAndDelete', (done) => {

        SubModel.findByIdAndDelete('NOTVALIDOBJECTID', (err, result) => {

            Code.expect(err).to.exist();
            done();
        });
    });


    lab.test('it deletes one document via deleteOne', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDoc = { name: 'Ren' };

                SubModel.insertOne(testDoc, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            SubModel.deleteOne({}, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(1);

                done();
            });
        });
    });


    lab.test('it returns an error when deleteOne fails', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const realCollection = MongoModels.db.collection;
            MongoModels.db.collection = function () {

                return {
                    deleteOne: function (filter, callback) {

                        callback(new Error('Whoops!'));
                    }
                };
            };

            SubModel.deleteOne({}, (err, count) => {

                Code.expect(err).to.exist();
                Code.expect(count).to.not.exist();

                MongoModels.db.collection = realCollection;
                done();
            });
        });
    });


    lab.test('it deletes multiple documents and returns the count via deleteMany', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            SubModel.deleteMany({}, (err, count) => {

                Code.expect(err).to.not.exist();
                Code.expect(count).to.be.a.number();
                Code.expect(count).to.equal(2);

                done();
            });
        });
    });


    lab.test('it returns an error when deleteMany fails', (done) => {

        Async.auto({
            setup: function (cb) {

                const testDocs = [
                    { name: 'Ren' },
                    { name: 'Stimpy' }
                ];

                SubModel.insertMany(testDocs, cb);
            }
        }, (err, results) => {

            if (err) {
                return done(err);
            }

            const realCollection = MongoModels.db.collection;
            MongoModels.db.collection = function () {

                return {
                    deleteMany: function (filter, callback) {

                        callback(new Error('Whoops!'));
                    }
                };
            };

            SubModel.deleteMany({}, (err, count) => {

                Code.expect(err).to.exist();
                Code.expect(count).to.not.exist();

                MongoModels.db.collection = realCollection;
                done();
            });
        });
    });
});
