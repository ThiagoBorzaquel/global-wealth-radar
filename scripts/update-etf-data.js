// scripts/update-etf-data.js
// Usage:
//   node scripts/update-etf-data.js              # update all ETFs
//   node scripts/update-etf-data.js --dry-run    # no DB writes
//   node scripts/update-etf-data.js --ticker=VTI # single ticker
//   node scripts/update-etf-data.js --history    # also save price history

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { fetchQuote, fetchPriceHistory, sleep } from './fetch-alpha-vantage.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const AV_KEY       = process.env.ALPHA_VANTAGE_KEY;
const DELAY_MS     = 15_000;  // 15s between requests (free tier: 5 req/min)

const args          = process.argv.slice(2);
const DRY_RUN       = args.includes('--dry-run');
const UPDATE_HIST   = args.includes('--history');
const SINGLE_TICKER = args.find(a => a.startsWith('--ticker='))?.split('=')[1];

if (!SUPABASE_URL || !SUPABASE_KEY || !AV_KEY) {
  console.error('❌ Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, ALPHA_VANTAGE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// ─── Load ETF list ─────────────────────────────────────────────────────────
let { etfs } = JSON.parse(readFileSync(join(__dirname, '../src/data/etf-list.json'), 'utf-8'));
if (SINGLE_TICKER) {
  etfs = etfs.filter(e => e.ticker === SINGLE_TICKER.toUpperCase());
  if (!etfs.length) { console.error(`❌ Ticker ${SINGLE_TICKER} not in etf-list.json`); process.exit(1); }
}

// ─── Upsert helpers ────────────────────────────────────────────────────────
async function upsertETF(data) {
  const { error } = await supabase.from('etf_data').upsert(data, { onConflict: 'ticker' });
  if (error) throw new Error(`Upsert failed: ${error.message}`);
}

async function upsertHistory(rows) {
  if (!rows.length) return;
  const { error } = await supabase.from('etf_price_history').upsert(rows, { onConflict: 'ticker,date', ignoreDuplicates: true });
  if (error) throw new Error(`History upsert failed: ${error.message}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
const start   = Date.now();
const results = { ok: [], fail: [] };

console.log('═══════════════════════════════════════');
console.log('🌍 Global Wealth Radar — ETF Data Update');
console.log(`📅 ${new Date().toISOString()}`);
console.log(`📋 ETFs: ${etfs.length} | DryRun: ${DRY_RUN} | History: ${UPDATE_HIST}`);
console.log('═══════════════════════════════════════');

for (let i = 0; i < etfs.length; i++) {
  const meta = etfs[i];
  console.log(`\n[${i + 1}/${etfs.length}] ${meta.ticker}`);

  try {
    const quote = await fetchQuote(meta.ticker, AV_KEY);
    console.log(`  ✓ $${quote.nav} (${quote.change_percent > 0 ? '+' : ''}${quote.change_percent?.toFixed(2)}%)`);

    const record = {
      ticker:         meta.ticker,
      name:           meta.name,
      category:       meta.category,
      subcategory:    meta.subcategory,
      issuer:         meta.issuer,
      description:    meta.description,
      is_premium:     meta.is_premium,
      nav:            quote.nav,
      prev_close:     quote.prev_close,
      change_amount:  quote.change_amount,
      change_percent: quote.change_percent,
      volume:         quote.volume,
      market_date:    quote.market_date,
      data_source:    'alpha_vantage',
      last_updated:   new Date().toISOString(),
    };

    if (!DRY_RUN) {
      await upsertETF(record);
      console.log(`  ✓ Saved to Supabase`);
    } else {
      console.log(`  [DRY RUN] nav=$${record.nav}`);
    }

    if (UPDATE_HIST && !DRY_RUN) {
      await sleep(3000);
      const hist = await fetchPriceHistory(meta.ticker, AV_KEY);
      await upsertHistory(hist);
      console.log(`  ✓ ${hist.length} history points saved`);
    }

    results.ok.push(meta.ticker);
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
    results.fail.push({ ticker: meta.ticker, error: err.message });
  }

  if (i < etfs.length - 1) {
    console.log(`  ⏱  Waiting ${DELAY_MS / 1000}s...`);
    await sleep(DELAY_MS);
  }
}

// ─── Summary ───────────────────────────────────────────────────────────────
const duration = ((Date.now() - start) / 1000).toFixed(1);
console.log('\n═══════════════════════════════════════');
console.log(`✅ Updated: ${results.ok.length}/${etfs.length}`);
console.log(`❌ Failed:  ${results.fail.length}/${etfs.length}`);
console.log(`⏱  Duration: ${duration}s`);
if (results.fail.length) {
  results.fail.forEach(f => console.log(`   ${f.ticker}: ${f.error}`));
}

if (!DRY_RUN) {
  await supabase.from('etf_update_log').insert({
    tickers_updated: results.ok.length,
    tickers_failed:  results.fail.length,
    duration_ms:     Math.round((Date.now() - start)),
    errors:          results.fail.length ? results.fail : null,
    status:          results.fail.length === 0 ? 'success' : results.fail.length < etfs.length ? 'partial' : 'failed',
  });
}

if (results.fail.length === etfs.length) process.exit(1);
