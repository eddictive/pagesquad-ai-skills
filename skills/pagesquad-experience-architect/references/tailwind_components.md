# Tailwind CSS & UI Component Patterns

Efficient styling using utility classes and pre-built UI components.

## Tailwind v4 (CSS-first config)

Tailwind v4 has no `tailwind.config.js` by default — tokens live in CSS via `@theme`:

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-primary: #0F172A;   /* from brand_state.json */
  --color-accent: #F59E0B;
  --font-heading: "Outfit", sans-serif;
  --font-body: "Plus Jakarta Sans", sans-serif;
}
```

- Tokens become utilities automatically: `bg-primary`, `text-accent`, `font-heading`.
- Vite plugin setup: `bun add tailwindcss @tailwindcss/vite`, add `tailwindcss()` to `astro.config.mjs` vite plugins.
- Utilities are the same as v3 (responsive prefixes, hover/focus variants) — only configuration moved to CSS.

## Core Utility Patterns

- **Responsiveness**: mobile-first — write base styles for mobile, add `sm:`, `md:`, `lg:` overrides.
- **Containerization**: `max-w-7xl mx-auto px-4` (v4 ships no `container` class by default).
- **Typography hierarchy**: `text-4xl font-bold leading-tight` for H1, scale down per level.
- **Colors**: always via `@theme` tokens — never raw hex in components.

## Component Library Decision Tree

**Default: vanilla Tailwind utilities + a few hand-rolled `ui/` primitives.** Add a library only when the trade-off is justified:

| Use | When | Trade-off |
|---|---|---|
| **None (utilities only)** | Landing pages, marketing sections, most PageSquad builds | Full control, zero deps, brand tokens enforced |
| **DaisyUI** | Static marketing sites needing standard widgets fast (buttons, cards, modals via semantic classes) | No JS required; themeable; some class bloat |
| **Svelte 5 island** | Complex client state only (multi-step form, calculator). Hand-rolled runes first. A headless Svelte library is allowed inside that island if the user asks. | Hydration cost. Still not a reason to add React. |

Rules of thumb:
- A DaisyUI `btn` on a static page costs nothing. A Svelte island costs JS. Choose accordingly.
- Do not add React, Shadcn-React, or a second CSS framework on the same page.
- For simple forms, HTML5 validation + Astro Actions beats a component library (see `astro_patterns.md`).

## Section Templates (Tailwind-Ready)

### Hero Section
- High-contrast headline (token colors), clear primary + secondary buttons.
- `astro:assets` image, eager + `fetchpriority="high"`; CTA carries `data-tracking-id`.

### Feature Grid
```html
<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
  <!-- icon + headline + short description per cell -->
</div>
```

### CTA Banner + Form
- Form fields with snake_case `name` attributes matching `automation_state.json`.
- Submit button `data-tracking-id="cta_form_submit"`.
- Success/error states visible without JS where possible (server-rendered via Actions).
