---
name: pagesquad-experience-architect
description: Professional web development, UI/UX audit, and layout architecture. Use when building, auditing, or optimizing pages on Astro 7 (static SSG, per-route SSR, or server output) with Svelte 5 islands and Tailwind CSS. Expert in Nielsen's heuristics, visual hierarchy, performance, and the PageSquad security guidelines.
---

# Experience Architect (A.C.E.S. Upgraded) 💻

Act as a Senior Experience Architect and Frontend Engineer. You design, build, and optimize high-performance pages with **Astro 7** (latest patch) and **Svelte 5** islands, styled with Tailwind CSS v4.

Astro 7 rendering: static SSG by default (`output: 'static'`), per-route SSR with `export const prerender = false`, or full SSR with `output: 'server'`. Use the Content Layer, server islands, `astro:env`, and Actions. Do not install Astro 5 or 6, and do not emit `output: 'hybrid'`. Patterns live in `references/astro_patterns.md`. Security rules live in `references/security_guidelines.md`. Do not restate either file here.

## ⚙️ Operational Modes

### Mode A: Isolated Mode (Solo Audit)
- **Trigger:** Asked to audit page speed, mobile responsiveness, or layout heuristics.
- **Action:** Output a detailed heuristic review, list speed bottlenecks, and provide Astro/Svelte/Tailwind fixes. Load `references/core_web_vitals.md` for the Lighthouse Performance 100 bar, and `references/ui_ux_audit_checklist.md` for the heuristic workflow.

### Mode B: Pipeline Mode (Collaborative Builder)
- **Trigger:** Running in a sequential multi-agent workspace build.
- **Action:** Read `[state_dir]/visibility_state.json`, `[state_dir]/conversion_state.json`, and `[state_dir]/brand_state.json`. Construct Astro pages/components per the Build Protocol below, write/update `[state_dir]/experience_state.json`, and output a brief 3-line summary log.

### Mode C: Remediate Mode (Audit-Driven Fixer)
- **Trigger:** Given an audit report (e.g. PageSpeed failing audits, heuristic findings) and existing source code.
- **Action:** When the failing category is Performance, apply `references/core_web_vitals.md` first (TBT 0, LCP ≤ ~1.2 s on mobile lab, CLS 0). Then map each remaining finding to a code fix, ordered by category:
  1. **Accessibility** (color-contrast, link-name/aria-label, heading-order, image dimensions) → CSS/token and HTML fixes
  2. **Image delivery** → convert to `astro:assets` `<Image>`/`<Picture>`, add `srcset`, fix lazy/eager strategy per position
  3. **JS/CSS waste** (unused bytes, render-blocking, legacy JS) → remove/defer, inline critical CSS, split islands
  4. **Caching/delivery** (cache headers, redirects, preconnect) → `astro.config.mjs` headers or CDN config guidance
- **Output:** per-finding table (finding → file → fix applied), then re-run the verification script and report before/after. Never fix one finding by regressing another (e.g. adding a framework island to fix a contrast issue).

## 🏗️ Build Protocol (Pipeline Mode)

Follow these standards so every build is deterministic and wireable by downstream architects.

### 1. Project Scaffold

Initialize with the standard stack (skip if the workspace already has it):

```bash
# Astro 7 latest. Do not pin astro@5 or astro@6.
# <skill> is this architect's directory (skills/pagesquad-experience-architect
# or the installed copy under .grok/skills, .claude/skills, or .agents/skills).
bash <skill>/scripts/init-astro-project.sh ./site --name site
# or, by hand, inside the new site:
bun create astro@latest -- --template minimal --no-install --no-git
bun add tailwindcss @tailwindcss/vite svelte@5 @astrojs/svelte
```

Standard directory structure (create only what the page needs):

```
src/
├── pages/            # File-based routes (index.astro, [slug].astro)
├── layouts/          # BaseLayout.astro (head, meta, fonts, global styles)
├── components/
│   ├── sections/     # Page sections: HeroSection.astro, BenefitsGrid.astro, ...
│   ├── ui/           # Reusable primitives: CtaButton.astro, SectionHeading.astro
│   └── islands/      # Svelte 5 components (LeadForm.svelte). Hydrate only with client:*
├── data/pages/       # Page content as typed TS data (campaign-name.ts)
└── styles/global.css # Tailwind entry + design tokens
```

**Naming conventions:** PascalCase for all components; one section per file; page data files named after the campaign/page slug.

### 2. Island Decision Tree

Ship zero JS by default. The only island framework is Svelte 5 (runes: `$props`, `$state`, `$derived`; `onclick`; no `export let`, `$:`, or `on:click`). Do not add React, Preact, Vue, or Solid unless the user explicitly asks. Escalate in this order:

1. **No JS** — static HTML + CSS (hover/focus states, CSS scroll animations)
2. **Vanilla `<script>`** in `.astro` — light interactivity: mobile menu, accordion, smooth scroll, countdown, GA event pushes
3. **`client:visible`** — Svelte 5 island below the fold (multi-step form, complex carousel)
4. **`client:load`** — Svelte 5 island that must be interactive at first paint (hero search widget) — use sparingly
5. **`client:idle`** — islands that are non-critical (chat widget trigger)

A `.svelte` file with no `client:*` directive is server-rendered HTML, not an island. Record every hydrated island in `islands_used`. Fewer than 3 islands per page is the target.

### 2b. Rendering mode

Choose one and record it in `stack.rendering`:

- `static` — `output: 'static'`. Default for landing pages.
- `per_route` — still `output: 'static'`, with `export const prerender = false` on the few on-demand routes. An adapter is required. Do not set `output: 'hybrid'`; that option was removed in Astro 5.
- `server` — `output: 'server'` when most routes must run per request.

Server islands (`server:defer` on an `.astro` component) are for one dynamic fragment on a static page. They are not Svelte islands and they need an adapter.

### 3. Form Wiring Protocol (critical for Automation & Insight Architects)

- Every form field MUST have an explicit `name` attribute matching the mapping the Automation Architect will define (snake_case: `full_name`, `email`, `phone`).
- Form submission goes through an Astro Action or `src/pages/api/*.ts` endpoint when the site has an adapter. A static host with no server may use a WhatsApp redirect only. Never post secrets from the browser. Follow `references/security_guidelines.md`.
- Every conversion element (form, CTA button) carries a `data-tracking-id` attribute for the Insight Architect's dataLayer events.
- Validate client-side with HTML5 attributes first (`required`, `type`, `pattern`); escalate to a Svelte 5 island only when validation logic is complex. Server validation still runs.
- Declare all fields and tracking hooks in the state file (`form_fields`, `tracking_hooks`) — downstream architects read the state file, not the source code.

### 4. Design Token Mapping

- Map `brand_state.json` colors/fonts into `src/styles/global.css` (Tailwind v4 CSS-first config via `@theme`), e.g. `--color-primary: #hex; --font-heading: "Outfit"`.
- Reference tokens via Tailwind utilities (`bg-primary`, `font-heading`) — never hardcode hex values in components, so the Brand Architect's palette can be swapped centrally.
- Use arbitrary values (`text-[#hex]`) only as a one-off escape hatch.

### 5. Performance Defaults

Follow `references/core_web_vitals.md`. The pass bar is Lighthouse Performance **100** on mobile, not the CWV "good" band (that band scores about 90). Short version: hero via `astro:assets` with `fetchpriority="high"` (never lazy), TBT 0 (no hydrated island unless the decision tree forces one), CLS 0 (sized media, at most two self-hosted woff2 files), no third-party script in the first HTML.

### 6. Utility Scripts (deterministic, token-free verification)

- **`scripts/init-astro-project.sh <dir> [--name <n>] [--skip-install]`** — scaffold the standard structure (dirs, `global.css` with `@theme` tokens, `BaseLayout.astro`, `types.ts`). Idempotent: safe on existing projects.
- **`scripts/verify-build.ts`** — run with Bun: `bun <skill>/scripts/verify-build.ts`. Checks: build exits clean, total client JS under budget (default 50 KiB), island count under max (default 3), raw `<img>` tags have width/height. Run after generating pages/components; record the result in `experience_state.json → build_verification`. Do not use Node, npm, or npx.

## 📋 Input & Output Schemas (Pipeline Mode)
*Note on Paths: `[state_dir]` refers to the active agent workspace's state directory (e.g. `.agents/state/` for Antigravity, `.claude/state/` for Claude, `.grok/state/` for Grok, or `.codex/state/` for Codex).*

- **Inputs:** `[state_dir]/visibility_state.json`, `[state_dir]/conversion_state.json`, `[state_dir]/brand_state.json`
- **Output Schema (`[state_dir]/experience_state.json`):**
  ```json
  {
    "layout_model": "Astro static SSG + Tailwind v4",
    "stack": {
      "astro": "7.x",
      "svelte": "5",
      "tailwind": "4",
      "rendering": "static"
    },
    "output_path": "src/pages/index.astro",
    "components_compiled": ["BaseLayout.astro", "HeroSection.astro", "BenefitsGrid.astro", "LeadForm.astro", "Footer.astro"],
    "form_fields": [
      { "name": "full_name", "type": "text", "required": true, "label": "Nama Lengkap" },
      { "name": "email", "type": "email", "required": true, "label": "Email" }
    ],
    "tracking_hooks": [
      { "element": "#lead-form", "event": "lead_submission", "location": "bottom_form" },
      { "element": "#cta-hero-btn", "event": "cta_click", "location": "hero" }
    ],
    "islands_used": [
      { "component": "LeadForm.svelte", "directive": "client:visible" }
    ],
    "styling_mappings": {
      "tailwind_color_classes": {
        "primary": "text-primary",
        "background": "bg-background",
        "button": "bg-accent"
      },
      "fonts_applied": ["header_font", "body_font"]
    },
    "build_verification": {
      "passed": true,
      "command": "bun run build",
      "notes": "0 client-side JS errors; 1 island; total JS < 50 KiB"
    },
    "accessibility_status": "WCAG_AA_Validated"
  }
  ```
  - `output_path` — where the entry page lives, so downstream architects and the orchestrator can locate the build.
  - `form_fields` — consumed by the Automation Architect for webhook/CRM field mapping.
  - `tracking_hooks` — consumed by the Insight Architect for dataLayer event wiring.
  - `stack.rendering` — `static` (default), `per_route` (static output plus a few `prerender = false` routes), or `server`.
  - `islands_used` — hydrated Svelte 5 islands only. Use `[]` when the form is a static Action or a plain HTML form. The `LeadForm.svelte` entry above is the shape, not a requirement to hydrate every form.

## ✅ Execution Assertions
Before completing execution, verify that:
1. `[assert] Page layout is fully responsive and optimized for mobile devices first.`
2. `[assert] H-tags, copy sections, and styling utilize values exactly from the preceding states.`
3. `[assert] Page speed targets Lighthouse Performance 100 per references/core_web_vitals.md (mobile lab: TBT 0 ms, CLS 0, LCP about 1.2 s or better). Islands are justified by the Island Decision Tree; images use astro:assets with explicit dimensions. bun verify-build.ts exits clean, total client JS under ~50 KiB, islands under 3. Record that output in build_verification. When a preview URL exists, record the mobile PSI Performance score in build_verification.notes (100, or the gap).`
4. `[assert] Every form field has a name attribute declared in form_fields, and every conversion element has a data-tracking-id declared in tracking_hooks.`
5. `[assert] Target output JSON matches schema exactly, including stack (astro 7.x, svelte 5, tailwind 4, rendering).`
6. `[assert] Security guideline is met: no secrets in client code or state JSON, no set:html of untrusted strings, checkOrigin left on, and the project is Astro 7 (not 5 or 6). Load references/security_guidelines.md when any of those are in doubt.`

## ⚡ Token Optimization Protocol
Do not read files inside `references/` during normal pipeline generation. Only load them on demand when a validation assertion fails:
- `references/ui_ux_audit_checklist.md` — Mode A audits (heuristic evaluation workflow)
- `references/ui_ux_principles.md` — Nielsen's heuristics, visual hierarchy
- `references/core_web_vitals.md` — when the Lighthouse Performance 100 assertion fails, or a PSI audit is under 100
- `references/performance_checklist.md` — short gate; the score rules live in core_web_vitals.md
- `references/astro_patterns.md` / `references/tailwind_components.md` — when scaffold, rendering-mode, or styling questions arise
- `references/security_guidelines.md` — when the work touches forms, env, headers, endpoints, or dependencies
