// src/api/checkout.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY!, {
  apiVersion: '2023-08-16',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { priceId, successUrl, cancelUrl, email, userId } = req.body;

    if (!priceId || !email || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
      // 以下により「今すぐ請求 → 毎月同じ日」を確実に実行
      subscription_data: {
        trial_period_days: 0,
        metadata: {
          userId,
        },
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('❌ Error creating Stripe checkout session:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
