{
  "apps": [
    {
      "name": "woyouwu-server",
      "script": "index.js",
      "cwd": "/var/www/woyouwu/server",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "production",
        "PORT": 5000
      },
      "env_production": {
        "NODE_ENV": "production",
        "PORT": 5000
      },
      "error_file": "/var/log/woyouwu/server-error.log",
      "out_file": "/var/log/woyouwu/server-out.log",
      "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
      "merge_logs": true,
      "kill_timeout": 10000,
      "wait_ready": true,
      "listen_timeout": 10000,
      "restart_delay": 1000
    }
  ]
}
