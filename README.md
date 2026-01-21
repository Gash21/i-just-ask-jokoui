# I Just Ask - Joko UI (MCP Server)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for [Joko UI](https://jokoui.web.id) - free open source Tailwind CSS components.

This server allows AI assistants (Claude Desktop, OpenCode, Cursor, etc.) to search, browse, and implement production-ready Joko UI components directly into your codebase.

## Features

- **Search**: Find components by name, description, or tags.
- **Fetch & Implement**: Get code from jokoui.web.id and write it to your project in one step.
- **Browse**: List all available components by category (Application/Marketing).
- **Zero Config**: "It just works" with most Tailwind projects.

## 📚 Documentation

- **[Installation Guide](INSTALL.md)** - Detailed setup for Claude, OpenCode, Cursor, and more.
- **[Tools & API](TOOLS.md)** - Full reference of available tools (`search_components`, `fetch_component`, etc.).
- **[Usage & Workflows](USAGE.md)** - Examples of how to use the server effectively.
- **[Development](CONTRIBUTING.md)** - Guide for contributors.
- **[Deployment](DEPLOYMENT.md)** - How to publish and deploy.

## 🚀 Installation

### Automatic Installation (Recommended)

The easiest way to install and configure the server for Claude Desktop, OpenCode, and Cursor.

```bash
Install and configure I Just Ask - Joko UI (MCP Server) by following the instructions here:
https://raw.githubusercontent.com/Gash21/i-just-ask-jokoui/refs/heads/main/INSTALL.md
```

### For AI Agents

If you are an AI assistant (Claude, etc.) reading this, you can install the server for the user with this one-liner (uses npm):

```bash
curl -fsSL https://raw.githubusercontent.com/Gash21/i-just-ask-jokoui/main/install.sh | bash -s -- --npm all
```
> **Note**: This will install the package from npm and configure all detected tools (Claude Desktop, OpenCode, Cursor, etc.).

### Manual Installation & npm

For manual steps or npm installation, see the **[Installation Guide](INSTALL.md)**.

## Available Components

**Application UI:**
- Auth Forms (Login, Register, Reset)
- Admin Dashboards & Sidebars
- Settings Pages
- data Tables & Charts

**Marketing UI:**
- Hero Sections
- Feature Grids
- Pricing Tables
- Footers

## Links

- [Joko UI Website](https://jokoui.web.id)
- [GitHub Repository](https://github.com/rayasabari/joko-ui)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT
