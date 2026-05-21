-- =============================================================
-- GLOBAL WEALTH RADAR — Complete Supabase SQL Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- =============================================================

-- ── 1. PROFILES ──────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                      UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                   TEXT NOT NULL,
  full_name               TEXT,
  avatar_url              TEXT,
  is_premium              BOOLEAN DEFAULT FALSE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  subscription_status     TEXT DEFAULT 'inactive',
  subscription_ends_at    TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. ETF DATA ───────────────────────────────────────────────
CREATE TABLE public.etf_data (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker          TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  category        TEXT,
  subcategory     TEXT,
  issuer          TEXT,
  description     TEXT,
  is_premium      BOOLEAN DEFAULT FALSE,
  nav             DECIMAL(12,4),
  prev_close      DECIMAL(12,4),
  change_amount   DECIMAL(12,4),
  change_percent  DECIMAL(8,4),
  volume          BIGINT,
  avg_volume      BIGINT,
  week_52_high    DECIMAL(12,4),
  week_52_low     DECIMAL(12,4),
  ytd_return      DECIMAL(8,4),
  aum             BIGINT,
  expense_ratio   DECIMAL(6,4),
  dividend_yield  DECIMAL(6,4),
  num_holdings    INTEGER,
  data_source     TEXT DEFAULT 'alpha_vantage',
  market_date     DATE,
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. ETF PRICE HISTORY ──────────────────────────────────────
CREATE TABLE public.etf_price_history (
  id      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticker  TEXT NOT NULL REFERENCES public.etf_data(ticker) ON DELETE CASCADE,
  date    DATE NOT NULL,
  open    DECIMAL(12,4),
  high    DECIMAL(12,4),
  low     DECIMAL(12,4),
  close   DECIMAL(12,4),
  volume  BIGINT,
  UNIQUE(ticker, date)
);

-- ── 4. WATCHLIST ──────────────────────────────────────────────
CREATE TABLE public.watchlist (
  id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker   TEXT NOT NULL,
  name     TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ticker)
);

-- ── 5. WATCHLIST ALERTS ───────────────────────────────────────
CREATE TABLE public.watchlist_alerts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker              TEXT NOT NULL,
  alert_type          TEXT NOT NULL,
  threshold           DECIMAL(12,4) NOT NULL,
  is_active           BOOLEAN DEFAULT TRUE,
  notify_email        BOOLEAN DEFAULT TRUE,
  cooldown_hours      INTEGER DEFAULT 24,
  last_triggered_at   TIMESTAMPTZ,
  trigger_count       INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. ALERT HISTORY ──────────────────────────────────────────
CREATE TABLE public.alert_history (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id        UUID REFERENCES public.watchlist_alerts(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ticker          TEXT NOT NULL,
  alert_type      TEXT NOT NULL,
  threshold       DECIMAL(12,4),
  triggered_value DECIMAL(12,4),
  email_sent      BOOLEAN DEFAULT FALSE,
  triggered_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. NEWSLETTER SUBSCRIBERS ─────────────────────────────────
CREATE TABLE public.newsletter_subscribers (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email      TEXT UNIQUE NOT NULL,
  confirmed  BOOLEAN DEFAULT FALSE,
  source     TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 8. ETF UPDATE LOG ─────────────────────────────────────────
CREATE TABLE public.etf_update_log (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_at           TIMESTAMPTZ DEFAULT NOW(),
  tickers_updated  INTEGER DEFAULT 0,
  tickers_failed   INTEGER DEFAULT 0,
  duration_ms      INTEGER,
  errors           JSONB,
  status           TEXT DEFAULT 'success'
);

-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto update_at on profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Increment trigger count helper
CREATE OR REPLACE FUNCTION increment_trigger_count(alert_id UUID)
RETURNS INTEGER AS $$
DECLARE c INTEGER;
BEGIN
  SELECT trigger_count INTO c FROM public.watchlist_alerts WHERE id = alert_id;
  RETURN COALESCE(c, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_data              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etf_price_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist_alerts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_history         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users view own profile"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ETF data: free = public, premium = logged-in premium users
CREATE POLICY "Free ETFs are public"
  ON public.etf_data FOR SELECT USING (is_premium = FALSE);

CREATE POLICY "Premium ETFs for subscribers"
  ON public.etf_data FOR SELECT
  USING (is_premium = FALSE OR (
    auth.uid() IS NOT NULL AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_premium = TRUE)
  ));

-- ETF history: same as parent ETF
CREATE POLICY "ETF history follows ETF rule"
  ON public.etf_price_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.etf_data e WHERE e.ticker = etf_price_history.ticker
    AND (e.is_premium = FALSE OR (
      auth.uid() IS NOT NULL AND
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_premium = TRUE)
    ))
  ));

-- Watchlist
CREATE POLICY "Users manage own watchlist"
  ON public.watchlist FOR ALL USING (auth.uid() = user_id);

-- Alerts
CREATE POLICY "Users manage own alerts"
  ON public.watchlist_alerts FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users see own alert history"
  ON public.alert_history FOR SELECT USING (auth.uid() = user_id);

-- Newsletter: anyone can insert
CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_watchlist_user      ON public.watchlist(user_id);
CREATE INDEX idx_alerts_user         ON public.watchlist_alerts(user_id);
CREATE INDEX idx_alerts_active       ON public.watchlist_alerts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_alerts_ticker       ON public.watchlist_alerts(ticker);
CREATE INDEX idx_etf_history_ticker  ON public.etf_price_history(ticker, date DESC);
CREATE INDEX idx_etf_category        ON public.etf_data(category);
CREATE INDEX idx_etf_premium         ON public.etf_data(is_premium);
CREATE INDEX idx_profile_stripe      ON public.profiles(stripe_customer_id);
CREATE INDEX idx_newsletter_email    ON public.newsletter_subscribers(email);
