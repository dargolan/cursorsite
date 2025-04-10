import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { STRAPI_URL } from '../../../../services/strapi';

// Initialize Stripe with API version
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not defined');
}

if (!stripeWebhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not defined');
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-03-31.basil',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret || '');
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle specific event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
      
      // Get the customer metadata
      const metadata = paymentIntent.metadata;
      
      // Process the payment success
      // For example, update user permissions in Strapi
      await handlePaymentSuccess(paymentIntent);
      
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle payment success
 * @param paymentIntent The payment intent object from Stripe
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Extract customer information from the payment intent
    const customerId = paymentIntent.customer;
    const metadata = paymentIntent.metadata;
    const userEmail = metadata.email;
    const stemId = metadata.stemId;
    
    if (!userEmail) {
      console.error('No user email found in payment intent metadata');
      return;
    }

    // Update user permissions in Strapi or perform other actions
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    
    // Example: Update user permissions for purchased stems
    if (stemId) {
      console.log(`Granting access to stem ${stemId} for user ${userEmail}`);
      
      // Make API call to your Strapi backend to update user permissions
      const updateResponse = await fetch(`${strapiUrl}/api/stem-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            user_email: userEmail,
            stem_id: stemId,
            payment_intent_id: paymentIntent.id,
            payment_status: 'completed',
          }
        }),
      });
      
      if (!updateResponse.ok) {
        console.error('Failed to update user permissions in Strapi:', await updateResponse.text());
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handler for successful payments
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  
  try {
    // Get purchased items from metadata
    if (!paymentIntent.metadata.items) {
      console.error('No items found in payment metadata');
      return;
    }
    
    const purchasedItems = JSON.parse(paymentIntent.metadata.items);
    const customerId = paymentIntent.customer as string;
    
    // Record the purchase in your database via Strapi
    // We'll use Strapi's API to create purchase records
    await recordPurchaseInStrapi(customerId, purchasedItems, paymentIntent.id);
    
    console.log(`✅ Processed purchase for ${purchasedItems.length} items with payment ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

// Handler for failed payments
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  console.log(`Reason: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);
  
  // Optionally notify customer or update records in your database
}

// Handler for completed checkout sessions
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`🛒 Checkout completed: ${session.id}`);
  
  // If using Checkout Sessions instead of direct PaymentIntents
  if (session.payment_intent) {
    // Retrieve the payment intent to get full details
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );
    
    await handlePaymentSucceeded(paymentIntent);
  }
}

// Helper function to record purchases in Strapi
async function recordPurchaseInStrapi(
  customerId: string,
  items: any[],
  paymentIntentId: string
) {
  try {
    // Create a purchase record for each item
    for (const item of items) {
      const { stemId, trackId } = item;
      
      // Create a purchase record in Strapi
      const response = await fetch(`${STRAPI_URL}/api/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You may need to add authentication headers here
          // 'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        },
        body: JSON.stringify({
          data: {
            customer: customerId,
            payment_intent: paymentIntentId,
            stem: stemId,
            track: trackId,
            purchase_date: new Date().toISOString(),
            status: 'completed',
            // Add any other relevant data
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create purchase record: ${error}`);
      }
      
      console.log(`📝 Created purchase record for stem ${stemId}`);
    }
  } catch (error) {
    console.error('Error recording purchase in Strapi:', error);
    throw error;
  }
} 
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { STRAPI_URL } from '../../../../services/strapi';

// Initialize Stripe with API version
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not defined');
}

if (!stripeWebhookSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not defined');
}

const stripe = new Stripe(stripeSecretKey || '', {
  apiVersion: '2025-03-31.basil',
});

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret || '');
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle specific event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log(`PaymentIntent ${paymentIntent.id} succeeded`);
      
      // Get the customer metadata
      const metadata = paymentIntent.metadata;
      
      // Process the payment success
      // For example, update user permissions in Strapi
      await handlePaymentSuccess(paymentIntent);
      
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle payment success
 * @param paymentIntent The payment intent object from Stripe
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Extract customer information from the payment intent
    const customerId = paymentIntent.customer;
    const metadata = paymentIntent.metadata;
    const userEmail = metadata.email;
    const stemId = metadata.stemId;
    
    if (!userEmail) {
      console.error('No user email found in payment intent metadata');
      return;
    }

    // Update user permissions in Strapi or perform other actions
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    
    // Example: Update user permissions for purchased stems
    if (stemId) {
      console.log(`Granting access to stem ${stemId} for user ${userEmail}`);
      
      // Make API call to your Strapi backend to update user permissions
      const updateResponse = await fetch(`${strapiUrl}/api/stem-purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            user_email: userEmail,
            stem_id: stemId,
            payment_intent_id: paymentIntent.id,
            payment_status: 'completed',
          }
        }),
      });
      
      if (!updateResponse.ok) {
        console.error('Failed to update user permissions in Strapi:', await updateResponse.text());
      }
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

// Handler for successful payments
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
  
  try {
    // Get purchased items from metadata
    if (!paymentIntent.metadata.items) {
      console.error('No items found in payment metadata');
      return;
    }
    
    const purchasedItems = JSON.parse(paymentIntent.metadata.items);
    const customerId = paymentIntent.customer as string;
    
    // Record the purchase in your database via Strapi
    // We'll use Strapi's API to create purchase records
    await recordPurchaseInStrapi(customerId, purchasedItems, paymentIntent.id);
    
    console.log(`✅ Processed purchase for ${purchasedItems.length} items with payment ${paymentIntent.id}`);
  } catch (error) {
    console.error('Error processing successful payment:', error);
  }
}

// Handler for failed payments
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`❌ Payment failed: ${paymentIntent.id}`);
  console.log(`Reason: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`);
  
  // Optionally notify customer or update records in your database
}

// Handler for completed checkout sessions
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`🛒 Checkout completed: ${session.id}`);
  
  // If using Checkout Sessions instead of direct PaymentIntents
  if (session.payment_intent) {
    // Retrieve the payment intent to get full details
    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );
    
    await handlePaymentSucceeded(paymentIntent);
  }
}

// Helper function to record purchases in Strapi
async function recordPurchaseInStrapi(
  customerId: string,
  items: any[],
  paymentIntentId: string
) {
  try {
    // Create a purchase record for each item
    for (const item of items) {
      const { stemId, trackId } = item;
      
      // Create a purchase record in Strapi
      const response = await fetch(`${STRAPI_URL}/api/purchases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // You may need to add authentication headers here
          // 'Authorization': `Bearer ${STRAPI_API_TOKEN}`
        },
        body: JSON.stringify({
          data: {
            customer: customerId,
            payment_intent: paymentIntentId,
            stem: stemId,
            track: trackId,
            purchase_date: new Date().toISOString(),
            status: 'completed',
            // Add any other relevant data
          }
        }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create purchase record: ${error}`);
      }
      
      console.log(`📝 Created purchase record for stem ${stemId}`);
    }
  } catch (error) {
    console.error('Error recording purchase in Strapi:', error);
    throw error;
  }
} 