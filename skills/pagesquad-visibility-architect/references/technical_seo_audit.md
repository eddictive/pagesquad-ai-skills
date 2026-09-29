# Technical SEO & Performance Audit Guide

A workflow for auditing page speed, technical health, and performance metrics.

## 1. PageSpeed Insights (PSI) Audit
Analyze performance using [PageSpeed Insights](https://pagespeed.web.dev/).

### Critical Metrics (Core Web Vitals)
- **LCP (Largest Contentful Paint)**: Measure the time it takes for the largest image or text block to become visible.
    - *Fixes*: Optimize image size, implement lazy loading, use a CDN.
- **INP (Interaction to Next Paint)**: Measure the latency of all user interactions.
    - *Fixes*: Reduce JavaScript execution time, break up long tasks.
- **CLS (Cumulative Layout Shift)**: Measure visual stability.
    - *Fixes*: Set dimensions on images/iframes, avoid inserting content above existing content.

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
3. **Implement**: Collaborate with `page-builder` to apply code changes.
4. **Validate**: Re-run audits to confirm improvements.
