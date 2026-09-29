#!/usr/bin/env python3

"""
PageSpeed Audit Utility (Python)
Helps the Visibility Architect audit core web vitals and SEO performance.

Usage: PAGESPEED_API_KEY=<your_api_key> python pagespeed-audit.py <url> [strategy: mobile|desktop]

Note for AI Agents: If the API key is missing, ask the user to provide it or check the .env file.
"""

import sys
import os
import urllib.request
import urllib.parse
import json

# Remediation guide: audit id -> concise, actionable fix instruction.
FIXES = {
    # Accessibility
    "color-contrast": "Ensure text/background contrast >= 4.5:1 (3:1 for large text). Darken light-gray text (e.g. #a4a4a4 -> #767676) and avoid white text on light backgrounds. Verify with a WCAG contrast checker.",
    "link-name": "Add accessible names to icon/image-only links: aria-label=\"Facebook Nakhla Tour\" or visually-hidden text inside the <a>.",
    "heading-order": "Do not skip heading levels. Wrap page content in one H1, then H2 > H3 > H4 in order; use CSS classes for visual sizing instead of jumping tags.",
    "link-in-text-block": "Make inline links distinguishable: add underline, bold weight, or >= 3:1 color contrast versus surrounding text.",
    "image-aspect-ratio": "Set width/height attributes on <img> matching the intrinsic aspect ratio, or CSS aspect-ratio, so the browser reserves correct space.",
    "unsized-images": "Add explicit width and height attributes (or CSS aspect-ratio) to every <img> to prevent layout shifts.",
    "button-name": "Add aria-label or inner text to icon-only buttons.",
    "document-title": "Add a descriptive <title> to the page.",
    "html-has-lang": "Set lang attribute on <html> (e.g. lang=\"id\").",
    "tap-targets": "Make touch targets at least 48x48 CSS px with 8px spacing between them.",
    # Performance diagnostics
    "image-delivery-insight": "Serve images in WebP/AVIF, right-sized to display dimensions (srcset/sizes), compressed, and lazy-loaded below the fold. If behind Cloudflare, enable Polish + WebP.",
    "cache-insight": "Serve versioned static assets (/assets/*) with Cache-Control: public, max-age=31536000, immutable.",
    "unused-javascript": "Remove or defer unused JS: code-split bundles, tree-shake, or dynamically import non-critical modules (carousels, modals).",
    "unused-css-rules": "Purge unused CSS rules per page or remove blocking stylesheets not used above the fold.",
    "render-blocking-insight": "Inline critical CSS in <head> and defer the rest (media=\"print\" onload pattern), or reduce blocking stylesheet count.",
    "render-blocking-resources": "Inline critical CSS; defer non-critical stylesheets and scripts (defer/async).",
    "font-display-insight": "Add font-display: swap to @font-face declarations and preload primary font files.",
    "font-display": "Add font-display: swap (or optional) to @font-face rules.",
    "legacy-javascript-insight": "Raise the JS build target (drop ES5 polyfills/transforms for modern browsers), or serve legacy bundles only via nomodule.",
    "legacy-javascript": "Update build targets to ES2017+ and split legacy bundles behind nomodule.",
    "forced-reflow-insight": "Batch DOM reads before writes; avoid repeated style reads interleaved with style writes (layout thrashing).",
    "network-dependency-tree-insight": "Shorten the critical request chain: preconnect to third-party origins, self-host critical fonts/CSS, combine small files.",
    "third-party-summary": "Audit third-party scripts; defer non-essential ones and remove duplicates.",
    "modern-image-formats": "Convert JPEG/PNG to WebP or AVIF (<picture> element or CDN auto-negotiation).",
    "uses-optimized-images": "Compress images (lossy quality ~80) before upload or via CDN transforms.",
    "offscreen-images": "Add loading=\"lazy\" to below-the-fold images; never lazy-load the LCP/hero image.",
    "uses-responsive-images": "Provide multiple sizes via srcset + sizes so mobile devices do not download desktop-sized images.",
    "uses-long-cache-ttl": "Add long Cache-Control max-age with immutable to fingerprinted static assets.",
    "prioritize-lcp-image": "Preload the LCP image: <link rel=\"preload\" as=\"image\" fetchpriority=\"high\"> and avoid lazy-loading it.",
    "uses-rel-preconnect": "Add <link rel=\"preconnect\"> for critical third-party origins (CDN, font hosts).",
    "redirects": "Eliminate redirect chains; link directly to the final URL.",
    "total-byte-weight": "Reduce page weight: smaller images, fewer fonts, trim payloads.",
    "duplicated-javascript": "Dedupe shared modules into a common chunk instead of bundling them per-page.",
    # Best practices
    "errors-in-console": "Fix runtime errors reported in the browser console.",
    "no-vulnerable-libraries": "Upgrade JS dependencies with known CVEs.",
    "csp-xss": "Add a Content-Security-Policy header to mitigate XSS.",
}

def parse_args(argv):
    """Parse args: supports flags (--url X, --strategy=Y) and legacy positional args."""
    usage = (
        "Usage: python pagespeed-audit.py [--url <url>] [--strategy mobile|desktop]\n"
        "Also accepted positionally: python pagespeed-audit.py <url> [strategy]"
    )
    opts = {"url": None, "strategy": None}
    positional = []
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--url":
            i += 1
            opts["url"] = argv[i] if i < len(argv) else None
        elif arg.startswith("--url="):
            opts["url"] = arg[len("--url="):]
        elif arg == "--strategy":
            i += 1
            opts["strategy"] = argv[i] if i < len(argv) else None
        elif arg.startswith("--strategy="):
            opts["strategy"] = arg[len("--strategy="):]
        elif arg in ("-h", "--help"):
            print(usage)
            sys.exit(0)
        elif arg.startswith("-"):
            print(f"Unknown option: {arg}\n{usage}", file=sys.stderr)
            sys.exit(1)
        else:
            positional.append(arg)
        i += 1
    if not opts["url"] and positional:
        opts["url"] = positional[0]
    if not opts["strategy"] and len(positional) > 1:
        opts["strategy"] = positional[1]
    strategy = (opts["strategy"] or "mobile").lower()
    if strategy not in ("mobile", "desktop"):
        print(f"Invalid strategy: {strategy} (must be 'mobile' or 'desktop')", file=sys.stderr)
        sys.exit(1)
    return opts["url"], strategy


def main():
    url, strategy = parse_args(sys.argv[1:])

    if not url:
        print("Usage: PAGESPEED_API_KEY=<key> python pagespeed-audit.py [--url <url>] [--strategy mobile|desktop]")
        print("Example: PAGESPEED_API_KEY=AIzaSy... python pagespeed-audit.py --url https://example.com --strategy desktop")
        sys.exit(1)

    api_key = os.environ.get("PAGESPEED_API_KEY")
    if not api_key:
        print("Error: PAGESPEED_API_KEY environment variable is missing.", file=sys.stderr)
        print("Agent Action Required: Please ask the user to provide their Google PageSpeed API key, or read it from a .env file, then rerun the command with the key.", file=sys.stderr)
        sys.exit(1)

    api_url = (
        f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
        f"?url={urllib.parse.quote(url)}"
        f"&strategy={strategy.upper()}"
        f"&category=performance&category=seo&category=accessibility&category=best-practices"
        f"&key={api_key}"
    )

    print(f"Auditing {url} ({strategy} strategy)...")

    try:
        with urllib.request.urlopen(api_url) as response:
            data = response.read()
            result = json.loads(data)

            if "error" in result:
                print(f"Error from API: {result['error']['message']}")
                sys.exit(1)

            categories = result["lighthouseResult"]["categories"]
            audits = result["lighthouseResult"]["audits"]

            def cat_score(cat_id):
                cat = categories.get(cat_id)
                if cat and cat.get("score") is not None:
                    return round(cat["score"] * 100)
                return None

            perf_score = cat_score("performance")
            seo_score = cat_score("seo")
            a11y_score = cat_score("accessibility")
            bp_score = cat_score("best-practices")

            print("\n--- PageSpeed Insights Report (Python) ---")
            print(f"URL: {url}")
            print(f"Strategy: {strategy}")
            print(f"Performance Score: {perf_score}  (target: 90+)")
            print(f"SEO Score: {seo_score}  (target: 90+)")
            if a11y_score is not None:
                print(f"Accessibility Score: {a11y_score}  (target: 90+)")
            if bp_score is not None:
                print(f"Best Practices Score: {bp_score}  (target: 90+)")

            # CrUX field data (real-user Core Web Vitals, 28-day window)
            le_metrics = (result.get("loadingExperience") or {}).get("metrics") or {}
            if le_metrics:
                overall = result["loadingExperience"].get("overall_category", "n/a")
                print(f"\nCore Web Vitals (Field Data, {overall}):")
                for mid, m in le_metrics.items():
                    print(f"- {mid}: {m['percentile']} ({m['category']})")
            else:
                print("\nCore Web Vitals (Field Data): no CrUX data (traffic below threshold) — relying on lab data below")

            print("\nKey Metrics (Lab):")

            def metrics_val(aid):
                return (audits.get(aid) or {}).get("displayValue") or "n/a"

            print(f"- First Contentful Paint: {metrics_val('first-contentful-paint')}")
            print(f"- Largest Contentful Paint: {metrics_val('largest-contentful-paint')}")
            print(f"- Cumulative Layout Shift: {metrics_val('cumulative-layout-shift')}")
            print(f"- Total Blocking Time: {metrics_val('total-blocking-time')}")
            print(f"- Speed Index: {metrics_val('speed-index')}")

            # Failing audits (score < 0.9) across all categories
            EXCLUDE = {
                "metrics", "screenshot-thumbnails", "final-screenshot", "timing",
                "network-requests", "network-rtt", "network-server-latency",
                "diagnostics", "debug-data", "stacks", "errors-in-console",
                "worker-timing", "lcp-lazy-loaded", "prioritize-lcp-image",
                "uses-rel-preconnect", "third-party-summary",
                "first-contentful-paint", "largest-contentful-paint",
                "cumulative-layout-shift", "total-blocking-time", "speed-index",
                "interactive",
            }
            weighted_ids = {
                ref["id"]
                for cat in categories.values()
                for ref in cat.get("auditRefs", [])
                if ref.get("weight", 0) > 0
            }
            failing = []
            for aid, audit in audits.items():
                score = audit.get("score")
                if score is None or score >= 0.9 or aid in EXCLUDE:
                    continue
                failing.append({
                    "id": aid,
                    "score": score,
                    "displayValue": audit.get("displayValue", ""),
                    "weighted": aid in weighted_ids,
                })
            failing.sort(key=lambda f: f["score"])
            if failing:
                print("\nFailing Audits (score < 0.9):")
                for f in failing[:15]:
                    tag = " [core-weighted]" if f["weighted"] else ""
                    print(f"- {f['id']}: {f['displayValue'] or 'failed'}{tag}")
                    fix = FIXES.get(f["id"])
                    if fix:
                        print(f"  -> Fix: {fix}")

            # Savings opportunities (bytes/ms estimates)
            SAVINGS = [
                "unused-javascript", "unused-css-rules", "render-blocking-resources",
                "modern-image-formats", "uses-optimized-images", "offscreen-images",
                "uses-responsive-images", "uses-long-cache-ttl", "legacy-javascript",
                "duplicated-javascript", "font-display",
            ]
            opportunities = [
                audits[sid] for sid in SAVINGS
                if sid in audits and audits[sid].get("score") is not None and audits[sid]["score"] < 1
            ]
            opportunities.sort(key=lambda a: a["score"])
            if opportunities:
                print("\nSavings Opportunities:")
                for o in opportunities:
                    print(f"- {o['id']}: {o.get('displayValue') or 'see report'}")
                    fix = FIXES.get(o["id"])
                    if fix:
                        print(f"  -> Fix: {fix}")
            print("------------------------------------------\n")

            scores = [s for s in (perf_score, seo_score, a11y_score, bp_score) if s is not None]
            if any(s < 90 for s in scores):
                weak = sum(1 for s in scores if s < 90)
                plural = "y is" if weak == 1 else "ies are"
                print(f"Action Item: {weak} categor{plural} below the 90 target. Advise the Experience Architect to prioritize the failing audits above.")
            else:
                print("Status: All category scores meet the 90+ target. Visibility targets met.")

    except urllib.error.URLError as e:
        print(f"Request failed: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"Audit failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
