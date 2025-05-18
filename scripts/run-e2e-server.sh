#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "🚀 Starting Firebase emulators and Next.js test server..."

# Define project ID (replace with env var if needed)
PROJECT_ID="next-firebase-base-template"
SEED_DATA_DIR="./firebase-seed-data"

# Start emulators and execute the test server command within that environment
# We only need the auth emulator for the current global-setup.ts logic
# Explicitly set NODE_ENV=test for the command executed by emulators:exec
firebase emulators:exec --only auth --import="$SEED_DATA_DIR" --project "$PROJECT_ID" \
  "echo '🔥 Starting Next.js server for E2E tests...' && NODE_ENV=test npm run dev:test"

echo "✅ Emulators and server started (or process exited)." 