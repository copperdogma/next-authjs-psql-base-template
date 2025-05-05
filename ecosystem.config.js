module.exports = {
  apps: [
    {
      name: 'next-dev',
      script: 'npm',
      args: 'run dev',
      watch: ['.'],
      ignore_watch: ['node_modules', '.next', 'logs', '.git', '*.log'],
      autorestart: true,
      env_development: {
        NODE_ENV: 'development',
        DATABASE_URL:
          'postgresql://postgres:postgres@localhost:5432/ai-calendar-helper-test?schema=public',
        NEXTAUTH_SECRET: 'test_nextauth_secret',
        PORT: process.env.PORT || 3000,
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
        FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
        FIRESTORE_EMULATOR_HOST: 'localhost:8080',
        TEST_USER_EMAIL: 'test@example.com',
        TEST_USER_PASSWORD: 'Test123!',
      },
      out_file: './logs/next-dev-out.log',
      error_file: './logs/next-dev-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
