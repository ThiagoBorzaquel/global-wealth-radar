import { loadStripe } from '@stripe/stripe-js';

let stripePromise: ReturnType<typeof loadStripe>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

// ⚠️ Replace these with your actual Stripe Price IDs from the dashboard
export const PRICES = {
  premium_monthly: import.meta.env.STRIPE_PRICE_MONTHLY || 'price_MONTHLY_ID_HERE',
  premium_annual:  import.meta.env.STRIPE_PRICE_ANNUAL  || 'price_ANNUAL_ID_HERE',
};

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  email: string
): Promise<string> {
  // Resolve the Supabase Functions endpoint at runtime.
  // If PUBLIC_SUPABASE_URL isn't provided at build time, fall back to a
  // relative path so the client bundle doesn't contain the literal "undefined" string.
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

  const endpoint = supabaseUrl ? `${supabaseUrl}/functions/v1/create-checkout` : '/functions/v1/create-checkout';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (supabaseKey) {
    headers['Authorization'] = `Bearer ${supabaseKey}`;
    headers['apikey'] = supabaseKey;
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ priceId, userId, email }),
  });

  const { url, error } = await res.json();
  if (error) throw new Error(error);
  return url;
}
