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
async function recordPurchaseInStrapi(
  stemId: string, 
  sessionId: string, 
  userId: string, 
  amount: number,
  customerEmail: string,
  trackId?: string
): Promise<boolean> {
  try {
    // Call Strapi's endpoint to record the purchase
    const data = {
      stemId,
      trackId: trackId || null,
      userId: userId || 'anonymous',
      sessionId,
      amount,
      status: 'completed',
      customerEmail: customerEmail || ''
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
 * Grant access to a stem for a user
 */
async function grantStemAccess(stemId: string, userId: string): Promise<boolean> {
  try {
    // Skip if either stemId or userId is missing
    if (!stemId || !userId) {
      console.error('Missing stemId or userId for granting access');
      return false;
    }

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

    return true;
  } catch (error) {
    console.error('Error granting stem access:', error);
    return false;
  }
}

/**
 * Process a single stem purchase
 */
async function processSingleStemPurchase(
  stemId: string, 
  session: Stripe.Checkout.Session, 
  trackId?: string
): Promise<boolean> {
  try {
    const userId = session.metadata?.userId || 'anonymous';
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    const customerEmail = session.customer_details?.email || '';
    
    // Record in Strapi
    const purchaseRecorded = await recordPurchaseInStrapi(
      stemId, 
      session.id, 
      userId, 
      amount, 
      customerEmail,
      trackId
    );
    
    // Grant access to the stem
    if (purchaseRecorded && userId && userId !== 'anonymous') {
      const accessGranted = await grantStemAccess(stemId, userId);
      return accessGranted;
    }

    return purchaseRecorded;
  } catch (error) {
    console.error('Error processing stem purchase:', error);
    return false;
  }
}

/**
 * Process multiple stem purchases from a cart
 */
async function processCartPurchases(session: Stripe.Checkout.Session): Promise<boolean> {
  try {
    const { metadata } = session;
    if (!metadata) {
      console.error('No metadata found in session');
      return false;
    }

    // Get stem IDs from metadata
    const stemIds = metadata.stemIds?.split(',') || [];
    const itemCount = parseInt(metadata.itemCount || '0', 10);
    
    if (stemIds.length === 0 || stemIds.length !== itemCount) {
      console.error(`Item count mismatch: expected ${itemCount}, got ${stemIds.length}`);
      return false;
    }

    // Calculate amount per item (simple average division)
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    const amountPerItem = totalAmount / itemCount;
    
    // Process each stem
    let allSuccessful = true;
    
    for (const stemId of stemIds) {
      const success = await processSingleStemPurchase(stemId, session);
      if (!success) {
        allSuccessful = false;
        console.error(`Failed to process purchase for stem ${stemId}`);
      }
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('Error processing cart purchases:', error);
    return false;
  }
}

/**
 * Handle POST requests for webhook events from Stripe
 */
export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const sig = request.headers.get('stripe-signature') || '';
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Missing STRIPE_WEBHOOK_SECRET');
    }
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Log the event type for debugging
    console.log(`Stripe webhook received: ${event.type}`);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Extract stem information from the session
      if (session.metadata?.stemId) {
        // Single stem purchase
        await processSingleStemPurchase(
          session.metadata.stemId,
          session,
          session.metadata.trackId
        );
      } else if (session.metadata?.stemIds) {
        // Cart purchase with multiple stems
        await processCartPurchases(session);
      } else {
        console.error('No stem information found in session metadata');
      }
    }
    
    // Send a 200 response to acknowledge receipt of the event
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