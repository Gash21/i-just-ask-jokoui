# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Build the Project

```bash
npm run build
```

## 3. Test with MCP Inspector

```bash
npm run inspector
```

This will open a browser window where you can test the MCP server tools and resources.

## 4. Use with Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": [
        "/Users/galiharghubi/Work/personal/jokoui-mcp-server/dist/index.js"
      ]
    }
  }
}
```

Replace the path with the absolute path to your `dist/index.js`.

## 5. Restart Claude Desktop

After updating the config, restart Claude Desktop to load the MCP server.

## Example Usage in Claude

After setup, you can ask Claude:

- "Show me all Joko UI components"
- "Search for authentication components"
- "Get the code for the hero section component"
- "What marketing components are available?"

Claude will use the MCP server to retrieve component information and code.
