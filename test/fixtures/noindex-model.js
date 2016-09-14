'use strict';
const MongoModels = require('../../index');
const Joi = require('joi');


class NoIndex extends MongoModels {}


NoIndex.collection = 'noindexes';


NoIndex.schema = Joi.object().keys({
    name: Joi.string().required(),
    hasHat: Joi.boolean()
});


module.exports = NoIndex;
