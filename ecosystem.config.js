module.exports = {
  apps: [
    {
      name: 'next-dev',
      script: 'npm',
      args: 'run dev',
      watch: true,
      ignore_watch: ['node_modules', '.next', 'logs', '.git'],
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      min_uptime: '60s',
      max_restarts: 5,
    },
  ],
};
