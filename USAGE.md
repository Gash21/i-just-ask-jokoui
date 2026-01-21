# Usage & Troubleshooting

## Example Workflows

### 1. Basic Discovery
**User:** "What Joko UI components are available for building landing pages?"

**Assistant:**
1. Calls `list_components(category="marketing")`
2. Returns list: hero-section, feature-grid, pricing-table, etc.

### 2. Fetch & Implement
**User:** "Get the hero section and save it to ./src/components/Hero.tsx"

**Assistant:**
1. Calls `search_components("hero section")` to find the ID.
2. Calls `fetch_and_implement_component(componentId="hero-section", outputPath="./src/components/Hero.tsx")`
3. Confirms completion.

### 3. Bulk Implementation
**User:** "Search for authentication components and implement them"

**Assistant:**
1. Calls `search_components("auth")`
2. Iterates through results (login-form, register-form).
3. Calls `fetch_and_implement_component` for each.

## Troubleshooting

### Server Not Found
- Verify the path in your configuration file is absolute and correct.
- Ensure `node` is in your system PATH.
- Restart your AI assistant (fully quit and reopen).

### Tools Erroring
- Ensure Node.js version is >= 18.0.0.
- Check internet connection (required for fetching from jokoui.web.id).
- Run `npm run inspector` to debug locally.

### Permission Issues
- When using `implement_component`, ensure the server has write permissions to the target directory.
- Use absolute paths for `outputPath` to avoid CWD ambiguity.
