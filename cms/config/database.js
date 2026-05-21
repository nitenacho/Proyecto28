const path = require('path');

module.exports = ({ env }) => {
  // Strapi Cloud / Railway / Render set DATABASE_URL — prefer that if present
  if (env('DATABASE_URL')) {
    return {
      connection: {
        client: 'postgres',
        connection: {
          connectionString: env('DATABASE_URL'),
          ssl: env.bool('DATABASE_SSL', true)
            ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', false) }
            : false,
        },
        pool: { min: 0, max: 10 },
      },
    };
  }

  const client = env('DATABASE_CLIENT', 'sqlite');
  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: path.join(__dirname, '..', env('DATABASE_FILENAME', '.tmp/data.db')),
        },
        useNullAsDefault: true,
      },
    };
  }
  return {
    connection: {
      client,
      connection: {
        host:     env('DATABASE_HOST', 'localhost'),
        port:     env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user:     env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl:      env.bool('DATABASE_SSL', false),
      },
    },
  };
};
