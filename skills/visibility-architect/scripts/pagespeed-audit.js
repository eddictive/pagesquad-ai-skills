#!/usr/bin/env node

/**
 * PageSpeed Audit Utility (Node.js)
 * Helps the Visibility Architect audit core web vitals and SEO performance.
 * 
 * Usage: PAGESPEED_API_KEY=<your_api_key> node pagespeed-audit.js <url> [strategy: mobile|desktop]
 * 
 * Note for AI Agents: If the API key is missing, ask the user to provide it or check the .env file.
 */

const https = require('https');

const apiKey = process.env.PAGESPEED_API_KEY;

// Parse args: supports flags (--url X, --strategy=Y) and legacy positional args.
const USAGE = 'Usage: node pagespeed-audit.js [--url <url>] [--strategy mobile|desktop]\nAlso accepted positionally: node pagespeed-audit.js <url> [strategy]';

function parseArgs(argv) {
  const opts = { url: null, strategy: null };
  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--url') {
      opts.url = argv[++i];
    } else if (arg.startsWith('--url=')) {
      opts.url = arg.slice('--url='.length);
    } else if (arg === '--strategy') {
      opts.strategy = argv[++i];
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
  if (!opts.url && positional.length > 0) opts.url = positional[0];
  if (!opts.strategy && positional.length > 1) opts.strategy = positional[1];
  opts.strategy = (opts.strategy || 'mobile').toLowerCase();
  if (!['mobile', 'desktop'].includes(opts.strategy)) {
    console.error(`Invalid strategy: ${opts.strategy} (must be 'mobile' or 'desktop')`);
    process.exit(1);
  }
  return opts;
}

const { url, strategy } = parseArgs(process.argv.slice(2));

if (!url) {
  console.error(USAGE);
  console.error('Example: PAGESPEED_API_KEY=AIzaSy... node pagespeed-audit.js --url https://example.com --strategy desktop');
  process.exit(1);
}

if (!apiKey) {
  console.error('Error: PAGESPEED_API_KEY environment variable is missing.');
  console.error('Agent Action Required: Please ask the user to provide their Google PageSpeed API key, or read it from a .env file, then rerun the command with the key.');
  process.exit(1);
}

const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy.toUpperCase()}&category=performance&category=seo&key=${apiKey}`;

console.log(`Auditing ${url} (${strategy} strategy)...`);

https.get(apiUrl, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.error) {
        console.error('Error from API:', result.error.message);
        process.exit(1);
      }
      
      const performanceScore = result.lighthouseResult.categories.performance.score * 100;
      const seoScore = result.lighthouseResult.categories.seo.score * 100;
      
      console.log('\n--- PageSpeed Insights Report ---');
      console.log(`URL: ${url}`);
      console.log(`Strategy: ${strategy}`);
      console.log(`Performance Score: ${performanceScore}`);
      console.log(`SEO Score: ${seoScore}`);
      
      console.log('\nKey Metrics:');
      const metrics = result.lighthouseResult.audits;
      console.log(`- First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
      console.log(`- Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
      console.log(`- Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
      console.log(`- Total Blocking Time: ${metrics['total-blocking-time'].displayValue}`);
      console.log('---------------------------------\n');
      
      if (performanceScore < 90 || seoScore < 90) {
         console.log('Action Item: Target score is 90+. Advise the Experience Architect to optimize assets and restructure DOM.');
      } else {
         console.log('Status: Excellent performance. Visibility targets met.');
      }
    } catch (err) {
      console.error('Failed to parse response:', err.message);
    }
  });
}).on('error', (err) => {
  console.error('Request failed:', err.message);
});
