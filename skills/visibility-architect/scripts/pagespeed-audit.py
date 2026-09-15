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

    api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={urllib.parse.quote(url)}&strategy={strategy.upper()}&category=performance&category=seo&key={api_key}"

    print(f"Auditing {url} ({strategy} strategy)...")

    try:
        with urllib.request.urlopen(api_url) as response:
            data = response.read()
            result = json.loads(data)

            if "error" in result:
                print(f"Error from API: {result['error']['message']}")
                sys.exit(1)

            perf_score = int(result["lighthouseResult"]["categories"]["performance"]["score"] * 100)
            seo_score = int(result["lighthouseResult"]["categories"]["seo"]["score"] * 100)

            print("\n--- PageSpeed Insights Report (Python) ---")
            print(f"URL: {url}")
            print(f"Strategy: {strategy}")
            print(f"Performance Score: {perf_score}")
            print(f"SEO Score: {seo_score}")

            print("\nKey Metrics:")
            metrics = result["lighthouseResult"]["audits"]
            print(f"- First Contentful Paint: {metrics['first-contentful-paint']['displayValue']}")
            print(f"- Largest Contentful Paint: {metrics['largest-contentful-paint']['displayValue']}")
            print(f"- Cumulative Layout Shift: {metrics['cumulative-layout-shift']['displayValue']}")
            print(f"- Total Blocking Time: {metrics['total-blocking-time']['displayValue']}")
            print("------------------------------------------\n")

            if perf_score < 90 or seo_score < 90:
                print("Action Item: Target score is 90+. Advise the Experience Architect to optimize assets and restructure DOM.")
            else:
                print("Status: Excellent performance. Visibility targets met.")

    except urllib.error.URLError as e:
        print(f"Request failed: {e.reason}")
        sys.exit(1)
    except Exception as e:
        print(f"Audit failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
