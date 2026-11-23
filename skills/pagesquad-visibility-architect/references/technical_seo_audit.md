# Technical SEO & Performance Audit Guide

A workflow for auditing page speed, technical health, and performance metrics.

## 1. PageSpeed Insights (PSI) Audit

Run `bun <skill>/scripts/pagespeed-audit.ts` (mobile, then desktop) or [PageSpeed Insights](https://pagespeed.web.dev/). The runtime is Bun.

Pass bar: **Performance 100** on mobile (two runs) and desktop. SEO, accessibility, and best-practices stay at 90+. Field CrUX must be **FAST** when it exists. Do not treat LCP 2.5 s / INP 200 ms / CLS 0.1 as a 100.

The fix map is `../../pagesquad-experience-architect/references/core_web_vitals.md`. Hand failing audit ids to the Experience Architect. Do not lazy-load the LCP image.

## 2. Technical Health Checklist
- [ ] **HTTPS**: Is the site secure?
- [ ] **Robots.txt**: Is it present and correctly configured?
- [ ] **XML Sitemap**: Is it submitted to GSC and referenced in robots.txt?
- [ ] **Canonical Tags**: Are they pointing to the correct version of the page?
- [ ] **Broken Links**: Run a 404 check and fix or redirect.
- [ ] **Redirect Chains**: Ensure redirects are direct (A -> B, not A -> B -> C).
- [ ] **Alt Text**: Do all images have descriptive Alt text?
- [ ] **Semantic Markup**: Are H1-H6 tags used in a logical order?

## 3. Structured Data (Schema.org) Audit
- [ ] Use the [Rich Results Test](https://search.google.com/test/rich-results) to validate JSON-LD.
- [ ] Ensure `Organization` schema is on the home page.
- [ ] Ensure `BreadcrumbList` is implemented for deep pages.
- [ ] Implement `FAQPage` for FAQ sections to earn rich snippets.

## 4. Mobile Optimization
- [ ] Check for viewport meta tag.
- [ ] Ensure touch elements are not too close together.
- [ ] Verify that font sizes are legible without zooming.

## Performance Optimization Workflow
1. **Audit**: Run PSI and Yoast Checker.
2. **Prioritize**: Focus on LCP and CLS first (highest impact).
3. **Implement**: Hand the failing audit ids to the Experience Architect. Brand and Insight change assets and tags only as `core_web_vitals.md` allows.
4. **Validate**: Re-run audits to confirm improvements.
