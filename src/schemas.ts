import { z } from "zod";

export const SearchComponentsSchema = z.object({
  query: z.string().optional().describe("Search query for component name, description, or tags"),
  category: z.enum(["application", "marketing"]).optional().describe("Filter by category"),
  tags: z.array(z.string()).optional().describe("Filter by tags"),
  limit: z.number().min(1).max(50).optional().default(10).describe("Maximum number of results")
});

export const GetComponentCodeSchema = z.object({
  componentId: z.string().describe("Component ID to get code for"),
  language: z.enum(["typescript", "tsx"]).optional().default("tsx").describe("Language format (typescript or tsx)")
});

export const FetchComponentSchema = z.object({
  componentId: z.string().describe("Component ID to fetch from jokoui.web.id"),
  url: z.string().optional().describe("Direct URL to component page (overrides componentId)")
});

export const ImplementComponentSchema = z.object({
  code: z.string().describe("Component code to write to file"),
  outputPath: z.string().describe("File path to write the component code (e.g., ./src/components/Hero.tsx)"),
  createDirectories: z.boolean().optional().default(true).describe("Create parent directories if they don't exist")
});

export const FetchAndImplementComponentSchema = z.object({
  componentId: z.string().describe("Component ID to fetch and implement"),
  outputPath: z.string().describe("File path to write the component (e.g., ./src/components/Hero.tsx)"),
  url: z.string().optional().describe("Direct URL to component page (overrides componentId)"),
  createDirectories: z.boolean().optional().default(true).describe("Create parent directories if they don't exist")
});
