# Astro Implementation Patterns

Astro is the preferred framework for high-performance landing pages due to its "Islands Architecture" — zero JS by default, hydrate only what needs interactivity.

## Project Essentials (Astro 4/5+)

- **Entry**: `src/pages/*.astro` — file-based routing; `index.astro` is the homepage.
- **Base layout**: `src/layouts/BaseLayout.astro` holds `<head>`, SEO meta (title, description, canonical, OpenGraph, JSON-LD), font loading, and global styles import.
- **Scripts**: static or `is:inline` for third-party snippets; deferred by default.

## Images — always use `astro:assets`

Never drop raw `<img>` tags for content images. The built-in components auto-optimize:

```astro
---
import { Image, Picture } from 'astro:assets';
import hero from '../assets/hero.jpg';
---
<!-- Auto WebP/AVIF, enforced width/height (zero CLS), lazy by default -->
<Image src={hero} alt="Hero banner" widths={[400, 800, 1200]} sizes="(max-width: 768px) 100vw, 50vw" />
<!-- When art direction or format fallback order matters -->
<Picture src={hero} alt="Hero" formats={['avif', 'webp']} />
```

- Hero/above-fold images: add `loading="eager"` + `fetchpriority="high"`; everything else stays lazy.
- Images must live in `src/assets/` (processed) — `public/` is only for unprocessed originals like favicons.

## Interactivity — follow the Island Decision Tree

1. No JS (CSS-only) → 2. vanilla `<script>` in `.astro` → 3. `client:visible` → 4. `client:load` → 5. `client:idle`

```astro
<!-- Vanilla: runs once, zero framework cost -->
<script>
  document.querySelector('#mobile-menu-btn')?.addEventListener('click', () => {
    document.querySelector('#mobile-menu')?.classList.toggle('hidden');
  });
</script>

<!-- Framework island: only hydrates when scrolled into view -->
<LeadForm client:visible />
```

- React/Svelte/Preact/Solid all supported via `@astrojs/react` etc. — prefer the lightest one that fits.
- Islands cannot be passed functions as props — pass data/serializable props only.

## Forms — Astro Actions (preferred) or API routes

```astro
---
import { actions } from 'astro:actions';
---
<form action={actions.lead.submit} method="POST">
  <input name="full_name" required />
  <input type="email" name="email" required />
  <button data-tracking-id="cta_form_submit">Daftar</button>
</form>
```

- Actions (`src/actions/index.ts`) give typed input validation (zod) and co-located server logic — no separate API file or framework island needed for simple forms.
- Alternative: `src/pages/api/leads.ts` with `export const POST: APIRoute`.
- Field `name` attributes are the contract with the Automation Architect (webhook mapping) — never rename them unilaterally.

## View Transitions (multi-page sites)

```astro
// BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
<ClientRouter />
```

- Gives SPA-like page transitions while staying MPA-static. Use `transition:animate` on section elements sparingly.

## Data Management

- Centralize page content in `src/data/pages/` as typed TS objects — components stay presentational.
- `src/data/types.ts` holds shared interfaces so visibility/conversion/brand state maps cleanly into components.

## SEO & Meta

- Base layout emits: unique `<title>` (≤60 chars), meta description (≤155), canonical, OG tags, and the JSON-LD types required by `visibility_state.json`.
- `astro-sitemap` integration generates `sitemap-index.xml` automatically — wire it into `astro.config.mjs`.
