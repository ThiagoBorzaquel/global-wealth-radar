// supabase/functions/stripe-webhook/index.ts
import Stripe from 'npm:stripe@14.21.0';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const sig  = req.headers.get('stripe-signature')!;
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, Deno.env.get('STRIPE_WEBHOOK_SECRET')!);
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const sub     = event.data.object as Stripe.Subscription;
  const userId  = sub.metadata?.supabase_user_id;
  const isActive = sub.status === 'active' || sub.status === 'trialing';

  console.log(`Event: ${event.type} | User: ${userId} | Status: ${sub.status}`);

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      if (userId) {
        await supabase.from('profiles').update({
          is_premium:              isActive,
          stripe_subscription_id:  sub.id,
          subscription_status:     sub.status,
          subscription_ends_at:    new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('id', userId);
      }
      break;

    case 'customer.subscription.deleted':
      if (userId) {
        await supabase.from('profiles').update({
          is_premium:          false,
          subscription_status: 'canceled',
          subscription_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('id', userId);
      }
      break;

    case 'invoice.payment_failed':
      const invoice = event.data.object as Stripe.Invoice;
      const custId  = invoice.customer as string;
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', custId)
        .single();
      if (data) {
        await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', data.id);
      }
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
