#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { JokoComponent } from "./types.js";
import { fetchComponentData } from "./fetch.js";
import { registerToolHandlers } from "./handlers/tools.js";
import { registerResourceHandlers } from "./handlers/resources.js";

let JOKO_UI_COMPONENTS: JokoComponent[] = [];

const server = new Server(
  {
    name: "i-just-ask-jokoui",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_components",
        description: `
          Lists all available Joko UI components.
          Returns a comprehensive list of all components with their IDs,
          names, categories, descriptions, and tags. Use this to explore
          the entire Joko UI library and find components for your project.
        `,
        inputSchema: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["application", "marketing"],
              description: "Optional filter to show only components from a specific category"
            }
          }
        }
      },
      {
        name: "search_components",
        description: `
          Search for Joko UI components by name, description, or tags.
          Returns matching components with relevance ranking. Use this when
          looking for specific types of components or functionality.
        `,
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query (e.g., 'alert', 'pricing', 'navbar', 'hero')"
            },
            category: {
              type: "string",
              enum: ["application", "marketing"],
              description: "Optional filter by category"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Optional array of tags to filter by"
            },
            limit: {
              type: "number",
              description: "Maximum number of results (default: 10, max: 50)",
              default: 10,
              minimum: 1,
              maximum: 50
            }
          }
        }
      },
      {
        name: "get_component_code",
        description: `
          Get React/TSX code for a specific Joko UI component.
          Returns production-ready, copy-paste component code that you can
          use directly in your Tailwind CSS project. Includes all necessary
          imports and responsive classes.
        `,
        inputSchema: {
          type: "object",
          properties: {
            componentId: {
              type: "string",
              description: "Component ID (e.g., 'alerts', 'buttons', 'heroes', 'pricing')"
            },
            language: {
              type: "string",
              enum: ["typescript", "tsx"],
              description: "Output language format (default: tsx)",
              default: "tsx"
            }
          },
          required: ["componentId"]
        }
      },
      {
        name: "fetch_component",
        description: `
          Fetch actual component code from Joko UI repository.
          This tool fetches the complete source code for any component directly
          from the GitHub repository. Use this to get the latest,
          production-ready code.
        `,
        inputSchema: {
          type: "object",
          properties: {
            componentId: {
              type: "string",
              description: "Component ID (e.g., 'alerts', 'buttons', 'heroes')"
            },
            url: {
              type: "string",
              description: "Direct URL to component page. Use this if componentId doesn't work."
            }
          }
        }
      },
      {
        name: "implement_component",
        description: `
          Write component code to a file in your project.
          Use this after fetching code or generating it to save it to your
          project directory. Automatically creates parent directories if needed.
        `,
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The component source code to write to file"
            },
            outputPath: {
              type: "string",
              description: "File path (e.g., ./src/components/Hero.tsx, ./components/Button.tsx)"
            },
            createDirectories: {
              type: "boolean",
              description: "Create parent directories if they don't exist (default: true)",
              default: true
            }
          },
          required: ["code", "outputPath"]
        }
      },
      {
        name: "fetch_and_implement_component",
        description: `
          Fetch component code from Joko UI repository and write it to a file.
          Combines fetch_component and implement_component in one step. Perfect
          for quickly adding Joko UI components to your project.
        `,
        inputSchema: {
          type: "object",
          properties: {
            componentId: {
              type: "string",
              description: "Component ID (e.g., 'alerts', 'buttons', 'heroes', 'pricing')"
            },
            outputPath: {
              type: "string",
              description: "File path to write component (e.g., ./src/components/Hero.tsx)"
            },
            url: {
              type: "string",
              description: "Direct URL to component page (overrides componentId)"
            },
            createDirectories: {
              type: "boolean",
              description: "Create parent directories if needed (default: true)",
              default: true
            }
          },
          required: ["componentId", "outputPath"]
        }
      }
    ]
  };
});

// Register handlers
registerToolHandlers(server, () => JOKO_UI_COMPONENTS);
registerResourceHandlers(server, () => JOKO_UI_COMPONENTS);

async function main() {
  JOKO_UI_COMPONENTS = await fetchComponentData();

  if (JOKO_UI_COMPONENTS.length === 0) {
    console.error("Warning: No components loaded. Using fallback data if available.");
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Joko UI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
