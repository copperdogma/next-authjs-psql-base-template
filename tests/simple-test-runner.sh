#!/usr/bin/env bash

# This is a simplified test runner that separates each step
# to make it easier to identify where things are hanging

echo "Step 1: Killing any existing Next.js servers..."
kill $(lsof -t -i:3000 -i:3001 -i:3002 2>/dev/null) 2>/dev/null || true

echo "Step 2: Starting Next.js server manually..."
echo "Starting Next.js in a new terminal window. Please wait until it's running."
echo "Once it's running, press Enter to continue."

# Start the server in a separate terminal - this way we can see the output directly
osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'
read -p "Press Enter once the server is running..."

echo "Step 3: Finding server port..."
PORT=$(lsof -i -P -n | grep LISTEN | grep node | head -n 1 | awk '{print $9}' | sed 's/.*://')
if [ -z "$PORT" ]; then
  echo "Could not detect port automatically."
  read -p "Please enter the port number shown in the Next.js server output: " PORT
fi

echo "Server port detected/entered: $PORT"

# Export the base URL for Playwright
export PLAYWRIGHT_TEST_BASE_URL="http://localhost:$PORT"

echo "Step 4: Running simple debug test first..."
echo "Running test with URL: $PLAYWRIGHT_TEST_BASE_URL"
npx playwright test tests/e2e/debug.spec.ts --project=chromium

echo "Step 5: If the debug test succeeded, try running the navigation test with UI mode..."
read -p "Would you like to run the navigation test? (y/n): " RUN_NAV
if [ "$RUN_NAV" == "y" ]; then
  npx playwright test tests/e2e/navigation.spec.ts --project=chromium
fi

echo "Test complete. Don't forget to close the Next.js server manually." 