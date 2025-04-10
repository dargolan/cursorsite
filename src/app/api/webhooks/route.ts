import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Check for required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Missing STRIPE_SECRET_KEY environment variable');
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

// Initialize Stripe with the latest API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any // Type assertion to fix version mismatch
});

// Fetch helper for Strapi API calls
async function queryStrapi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337';
  const API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
  
  // Create headers with authentication if token exists
  const headers = {
    'Content-Type': 'application/json',
    ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {}),
    ...options.headers
  };
  
  // Build the complete URL
  const url = `${STRAPI_URL}${endpoint}`;
  
  console.log(`Making request to Strapi: ${url}`);
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * Record a purchase in Strapi
 */
async function recordPurchaseInStrapi(session: Stripe.Checkout.Session) {
  try {
    const { metadata } = session;
    if (!metadata) {
      console.error('No metadata found in session');
      return false;
    }

    const { stemId, trackId, userId } = metadata;

    // Call Strapi's endpoint to record the purchase
    const data = {
      stemId,
      trackId,
      userId: userId || 'anonymous',
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0, // Convert cents to dollars
      status: session.payment_status,
      customerEmail: session.customer_details?.email || ''
    };

    // Use the queryStrapi function to send the purchase data
    const response = await queryStrapi('/api/purchases', {
      method: 'POST',
      body: JSON.stringify({ data })
    });

    if (!response.ok) {
      console.error('Failed to record purchase in Strapi:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error recording purchase in Strapi:', error);
    return false;
  }
}

/**
 * Process a stem purchase in the system
 */
async function processStemPurchase(session: Stripe.Checkout.Session) {
  try {
    const { metadata } = session;
    if (!metadata) {
      console.error('No metadata found in session');
      return false;
    }

    const { stemId, userId } = metadata;
    
    // Record in Strapi
    const purchaseRecorded = await recordPurchaseInStrapi(session);
    
    // Grant access to the stem
    if (purchaseRecorded) {
      // If we have a user ID, we can grant them access to the stem
      if (userId) {
        // Use the queryStrapi function to grant access
        const response = await queryStrapi('/api/stem-access', {
          method: 'POST',
          body: JSON.stringify({ 
            userId,
            stemId,
            source: 'stripe',
            expiresAt: null // Permanent access
          })
        });

        if (!response.ok) {
          console.error('Failed to grant stem access:', await response.text());
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error processing stem purchase:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Get the signature from the headers
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    // Get the raw body
    const rawBody = await request.text();

    // Verify the event with Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle different event types
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Process the order
      console.log('Processing checkout session completed:', session.id);
      
      // Process the stem purchase
      const success = await processStemPurchase(session);
      
      if (success) {
        console.log(`Successfully processed purchase for session ${session.id}`);
        return NextResponse.json({ received: true, status: 'success' });
      } else {
        console.error(`Failed to process purchase for session ${session.id}`);
        return NextResponse.json({ received: true, status: 'processing_failed' }, { status: 500 });
      }
    }

    // Return a response for other event types
    return NextResponse.json({ received: true, type: event.type });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, stripe-signature',
    },
  });
} 