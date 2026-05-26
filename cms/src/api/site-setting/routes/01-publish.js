'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/publish',
      handler: 'api::site-setting.site-setting.publish',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
