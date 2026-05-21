// scripts/seed-etf-metadata.js
// Run ONCE to populate the etf_data table with metadata from etf-list.json
// Usage: node scripts/seed-etf-metadata.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  console.error('   Set them in .env or export before running this script');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const { etfs } = JSON.parse(
  readFileSync(join(__dirname, '../src/data/etf-list.json'), 'utf-8')
);

console.log(`🌍 Global Wealth Radar — ETF Seed`);
console.log(`📋 Seeding ${etfs.length} ETFs...`);

const { data, error } = await supabase
  .from('etf_data')
  .upsert(
    etfs.map(etf => ({
      ticker:      etf.ticker,
      name:        etf.name,
      category:    etf.category,
      subcategory: etf.subcategory,
      issuer:      etf.issuer,
      description: etf.description,
      is_premium:  etf.is_premium,
    })),
    { onConflict: 'ticker' }
  );

if (error) {
  console.error('❌ Seed failed:', error.message);
  process.exit(1);
}

console.log(`✅ Successfully seeded ${etfs.length} ETFs`);
console.log(`\nNext step: Run ETF data update to populate prices:`);
console.log(`  node scripts/update-etf-data.js --dry-run`);
