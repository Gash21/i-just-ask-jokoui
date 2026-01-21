# Installation Guide

## Installation Methods

### Option A: Using the Universal Installation Script (Recommended)

Quickly install and configure the server for Claude Desktop, OpenCode, Cursor, and more.

```bash
# Run the universal installer
bash install.sh
```

**This script:**
- ✅ Auto-detects your AI tools
- ✅ Configures settings automatically
- ✅ Handles path resolution

**Options:**
```bash
bash install.sh --help
# Usage:
#   bash install.sh [tool] [flags]
#   bash install.sh claude    # Install for Claude Desktop
#   bash install.sh opencode  # Install for OpenCode
#   bash install.sh cursor    # Install for Cursor
#   bash install.sh all       # Configure all detected tools
```

### Option B: Install from npm Registry

If you want to use the package without building from source:

```bash
# Global installation (recommended for general use)
npm install -g @gash21/i-just-ask-jokoui

# Local installation
npm install @gash21/i-just-ask-jokoui
```

### Option C: Manual Build & Install

```bash
git clone https://github.com/Gash21/i-just-ask-jokoui.git
cd i-just-ask-jokoui
npm install
npm run build
# The executable will be at ./dist/index.js
```

---

## Configuration

If you prefer manual configuration or need to customize the setup:

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows).

```json
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": [
        "/absolute/path/to/i-just-ask-jokoui/dist/index.js"
      ]
    }
  }
}
```

### OpenCode

Edit `~/.config/opencode/opencode.json`.

```json
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "/absolute/path/to/i-just-ask-jokoui/dist/index.js"
      ]
    }
  }
}
```

### Cursor

Add to your `.cursorrules` or project configuration:

```text
# Add to .cursorrules
You can access Joko UI components directly via MCP. The server is located at:

File: /absolute/path/to/i-just-ask-jokoui/dist/index.js

Available Tools:
[See TOOLS.md for full list]
```

### Advanced Configuration

For custom environments or specific requirements:

```json
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```
