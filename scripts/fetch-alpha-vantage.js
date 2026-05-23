// scripts/fetch-alpha-vantage.js
const AV_BASE = 'https://www.alphavantage.co/query';
const FMP_BASE = 'https://financialmodelingprep.com/api/v3';

function parseNumber(value) {
  return value == null || value === '' ? null : Number(value);
}

export async function fetchQuoteAlphaVantage(ticker, apiKey) {
  const url = `${AV_BASE}?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (data['Note'] || data['Information']) {
    throw new Error(`Alpha Vantage rate limit for ${ticker}: ${data['Note'] || data['Information']}`);
  }

  const q = data['Global Quote'];
  if (!q || !q['05. price']) throw new Error(`No Alpha Vantage data for ${ticker}`);

  return {
    ticker:         q['01. symbol'],
    nav:            parseNumber(q['05. price']),
    prev_close:     parseNumber(q['08. previous close']),
    change_amount:  parseNumber(q['09. change']),
    change_percent: parseNumber(q['10. change percent']?.replace('%', '')),
    volume:         parseInt(q['06. volume'], 10) || null,
    market_date:    q['07. latest trading day'],
    source:         'Alpha Vantage',
  };
}

export async function fetchPriceHistoryAlphaVantage(ticker, apiKey, outputSize = 'compact') {
  const url = `${AV_BASE}?function=TIME_SERIES_DAILY&symbol=${ticker}&outputsize=${outputSize}&apikey=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (data['Note'] || data['Information']) throw new Error(`Alpha Vantage rate limit (history) for ${ticker}`);

  const ts = data['Time Series (Daily)'];
  if (!ts) throw new Error(`No Alpha Vantage history for ${ticker}`);

  return Object.entries(ts).slice(0, 90).map(([date, v]) => ({
    ticker,
    date,
    open:   parseNumber(v['1. open']),
    high:   parseNumber(v['2. high']),
    low:    parseNumber(v['3. low']),
    close:  parseNumber(v['4. close']),
    volume: parseInt(v['5. volume'], 10) || null,
  }));
}

export async function fetchQuoteFmp(ticker, apiKey) {
  const url = `${FMP_BASE}/quote/${ticker}?apikey=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No FMP data for ${ticker}`);
  }

  const q = data[0];
  return {
    ticker:         q.symbol,
    nav:            parseNumber(q.price),
    prev_close:     parseNumber(q.previousClose ?? q.close),
    change_amount:  parseNumber(q.change),
    change_percent: parseNumber(q.changesPercentage),
    volume:         parseNumber(q.volume),
    market_date:    q.date || null,
    source:         'Financial Modeling Prep',
  };
}

export async function fetchPriceHistoryFmp(ticker, apiKey) {
  const url = `${FMP_BASE}/historical-price-full/${ticker}?timeseries=90&apikey=${apiKey}`;
  const res  = await fetch(url);
  const data = await res.json();

  const history = data.historical || data.historicalPrice || [];
  if (!Array.isArray(history) || history.length === 0) {
    throw new Error(`No FMP history for ${ticker}`);
  }

  return history.slice(0, 90).map(item => ({
    ticker,
    date:   item.date,
    open:   parseNumber(item.open),
    high:   parseNumber(item.high),
    low:    parseNumber(item.low),
    close:  parseNumber(item.close),
    volume: parseNumber(item.volume),
  }));
}

export async function fetchQuote(ticker, alphaKey, fmpKey) {
  if (alphaKey) return fetchQuoteAlphaVantage(ticker, alphaKey);
  if (fmpKey) return fetchQuoteFmp(ticker, fmpKey);
  throw new Error('No market data API key available. Set ALPHA_VANTAGE_KEY or FMP_KEY.');
}

export async function fetchPriceHistory(ticker, alphaKey, fmpKey, outputSize = 'compact') {
  if (alphaKey) return fetchPriceHistoryAlphaVantage(ticker, alphaKey, outputSize);
  if (fmpKey) return fetchPriceHistoryFmp(ticker, fmpKey);
  throw new Error('No market history provider available. Set ALPHA_VANTAGE_KEY or FMP_KEY.');
}

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
