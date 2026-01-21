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

## OpenCode Installation

### Install for OpenCode AI Assistants

This MCP server can be installed and used with OpenCode-powered AI assistants.

#### Step 1: Install from npm (or build locally)

```bash
# Option A: Install from npm registry
npm install @gash21/jokoui-mcp-server

# Option B: Install from local build
cd jokoui-mcp-server
npm install
npm run build
```

#### Step 2: Configure OpenCode

Add the MCP server to your OpenCode configuration. OpenCode uses `~/.config/opencode/opencode.json`.

**Simplest configuration (recommended):**
```json
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "/absolute/path/to/jokoui-mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Advanced configuration (with environment variables):**
```json
{
  "mcp": {
    "jokoui": {
      "command": "node",
      "args": [
        "/absolute/path/to/jokoui-mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "false"
      }
    }
  }
}
```

**Note:** Use absolute paths. Relative paths may not work correctly with OpenCode.

#### Step 3: Restart OpenCode

After adding the configuration, restart your OpenCode application to load the new MCP server.

#### Step 4: Verify Installation

Test that the MCP server is available in OpenCode by asking:

```
"Show me all Joko UI components"
"List available marketing components"
"Search for authentication components"
```

If the MCP server is configured correctly, OpenCode will use it to access Joko UI components.

### Available Tools in OpenCode

Once installed, the following tools will be available in OpenCode:

1. **list_components** - Browse all Joko UI components
2. **search_components** - Search by name, description, or tags
3. **get_component_code** - Get component code templates
4. **fetch_component** - Fetch actual code from jokoui.web.id
5. **implement_component** - Write component code to a file
6. **fetch_and_implement_component** - Combined fetch + write operation

### Example OpenCode Workflows

**Basic Component Discovery:**
```
You: "What Joko UI components are available for building landing pages?"

OpenCode (using MCP):
- Calls list_components
- Filters to marketing category
- Returns: hero-section, feature-grid, pricing-table, footer
```

**Fetch and Implement Component:**
```
You: "Get the hero section component from jokoui.web.id and save it to ./src/components/Hero.tsx"

OpenCode (using MCP):
1. Uses search_components to find hero-section
2. Uses fetch_and_implement_component to:
   - Fetch code from https://jokoui.web.id/components/marketing/hero-section
   - Parse HTML to extract React/TSX code
   - Create ./src/components directory
   - Write component to ./src/components/Hero.tsx
3. Returns success with file path and bytes written
```

**Multiple Components Workflow:**
```
You: "Search for all authentication-related components and implement them in my project"

OpenCode (using MCP):
1. Uses search_components with query "auth"
2. Finds: auth-forms, dashboard (auth-related)
3. For each component:
   - Uses fetch_and_implement_component
   - Saves to ./components/auth/[ComponentName].tsx
4. Returns: "Created 2 auth components in ./components/auth/"
```

### Troubleshooting OpenCode Integration

**OpenCode can't find the MCP server:**
- Verify that the path in your configuration is correct
- Check that `dist/index.js` exists and is executable
- Restart OpenCode completely
- Check OpenCode logs for MCP connection errors

**Tools show up but return errors:**
- Verify Node.js version is >= 18.0.0
- Check that all dependencies are installed: `npm install`
- Test the server manually: `node dist/index.js`

**Permission errors when writing files:**
- Ensure that the target directory has write permissions
- Try running OpenCode with elevated permissions if needed
- Use absolute paths instead of relative paths in outputPath

### MCP Server Configuration Reference

For advanced OpenCode configuration, you can customize:

```json
{
  "mcpServers": {
    "jokoui": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/jokoui-mcp-server/dist/index.js"],
      "cwd": "/working/directory",
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "false"
      },
      "timeout": 30000
    }
  }
}
```

### Performance Considerations

- The MCP server uses stdio transport (fast, low overhead)
- Component fetching from jokoui.web.id happens on-demand (no caching)
- File writing operations are synchronous for simplicity
- For high-volume usage, consider caching components locally

### Security Notes

- The MCP server only fetches from public jokoui.web.id website
- No authentication or credentials are transmitted
- File writing respects system permissions
- Consider using a dedicated Node.js version for production

---

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
