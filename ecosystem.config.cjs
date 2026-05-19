module.exports = {
  apps: [
    {
      name: 'barbu-api',
      script: 'dist/index.js',
      cwd: '/var/www/vincent/react-barbu-v3/src/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 4003,
      },
      watch: false,
    },
  ],
};
