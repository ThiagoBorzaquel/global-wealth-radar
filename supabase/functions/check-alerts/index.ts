// supabase/functions/check-alerts/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!;
const SITE_URL   = Deno.env.get('SITE_URL')!;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

function isInCooldown(a: any): boolean {
  if (!a.last_triggered_at) return false;
  return Date.now() - new Date(a.last_triggered_at).getTime() < a.cooldown_hours * 3_600_000;
}

function isTriggered(a: any, etf: any): boolean {
  switch (a.alert_type) {
    case 'price_above':  return etf.nav > a.threshold;
    case 'price_below':  return etf.nav < a.threshold;
    case 'change_above': return etf.change_percent > a.threshold;
    case 'change_below': return etf.change_percent < a.threshold;
    default: return false;
  }
}

function triggeredValue(a: any, etf: any): number {
  return a.alert_type.startsWith('change') ? etf.change_percent : etf.nav;
}

async function sendEmail(email: string, name: string | null, a: any, etf: any, val: number) {
  const isChange   = a.alert_type.startsWith('change');
  const valLabel   = isChange ? `${val > 0 ? '+' : ''}${val.toFixed(2)}%` : `$${val.toFixed(2)}`;
  const threshLabel = isChange
    ? `${a.alert_type === 'change_above' ? '>' : '<'} ${a.threshold}%`
    : `${a.alert_type === 'price_above'  ? '>' : '<'} $${a.threshold}`;

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0f1e;font-family:Inter,sans-serif;">
    <div style="max-width:520px;margin:40px auto;padding:0 20px;">
      <div style="text-align:center;margin-bottom:32px;">
        <span style="font-size:28px;color:#22c55e;">◎</span>
        <p style="color:#64748b;font-size:12px;margin:8px 0 0;">Global Wealth Radar</p>
      </div>
      <div style="background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px;">
        <p style="color:#94a3b8;font-size:14px;margin:0 0 8px;">${name ? `Hi ${name.split(' ')[0]},` : 'Hi,'}</p>
        <h1 style="color:#f8fafc;font-size:22px;margin:0 0 24px;font-weight:700;">Your alert was triggered</h1>
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <p style="color:#f8fafc;font-size:24px;font-weight:800;font-family:monospace;margin:0;">${a.ticker}</p>
              <p style="color:#64748b;font-size:13px;margin:4px 0 0;">${etf.nav ? `Price: $${etf.nav.toFixed(2)}` : ''}</p>
            </div>
            <p style="color:${val >= 0 ? '#22c55e' : '#f87171'};font-size:28px;font-weight:800;margin:0;font-family:monospace;">${valLabel}</p>
          </div>
        </div>
        <div style="background:#22c55e15;border:1px solid #22c55e30;border-radius:10px;padding:14px 18px;margin-bottom:28px;">
          <p style="color:#4ade80;font-size:13px;margin:0;">
            ✓ Condition met: <strong>${a.ticker}</strong> is <strong>${valLabel}</strong> (threshold: <strong>${threshLabel}</strong>)
          </p>
        </div>
        <a href="${SITE_URL}/premium/etf-tracker"
           style="display:block;text-align:center;background:#22c55e;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px;border-radius:12px;">
          View ETF Tracker →
        </a>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <p style="color:#334155;font-size:12px;">
          You set up this alert. <a href="${SITE_URL}/premium/watchlist" style="color:#475569;">Manage alerts</a>
        </p>
      </div>
    </div></body></html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'Global Wealth Radar <alerts@globalwealthradar.com>',
      to:      [email],
      subject: `🔔 Alert: ${a.ticker} ${valLabel} (${threshLabel})`,
      html,
    }),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const start = Date.now();
  const stats = { checked: 0, triggered: 0, sent: 0, errors: [] as string[] };

  try {
    const { data: alerts } = await supabase
      .from('watchlist_alerts')
      .select('*, profiles(email, full_name)')
      .eq('is_active', true);

    if (!alerts?.length) {
      return new Response(JSON.stringify({ message: 'No active alerts', ...stats }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const tickers = [...new Set(alerts.map((a: any) => a.ticker))];
    const { data: etfs } = await supabase
      .from('etf_data').select('ticker,nav,change_percent').in('ticker', tickers);

    const etfMap: Record<string, any> = {};
    etfs?.forEach((e: any) => { etfMap[e.ticker] = e; });

    for (const alert of alerts as any[]) {
      stats.checked++;
      if (isInCooldown(alert)) continue;
      const etf = etfMap[alert.ticker];
      if (!etf || !isTriggered(alert, etf)) continue;

      const val = triggeredValue(alert, etf);
      stats.triggered++;

      await supabase.from('alert_history').insert({
        alert_id: alert.id, user_id: alert.user_id,
        ticker: alert.ticker, alert_type: alert.alert_type,
        threshold: alert.threshold, triggered_value: val,
      });

      try {
        await sendEmail(alert.profiles.email, alert.profiles.full_name, alert, etf, val);
        stats.sent++;
        await supabase.from('watchlist_alerts').update({
          last_triggered_at: new Date().toISOString(),
          trigger_count: supabase.rpc('increment_trigger_count', { alert_id: alert.id }),
        }).eq('id', alert.id);
      } catch (e: any) {
        stats.errors.push(`${alert.ticker}: ${e.message}`);
      }
    }

    return new Response(JSON.stringify({ success: true, duration_ms: Date.now() - start, ...stats }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
