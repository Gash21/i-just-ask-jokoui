#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import * as cheerio from "cheerio";
import * as fs from "fs/promises";
import * as path from "path";

export interface JokoComponent {
  id: string;
  name: string;
  category: "application" | "marketing";
  description: string;
  tags: string[];
  url?: string;
  features: string[];
}

const JOKO_UI_COMPONENTS: JokoComponent[] = [
  {
    id: "auth-forms",
    name: "Authentication Forms",
    category: "application",
    description: "Login, register, and password reset forms with validation",
    tags: ["auth", "form", "login", "register", "validation"],
    url: "https://jokoui.web.id/components/application/auth-forms",
    features: [
      "Login form with email/password",
      "Registration form",
      "Password reset flow",
      "Form validation",
      "Responsive design"
    ]
  },
  {
    id: "dashboard",
    name: "Dashboard",
    category: "application",
    description: "Admin dashboard with sidebar, stats, and navigation",
    tags: ["dashboard", "admin", "sidebar", "stats"],
    url: "https://jokoui.web.id/components/application/dashboard",
    features: [
      "Sidebar navigation",
      "Statistics cards",
      "Data tables",
      "User profile",
      "Responsive layout"
    ]
  },
  {
    id: "settings-page",
    name: "Settings Page",
    category: "application",
    description: "User settings page with tabs and form controls",
    tags: ["settings", "profile", "form", "tabs"],
    url: "https://jokoui.web.id/components/application/settings-page",
    features: [
      "Tabbed navigation",
      "Form inputs",
      "Toggle switches",
      "Profile management",
      "Save changes"
    ]
  },
  {
    id: "data-display",
    name: "Data Display",
    category: "application",
    description: "Tables, cards, and charts for displaying data",
    tags: ["table", "chart", "data", "display"],
    url: "https://jokoui.web.id/components/application/data-display",
    features: [
      "Responsive tables",
      "Data cards",
      "Chart visualizations",
      "Pagination",
      "Filtering and sorting"
    ]
  },
  {
    id: "hero-section",
    name: "Hero Section",
    category: "marketing",
    description: "Eye-catching hero sections with CTAs",
    tags: ["hero", "landing", "cta", "header"],
    url: "https://jokoui.web.id/components/marketing/hero-section",
    features: [
      "Headline and subheadline",
      "Call-to-action buttons",
      "Background images",
      "Responsive layout",
      "Dark mode support"
    ]
  },
  {
    id: "feature-grid",
    name: "Feature Grid",
    category: "marketing",
    description: "Grid layouts showcasing product features",
    tags: ["features", "grid", "icons", "cards"],
    url: "https://jokoui.web.id/components/marketing/feature-grid",
    features: [
      "Feature cards with icons",
      "Grid layouts",
      "Responsive breakpoints",
      "Hover effects",
      "Dark mode support"
    ]
  },
  {
    id: "pricing-table",
    name: "Pricing Table",
    category: "marketing",
    description: "Pricing plans with comparison features",
    tags: ["pricing", "table", "plans", "comparison"],
    url: "https://jokoui.web.id/components/marketing/pricing-table",
    features: [
      "Multiple pricing tiers",
      "Feature comparison",
      "Highlighted popular plan",
      "CTA buttons",
      "Responsive design"
    ]
  },
  {
    id: "footer",
    name: "Footer",
    category: "marketing",
    description: "Site footers with links and information",
    tags: ["footer", "links", "navigation", "bottom"],
    url: "https://jokoui.web.id/components/marketing/footer",
    features: [
      "Multiple columns",
      "Navigation links",
      "Social media links",
      "Copyright info",
      "Responsive layout"
    ]
  }
];

const SearchComponentsSchema = z.object({
  query: z.string().optional().describe("Search query for component name, description, or tags"),
  category: z.enum(["application", "marketing"]).optional().describe("Filter by category"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of results")
});

const GetComponentCodeSchema = z.object({
  componentId: z.string().describe("Component ID to get code for"),
  language: z.enum(["typescript", "tsx"]).optional().default("tsx").describe("Language format (typescript or tsx)")
});

const FetchComponentSchema = z.object({
  componentId: z.string().describe("Component ID to fetch from jokoui.web.id"),
  url: z.string().optional().describe("Direct URL to component page (overrides componentId)")
});

const ImplementComponentSchema = z.object({
  code: z.string().describe("Component code to write to file"),
  outputPath: z.string().describe("File path to write the component code (e.g., ./src/components/Hero.tsx)"),
  createDirectories: z.boolean().optional().default(true).describe("Create parent directories if they don't exist")
});

const FetchAndImplementComponentSchema = z.object({
  componentId: z.string().describe("Component ID to fetch and implement"),
  outputPath: z.string().describe("File path to write the component (e.g., ./src/components/Hero.tsx)"),
  url: z.string().optional().describe("Direct URL to component page (overrides componentId)"),
  createDirectories: z.boolean().optional().default(true).describe("Create parent directories if they don't exist")
});

const server = new Server(
  {
    name: "i-just-ask-jokoui",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

async function fetchComponentCode(url: string): Promise<string> {
  try {
    console.error(`Fetching from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; I-Just-Ask-JokoUI/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let code = "";

    const codeBlocks = $('pre code, code, pre[class*="code"], code[class*="language"]');
    if (codeBlocks.length > 0) {
      codeBlocks.each((_, el) => {
        const blockText = $(el).text();
        if (blockText.length > code.length) {
          code = blockText.trim();
        }
      });
    }

    const scriptTags = $('script[type="text/javascript"], script[type="text/babel"], script[type="text/tsx"], script[type="text/ts"]');
    if (scriptTags.length > 0 && !code) {
      scriptTags.each((_, el) => {
        const scriptText = $(el).text();
        if (scriptText.includes("export") && scriptText.includes("function") && scriptText.length > code.length) {
          code = scriptText.trim();
        }
      });
    }

    const allCodeElements = $('code, pre, .code, [class*="code"]');
    if (!code) {
      allCodeElements.each((_, el) => {
        const elText = $(el).text();
        if (elText.length > 50 && elText.length > code.length) {
          code = elText.trim();
        }
      });
    }

    if (!code) {
      throw new Error("Could not extract code from component page. The website structure may have changed.");
    }

    return code;
  } catch (error) {
    console.error("Error fetching component:", error);
    throw error;
  }
}

async function writeComponentToFile(code: string, outputPath: string, createDirectories: boolean = true): Promise<string> {
  try {
    if (createDirectories) {
      const dir = path.dirname(outputPath);
      await fs.mkdir(dir, { recursive: true });
    }

    await fs.writeFile(outputPath, code, "utf-8");

    return outputPath;
  } catch (error) {
    console.error("Error writing file:", error);
    throw error;
  }
}

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
              description: "Search query (e.g., 'auth', 'pricing', 'dashboard', 'hero')"
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
              description: "Component ID (e.g., 'auth-forms', 'hero-section', 'pricing-table')"
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
          Fetch actual component code from jokoui.web.id website.
          This tool scrapes the Joko UI website and extracts the complete
          source code for any component. Use this to get the latest,
          production-ready code directly from the official site.
        `,
        inputSchema: {
          type: "object",
          properties: {
            componentId: {
              type: "string",
              description: "Component ID (e.g., 'auth-forms', 'hero-section')"
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
          Fetch component code from jokoui.web.id and write it to a file.
          Combines fetch_component and implement_component in one step. Perfect
          for quickly adding Joko UI components to your project.
        `,
        inputSchema: {
          type: "object",
          properties: {
            componentId: {
              type: "string",
              description: "Component ID (e.g., 'auth-forms', 'hero-section', 'pricing-table')"
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_components": {
        const categoryFilter = args?.category as "application" | "marketing" | undefined;

        let components = JOKO_UI_COMPONENTS;

        if (categoryFilter) {
          components = components.filter(c => c.category === categoryFilter);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              total: components.length,
              components: components.map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                description: c.description,
                tags: c.tags,
                url: c.url
              }))
            }, null, 2)
          }]
        };
      }

      case "search_components": {
        const parseResult = SearchComponentsSchema.safeParse(args);

        if (!parseResult.success) {
          return {
            content: [{
              type: "text",
              text: `Validation error: ${parseResult.error.message}`
            }],
            isError: true
          };
        }

        const { query, category, tags, limit } = parseResult.data;

        let results = JOKO_UI_COMPONENTS;

        if (category) {
          results = results.filter(c => c.category === category);
        }

        if (tags && tags.length > 0) {
          results = results.filter(c =>
            tags.every(tag => c.tags.some(ct => ct.toLowerCase().includes(tag.toLowerCase())))
          );
        }

        if (query) {
          const queryLower = query.toLowerCase();
          results = results.filter(c =>
            c.name.toLowerCase().includes(queryLower) ||
            c.description.toLowerCase().includes(queryLower) ||
            c.tags.some(t => t.toLowerCase().includes(queryLower))
          );

          results.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase() === queryLower ? 3 :
                            a.name.toLowerCase().includes(queryLower) ? 2 : 1;
            const bNameMatch = b.name.toLowerCase() === queryLower ? 3 :
                            b.name.toLowerCase().includes(queryLower) ? 2 : 1;
            return bNameMatch - aNameMatch;
          });
        }

        results = results.slice(0, limit);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              query: query || "(all)",
              total: results.length,
              components: results.map(c => ({
                id: c.id,
                name: c.name,
                category: c.category,
                description: c.description,
                tags: c.tags,
                url: c.url
              }))
            }, null, 2)
          }]
        };
      }

      case "get_component_code": {
        const parseResult = GetComponentCodeSchema.safeParse(args);

        if (!parseResult.success) {
          return {
            content: [{
              type: "text",
              text: `Validation error: ${parseResult.error.message}`
            }],
            isError: true
          };
        }

        const { componentId, language } = parseResult.data;

        const component = JOKO_UI_COMPONENTS.find(c => c.id === componentId);

        if (!component) {
          return {
            content: [{
              type: "text",
              text: `Component not found: ${componentId}. Use list_components to see available components.`
            }],
            isError: true
          };
        }

        const codeTemplate = generateComponentCode(component, language);

        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              component: {
                id: component.id,
                name: component.name,
                category: component.category,
                description: component.description,
                url: component.url || ""
              },
              code: codeTemplate,
              instructions: `
Copy and paste this code into your project.

1. Ensure you have Tailwind CSS installed and configured
2. Create a new component file (e.g., ${componentId}.tsx)
3. Paste code
4. Customize as needed

Visit ${component.url} to view component live and see more examples.
              `.trim()
            }, null, 2)
          }]
        };
      }

      case "fetch_component": {
        const parseResult = FetchComponentSchema.safeParse(args);

        if (!parseResult.success) {
          return {
            content: [{
              type: "text",
              text: `Validation error: ${parseResult.error.message}`
            }],
            isError: true
          };
        }

        const { componentId, url: providedUrl } = parseResult.data;

        let url = providedUrl;

        if (!url) {
          const component = JOKO_UI_COMPONENTS.find(c => c.id === componentId);

          if (!component) {
            return {
              content: [{
                type: "text",
                text: `Component not found: ${componentId}. Use list_components to see available components.`
              }],
              isError: true
            };
          }

          if (!component.url) {
            return {
              content: [{
                type: "text",
                text: `Component ${componentId} does not have a URL. Cannot fetch.`
              }],
              isError: true
            };
          }

          url = component.url;
        }

        try {
          const code = await fetchComponentCode(url);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                source: url || "",
                code: code,
                info: "Successfully fetched component code from jokoui.web.id",
                nextSteps: [
                  "Review the code to understand structure",
                  "Use 'implement_component' tool to save to file",
                  "Or use 'fetch_and_implement_component' to do both in one step"
                ]
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to fetch component: ${error instanceof Error ? error.message : String(error)}\n\nTry providing a direct URL or check if the component exists at jokoui.web.id`
            }],
            isError: true
          };
        }
      }

      case "implement_component": {
        const parseResult = ImplementComponentSchema.safeParse(args);

        if (!parseResult.success) {
          return {
            content: [{
              type: "text",
              text: `Validation error: ${parseResult.error.message}`
            }],
            isError: true
          };
        }

        const { code, outputPath, createDirectories } = parseResult.data;

        try {
          const resolvedPath = await writeComponentToFile(code, outputPath, createDirectories);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                success: true,
                outputPath: resolvedPath,
                bytesWritten: code.length,
                info: "Component successfully written to file"
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to write component: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }

      case "fetch_and_implement_component": {
        const parseResult = FetchAndImplementComponentSchema.safeParse(args);

        if (!parseResult.success) {
          return {
            content: [{
              type: "text",
              text: `Validation error: ${parseResult.error.message}`
            }],
            isError: true
          };
        }

        const { componentId, outputPath, url: providedUrl, createDirectories } = parseResult.data;

        let url = providedUrl;

        if (!url) {
          const component = JOKO_UI_COMPONENTS.find(c => c.id === componentId);

          if (!component) {
            return {
              content: [{
                type: "text",
                text: `Component not found: ${componentId}. Use list_components to see available components.`
              }],
              isError: true
            };
          }

          if (!component.url) {
            return {
              content: [{
                type: "text",
                text: `Component ${componentId} does not have a URL. Cannot fetch.`
              }],
              isError: true
            };
          }

          url = component.url;
        }

        try {
          const code = await fetchComponentCode(url);
          const resolvedPath = await writeComponentToFile(code, outputPath, createDirectories);

          return {
            content: [{
              type: "text",
                text: JSON.stringify({
                  success: true,
                  component: componentId,
                  source: url || "",
                  outputPath: resolvedPath,
                  bytesWritten: code.length,
                  info: "Successfully fetched and implemented component",
                  nextSteps: [
                  "Open the file to review the component",
                  "Import it in your application",
                  "Customize styling and functionality as needed"
                ]
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Failed to fetch and implement component: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }

      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "jokoui://components/all",
        name: "All Joko UI Components",
        description: "Complete list of all available Joko UI components with full details",
        mimeType: "application/json"
      },
      {
        uri: "jokoui://components/application",
        name: "Application Components",
        description: "Application UI components (auth forms, dashboards, settings, data display)",
        mimeType: "application/json"
      },
      {
        uri: "jokoui://components/marketing",
        name: "Marketing Components",
        description: "Marketing UI components (hero sections, feature grids, pricing tables, footers)",
        mimeType: "application/json"
      },
      {
        uri: "jokoui://docs/introduction",
        name: "Joko UI Introduction",
        description: "Introduction and getting started guide for Joko UI",
        mimeType: "text/markdown"
      }
    ]
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  try {
    switch (uri) {
      case "jokoui://components/all":
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(JOKO_UI_COMPONENTS, null, 2)
          }]
        };

      case "jokoui://components/application":
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              JOKO_UI_COMPONENTS.filter(c => c.category === "application"),
              null,
              2
            )
          }]
        };

      case "jokoui://components/marketing":
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify(
              JOKO_UI_COMPONENTS.filter(c => c.category === "marketing"),
              null,
              2
            )
          }]
        };

      case "jokoui://docs/introduction":
        return {
          contents: [{
            uri,
            mimeType: "text/markdown",
            text: `# Joko UI - Free Open Source Tailwind CSS Components

Joko UI is a collection of free Tailwind CSS components that you can use in your next project.

## Getting Started

There is no Joko UI installation. If you have a Tailwind CSS project, you can simply copy code and paste it into your project.

## Usage

1. Browse the website for a component you need
2. Preview the component at different breakpoints (Mobile, Tablet, Desktop)
3. Toggle **Dark Mode** to see how it looks in dark themes
4. Click on the **'Code'** tab or the **'Copy Code'** button to get the source
5. Paste the copied code into your project

Note

All components support both Light and Dark modes out of the box using Tailwind's \`dark:\` modifier.

## Component Categories

### [Application](/components/application)

UI components for building functional web applications:

- Authentication Forms
- Dashboards
- Settings Pages
- Data Displays

### [Marketing](/components/marketing)

Components for building high-converting landing pages:

- Hero Sections
- Feature Grids
- Pricing Tables
- Footers

## MCP Server Tools

This MCP server provides tools to:

- **fetch_component**: Fetch actual code from jokoui.web.id
- **implement_component**: Write code to a file
- **fetch_and_implement_component**: Do both in one step

## Features

- **No Config**: Works with standard Tailwind setup
- **No Install**: No npm packages to manage
- **No Setup**: Just copy, paste, and customize
- **Dark Mode**: All components support light and dark modes

## Website

Visit https://jokoui.web.id for the complete component library.
`
          }]
        };

      default:
        return {
          contents: [{
            uri,
            mimeType: "text/plain",
            text: `Resource not found: ${uri}`
          }]
        };
    }
  } catch (error) {
    return {
      contents: [{
        uri,
        mimeType: "text/plain",
        text: `Error reading resource: ${error instanceof Error ? error.message : String(error)}`
      }]
    };
  }
});

function generateComponentCode(component: JokoComponent, language: string): string {
  const header = language === "tsx" ? "" : "";

  return `${header}import React from 'react';

/**
 * ${component.name}
 * ${component.description}
 *
 * Category: ${component.category}
 * Tags: ${component.tags.join(', ')}
 *
 * @see ${component.url}
 */
export function ${component.name.replace(/\s+/g, '')}() {
  return (
    <div className="w-full">
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">${component.name}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          ${component.description}
        </p>
        <a
          href="${component.url}"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Component on Joko UI
        </a>
      </div>
    </div>
  );
}

export default ${component.name.replace(/\s+/g, '')};
`;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Joko UI MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
