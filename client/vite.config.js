const { defineConfig } = require('vite');

// Proxy any /api requests to the backend running on port 4000 during dev
module.exports = defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
