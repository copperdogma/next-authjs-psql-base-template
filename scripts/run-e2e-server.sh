#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Starting Next.js test server..."

# Start the Next.js test server directly
echo '🔥 Starting Next.js server for E2E tests...'
NODE_ENV=test npm run dev:test

echo "✅ Server started (or process exited)." 