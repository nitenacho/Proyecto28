module.exports = ({ env }) => ({
  // Strapi Cloud handles file uploads with its own provider. For local dev we
  // use the default local provider; in production the platform injects creds.
  upload: {
    config: {
      sizeLimit: 25 * 1024 * 1024, // 25 MB — enough for .glb / hi-res images
    },
  },
});
