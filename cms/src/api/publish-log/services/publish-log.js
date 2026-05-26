'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::publish-log.publish-log');
