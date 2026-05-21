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
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  const res = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ priceId, userId, email }),
  });

  const { url, error } = await res.json();
  if (error) throw new Error(error);
  return url;
}
