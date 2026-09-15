#!/usr/bin/env bun

/**
 * PageSpeed Audit Utility (Bun)
 * Helps the Visibility Architect audit core web vitals and SEO performance.
 * 
 * Usage: PAGESPEED_API_KEY=<your_api_key> bun pagespeed-audit.ts <url> [strategy: mobile|desktop]
 * 
 * Note for AI Agents: If the API key is missing, ask the user to provide it or check the .env file.
 */

const apiKey = process.env.PAGESPEED_API_KEY;

// Parse args: supports flags (--url X, --strategy=Y) and legacy positional args.
const USAGE = 'Usage: bun pagespeed-audit.ts [--url <url>] [--strategy mobile|desktop]\nAlso accepted positionally: bun pagespeed-audit.ts <url> [strategy]';

function parseArgs(argv: string[]): { url: string | null; strategy: string } {
  const opts: { url: string | null; strategy: string | null } = { url: null, strategy: null };
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--url') {
      opts.url = argv[++i] ?? null;
    } else if (arg.startsWith('--url=')) {
      opts.url = arg.slice('--url='.length);
    } else if (arg === '--strategy') {
      opts.strategy = argv[++i] ?? null;
    } else if (arg.startsWith('--strategy=')) {
      opts.strategy = arg.slice('--strategy='.length);
    } else if (arg === '-h' || arg === '--help') {
      console.log(USAGE);
      process.exit(0);
    } else if (arg.startsWith('-')) {
      console.error(`Unknown option: ${arg}\n${USAGE}`);
      process.exit(1);
    } else {
      positional.push(arg);
    }
  }
  if (!opts.url && positional.length > 0) opts.url = positional[0]!;
  if (!opts.strategy && positional.length > 1) opts.strategy = positional[1]!;
  const strategy = (opts.strategy || 'mobile').toLowerCase();
  if (!['mobile', 'desktop'].includes(strategy)) {
    console.error(`Invalid strategy: ${strategy} (must be 'mobile' or 'desktop')`);
    process.exit(1);
  }
  return { url: opts.url, strategy };
}

const { url, strategy } = parseArgs(process.argv.slice(2));

if (!url) {
  console.error(USAGE);
  console.error('Example: PAGESPEED_API_KEY=AIzaSy... bun pagespeed-audit.ts --url https://example.com --strategy desktop');
  process.exit(1);
}

if (!apiKey) {
  console.error('Error: PAGESPEED_API_KEY environment variable is missing.');
  console.error('Agent Action Required: Please ask the user to provide their Google PageSpeed API key, or read it from a .env file, then rerun the command with the key.');
  process.exit(1);
}

const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy.toUpperCase()}&category=performance&category=seo&category=accessibility&category=best-practices&key=${apiKey}`;

console.log(`Auditing ${url} (${strategy} strategy)...`);

try {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    console.error('Error from API:', result.error.message);
    process.exit(1);
  }

  const categories = result.lighthouseResult.categories;
  const audits = result.lighthouseResult.audits;
  const catScore = (id: string): number | null =>
    categories[id] && categories[id].score !== null ? Math.round(categories[id].score * 100) : null;

  const performanceScore = catScore('performance');
  const seoScore = catScore('seo');
  const a11yScore = catScore('accessibility');
  const bpScore = catScore('best-practices');

  console.log('\n--- PageSpeed Insights Report (Bun) ---');
  console.log(`URL: ${url}`);
  console.log(`Strategy: ${strategy}`);
  console.log(`Performance Score: ${performanceScore}  (target: 90+)`);
  console.log(`SEO Score: ${seoScore}  (target: 90+)`);
  if (a11yScore !== null) console.log(`Accessibility Score: ${a11yScore}  (target: 90+)`);
  if (bpScore !== null) console.log(`Best Practices Score: ${bpScore}  (target: 90+)`);

  // CrUX field data (real-user Core Web Vitals, 28-day window)
  const le = result.loadingExperience || {};
  const leMetrics = le.metrics || {};
  if (Object.keys(leMetrics).length > 0) {
    console.log(`\nCore Web Vitals (Field Data, ${le.overall_category || 'n/a'}):`);
    for (const [id, m] of Object.entries(leMetrics)) {
      console.log(`- ${id}: ${m.percentile} (${m.category})`);
    }
  } else {
    console.log('\nCore Web Vitals (Field Data): no CrUX data (traffic below threshold) — relying on lab data below');
  }

  console.log('\nKey Metrics (Lab):');
  console.log(`- First Contentful Paint: ${metricsVal(audits, 'first-contentful-paint')}`);
  console.log(`- Largest Contentful Paint: ${metricsVal(audits, 'largest-contentful-paint')}`);
  console.log(`- Cumulative Layout Shift: ${metricsVal(audits, 'cumulative-layout-shift')}`);
  console.log(`- Total Blocking Time: ${metricsVal(audits, 'total-blocking-time')}`);
  console.log(`- Speed Index: ${metricsVal(audits, 'speed-index')}`);

  // Failing audits (score < 0.9) across all categories, excluding pass-only/informational audits
  const EXCLUDE = new Set(['metrics', 'screenshot-thumbnails', 'final-screenshot', 'timing', 'network-requests', 'network-rtt', 'network-server-latency', 'diagnostics', 'debug-data', 'stacks', 'errors-in-console', 'worker-timing', 'lcp-lazy-loaded', 'prioritize-lcp-image', 'uses-rel-preconnect', 'third-party-summary', 'first-contentful-paint', 'largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'speed-index', 'interactive']);
  const failing: { id: string; score: number; displayValue: string; weighted: boolean }[] = [];
  for (const [id, audit] of Object.entries(audits) as [string, any][]) {
    if (audit.score === null || audit.score === undefined || audit.score >= 0.9 || EXCLUDE.has(id)) continue;
    if (audit.scoreMode !== 'binary' && audit.scoreMode !== 'metricSavings') continue;
    const weighted = Object.values(categories).some((c: any) => c.auditRefs && c.auditRefs.some((r: any) => r.id === id && r.weight > 0));
    failing.push({ id, score: audit.score, displayValue: audit.displayValue || '', weighted });
  }
  failing.sort((a, b) => a.score - b.score);
  if (failing.length > 0) {
    console.log('\nFailing Audits (score < 0.9):');
    for (const f of failing.slice(0, 15)) {
      const tag = f.weighted ? ' [core-weighted]' : '';
      console.log(`- ${f.id}: ${f.displayValue || 'failed'}${tag}`);
    }
  }

  // Savings opportunities (bytes/ms estimates)
  const SAVINGS = ['unused-javascript', 'unused-css-rules', 'render-blocking-resources', 'modern-image-formats', 'uses-optimized-images', 'offscreen-images', 'uses-responsive-images', 'uses-long-cache-ttl', 'legacy-javascript', 'duplicated-javascript', 'font-display'];
  const opportunities = SAVINGS
    .map(id => audits[id])
    .filter((a: any) => a && a.score !== null && a.score !== undefined && a.score < 1)
    .sort((a: any, b: any) => a.score - b.score);
  if (opportunities.length > 0) {
    console.log('\nSavings Opportunities:');
    for (const o of opportunities) {
      console.log(`- ${o.id}: ${o.displayValue || 'see report'}`);
    }
  }
  console.log('---------------------------------------\n');

  const scores = [performanceScore, seoScore, a11yScore, bpScore].filter((s): s is number => s !== null);
  if (scores.some(s => s < 90)) {
    const weak = scores.filter(s => s < 90).length;
    console.log(`Action Item: ${weak} categor${weak === 1 ? 'y is' : 'ies are'} below the 90 target. Advise the Experience Architect to prioritize the failing audits above.`);
  } else {
    console.log('Status: All category scores meet the 90+ target. Visibility targets met.');
  }

} catch (err) {
  console.error('Audit failed:', err instanceof Error ? err.message : err);
  process.exit(1);
}

function metricsVal(audits: Record<string, any>, id: string): string {
  return (audits[id] && audits[id].displayValue) || 'n/a';
}
