# Web Performance & SEO Checklist

Every landing page must be fast and findable.

## Performance Checklist

### 1. Image Optimization
- [ ] Use `WebP` or `AVIF` formats.
- [ ] Set explicit `width` and `height` to prevent Layout Shift (CLS).
- [ ] Lazy load images below the fold (`loading="lazy"`).
- [ ] Use `<picture>` or `srcset` for responsive images.

### 2. JavaScript & Critical Path
- [ ] Minimize "Heavy" libraries.
- [ ] Use Astro Islands to ship zero JS by default.
- [ ] Defer non-critical scripts (Tracking, Chatbots).
- [ ] Inline critical CSS for the Hero section.

### 3. Caching & Delivery
- [ ] Use a CDN (Cloudflare, Vercel Edge).
- [ ] Configure `Cache-Control` headers for static assets.

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
