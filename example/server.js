'use strict';
const BodyParser = require('body-parser');
const Customer = require('./customer');
const Express = require('express');
const MongoModels = require('../');


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
