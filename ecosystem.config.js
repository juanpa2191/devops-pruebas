module.exports = {
  apps: [
    {
      name: 'taller-motos-api',
      script: 'src/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3030,
      },
    },
  ],
};
