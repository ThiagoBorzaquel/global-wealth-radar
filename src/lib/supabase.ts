import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  subscription_ends_at: string | null;
};

export type ETF = {
  ticker: string;
  name: string;
  category: string;
  subcategory: string | null;
  issuer: string | null;
  nav: number | null;
  change_percent: number | null;
  ytd_return: number | null;
  expense_ratio: number | null;
  aum: number | null;
  is_premium: boolean;
  last_updated: string | null;
};

export type WatchlistAlert = {
  id: string;
  user_id: string;
  ticker: string;
  alert_type: 'price_above' | 'price_below' | 'change_above' | 'change_below';
  threshold: number;
  cooldown_hours: number;
  last_triggered_at: string | null;
  is_active: boolean;
};
