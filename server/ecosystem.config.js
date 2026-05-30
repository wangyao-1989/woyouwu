module.exports = {
  apps: [{
    name: 'woyouwu-server',
    script: 'index.js',
    cwd: '/www/wwwroot/woyouwu/server',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '800M',
    node_args: '--max-old-space-size=512',
    env: {
      NODE_ENV: 'development',
      PORT: 5004,
      JWT_SECRET: 'woyouwu_jwt_secret_key_2026',
      DEEPSEEK_API_KEY: 'ark-bb76e101-355a-428f-9ebe-e481a942040d-a2343'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5004,
      JWT_SECRET: 'woyouwu_jwt_secret_key_2026',
      DEEPSEEK_API_KEY: 'ark-bb76e101-355a-428f-9ebe-e481a942040d-a2343'
    },
    autorestart: true,
    restart_delay: 1000,
    exp_backoff_restart_delay: 100,
    kill_timeout: 10000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
