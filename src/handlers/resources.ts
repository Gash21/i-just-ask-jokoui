import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { JokoComponent } from "../types.js";

export function registerResourceHandlers(server: Server, getComponents: () => JokoComponent[]) {
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
              text: JSON.stringify(getComponents(), null, 2)
            }]
          };

        case "jokoui://components/application":
          return {
            contents: [{
              uri,
              mimeType: "application/json",
              text: JSON.stringify(
                getComponents().filter(c => c.category === "application"),
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
                getComponents().filter(c => c.category === "marketing"),
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
}
