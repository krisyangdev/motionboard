// Runs Lighthouse (mobile and desktop) against a URL, N times each, prints every run and the median,
// and exits 1 if any median category score is below THRESHOLD (95), or the performance median is below --perf.
// Usage: npm run lighthouse -- [--url https://example.com/] [--runs 3] [--all] [--form mobile|desktop] [--perf 99]
// --perf <n>: minimum for the performance category alone (default 95), e.g. --perf 99 for the launch gate.
// Local numbers run behind a proxy and read lower than real; PageSpeed Insights (pagespeed.web.dev) is the
// reference for the 99 gate.
// --all: also checks every URL of the sitemap (paths taken from <url origin>/sitemap.xml), one table row per page.
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { SITE_URL } from '../site.config.ts';

const args = process.argv.slice(2);
const opt = (name, dflt) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : dflt);
const url = opt('url', `${SITE_URL}/`);
const runs = Number(opt('runs', 3));
const THRESHOLD = 95;
const perfMin = Number(opt('perf', THRESHOLD));
const form = opt('form', 'both');
const all = args.includes('--all');
const CATS = ['performance', 'accessibility', 'best-practices', 'seo'];
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

let urls = [url];
if (all) {
  const origin = new URL(url).origin;
  const xml = await (await fetch(`${origin}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => origin + m[1]);
}

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] });
let failed = false;
try {
  for (const target of urls) for (const [name, config] of [['mobile', undefined], ['desktop', desktopConfig]].filter(([n]) => form === 'both' || form === n)) {
    const scores = [];
    for (let i = 0; i < runs; i++) {
      const { lhr } = await lighthouse(target, { port: chrome.port, output: 'json', onlyCategories: CATS, logLevel: 'error' }, config);
      if (lhr.runtimeError) throw new Error(`Lighthouse runtime error: ${lhr.runtimeError.code} ${lhr.runtimeError.message}`);
      const s = CATS.map((c) => Math.round(lhr.categories[c].score * 100));
      const a = lhr.audits;
      scores.push(s);
      console.log(`${target} ${name} run ${i + 1}: ${CATS.map((c, k) => `${c} ${s[k]}`).join(' / ')}  FCP ${a['first-contentful-paint'].displayValue} LCP ${a['largest-contentful-paint'].displayValue} TBT ${a['total-blocking-time'].displayValue} CLS ${a['cumulative-layout-shift'].displayValue} SI ${a['speed-index'].displayValue}`);
    }
    const med = CATS.map((_, k) => median(scores.map((s) => s[k])));
    console.log(`${target} ${name} median: ${CATS.map((c, k) => `${c} ${med[k]}`).join(' / ')}`);
    if (med.some((v, k) => v < (CATS[k] === 'performance' ? perfMin : THRESHOLD))) failed = true;
  }
} finally {
  await chrome.kill();
}
if (failed) {
  console.error(`Lighthouse: a median score is below its minimum (performance ${perfMin}, others ${THRESHOLD})`);
  process.exit(1);
}
