# mongo-models

JavaScript class interfaces to MongoDB collections.

[![Build Status](https://img.shields.io/travis/jedireza/mongo-models.svg)](https://travis-ci.org/jedireza/mongo-models)
[![Dependency Status](https://img.shields.io/david/jedireza/mongo-models.svg)](https://david-dm.org/jedireza/mongo-models)
[![devDependency Status](https://img.shields.io/david/dev/jedireza/mongo-models.svg)](https://david-dm.org/jedireza/mongo-models#info=devDependencies)
[![peerDependency Status](https://img.shields.io/david/peer/jedireza/mongo-models.svg)](https://david-dm.org/jedireza/mongo-models#info=peerDependencies)

[MongoDB](https://github.com/mongodb/node-mongodb-native)'s native driver for
Node.js is pretty good. We just want a little sugar on top.

[Mongoose](http://mongoosejs.com/) is awesome, and big. It's built on top of
MongoDB's native Node.js driver. It's a real deal ODM with tons of features.
You should check it out.

We wanted something in between the MongoDB driver and Mongoose. A light weight
abstraction where we can interact with collections via JavaScript classes and
get document results as instances of those classes.

We're also big fans of the object schema validation library
[joi](https://github.com/hapijs/joi). Joi works well for defining a model's
data schema.


## API reference

See the current [v2.x API
reference](https://github.com/jedireza/mongo-models/blob/master/API.md).

See the old [v1.x API
reference](https://github.com/jedireza/mongo-models/blob/996c21e0e18c4cf70e665d319c7cf5eaa9cff846/API.md).


## Install

```bash
$ npm install mongo-models
```


## Usage

### Creating models

You extend the `MongoModels` class to create new model classes that map to
MongoDB collections.

Let's create a `Customer` model.

```js
'use strict';
const Joi = require('joi');
const MongoModels = require('mongo-models');

const schema = Joi.object({
    _id: Joi.object(),
    name: Joi.string().required(),
    email: Joi.string().email(),
    phone: Joi.string()
});

class Customer extends MongoModels {
    static create(name, email, phone) {

        const document = new Customer({
            name,
            email,
            phone
        });

        return this.insertOne(document);
    }

    speak() {

        console.log(`${this.name}: call me at ${this.phone}.`);
    }
}

Customer.collectionName = 'customers'; // the mongodb collection name
Customer.schema = schema;

module.exports = Customer;
```


## Example

```js
'use strict';
const BodyParser = require('body-parser');
const Customer = require('./customer');
const Express = require('express');
const MongoModels = require('mongo-models');

const app = Express();
const connection = {
    uri: process.env.MONGODB_URI,
    db: process.env.MONGODB_NAME
};

app.use(BodyParser.json());

app.post('/customers', async (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    let customers;

    try {
        customers = await Customer.create(name, email, phone);
    }
    catch (err) {
        res.status(500).json({ error: 'something blew up' });
        return;
    }

    res.json(customers[0]);
});

app.get('/customers', async (req, res) => {

    const name = req.query.name;
    const filter = {};

    if (name) {
        filter.name = name;
    }

    let customers;

    try {
        customers = await Customer.find(filter);
    }
    catch (err) {
        res.status(500).json({ error: 'something blew up' });
        return;
    }

    res.json(customers);
});

const main = async function () {

    await MongoModels.connect(connection, {});

    console.log('Models are now connected.');

    await app.listen(process.env.PORT);

    console.log(`Server is running on port ${process.env.PORT}`);
};

main();
```

### Run the example

To run the example, first clone this repo and install the dependencies.

```bash
$ git clone https://github.com/jedireza/mongo-models.git
$ cd mongo-models
$ npm install
```

The example is a simple Express API that uses the Customer model we created
above. [View the
code.](https://github.com/jedireza/mongo-models/tree/master/example)

```bash
$ npm run example
```


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
