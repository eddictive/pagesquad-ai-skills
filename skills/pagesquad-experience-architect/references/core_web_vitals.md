# Core Web Vitals — Lighthouse performance 100

Source of truth for a **Lighthouse Performance score of 100**. Experience implements it. Visibility measures it. Brand, Insight, and Automation must not break it.

Stack context (Astro 7, Svelte 5, Tailwind v4) stays in `astro_patterns.md`. This file is only the score.

## What "100" means

Lighthouse Performance is a weighted lab score, not the field Core Web Vitals pass/fail. Chrome still documents the **Lighthouse 10** weights:

| Metric | Weight | Role |
|---|---|---|
| Total Blocking Time (TBT) | 30% | Lab stand-in for responsiveness. Field metric is **INP**. |
| Largest Contentful Paint (LCP) | 25% | Core Web Vital |
| Cumulative Layout Shift (CLS) | 25% | Core Web Vital |
| First Contentful Paint (FCP) | 10% | |
| Speed Index | 10% | |

The green "good" band is a score of **90–100**. The usual CWV cuts (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) sit near a **metric score of 90**. They do not produce a Performance score of 100. Chrome's own scoring note: an LCP of about **1,220 ms** maps to a metric score of **99**.

Build targets for a mobile lab score of 100 (PSI mobile is the gate; it throttles CPU and network):

| Metric | Target on the mobile lab run |
|---|---|
| TBT | **0 ms**. Any long task costs the 30% weight. |
| CLS | **0** |
| LCP | **≤ ~1.2 s** (about 1,220 ms is a 99, not a comfortable 100) |
| FCP, Speed Index | Follow LCP when the hero is the first paint and nothing blocks it |

Field data (CrUX, 28 days, 75th percentile) is not a number out of 100. Production target: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, overall category **FAST**. Never report field data as "100".

A single run moves. Call it 100 only after **two** mobile PSI runs agree. Desktop is checked second. Extensions, consent-less tags, and ads will drop a clean build; the lab run must be the page users get before those tags.

`pagespeed-audit` prints this bar: Performance **100**, SEO / accessibility / best-practices **90+**.

## LCP (25%)

One LCP element. It is either the hero image or the H1, and the hero is an `.astro` component, never a hydrated island.

- Source file in `src/assets/`. Render with `astro:assets` `<Image>` or `<Picture>`.
- `loading="eager"` and `fetchpriority="high"` on that image only. `loading="lazy"` on the LCP image fails the audit.
- `sizes` matches the layout (`100vw` for a full-bleed hero). Include a mobile width (640 or smaller) so the phone does not download the desktop file.
- Transferred mobile candidate **≤ 100 KB** (AVIF or WebP). A 4K master is the archive. The page uses the responsive derivatives.
- Do not paint the LCP as a CSS `background-image`. It will not get the preload Astro attaches to `<Image>`.
- Do not add a second `<link rel="preload">` for a different URL than the one `<Image>` emits. That downloads the hero twice.
- No render-blocking third-party CSS. Tailwind ships in the Astro CSS bundle.
- The hero is static HTML. `client:load` above the fold delays LCP when the LCP node sits inside the island.
- Static hosting. A cold SSR render of the whole landing page spends the LCP budget on TTFB.

## TBT and INP (TBT is 30% of the lab score)

TBT must be **0 ms** on the lab run. That means no main-thread task longer than 50 ms between FCP and the end of the trace.

- Default: **zero hydrated islands**. CSS, then a tiny inline `<script>`, then `client:visible` only if the control cannot exist otherwise. `client:load` is not used on a page that is aiming at 100.
- The existing JS budget still applies: total client JS **≤ 50 KiB**, islands **< 3**. A page that uses that whole budget will usually miss TBT 0. Prefer empty `islands_used`.
- No date library, carousel runtime, or animation framework.
- Marketing tags are not in the first HTML. See the Insight rules below. Partytown does not make a tag free; the page still downloads it.
- Menu, accordion, and countdown scripts do not interleave layout reads and writes.

Field INP stays ≤ 200 ms when the main thread is idle at load and submit handlers stay small. A lab TBT of 0 with a slow INP means a later script (tag, chat, island) is the cause.

## CLS (25%)

CLS must be **0**.

- Every `<img>`, video, iframe, and embed has `width` and `height`, or a CSS `aspect-ratio`, before paint.
- At most **two** font files on the first view (one heading weight, one body weight), self-hosted `woff2`, subset to Latin and Latin Extended (`lang="id"` needs Latin Extended). Preload only the file the hero actually uses.
- `font-display: swap` without a metric-matched fallback shifts the H1 and fails CLS. Match the fallback with `size-adjust` / `ascent-override`, or use the installed Astro Fonts API when that version's docs describe it. `font-display: optional` is allowed when the fallback is on-brand.
- Do not pull `fonts.googleapis.com` or `fonts.gstatic.com`. That is a render-blocking chain and a CLS source.
- Cookie notice, chat, and promo bars do not push the hero. Pin them to a corner, or reserve their space in the first HTML.
- Motion uses `transform` and `opacity` only.

## FCP and Speed Index (10% each)

- One CSS file from the Astro build. No extra blocking stylesheet.
- Hero is the first visual. No JS slider, no fade-in that starts at `opacity: 0` (that delays LCP and Speed Index).
- HTML stays small. Do not inline a large JSON blob or a base64 hero.
- Self-host fonts so the document does not preconnect to a font CDN. Extra preconnects compete with the hero.

## Who protects the score

| Architect | Rule |
|---|---|
| **Experience** | Implements this file. Records PSI mobile Performance in `build_verification.notes` when a URL or preview exists. |
| **Visibility** | Runs `pagespeed-audit` mobile, then desktop. Performance under 100 is a failed audit. Map each failing audit id to a fix in this file. |
| **Brand** | Hero prompt must be croppable to 16:9 and deliverable at ≤ 100 KB on mobile. At most two families. No Google Fonts stylesheet. |
| **Insight** | GTM, GA4, Meta, TikTok, heatmaps, and chat load **after consent and after `load`**. Nothing in `<head>` that executes during the LCP window. List origins for CSP, but do not add them as parser-blocking scripts. |
| **Automation** | No Google Forms iframe, no CRM embed, no chat widget in the first view. Native form or a `wa.me` link. |

## Verify

1. `bun run build`.
2. `bun <skill>/scripts/pagespeed-audit.ts` with `--strategy mobile`, then `desktop`.
3. Mobile Performance is **100** on two runs. Desktop Performance is **100**. Other categories are **90+**.
4. Write the lab LCP, TBT, and CLS into `experience_state.json` → `build_verification.notes`.
5. If CrUX exists, the field category is **FAST**. A lab 100 with a poor field score means the lab missed a real-user script or device. Fix that cause. Do not average it away.

## Fixes that miss 100

- Lazy-loading the hero, or preloading a different hero URL than the `<img>` `src`.
- A hydrated island on the hero (`client:load` / `client:visible` on the LCP component).
- GTM or a pixel in `<head>` before consent.
- A Google Fonts `<link>`.
- An iframe form, map, or video in the first viewport without a sized box.
- A cookie bar inserted above the hero after paint.
- Shipping the 4K master to mobile.
- Treating LCP 2.5 s / CLS 0.1 / INP 200 ms as "the 100". That is the good band, about a 90.
