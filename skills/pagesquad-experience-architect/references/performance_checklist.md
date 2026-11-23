# Web Performance & SEO Checklist

Score rules live in `core_web_vitals.md` (Lighthouse Performance **100**). This file is the short gate plus on-page SEO and accessibility.

## Performance gate

- [ ] Mobile PSI Performance is 100 on two runs. Desktop Performance is 100. See `core_web_vitals.md`.
- [ ] Hero is an `astro:assets` image, eager, `fetchpriority="high"`, mobile file ≤ 100 KB. Not lazy. Not a CSS background.
- [ ] TBT is 0 ms. No tag, chat, or hydrated island in the first HTML unless the Island Decision Tree requires it.
- [ ] CLS is 0. Media has width and height. At most two self-hosted woff2 files. No `fonts.googleapis.com`.
- [ ] Fingerprinted assets use a long `Cache-Control` (`public, max-age=31536000, immutable`) at the CDN.

## SEO & Accessibility (A11y)

### 1. On-Page SEO
- [ ] Unique `title` (under 60 chars) and `meta description` (under 160 chars).
- [ ] Canonical tag to prevent duplicate content.
- [ ] OpenGraph (`og:image`, `og:title`) for social previews.
- [ ] Schema.org JSON-LD (e.g., `Product`, `Organization`, `FAQ`).

### 2. Accessibility
- [ ] Color contrast ratio >= 4.5:1 for text.
- [ ] All images have `alt` text.
- [ ] Descriptive link text (Avoid "Click Here").
- [ ] Keyboard navigable (Focus states).
