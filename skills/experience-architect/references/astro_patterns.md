# Astro Implementation Patterns

Astro is the preferred framework for high-performance landing pages due to its "Islands Architecture."

## Component Structure

### 1. Astro Components (`.astro`)
- Use for static HTML, layouts, and fragments.
- Keep the script section (`---`) for data fetching or prop definitions.
- Avoid client-side JS in `.astro` files; use UI framework components for interactivity.

### 2. Framework Integration (React/Svelte)
- Use for interactive elements: `RegistrationForm`, `Header` (with mobile menu), `Carousel`.
- Use the `client:load` or `client:visible` directives strategically to optimize performance.

## Data Management

- Centralize page data in `src/data/pages/`.
- Use TypeScript interfaces in `src/data/types.ts` to ensure data consistency across pages.
- Pattern for campaign pages:
  ```typescript
  // src/data/pages/campaign-name.ts
  export const campaignData = {
    hero: { ... },
    packages: [ ... ],
    // ...
  };
  ```

## Layouts & Meta

- Use a base `Layout.astro` for common `<head>` elements, SEO meta tags, and global styles.
- Always include `canonical` URLs and OpenGraph tags for social sharing.
