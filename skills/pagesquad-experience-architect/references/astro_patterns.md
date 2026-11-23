# Astro + Svelte 5 Implementation Patterns

This is the source of truth for how PageSquad sites are built. `SKILL.md` only points here.

Astro renders the page. Svelte 5 is the only island framework. Tailwind v4 styles both.

## Version floor

| Package | Install | Do not install |
|---|---|---|
| `astro` | **7.x latest patch** (`bun create astro@latest`, then stay on the latest 7.4+ patch) | `astro@5`, `astro@6`, any pin below the current 7.4 line |
| `@astrojs/svelte` | Current major that supports Svelte 5 (9.x as of 2026-11) | `@astrojs/svelte@5` (that release is the Svelte 3/4 integration) |
| `svelte` | `svelte@5` | Svelte 3 or 4 syntax |
| `tailwindcss` | v4, via `@tailwindcss/vite` | `tailwind.config.js` as the default setup |

Install Astro 7. Astro 5 ended at 5.18.2 (2026-05-26) and gets no security fixes. Astro 6 is the previous major. Neither is a new-project target.

These removed calls must not be emitted:

- `output: 'hybrid'`
- `Astro.glob()`
- `<ViewTransitions />` (use `ClientRouter`)
- Legacy content collections in `src/content/config.ts` (use `src/content.config.ts`)

Before adding an adapter, image service, or markdown plugin, check the installed version's advisory. As of 2026-11 the current patch line is 7.4.x. Do not ship a known-vulnerable Astro.

## Rendering: static, per-route SSR, full SSR

Default is a static landing page. Pick a mode before writing routes.

| Mode | Config | Use when |
|---|---|---|
| **Static / SSG** | `output: 'static'` (the default). Every page is prerendered. | Marketing pages, blogs, campaign landers. **PageSquad default.** |
| **Per-route SSR** | Stay on `output: 'static'`. Add `export const prerender = false` to the one page or endpoint that must run per request. An adapter is required. | One on-demand route (a form Action, a personalized fragment) on an otherwise static site. |
| **Server (SSR)** | `output: 'server'` plus an adapter. Opt static pages back in with `export const prerender = true`. | Most routes depend on the request (auth, account, per-user content). |
| **Server island** | An `.astro` component with `server:defer`, plus an adapter. The rest of the page stays static. | A small dynamic fragment (price, stock, greeting) must not block or uncache the whole page. |

There is no `hybrid` output. "Mostly static, one dynamic route" is `output: 'static'` plus `prerender = false` on that route.

```astro
---
// src/pages/api/leads.ts is a page too. This one route is on-demand.
export const prerender = false;
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({ ok: true }), { status: 202 });
};
---
```

Server islands are `.astro` components, not Svelte components:

```astro
---
import Price from '../components/Price.astro';
---
<Price server:defer>
  <p slot="fallback">Memuat harga…</p>
</Price>
```

Props passed to `server:defer` are encrypted. Still do not put secrets in those props. Set `ASTRO_KEY` (from `astro create-key`) when more than one server instance handles the island requests.

Actions and server islands need an adapter even if the rest of the site is static. A host with no server runtime (plain file hosting) cannot run them. On that host, a form may only do a client-side WhatsApp redirect. See the security guideline before posting lead data from the browser.

## Project essentials

```
src/
├── pages/                 # file routes; index.astro is the homepage
├── layouts/BaseLayout.astro
├── components/
│   ├── sections/          # HeroSection.astro — static
│   ├── ui/                # CtaButton.astro
│   └── islands/           # LeadForm.svelte — Svelte 5 only
├── content.config.ts      # Content Layer collections, when the page has content
├── actions/index.ts       # server actions, when a form needs a server
├── data/pages/            # typed campaign data
├── styles/global.css
└── assets/                # processed images
```

`astro.config.mjs` for the default site:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [svelte()],
  vite: { plugins: [tailwindcss()] },
  security: { checkOrigin: true },
});
```

```js
// svelte.config.js
import { vitePreprocess } from '@astrojs/svelte';

export default { preprocess: vitePreprocess() };
```

Do not add `@astrojs/react`, Preact, Vue, or Solid unless the user explicitly asks. One island framework per project.

## Svelte 5 islands

Write islands as Svelte 5 runes. Do not emit Svelte 4.

| Write | Do not write |
|---|---|
| `let { label } = $props();` | `export let label` |
| `let open = $state(false);` | `let open = false` plus a manual invalidate |
| `let total = $derived(price * qty);` | `$: total = price * qty` |
| `onclick={toggle}` | `on:click={toggle}` |
| `<slot />` for children passed from `.astro` | Snippets as the Astro→Svelte bridge |

Astro still passes children to a Svelte component through slots. Use `<slot />` on that boundary. Use snippets (`{#snippet}` / `{@render}`) only for composition inside Svelte files.

```svelte
<script lang="ts">
  let { fields = [] }: { fields?: { name: string; label: string }[] } = $props();
  let status = $state<'idle' | 'submitting'>('idle');
</script>

<form method="POST" onsubmit={() => (status = 'submitting')}>
  {#each fields as field (field.name)}
    <label>
      {field.label}
      <input name={field.name} required />
    </label>
  {/each}
  <button type="submit" data-tracking-id="cta_form_submit">Kirim</button>
</form>
```

```astro
---
import LeadForm from '../components/islands/LeadForm.svelte';
---
<!-- No directive: Astro SSRs the component to HTML and ships zero Svelte JS. -->
<LeadForm fields={fields} />

<!-- Directive: hydrate. Prefer client:visible. -->
<LeadForm client:visible fields={fields} />
```

Props that cross into a hydrated island must be serializable. Functions, class instances, and `Map` do not cross. A hydrated island cannot import an `.astro` component.

Island decision order, unchanged:

1. No JS (CSS only)
2. Vanilla `<script>` in the `.astro` file
3. `client:visible` Svelte island
4. `client:load` only when the control must work at first paint
5. `client:idle` for non-critical widgets

Target: fewer than 3 hydrated islands per page. Record each one in `islands_used`. A Svelte file with no `client:*` directive is not an island and counts as zero JS.

## Images

Use `astro:assets` for content images. `public/` is for files that must keep a fixed URL (favicon, robots, files linked from ads).

```astro
---
import { Image, Picture } from 'astro:assets';
import hero from '../assets/hero.jpg';
---
<Image
  src={hero}
  alt="Hero banner"
  widths={[400, 800, 1200]}
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="eager"
  fetchpriority="high"
/>
```

Above-the-fold images are `loading="eager"` and `fetchpriority="high"`. Everything else stays lazy. Remote images need an explicit allowlist in the image service. Do not point the optimizer at arbitrary user URLs.

## Forms

Simple form: HTML5 validation (`required`, `type`, `pattern`) and an Astro Action. No Svelte island.

```ts
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  lead: defineAction({
    accept: 'form',
    input: z.object({
      full_name: z.string().min(1).max(120),
      email: z.string().email(),
      phone: z.string().max(20).optional(),
    }),
    handler: async (input) => {
      // Server-only. Read secrets from astro:env/server here.
      return { ok: true };
    },
  }),
};
```

```astro
---
import { actions } from 'astro:actions';
---
<form method="POST" action={actions.lead}>
  <input name="full_name" required />
  <input type="email" name="email" required />
  <button data-tracking-id="cta_form_submit">Daftar</button>
</form>
```

Field `name` values are the contract with the Automation Architect. snake_case: `full_name`, `email`, `phone`. Do not rename them in the component without updating `experience_state.json`.

Leave `security.checkOrigin` at its default `true`. That check is what stops cross-site form posts to on-demand routes.

## Environment variables

Declare every variable. Server secrets never use a `PUBLIC_` prefix and are never imported from client code.

```js
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      LEAD_INGEST_SECRET: envField.string({ context: 'server', access: 'secret' }),
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
    },
  },
});
```

```ts
import { LEAD_INGEST_SECRET } from 'astro:env/server';
import { PUBLIC_GTM_ID } from 'astro:env/client';
```

A Svelte island may import `astro:env/client` only. Importing `astro:env/server` from a `.svelte` file is a bug.

## Content

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { pages };
```

Campaign copy that comes from pipeline state belongs in `src/data/pages/*.ts`, not in a collection, unless the user already has a content folder.

## SEO, transitions, sitemap

- `BaseLayout.astro` emits a unique `<title>` (≤60 characters), meta description (≤155), canonical, Open Graph, and the JSON-LD types required by `visibility_state.json`.
- Escape `<` in JSON-LD before injecting it. See the security guideline.
- Multi-page sites: `import { ClientRouter } from 'astro:transitions'` in the base layout. Do not use `<ViewTransitions />`.
- Add `@astrojs/sitemap` and set `site` in the config when the project has more than one public URL.

## CSP

Stable since Astro 6, configured under `security.csp` (Astro 5.9 only had `experimental.csp`). Turn it on once every third-party script and style origin is known:

```js
export default defineConfig({
  security: {
    checkOrigin: true,
    csp: true,
  },
});
```

Marketing tags (GTM, Meta, TikTok) need explicit `script-src` entries. Coordinate that list with the Insight Architect. A strict CSP that the page immediately relaxes with `'unsafe-inline'` for a tag manager is not a control.

## Scaffold and verify

- `scripts/init-astro-project.sh <dir>` creates this structure. It is idempotent.
- `bun scripts/verify-build.ts` checks the production build (`bun run build`), the client JS budget (default 50 KiB), the hydrated-island count (default 3), and raw `<img>` dimensions. Record the result in `build_verification`. The runtime is Bun.
