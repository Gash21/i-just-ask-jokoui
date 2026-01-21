import { JokoComponent } from "./types.js";

export function generateComponentCode(component: JokoComponent, language: string): string {
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
