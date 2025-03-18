# Simple Weather MCP Server example from Quickstart [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/hideya/mcp-server-weather-js/blob/main/LICENSE) [![npm version](https://img.shields.io/npm/v/@h1deya/mcp-server-weather.svg)](https://www.npmjs.com/package/@h1deya/mcp-server-weather)

Node.js server implementing
[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
for accessing weather information in the US.

This is an example explained in [MCP Quickstart](https://modelcontextprotocol.io/quickstart).

It has been hosted as an [npm package](https://www.npmjs.com/package/@h1deya/mcp-server-weather)
for convenient use with `npx`.

## Usage with Claude Desktop

Merge the following JSON fragment into your `claude_desktop_config.json`.
Please refer to the "Testing your server with Claude for Desktop" section of
[MCP Quickstart](https://modelcontextprotocol.io/quickstart) for details.

```
# MacOS/Linux
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows
code $env:AppData\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
        "args": [
            "-y",
            "@h1deya/mcp-server-weather"
        ],
    }
  }
}
```

## Tools

- **get-alerts**
  - Get weather alerts for a US state.
  - Input: `state` (string): Two-letter US state code (e.g. CA, NY)
- **get-forecast**
  - Get weather forecast for a location in the US
  - Inputs:
    - `latitude` (number): Latitude of the location
    - `longitude` (number): Longitude of the location

## Example Queries

- Tomorrow's weather in Palo Alto?
- Any weather alerts in California?

## Original Author and License

This example is based on the code explained in [MCP Quickstart](https://modelcontextprotocol.io/quickstart)
([github](https://github.com/modelcontextprotocol/docs)),
whose license is [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/deed.en).
The completed code examples are also hosted in
[this repo](https://github.com/modelcontextprotocol/quickstart-resources),
whose license is MIT (Copyright (c) 2025 Model Context Protocol).
So I've chosen the MIT license for this repo.
