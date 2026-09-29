#!/usr/bin/env node

/**
 * Build Verification Utility (Node.js)
 * Helps the Experience Architect verify pipeline output deterministically.
 *
 * What it checks (mirrors SKILL.md execution assertions):
 *   1. Build completes without errors (unless --skip-build).
 *   2. Total client-side JS in dist/ stays under the budget (default 50 KiB).
 *   3. Framework island count stays under the max (default 3).
 *   4. <img> tags in .astro sources have explicit width/height.
 *
 * Usage:
 *   node verify-build.js [--src <dir>] [--dist <dir>] [--budget 50] [--max-islands 3] [--skip-build]
 *
 * Note for AI Agents: run this after generating pages/components and record the
 * result in experience_state.json -> build_verification.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const USAGE = 'Usage: node verify-build.js [--src <dir>] [--dist <dir>] [--budget 50] [--max-islands 3] [--skip-build]';

function parseArgs(argv) {
  const opts = { src: 'src', dist: 'dist', budget: 50, maxIslands: 3, skipBuild: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--src': opts.src = argv[++i]; break;
      case '--dist': opts.dist = argv[++i]; break;
      case '--budget': opts.budget = Number(argv[++i]); break;
      case '--max-islands': opts.maxIslands = Number(argv[++i]); break;
      case '--skip-build': opts.skipBuild = true; break;
      case '-h': case '--help': console.log(USAGE); process.exit(0);
      default:
        if (arg.startsWith('--src=')) opts.src = arg.slice(6);
        else if (arg.startsWith('--dist=')) opts.dist = arg.slice(7);
        else if (arg.startsWith('--budget=')) opts.budget = Number(arg.slice(9));
        else if (arg.startsWith('--max-islands=')) opts.maxIslands = Number(arg.slice(13));
        else { console.error(`Unknown option: ${arg}\n${USAGE}`); process.exit(1); }
    }
  }
  return opts;
}

function walk(dir, exts, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, exts, acc);
    else if (exts.some(e => entry.name.endsWith(e))) acc.push(full);
  }
  return acc;
}

const kb = (bytes) => (bytes / 1024).toFixed(1);

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const report = { passed: true, checks: [] };
  const check = (name, ok, detail) => {
    report.checks.push({ name, ok, detail });
    if (!ok) report.passed = false;
  };

  // 1. Build
  if (opts.skipBuild) {
    report.checks.push({ name: 'build', ok: true, detail: 'skipped (--skip-build)' });
  } else {
    if (!fs.existsSync('package.json')) {
      console.error('Error: no package.json in cwd. Run from the project root or pass --skip-build.');
      process.exit(1);
    }
    const runner = fs.existsSync('bun.lockb') || fs.existsSync('bun.lock') ? 'bun run build' : 'npm run build';
    try {
      const out = execSync(runner, { stdio: 'pipe', encoding: 'utf8' });
      report.checks.push({ name: 'build', ok: true, detail: `${runner} exited 0` });
      if (out.trim()) console.log(out.trim().split('\n').slice(-5).join('\n'));
    } catch (err) {
      report.checks.push({ name: 'build', ok: false, detail: `${runner} failed` });
      if (err.stdout) console.log(err.stdout);
      if (err.stderr) console.error(err.stderr);
      finish(report);
    }
  }

  // 2. Client JS budget
  const jsFiles = walk(opts.dist, ['.js']);
  const totalJs = jsFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  if (jsFiles.length === 0) {
    check('js_budget', true, 'no JS files in dist (perfect static build)');
  } else {
    const ok = totalJs <= opts.budget * 1024;
    check('js_budget', ok,
      `total client JS ${kb(totalJs)} KiB across ${jsFiles.length} files (budget ${opts.budget} KiB)`);
    const largest = jsFiles.map(f => ({ f, s: fs.statSync(f).size })).sort((a, b) => b.s - a.s)[0];
    if (largest) report.checks.push({ name: 'largest_bundle', ok: true, detail: `${path.basename(largest.f)} = ${kb(largest.s)} KiB` });
  }

  // 3. Island count
  const astroFiles = walk(opts.src, ['.astro', '.tsx', '.jsx', '.svelte', '.vue']);
  const directiveRe = /\bclient:(load|visible|idle|only|media)\b/g;
  let islands = 0;
  const islandDetail = [];
  for (const f of astroFiles) {
    const content = fs.readFileSync(f, 'utf8');
    const matches = content.match(directiveRe) || [];
    if (matches.length > 0) {
      islands += matches.length;
      islandDetail.push(`${path.relative(opts.src, f)}: ${matches.join(', ')}`);
    }
  }
  check('island_count', islands <= opts.maxIslands,
    `${islands} framework island(s) across ${astroFiles.length} source files (max ${opts.maxIslands})${islandDetail.length ? '\n      ' + islandDetail.join('\n      ') : ''}`);

  // 4. Image dimensions
  const unsized = [];
  for (const f of astroFiles.filter(f => f.endsWith('.astro'))) {
    const content = fs.readFileSync(f, 'utf8');
    const imgRe = /<img\b[^>]*>/g;
    for (const tag of content.match(imgRe) || []) {
      if (!/\b(width|aspect-ratio)\b/.test(tag) && !/astro:assets/.test(tag)) unsized.push(`${path.relative(opts.src, f)}: ${tag.slice(0, 80)}`);
    }
  }
  check('image_dimensions', unsized.length === 0,
    unsized.length === 0
      ? 'all raw <img> tags declare width/height'
      : `${unsized.length} <img> tag(s) without width/height:\n      ${unsized.join('\n      ')}`);

  finish(report);
}

function finish(report) {
  console.log('\n--- Build Verification Report ---');
  for (const c of report.checks) {
    console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}: ${c.detail}`);
  }
  console.log('---------------------------------');
  console.log(report.passed ? 'Status: All checks passed. Record this in experience_state.json -> build_verification.' : 'Status: FAILED — fix the items above before handing off to the Automation Architect.');
  process.exit(report.passed ? 0 : 1);
}

main();
