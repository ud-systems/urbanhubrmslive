import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock payment intent endpoint
app.post('/create-payment-intent', (req, res) => {
  try {
    const { amount, currency = 'gbp' } = req.body;
    
    // Mock response - in production this would integrate with Stripe
    const mockPaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount,
      currency: currency,
      status: 'requires_payment_method',
      client_secret: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      created: Math.floor(Date.now() / 1000)
    };
    
    console.log('💰 Mock payment intent created:', mockPaymentIntent);
    
    res.json({
      success: true,
      paymentIntent: mockPaymentIntent
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /create-payment-intent`);
  console.log(`   GET  /health`);
}); 