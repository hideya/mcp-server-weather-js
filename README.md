# Simple Weather MCP Server example from Quickstart [![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-blue.svg)](https://creativecommons.org/licenses/by/4.0/) [![npm version](https://img.shields.io/npm/v/@h1deya/mcp-server-weather.svg)](https://www.npmjs.com/package/@h1deya/mcp-server-weather)

Node.js server implementing
[Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
for accessing weather information in the U.S.

This is an example explained in [MCP Quickstart](https://modelcontextprotocol.io/quickstart).

It has been hosted as an [npm package](https://www.npmjs.com/package/@h1deya/mcp-server-weather)
for convenient use with `npx`.

## Original Author and License

This example is based on the code explained in [MCP Quickstart](https://modelcontextprotocol.io/quickstart)
([github](https://github.com/modelcontextprotocol/docs)),
whose license is [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/deed.en).
Because no other license is specified, the same license has been applied,
even though it is said not to be suitable for software...

## Usage with Claude Desktop

Merge the following JSON fragment into your `claude_desktop_config.json`.
Please refer to [MCP Quickstart](https://modelcontextprotocol.io/quickstart) for more details.

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
  - Get weather alerts for a state in the U.S.
  - Input: `state` (string): Two-letter state code (e.g. CA, NY)
- **get-forecast**
  - Get weather forecast for a location in the U.S.
  - Inputs:
    - `path` (number): Latitude of the location
    - `content` (number): Longitude of the location

## Example Queries

- "What's the weather like in Cupertino?"
- "Is there a weather alert in California?"
