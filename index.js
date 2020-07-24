'use strict';

const Hoek = require('@hapi/hoek');
const Mongodb = require('mongodb');


const dbFromArgs = function (args) {

    let db = MongoModels.dbs.default;

    if (args[0] instanceof Mongodb.Db) {
        db = args.shift();
    }

    return db;
};


class MongoModels {
    constructor(data) {

        const result = this.constructor.validate(data);

        if (result.error) {
            throw result.error;
        }

        Object.assign(this, result.value);
    }


    static aggregate(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);

        return collection.aggregate(...args).toArray();
    }


    static collection(...args) {

        const db = dbFromArgs(args);

        return db.collection(this.collectionName);
    }


    static async connect(connection, options = {}, name = 'default') {

        options = Hoek.applyToDefaults({ useNewUrlParser: true }, options);

        const client = await Mongodb.MongoClient.connect(connection.uri, options);

        MongoModels.clients[name] = client;
        MongoModels.dbs[name] = client.db(connection.db);

        return MongoModels.dbs[name];
    }


    static count(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);

        return collection.countDocuments(...args);
    }


    static createIndexes(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);

        return collection.createIndexes(...args);
    }


    static deleteMany(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);

        return collection.deleteMany(...args);
    }


    static deleteOne(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);

        return collection.deleteOne(...args);
    }


    static disconnect(name) {

        if (name === undefined) {
            Object.keys(MongoModels.dbs).forEach((key) => {

                delete MongoModels.dbs[key];

                MongoModels.clients[key].close();
            });

            return;
        }

        if (!MongoModels.dbs.hasOwnProperty(name)) {
            throw new Error(`Db connection '${name}' not found.`);
        }

        delete MongoModels.dbs[name];

        MongoModels.clients[name].close();
    }


    static distinct(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);

        return collection.distinct(...args);
    }


    static fieldsAdapter(fields) {

        if (Object.prototype.toString.call(fields) === '[object String]') {
            const document = {};

            fields = fields.split(/\s+/);
            fields.forEach((field) => {

                if (field) {
                    const include = field[0] === '-' ? false : true;
                    if (!include) {
                        field = field.slice(1);
                    }

                    document[field] = include;
                }
            });

            fields = document;
        }

        return fields;
    }


    static async find(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const result = await collection.find(...args).toArray();

        return this.resultFactory(result);
    }


    static async findById(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const id = args.shift();
        const filter = { _id: this._idClass(id) };

        args.unshift(filter);

        const result = await collection.findOne(...args);

        return this.resultFactory(result);
    }


    static async findByIdAndDelete(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const id = args.shift();
        const filter = { _id: this._idClass(id) };
        const options = Hoek.applyToDefaults({}, args.pop() || {});
        const result = await collection.findOneAndDelete(filter, options);

        return this.resultFactory(result);
    }


    static async findByIdAndUpdate(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const id = args.shift();
        const update = args.shift();
        const defaultOptions = {
            returnOriginal: false
        };
        const options = Hoek.applyToDefaults(defaultOptions, args.pop() || {});
        const filter = { _id: this._idClass(id) };
        const result = await collection.findOneAndUpdate(filter, update, options);

        return this.resultFactory(result);
    }


    static async findOne(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const result = await collection.findOne(...args);

        return this.resultFactory(result);
    }


    static async findOneAndDelete(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const result = await collection.findOneAndDelete(...args);

        return this.resultFactory(result);
    }


    static async findOneAndReplace(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const filter = args.shift();
        const doc = args.shift();
        const defaultOptions = {
            returnOriginal: false
        };
        const options = Hoek.applyToDefaults(defaultOptions, args.pop() || {});

        args.push(filter);
        args.push(doc);
        args.push(options);

        const result = await collection.findOneAndReplace(...args);

        return this.resultFactory(result);
    }


    static async findOneAndUpdate(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const filter = args.shift();
        const doc = args.shift();
        const defaultOptions = {
            returnOriginal: false
        };
        const options = Hoek.applyToDefaults(defaultOptions, args.pop() || {});

        args.push(filter);
        args.push(doc);
        args.push(options);

        const result = await collection.findOneAndUpdate(...args);

        return this.resultFactory(result);
    }


    static async insertMany(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const result = await collection.insertMany(...args);

        return this.resultFactory(result);
    }


    static async insertOne(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const result = await collection.insertOne(...args);

        return this.resultFactory(result);
    }


    static async pagedFind(...args) {

        const db = dbFromArgs(args);
        const filter = args.shift();
        const page = args.shift();
        const limit = args.shift();
        const options = args.pop() || {};

        const output = {
            data: undefined,
            pages: {
                current: page,
                prev: 0,
                hasPrev: false,
                next: 0,
                hasNext: false,
                total: 0
            },
            items: {
                limit,
                begin: ((page * limit) - limit) + 1,
                end: page * limit,
                total: 0
            }
        };
        const findOptions = Object.assign({}, options, {
            limit,
            skip: (page - 1) * limit
        });
        const [count, results] = await Promise.all([
            this.count(db, filter),
            this.find(db, filter, findOptions)
        ]);

        output.data = results;
        output.items.total = count;
        output.pages.total = Math.ceil(output.items.total / limit);
        output.pages.next = output.pages.current + 1;
        output.pages.hasNext = output.pages.next <= output.pages.total;
        output.pages.prev = output.pages.current - 1;
        output.pages.hasPrev = output.pages.prev !== 0;

        if (output.items.begin > output.items.total) {
            output.items.begin = output.items.total;
        }

        if (output.items.end > output.items.total) {
            output.items.end = output.items.total;
        }

        return output;
    }


    static async replaceOne(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const filter = args.shift();
        const doc = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});

        args.push(filter);
        args.push(doc);
        args.push(options);

        const result = await collection.replaceOne(...args);

        return this.resultFactory(result);
    }


    static resultFactory(result) {

        if (Object.prototype.toString.call(result) === '[object Array]') {
            result.forEach((item, index) => {

                result[index] = new this(item);
            });
        }

        if (Object.prototype.toString.call(result) === '[object Object]') {
            if (result.hasOwnProperty('value') && !result.hasOwnProperty('_id')) {
                if (result.value) {
                    result = new this(result.value);
                }
                else {
                    result = undefined;
                }
            }
            else if (result.hasOwnProperty('ops')) {
                result.ops.forEach((item, index) => {

                    result.ops[index] = new this(item);
                });

                result = result.ops;
            }
            else if (result.hasOwnProperty('_id')) {
                result = new this(result);
            }
        }

        return result;
    }


    static sortAdapter(sorts) {

        if (Object.prototype.toString.call(sorts) === '[object String]') {
            const document = {};

            sorts = sorts.split(/\s+/);
            sorts.forEach((sort) => {

                if (sort) {
                    const order = sort[0] === '-' ? -1 : 1;
                    if (order === -1) {
                        sort = sort.slice(1);
                    }

                    document[sort] = order;
                }
            });

            sorts = document;
        }

        return sorts;
    }


    static async updateMany(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const filter = args.shift();
        const update = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});

        args.push(filter);
        args.push(update);
        args.push(options);

        const result = await collection.updateMany(...args);

        return this.resultFactory(result);
    }


    static async updateOne(...args) {

        const db = dbFromArgs(args);
        const collection = db.collection(this.collectionName);
        const filter = args.shift();
        const update = args.shift();
        const options = Hoek.applyToDefaults({}, args.pop() || {});

        args.push(filter);
        args.push(update);
        args.push(options);

        const result = await collection.updateOne(...args);

        return this.resultFactory(result);
    }


    static validate(input) {

        return this.schema.validate(input);
    }


    validate() {

        return this.constructor.schema.validate(this);
    }


    static with(name) {

        if (!MongoModels.dbs.hasOwnProperty(name)) {
            throw new Error(`Db connection '${name}' not found.`);
        }

        const db = MongoModels.dbs[name];
        const boundFunctionsId = `__MongoModelsDbBound${this.name}__`;

        if (!db.hasOwnProperty(boundFunctionsId)) {
            db[boundFunctionsId] = {
                aggregate: this.aggregate.bind(this, db),
                collection: this.collection.bind(this, db),
                count: this.count.bind(this, db),
                createIndexes: this.createIndexes.bind(this, db),
                deleteMany: this.deleteMany.bind(this, db),
                deleteOne: this.deleteOne.bind(this, db),
                distinct: this.distinct.bind(this, db),
                find: this.find.bind(this, db),
                findById: this.findById.bind(this, db),
                findByIdAndDelete: this.findByIdAndDelete.bind(this, db),
                findByIdAndUpdate: this.findByIdAndUpdate.bind(this, db),
                findOne: this.findOne.bind(this, db),
                findOneAndDelete: this.findOneAndDelete.bind(this, db),
                findOneAndReplace: this.findOneAndReplace.bind(this, db),
                findOneAndUpdate: this.findOneAndUpdate.bind(this, db),
                insertMany: this.insertMany.bind(this, db),
                insertOne: this.insertOne.bind(this, db),
                pagedFind: this.pagedFind.bind(this, db),
                replaceOne: this.replaceOne.bind(this, db),
                updateMany: this.updateMany.bind(this, db),
                updateOne: this.updateOne.bind(this, db)
            };
        }

        return db[boundFunctionsId];
    }
}


MongoModels._idClass = Mongodb.ObjectID;
MongoModels.ObjectId = MongoModels.ObjectID = Mongodb.ObjectID;
MongoModels.clients = {};
MongoModels.dbs = {};


module.exports = MongoModels;
