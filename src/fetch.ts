import { JokoComponent } from "./types.js";
import { GITHUB_API_BASE, GITHUB_RAW_BASE, JOKO_UI_BASE } from "./constants.js";
import { toTitleCase } from "./utils.js";

export async function fetchComponentData(): Promise<JokoComponent[]> {
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

export async function tryFetchComponentFromGitHub(componentId: string): Promise<{ code: string; category: "application" | "marketing"; url: string } | null> {
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

export async function fetchComponentCode(url: string): Promise<string> {
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
