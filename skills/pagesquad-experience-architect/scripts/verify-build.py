#!/usr/bin/env python3

"""
Build Verification Utility (Python)
Helps the Experience Architect verify pipeline output deterministically.

What it checks (mirrors SKILL.md execution assertions):
  1. Build completes without errors (unless --skip-build).
  2. Total client-side JS in dist/ stays under the budget (default 50 KiB).
  3. Framework island count stays under the max (default 3).
  4. <img> tags in .astro sources have explicit width/height.

Usage:
  python verify-build.py [--src <dir>] [--dist <dir>] [--budget 50] [--max-islands 3] [--skip-build]

Note for AI Agents: run this after generating pages/components and record the
result in experience_state.json -> build_verification.
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path


def walk_files(root, exts):
    root = Path(root)
    if not root.exists():
        return []
    return [p for p in root.rglob("*") if p.is_file() and p.suffix in exts]


def main():
    parser = argparse.ArgumentParser(description="Verify Experience Architect build output.")
    parser.add_argument("--src", default="src")
    parser.add_argument("--dist", default="dist")
    parser.add_argument("--budget", type=int, default=50, help="client JS budget in KiB")
    parser.add_argument("--max-islands", type=int, default=3)
    parser.add_argument("--skip-build", action="store_true")
    args = parser.parse_args()

    checks = []
    passed = True

    def check(name, ok, detail):
        nonlocal passed
        checks.append((name, ok, detail))
        if not ok:
            passed = False

    # 1. Build
    if args.skip_build:
        checks.append(("build", True, "skipped (--skip-build)"))
    else:
        if not Path("package.json").exists():
            print("Error: no package.json in cwd. Run from the project root or pass --skip-build.", file=sys.stderr)
            sys.exit(1)
        runner = "bun run build" if (Path("bun.lockb").exists() or Path("bun.lock").exists()) else "npm run build"
        try:
            result = subprocess.run(runner, shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                check("build", False, f"{runner} failed (exit {result.returncode})")
                if result.stdout:
                    print(result.stdout)
                if result.stderr:
                    print(result.stderr, file=sys.stderr)
                finish(checks, passed)
            checks.append(("build", True, f"{runner} exited 0"))
        except Exception as e:
            check("build", False, f"{runner} failed: {e}")
            finish(checks, passed)

    # 2. Client JS budget
    js_files = walk_files(args.dist, [".js"])
    total_js = sum(f.stat().st_size for f in js_files)
    if not js_files:
        check("js_budget", True, "no JS files in dist (perfect static build)")
    else:
        check("js_budget", total_js <= args.budget * 1024,
              f"total client JS {total_js/1024:.1f} KiB across {len(js_files)} files (budget {args.budget} KiB)")
        largest = max(js_files, key=lambda f: f.stat().st_size)
        checks.append(("largest_bundle", True, f"{largest.name} = {largest.stat().st_size/1024:.1f} KiB"))

    # 3. Island count
    src_files = walk_files(args.src, [".astro", ".tsx", ".jsx", ".svelte", ".vue"])
    directive_re = re.compile(r"\bclient:(?:load|visible|idle|only|media)\b")
    islands = 0
    island_detail = []
    for f in src_files:
        matches = directive_re.findall(f.read_text(encoding="utf-8", errors="ignore"))
        if matches:
            islands += len(matches)
            island_detail.append(f"{f.relative_to(args.src)}: {', '.join(matches)}")
    detail = f"{islands} framework island(s) across {len(src_files)} source files (max {args.max_islands})"
    if island_detail:
        detail += "\n      " + "\n      ".join(island_detail)
    check("island_count", islands <= args.max_islands, detail)

    # 4. Image dimensions
    img_re = re.compile(r"<img\b[^>]*>")
    unsized = []
    for f in (p for p in src_files if p.suffix == ".astro"):
        content = f.read_text(encoding="utf-8", errors="ignore")
        for tag in img_re.findall(content):
            if not re.search(r"\b(width|aspect-ratio)\b", tag) and "astro:assets" not in tag:
                unsized.append(f"{f.relative_to(args.src)}: {tag[:80]}")
    check("image_dimensions", not unsized,
          "all raw <img> tags declare width/height" if not unsized
          else f"{len(unsized)} <img> tag(s) without width/height:\n      " + "\n      ".join(unsized))

    finish(checks, passed)


def finish(checks, passed):
    print("\n--- Build Verification Report (Python) ---")
    for name, ok, detail in checks:
        print(f"{'PASS' if ok else 'FAIL'}  {name}: {detail}")
    print("------------------------------------------")
    if passed:
        print("Status: All checks passed. Record this in experience_state.json -> build_verification.")
    else:
        print("Status: FAILED — fix the items above before handing off to the Automation Architect.")
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
