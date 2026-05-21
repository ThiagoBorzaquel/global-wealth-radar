// supabase/functions/export-csv/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: cors });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (authErr || !user) return new Response('Unauthorized', { status: 401, headers: cors });

  const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single();
  if (!profile?.is_premium) {
    return new Response(JSON.stringify({ error: 'Premium required' }), {
      status: 403, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const url    = new URL(req.url);
  const type   = url.searchParams.get('type') || 'etf';
  const ticker = url.searchParams.get('ticker');
  const from   = url.searchParams.get('from');
  const to     = url.searchParams.get('to');

  let rows: any[] = [];
  let filename = 'gwr-export';
  const today  = new Date().toISOString().split('T')[0];

  if (type === 'etf') {
    const { data } = await supabase
      .from('etf_data')
      .select('ticker,name,category,subcategory,issuer,nav,prev_close,change_amount,change_percent,volume,ytd_return,aum,expense_ratio,dividend_yield,num_holdings,market_date,last_updated')
      .order('ticker');
    rows = data || [];
    filename = `gwr-etf-data-${today}`;
  }

  else if (type === 'watchlist') {
    const { data: wl } = await supabase.from('watchlist').select('ticker,added_at').eq('user_id', user.id).order('added_at', { ascending: false });
    if (wl?.length) {
      const tickers = wl.map((w: any) => w.ticker);
      const { data: etfs } = await supabase.from('etf_data').select('ticker,name,nav,change_percent,ytd_return,expense_ratio,aum').in('ticker', tickers);
      const em: Record<string, any> = {};
      etfs?.forEach((e: any) => { em[e.ticker] = e; });
      rows = wl.map((w: any) => ({
        ticker: w.ticker, name: em[w.ticker]?.name || '',
        added_at: w.added_at, current_price: em[w.ticker]?.nav || '',
        change_pct: em[w.ticker]?.change_percent || '',
        ytd_return: em[w.ticker]?.ytd_return || '',
        expense_ratio: em[w.ticker]?.expense_ratio || '',
        aum: em[w.ticker]?.aum || '',
      }));
    }
    filename = `gwr-watchlist-${today}`;
  }

  else if (type === 'history' && ticker) {
    let q = supabase.from('etf_price_history')
      .select('ticker,date,open,high,low,close,volume')
      .eq('ticker', ticker.toUpperCase())
      .order('date', { ascending: false })
      .limit(1000);
    if (from) q = q.gte('date', from);
    if (to)   q = q.lte('date', to);
    const { data } = await q;
    rows = data || [];
    filename = `gwr-${ticker.toUpperCase()}-history-${today}`;
  }

  else {
    return new Response(JSON.stringify({ error: 'Invalid type. Use: etf | watchlist | history' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  return new Response(toCSV(rows), {
    headers: {
      ...cors,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}.csv"`,
      'X-Row-Count': String(rows.length),
    },
  });
});
