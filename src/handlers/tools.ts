import * as fs from "fs/promises";
import * as path from "path";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { JokoComponent } from "../types.js";
import { SearchComponentsSchema, GetComponentCodeSchema, FetchComponentSchema, ImplementComponentSchema, FetchAndImplementComponentSchema } from "../schemas.js";
import { fetchComponentCode, tryFetchComponentFromGitHub } from "../fetch.js";
import { generateComponentCode } from "../generators.js";
import { toTitleCase } from "../utils.js";

export function writeComponentToFile(code: string, outputPath: string, createDirectories: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    (async () => {
      try {
        if (createDirectories) {
          const dir = path.dirname(outputPath);
          await fs.mkdir(dir, { recursive: true });
        }

        await fs.writeFile(outputPath, code, "utf-8");

        resolve(outputPath);
      } catch (error) {
        console.error("Error writing file:", error);
        reject(error);
      }
    })();
  });
}

export function registerToolHandlers(server: Server, getComponents: () => JokoComponent[]) {
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "list_components": {
          const categoryFilter = args?.category as "application" | "marketing" | undefined;

          let components = getComponents();

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

          let results = getComponents();

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

          let component = getComponents().find(c => c.id === componentId);

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
            const component = getComponents().find(c => c.id === componentId);

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
            const component = getComponents().find(c => c.id === componentId);

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
}
