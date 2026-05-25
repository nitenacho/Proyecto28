module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https:'],
          'media-src': ["'self'", 'data:', 'blob:', 'https:'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: (ctx) => {
        const requestOrigin = ctx.get('Origin');
        if (!requestOrigin) return '*';

        const allowedOrigins = new Set([
          'https://proyecto28.com',
          'https://www.proyecto28.com',
          'https://proyecto28.cl',
          'https://www.proyecto28.cl',
          'https://nitenacho.github.io',
        ]);

        try {
          const { hostname, protocol } = new URL(requestOrigin);
          if (
            (hostname === 'localhost' || hostname === '127.0.0.1') &&
            (protocol === 'http:' || protocol === 'https:')
          ) {
            return requestOrigin;
          }
        } catch {
          return '';
        }

        return allowedOrigins.has(requestOrigin) ? requestOrigin : '';
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      headers: '*',
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
