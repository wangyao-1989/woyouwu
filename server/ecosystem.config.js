module.exports = {
  apps: [{
    name: 'woyouwu-server',
    script: 'index.js',
    cwd: '/www/wwwroot/woyouwu/server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5004,
      JWT_SECRET: 'woyouwu_jwt_secret_key_2026'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5004,
      JWT_SECRET: 'woyouwu_jwt_secret_key_2026'
    },
    autorestart: true,
    restart_delay: 1000,
    exp_backoff_restart_delay: 100,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
