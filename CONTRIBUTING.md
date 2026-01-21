# Development Guide

## Project Structure
```
i-just-ask-jokoui/
├── src/
│   └── index.ts          # Main MCP server implementation
├── dist/                 # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

## Adding New Components

Edit `src/index.ts` and append to the `JOKO_UI_COMPONENTS` array:

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

Then rebuild: `npm run build`

## Testing
- Use `npm run inspector` to test tools with the MCP Inspector.
- Use `npm start` to run the server.
