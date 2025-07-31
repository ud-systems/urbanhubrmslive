import { loadStripe, Stripe } from '@stripe/stripe-js';

// This will be loaded from settings, but default to test key
let stripePublishableKey = 'pk_test_51Qhy84IwhoZJMJiysLyBysUJASo303JBZ77jnNVyH5phk61loeoTC17UBUaOSAkrZ7ohJeoHn3SPypS8l6fyFRha00XuWeOdxb';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Function to update Stripe key from settings
export const updateStripeKey = (newKey: string) => {
  stripePublishableKey = newKey;
  stripePromise = loadStripe(stripePublishableKey);
  return stripePromise;
};

// Stripe configuration interface
export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  isLiveMode: boolean;
  webhookSecret?: string;
}

// Default Stripe configuration
export const defaultStripeConfig: StripeConfig = {
  publishableKey: 'pk_test_51Qhy84IwhoZJMJiysLyBysUJASo303JBZ77jnNVyH5phk61loeoTC17UBUaOSAkrZ7ohJeoHn3SPypS8l6fyFRha00XuWeOdxb',
  secretKey: import.meta.env.VITE_STRIPE_SECRET_KEY || '',
  isLiveMode: false,
  webhookSecret: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || ''
}; 