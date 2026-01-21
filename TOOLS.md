# Available Tools & Resources

## Tools

### `list_components`
Lists all available Joko UI components with optional category filter.

- **Parameters:**
  - `category` (optional): "application" or "marketing"
- **Example:** `list_components(category="marketing")`

### `search_components`
Search for components by name, description, or tags.

- **Parameters:**
  - `query` (optional): Search terms
  - `category` (optional): Filter by category
  - `tags` (optional): Filter by tags
  - `limit` (optional): Max results (default 10)

### `get_component_code`
Get React/TSX code for a specific component.

- **Parameters:**
  - `componentId`: ID of the component (e.g., "hero-section")
  - `language`: Output format (default: "tsx")

### `fetch_component`
Fetch actual component code from jokoui.web.id website.

- **Parameters:**
  - `componentId` (optional): Component ID to fetch
  - `url` (optional): Direct URL (overrides componentId)

### `implement_component`
Write component code to a file in your project.

- **Parameters:**
  - `code`: Source code string
  - `outputPath`: Destination file path
  - `createDirectories`: Boolean (default: true)

### `fetch_and_implement_component`
**Combined Operation:** Fetches code from the web and writes it to a file immediately.

- **Parameters:**
  - `componentId`: Component ID
  - `outputPath`: file path (e.g., `./src/components/Hero.tsx`)
  - `url` (optional): Direct URL

## Resources

- `jokoui://components/all` - Full list of components and metadata
- `jokoui://components/application` - Application components list
- `jokoui://components/marketing` - Marketing components list
- `jokoui://docs/introduction` - Introduction guide
