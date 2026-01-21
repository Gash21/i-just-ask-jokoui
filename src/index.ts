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
import * as fs from "fs/promises";
import * as path from "path";

export interface JokoComponent {
  id: string;
  name: string;
  category: "application" | "marketing";
  description: string;
  tags: string[];
  url?: string;
}

const GITHUB_API_BASE = "https://api.github.com/repos/rayasabari/joko-ui/contents/lib/data/components";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com/rayasabari/joko-ui/main/lib/data/components";
const JOKO_UI_BASE = "https://jokoui.web.id/components";

async function fetchComponentData(): Promise<JokoComponent[]> {
  try {
    console.error("Fetching component data from GitHub...");

    const [appResponse, marketingResponse] = await Promise.all([
      fetch(`${GITHUB_API_BASE}/application`),
      fetch(`${GITHUB_API_BASE}/marketing`)
    ]);

    if (!appResponse.ok || !marketingResponse.ok) {
      throw new Error("Failed to fetch component data from GitHub");
    }

    const [appData, marketingData] = await Promise.all([
      appResponse.json() as Promise<any[]>,
      marketingResponse.json() as Promise<any[]>
    ]);

    const components: JokoComponent[] = [];

    for (const item of appData) {
      if (item.type === "file" && item.name.endsWith(".tsx") && item.name !== "index.ts") {
        const componentName = item.name.replace(".tsx", "");
        components.push({
          id: componentName,
          name: toTitleCase(componentName),
          category: "application",
          description: `${toTitleCase(componentName)} component for application UI`,
          tags: [componentName, "application", "ui"],
          url: `${JOKO_UI_BASE}/application/${componentName}`
        });
      }
    }

    for (const item of marketingData) {
      if (item.type === "file" && item.name.endsWith(".tsx") && item.name !== "index.ts") {
        const componentName = item.name.replace(".tsx", "");
        components.push({
          id: componentName,
          name: toTitleCase(componentName),
          category: "marketing",
          description: `${toTitleCase(componentName)} component for marketing pages`,
          tags: [componentName, "marketing", "ui"],
          url: `${JOKO_UI_BASE}/marketing/${componentName}`
        });
      }
    }

    console.error(`Fetched ${components.length} components from GitHub`);
    return components;
  } catch (error) {
    console.error("Error fetching component data:", error);
    return [];
  }
}

function toTitleCase(str: string): string {
  return str
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

let JOKO_UI_COMPONENTS: JokoComponent[] = [];

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
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

async function tryFetchComponentFromGitHub(componentId: string): Promise<{ code: string; category: "application" | "marketing"; url: string } | null> {
  const categories: ("application" | "marketing")[] = ["application", "marketing"];

  for (const category of categories) {
    try {
      const githubRawUrl = `${GITHUB_RAW_BASE}/${category}/${componentId}.tsx`;
      console.error(`Trying GitHub raw: ${githubRawUrl}`);

      const response = await fetch(githubRawUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; I-Just-Ask-JokoUI/2.0)'
        }
      });

      if (response.ok) {
        const code = await response.text();
        return {
          code,
          category,
          url: `${JOKO_UI_BASE}/${category}/${componentId}`
        };
      }
    } catch (error) {
      continue;
    }
  }

  return null;
}

async function fetchComponentCode(url: string): Promise<string> {
  try {
    console.error(`Fetching from: ${url}`);

    if (url.includes("jokoui.web.id")) {
      const match = url.match(/components\/(application|marketing)\/([^/]+)/);
      if (match) {
        const [, category, componentName] = match;
        const githubRawUrl = `${GITHUB_RAW_BASE}/${category}/${componentName}.tsx`;
        console.error(`Fetching from GitHub raw: ${githubRawUrl}`);

        const response = await fetch(githubRawUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; I-Just-Ask-JokoUI/2.0)'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
      }
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; I-Just-Ask-JokoUI/2.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.text();
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

        let component = JOKO_UI_COMPONENTS.find(c => c.id === componentId);

        if (!component) {
          console.error(`Component not found in loaded list: ${componentId}. Trying GitHub fallback...`);

          const fallback = await tryFetchComponentFromGitHub(componentId);
          if (!fallback) {
            return {
              content: [{
                type: "text",
                text: `Component not found: ${componentId}. Use list_components to see available components.`
              }],
              isError: true
            };
          }

          const fallbackComponent = {
            id: componentId,
            name: toTitleCase(componentId),
            category: fallback.category,
            description: `${toTitleCase(componentId)} component for ${fallback.category} UI`,
            tags: [componentId, fallback.category, "ui"],
            url: fallback.url
          };

          const codeTemplate = generateComponentCode(fallbackComponent, language);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                component: fallbackComponent,
                code: codeTemplate,
                instructions: `
 Copy and paste this code into your project.

 1. Ensure you have Tailwind CSS installed and configured
 2. Create a new component file (e.g., ${componentId}.tsx)
 3. Paste code
 4. Customize as needed

 Visit ${fallback.url} to view component live and see more examples.
 Note: This component was found in the repository but is not yet in the cached component list.
              `.trim()
            }, null, 2)
            }]
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
            console.error(`Component not found in loaded list: ${componentId}. Trying GitHub fallback...`);

            const fallback = await tryFetchComponentFromGitHub(componentId);
            if (!fallback) {
              return {
                content: [{
                  type: "text",
                  text: `Component not found: ${componentId}. Use list_components to see available components.`
                }],
                isError: true
              };
            }

            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  source: fallback.url,
                  code: fallback.code,
                  component: {
                    id: componentId,
                    name: toTitleCase(componentId),
                    category: fallback.category,
                    url: fallback.url
                  },
                  info: `Successfully fetched component '${componentId}' from GitHub repository (newly added, not in cache)`,
                  nextSteps: [
                    "Review the code to understand structure",
                    "Use 'implement_component' tool to save to file",
                    "Or use 'fetch_and_implement_component' to do both in one step"
                  ]
                }, null, 2)
              }]
            };
          }

          url = component.url;
        }

        try {
          const code = await fetchComponentCode(url!);

          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                source: url || "",
                code: code,
                info: "Successfully fetched component code from Joko UI repository",
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
              text: `Failed to fetch component: ${error instanceof Error ? error.message : String(error)}\n\nTry providing a direct URL or check if the component exists in the repository.`
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
            console.error(`Component not found in loaded list: ${componentId}. Trying GitHub fallback...`);

            const fallback = await tryFetchComponentFromGitHub(componentId);
            if (!fallback) {
              return {
                content: [{
                  type: "text",
                  text: `Component not found: ${componentId}. Use list_components to see available components.`
                }],
                isError: true
              };
            }

            const resolvedPath = await writeComponentToFile(fallback.code, outputPath, createDirectories);
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: true,
                  component: componentId,
                  source: fallback.url,
                  outputPath: resolvedPath,
                  bytesWritten: fallback.code.length,
                  info: `Successfully fetched and implemented component '${componentId}' from GitHub repository (newly added, not in cache)`,
                  nextSteps: [
                    "Open the file to review the component",
                    "Import it in your application",
                    "Customize styling and functionality as needed"
                  ]
                }, null, 2)
              }]
            };
          }

          url = component.url;
        }

        try {
          const code = await fetchComponentCode(url!);
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
        description: "Application UI components (alerts, avatars, badges, buttons, cards, forms, loaders, navbars, progress, sidebars, skeleton, breadcrumbs)",
        mimeType: "application/json"
      },
      {
        uri: "jokoui://components/marketing",
        name: "Marketing Components",
        description: "Marketing UI components (banners, ctas, description-list, faq, footers, headers, heroes, pricing, stats, teams, testimonials)",
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

**Note**

All components support both Light and Dark modes out of the box using Tailwind's \`dark:\` modifier.

## Component Categories

### [Application](/components/application)

UI components for building functional web applications:

- Alerts
- Avatars
- Badges
- Buttons
- Cards
- Forms
- Loaders
- Navbars
- Progress
- Sidebars
- Skeleton
- Breadcrumbs

### [Marketing](/components/marketing)

Components for building high-converting landing pages:

- Banners
- CTAs
- Description Lists
- FAQs
- Footers
- Headers
- Heroes
- Pricing
- Stats
- Teams
- Testimonials

## MCP Server Tools

This MCP server provides tools to:

- **fetch_component**: Fetch actual code from Joko UI repository
- **implement_component**: Write code to a file
- **fetch_and_implement_component**: Do both in one step

## Features

- **No Config**: Works with standard Tailwind setup
- **No Install**: No npm packages to manage
- **No Setup**: Just copy, paste, and customize
- **Dark Mode**: All components support light and dark modes
- **Up to Date**: Fetches directly from GitHub repository

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
