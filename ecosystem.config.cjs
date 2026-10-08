// pm2 process for production. Deploy:
//   npm ci && npm run build && pm2 startOrReload ecosystem.config.cjs --update-env && pm2 save
module.exports = {
  apps: [
    {
      name: "clubedescontosporto",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      // Must be `localhost` (not 127.0.0.1): Next 16 builds the Proxy URL as localhost:<port>,
      // and a different host makes the next-intl rewrite /pt -> /pt-PT an external proxy (500 over HTTPS).
      args: "start -H localhost -p 3020",
      exec_mode: "fork",
      instances: 1,
      env: { NODE_ENV: "production" },
      max_memory_restart: "600M",
      kill_timeout: 5000,
    },
  ],
};
