# mongo-models

Map JavaScript classes to MongoDB collections.

[![Build Status](https://travis-ci.org/jedireza/mongo-models.svg?branch=master)](https://travis-ci.org/jedireza/mongo-models)
[![Dependency Status](https://david-dm.org/jedireza/mongo-models.svg?style=flat)](https://david-dm.org/jedireza/mongo-models)
[![devDependency Status](https://david-dm.org/jedireza/mongo-models/dev-status.svg?style=flat)](https://david-dm.org/jedireza/mongo-models#info=devDependencies)
[![peerDependency Status](https://david-dm.org/jedireza/mongo-models/peer-status.svg?style=flat)](https://david-dm.org/jedireza/mongo-models#info=peerDependencies)

[MongoDB](https://github.com/mongodb/node-mongodb-native)'s native driver for
Node.js is pretty good. We just want a little sugar on top.

[Mongoose](http://mongoosejs.com/) is awesome, and big. It's built on top of
MongoDB's native Node.js driver. It's a real deal ODM with tons of features.
You should check it out.

We wanted something in between the MongoDB driver and Mongoose. A light weight
absctraction where we can interact with collections via JavaScript classes and
get document results as instances of those classes.

We're also big fans of the object schema validation library
[joi](https://github.com/hapijs/joi). Joi works well for defining a model's
data schema.


## Install

```bash
$ npm install mongo-models
```


## Usage

### Creating models

You extend the `MongoModels` class to create new model classes that map to
MongoDB collections. The base class also acts as a singleton so models share
one connection per process.

Let's create a `Customer` model.

```js
const Joi = require('joi');
const MongoModels = require('mongo-models');

class Customer extends MongoModels {
    static create(name, email, phone, callback) {
      const document = {
          name,
          email,
          phone
      };

      this.insertOne(document, (err, docs) => {
          if (err) {
              callback();
              return;
          }

          callback(null, docs[0]);
      });
    }

    speak() {
        console.log(`${this.name}: call me at ${this.phone}.`);
    }
}

Customer.collection = 'customers'; // the mongodb collection name

Customer.schema = Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string()
});

module.exports = Customer;
```

### Example

```js
const Customer = require('./customer');
const Express = require('express');
const MongoModels = require('mongo-models');

const app = Express();

MongoModels.connect(process.env.MONGODB_URI, {}, (err, db) => {
    if (err) {
        // TODO: throw error or try reconnecting
        return;
    }

    // optionally, we can keep a reference to db if we want
    // access to the db connection outside of our models
    app.db = db;

    console.log('Models are now connected to mongodb.');
});

app.post('/customers', (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;

    Customer.create(name, email, phone, (err, customer) => {
        if (err) {
            res.status(500).json({ error: 'something blew up' });
            return;
        }

        res.json(customer);
    });
});

app.get('/customers', (req, res) => {

    const filter = {
        name: req.query.name
    };

    Customer.find(filter, (err, customers) => {
        if (err) {
            res.status(500).json({ error: 'something blew up' });
            return;
        }

        res.json(customers);
    });
});

app.server.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
```


## API

See the [API reference](https://github.com/jedireza/mongo-models/blob/master/API.md).


## Have a question?

Any issues or questions (no matter how basic), open an issue. Please take the
initiative to read relevant documentation and be pro-active with debugging.


## Want to contribute?

Contributions are welcome. If you're changing something non-trivial, you may
want to submit an issue before creating a large pull request.


## License

MIT


## Don't forget

What you create with `mongo-models` is more important than `mongo-models`.
