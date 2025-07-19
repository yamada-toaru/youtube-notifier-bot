// api/create-checkout-session.ts

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, plan } = req.body;

  if (!email || !plan) {
    return res.status(400).json({ error: 'Missing required fields: email or plan' });
  }

  const priceId =
    plan === 'pro'
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_NORMAL;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId!,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/main`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe セッション作成エラー:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
