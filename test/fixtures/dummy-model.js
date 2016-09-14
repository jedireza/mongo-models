'use strict';
const MongoModels = require('../../index');
const Joi = require('joi');


class Dummy extends MongoModels {}


Dummy.collection = 'dummies';


Dummy.schema = Joi.object().keys({
    name: Joi.string().required(),
    hasHat: Joi.boolean()
});


Dummy.indexes = [
    { key: { name: 1 } },
    { key: { hasHat: -1 } }
];


module.exports = Dummy;
