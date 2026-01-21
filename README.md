# Joko UI MCP Server

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

## 🚀 Quick Start

**Mac/Linux:**
```bash
# Universal installer: works for Claude, OpenCode, and Cursor
bash install.sh
```

**npm:**
```bash
npm install -g @gash21/jokoui-mcp-server
```

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
