# AI Agent Development Guide

This document provides information for AI agents working with this project, specifically focusing on how to manage the development server and get feedback during development.

## Server Management Commands

The following npm scripts are available specifically for AI agents to manage the development server without blocking the AI's workflow:

### Starting the Server

```bash
npm run ai:start
```

This command starts the development server using PM2, which runs it in the background. The server will automatically reload whenever you make changes to the code. It also automatically detects and records the port number in use (which may change between sessions).

### Determining the Server Port

```bash
npm run ai:port
```

This command detects and displays the port that the server is currently running on. The port is dynamically assigned to avoid conflicts, so you should use this command to determine the correct port for accessing the application.

### Checking Server Health

```bash
npm run ai:health
```

This command checks if the server is running properly by making a request to the health endpoint using the current port. It provides more detailed information than just checking the status.

### Checking Server Status

```bash
npm run ai:status
```

Use this command to check if the server is running correctly. The output will show the status of the server (online, stopped, errored, etc.), along with resource usage and uptime information.

### Viewing Server Logs

```bash
npm run ai:logs
```

This command displays the most recent logs from the server without keeping the terminal in a streaming state. It returns the last 100 lines of logs and then exits, allowing you to continue your workflow.

### Restarting the Server

```bash
npm run ai:restart
```

Use this command to restart the server after making changes that may require a full restart (e.g., changes to environment variables or configuration files that aren't automatically picked up). This also re-detects the port in use.

### Stopping the Server

```bash
npm run ai:stop
```

This command stops the development server when you're done with your work.

## Health Check

The application includes a health check endpoint that you can use to verify if the server is running correctly:

```
GET /api/health
```

Use the `ai:health` command to check the health endpoint without needing to know the specific port:

```bash
npm run ai:health
```

Or if you want to use curl with the correct port:

```bash
PORT=$(cat .next-port) && curl http://localhost:$PORT/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2023-05-25T12:34:56.789Z",
  "environment": "development"
}
```

## Recommended Workflow for AI Development

1. Start the server with `npm run ai:start`
2. Make necessary code changes
3. Check if the server restarted properly with `npm run ai:status`
4. Verify the server health with `npm run ai:health`
5. If needed, check server logs with `npm run ai:logs` to debug issues
6. When finished, stop the server with `npm run ai:stop`

This workflow allows you to develop without being blocked by a continuously running server in your terminal.

## Troubleshooting

If the server fails to start or shows an "errored" status:

1. Check the logs with `npm run ai:logs`
2. Look for error messages that indicate what went wrong
3. Fix the issue in the code
4. Restart the server with `npm run ai:restart`

If the error persists, you might need to:

1. Stop the server with `npm run ai:stop`
2. Start it again with `npm run ai:start`

If the port detection is not working:

1. Make sure the server is actually running (`npm run ai:status`)
2. Check the logs with `npm run ai:logs` to see if the server has started
3. Run `npm run ai:port` manually to attempt port detection again
4. If still not working, you might need to restart the server

## PM2 Configuration

The server is managed through PM2, configured in `ecosystem.config.js`. This configuration:

- Uses a dynamic port (PORT=0) to avoid port conflicts
- Watches for file changes and automatically restarts the server
- Ignores changes in node_modules, .next, logs, and .git directories
- Saves logs to ./logs/pm2-out.log and ./logs/pm2-err.log
- Automatically restarts the server if it crashes
- Limits the number of restarts to prevent infinite restart loops
