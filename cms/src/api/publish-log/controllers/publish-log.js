'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::publish-log.publish-log');
