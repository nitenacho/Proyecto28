'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::admin-whitelist.admin-whitelist');
