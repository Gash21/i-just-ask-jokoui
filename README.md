# Joko UI MCP Server

A Model Context Protocol (MCP) server for [Joko UI](https://jokoui.web.id) - free open source Tailwind CSS components.

This MCP server exposes Joko UI components to AI assistants like Claude Desktop, allowing them to search, browse, and retrieve production-ready Tailwind CSS component code.

## Features

- **Search Components**: Find components by name, description, or tags
- **List Components**: Browse all available Joko UI components
- **Fetch Component Code**: Retrieve actual code from jokoui.web.id
- **Write to Files**: Save components directly to your project directory
- **Fetch & Implement**: Combine fetching and writing in one step
- **Category Filtering**: Filter by Application or Marketing components
- **Resources**: Access complete component lists and documentation

## Available Tools

### `list_components`
Lists all available Joko UI components with optional category filter.

**Parameters:**
- `category` (optional): Filter to "application" or "marketing"

**Example:**
```json
{
  "name": "list_components",
  "arguments": {
    "category": "marketing"
  }
}
```

### `search_components`
Search for components by name, description, or tags with relevance ranking.

**Parameters:**
- `query` (optional): Search query string
- `category` (optional): Filter by category
- `tags` (optional): Array of tags to filter by
- `limit` (optional, default: 10, max: 50): Maximum results

**Example:**
```json
{
  "name": "search_components",
  "arguments": {
    "query": "auth",
    "category": "application",
    "limit": 5
  }
}
```

### `get_component_code`
Get React/TSX code for a specific component.

**Parameters:**
- `componentId` (required): Component ID (e.g., "auth-forms", "hero-section")
- `language` (optional, default: "tsx"): Output format

**Example:**
```json
{
  "name": "get_component_code",
  "arguments": {
    "componentId": "hero-section",
    "language": "tsx"
  }
}
```

### `fetch_component`
Fetch actual component code from jokoui.web.id website. This tool scrapes the official Joko UI site and extracts complete source code.

**Parameters:**
- `componentId` (optional): Component ID to fetch
- `url` (optional): Direct URL to component page (overrides componentId)

**Example:**
```json
{
  "name": "fetch_component",
  "arguments": {
    "componentId": "auth-forms"
  }
}
```

### `implement_component`
Write component code to a file in your project. Use this after fetching code to save it to your project directory.

**Parameters:**
- `code` (required): The component source code to write to file
- `outputPath` (required): File path (e.g., `./src/components/Hero.tsx`, `./components/Button.tsx`)
- `createDirectories` (optional, default: true): Create parent directories if they don't exist

**Example:**
```json
{
  "name": "implement_component",
  "arguments": {
    "code": "import React from 'react'\nexport default function Button() { ... }",
    "outputPath": "./src/components/Button.tsx"
  }
}
```

### `fetch_and_implement_component`
Fetch component code from jokoui.web.id and write it to a file. Combines `fetch_component` and `implement_component` in one step - perfect for quickly adding components to your project.

**Parameters:**
- `componentId` (required): Component ID (e.g., "auth-forms", "hero-section", "pricing-table")
- `outputPath` (required): File path to write component (e.g., `./src/components/Hero.tsx`)
- `url` (optional): Direct URL to component page (overrides componentId)
- `createDirectories` (optional, default: true): Create parent directories if needed

**Example:**
```json
{
  "name": "fetch_and_implement_component",
  "arguments": {
    "componentId": "hero-section",
    "outputPath": "./src/components/HeroSection.tsx"
  }
}
```

**Workflow Example:**
1. Use `list_components` or `search_components` to find a component
2. Use `fetch_and_implement_component` to fetch code and save to file
3. Import and use the component in your application

## Available Resources

- `jokoui://components/all` - All components with full details
- `jokoui://components/application` - Application UI components
- `jokoui://components/marketing` - Marketing UI components
- `jokoui://docs/introduction` - Joko UI introduction guide

## Installation

```bash
npm install @gash21/jokoui-mcp-server
```

Or clone and build locally:

```bash
git clone <repository-url>
cd jokoui-mcp-server
npm install
npm run build
```

## Usage

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Server
```bash
npm start
```

### Test with MCP Inspector
```bash
npm run inspector
```

## Claude Desktop Configuration

Add this to your Claude Desktop config (`claude_desktop_config.json`):

**macOS:**
```json
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": [
        "/absolute/path/to/jokoui-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "jokoui": {
      "command": "node.exe",
      "args": [
        "C:\\absolute\\path\\to\\jokoui-mcp-server\\dist\\index.js"
      ]
    }
  }
}
```

**Linux:**
```json
{
  "mcpServers": {
    "jokoui": {
      "command": "node",
      "args": [
        "/absolute/path/to/jokoui-mcp-server/dist/index.js"
      ]
    }
  }
}
```

Restart Claude Desktop after updating the configuration.

## Available Components

### Application Components
- **Auth Forms** - Login, register, and password reset forms
- **Dashboard** - Admin dashboard with sidebar and stats
- **Settings Page** - User settings with tabs
- **Data Display** - Tables, cards, and charts

### Marketing Components
- **Hero Section** - Landing page hero with CTAs
- **Feature Grid** - Product feature showcase
- **Pricing Table** - Pricing plans with comparison
- **Footer** - Site footer with links

## Joko UI Website

Visit [https://jokoui.web.id](https://jokoui.web.id) to:
- Browse all components live
- Preview at different breakpoints
- Toggle dark mode
- Copy component code directly

## Development

### Project Structure
```
jokoui-mcp-server/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Components

Edit `src/index.ts` and add to the `JOKO_UI_COMPONENTS` array:

```typescript
{
  id: "unique-id",
  name: "Component Name",
  category: "application" | "marketing",
  description: "Component description",
  tags: ["tag1", "tag2"],
  url: "https://jokoui.web.id/components/...",
  features: [
    "Feature 1",
    "Feature 2"
  ]
}
```

Then rebuild:
```bash
npm run build
```

## License

MIT

## Links

- [Joko UI Website](https://jokoui.web.id)
- [Joko UI GitHub](https://github.com/rayasabari/joko-ui)
- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
