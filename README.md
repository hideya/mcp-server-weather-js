# MCP Server for Logging

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/yourusername/mcp-server-logging/blob/main/LICENSE)

Node.js server implementing [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for handling log file entries. This server allows Claude to write and read log entries on behalf of clients.

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/mcp-server-logging.git
cd mcp-server-logging
npm install
```

## Build

```bash
npm run build
```

## Usage with Claude Desktop

Merge the following JSON fragment into your `claude_desktop_config.json`:

```
# MacOS/Linux
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
code $env:AppData\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "logging": {
      "command": "node",
      "args": [
        "C:/Users/andyd/Repositories/mcp-server-logging/dist/index.js"
      ]
    }
  }
}
```

## Tools

- **write-log**
  - Write a log entry to a file
  - Inputs:
    - `level` (string, optional): Log level (INFO, WARN, ERROR, DEBUG) - Default: INFO
    - `message` (string, required): Log message content
    - `timestamp` (string, optional): Custom timestamp (ISO format) - Default: Current time
    - `logFile` (string, optional): Custom log file name - Default: application.log

- **read-logs**
  - Read recent log entries from a file
  - Inputs:
    - `logFile` (string, optional): Custom log file name - Default: application.log
    - `maxEntries` (number, optional): Maximum number of log entries to return - Default: 10
    - `level` (string, optional): Filter logs by level

## Example Queries

- Write a log entry about a system startup
- Record an error that occurred in the application
- Show me the most recent 5 log entries
- Are there any ERROR level logs today?

## Logging

### Local Log Files

Log files are stored in the `logs` directory within the project. The default log file is `application.log`.

### Remote Logging with Graylog

This MCP server includes remote logging to a Graylog server. Log entries are automatically sent to both the local log file and the remote Graylog server.

The remote logging is configured to use:
- Host: graylog.fusiontech.global
- Port: 12201
- Facility: McpLogger

To modify these settings, edit the Graylog configuration in the `index.ts` file.

## Human-AI Collaborative Workflow

This MCP server is designed to enable a workflow where human engineers work alongside multiple Claude instances to build software collaboratively. The workflow is structured as follows:

### Team Structure
- 1-2 human engineers providing high-level guidance and review
- 3-4 Claude instances with specialized roles:
  - Business Analyst Claude: Requirements gathering and user story development
  - UX Designer Claude: Interface design and user experience planning
  - Front-End Developer Claude: Client-side implementation
  - Back-End Developer Claude: Server-side implementation

### Workflow Steps
1. Humans define project goals and initial architecture
2. Claude instances collaborate using the logging service to maintain shared context
3. Each Claude instance uses the logging tool to record progress, decisions, and issues
4. Humans review logs to monitor progress and provide guidance
5. When implementation occurs, Claude instances create GitHub PRs for human review

### Communication Protocol
- Log entries serve as a persistent, asynchronous communication channel
- Human engineers can review the logs to understand what each Claude instance is working on
- Claude instances can check the logs to coordinate their work with other instances

### Context Management
- Critical decisions and context are preserved in the logs
- Each Claude instance maintains its focus area but can access the shared log for coordination
- The log format provides timestamps to track the sequence of events

## License

MIT
