module.exports = {
  apps: [
    {
      name: "alyona-api",
      script: "./server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 3000,
      kill_timeout: 15000,
      listen_timeout: 15000,
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
