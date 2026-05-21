// scripts/fetch-alpha-vantage.js
const BASE = 'https://www.alphavantage.co/query';

export async function fetchQuote(ticker, apiKey) {
  const url = `${BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (data['Note'] || data['Information']) {
    throw new Error(`Rate limit for ${ticker}: ${data['Note'] || data['Information']}`);
  }

  const q = data['Global Quote'];
  if (!q || !q['05. price']) throw new Error(`No data for ${ticker}`);

  return {
    ticker:         q['01. symbol'],
    nav:            parseFloat(q['05. price']),
    prev_close:     parseFloat(q['08. previous close']),
    change_amount:  parseFloat(q['09. change']),
    change_percent: parseFloat(q['10. change percent'].replace('%', '')),
    volume:         parseInt(q['06. volume']),
    market_date:    q['07. latest trading day'],
  };
}

export async function fetchPriceHistory(ticker, apiKey, outputSize = 'compact') {
  const url = `${BASE}?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=${outputSize}&apikey=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (data['Note'] || data['Information']) throw new Error(`Rate limit (history) for ${ticker}`);

  const ts = data['Time Series (Daily)'];
  if (!ts) throw new Error(`No history for ${ticker}`);

  return Object.entries(ts).slice(0, 90).map(([date, v]) => ({
    ticker,
    date,
    open:   parseFloat(v['1. open']),
    high:   parseFloat(v['2. high']),
    low:    parseFloat(v['3. low']),
    close:  parseFloat(v['4. close']),
    volume: parseInt(v['5. volume']),
  }));
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
