#!/usr/bin/env bash

# Kill any existing Next.js dev servers
echo "Killing any existing Next.js servers..."
kill $(lsof -t -i:3000 -i:3001 -i:3002 2>/dev/null) 2>/dev/null || true

# Create a temp file to capture the server output
TEMP_LOG_FILE=$(mktemp)

# Start a Next.js dev server and capture its output
echo "Starting Next.js server..."
npm run dev > "$TEMP_LOG_FILE" 2>&1 &

# Get the PID of the server
SERVER_PID=$!

# Give the server time to start and output its info
echo "Waiting for server to start..."
sleep 7

# Extract the port from Next.js output
PORT=$(grep -o "Local:.*http://localhost:[0-9]\+" "$TEMP_LOG_FILE" | grep -o "[0-9]\+$")
if [ -z "$PORT" ]; then
  echo "Could not detect port from server output, trying another pattern..."
  PORT=$(grep -o "http://localhost:[0-9]\+" "$TEMP_LOG_FILE" | head -1 | grep -o "[0-9]\+$")
  if [ -z "$PORT" ]; then
    echo "Still couldn't detect port, checking network..."
    PORT=$(lsof -i -P -n | grep LISTEN | grep node | head -n 1 | awk '{print $9}' | sed 's/.*://')
    if [ -z "$PORT" ]; then
      echo "Falling back to default port 3000"
      PORT=3000
    fi
  fi
fi

# Show the server log for debugging
echo "Server log output:"
cat "$TEMP_LOG_FILE"
rm "$TEMP_LOG_FILE"

echo "Server detected on port $PORT"

# Export the base URL for Playwright
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:$PORT"

# Confirm server is up by making a request
echo "Checking if server is ready at $PLAYWRIGHT_TEST_BASE_URL..."
RETRY_COUNT=0
MAX_RETRIES=10
SERVER_READY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -s -o /dev/null -w "%{http_code}" "$PLAYWRIGHT_TEST_BASE_URL" | grep -q "200\|404"; then
    SERVER_READY=true
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for server (attempt $RETRY_COUNT/$MAX_RETRIES)..."
  sleep 2
done

if [ "$SERVER_READY" = false ]; then
  echo "Server did not become ready, exiting..."
  kill $SERVER_PID
  exit 1
fi

# Run the navigation tests with a focus on just one browser to simplify debugging
echo "Running navigation tests on port $PORT..."
npx playwright test tests/e2e/navigation.spec.ts --project=chromium "$@"
TEST_RESULT=$?

# Kill the server
echo "Shutting down server..."
kill $SERVER_PID

# Exit with the test result
exit $TEST_RESULT 