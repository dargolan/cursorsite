import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any // Type assertion to fix version mismatch
});

// Get the domain URL based on environment
function getDomain() {
  // Use the NEXT_PUBLIC_URL environment variable if available
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }
  
  // Fallback for development
  return 'http://localhost:3000';
}

interface CheckoutItem {
  stemId: string;
  stemName: string;
  trackName: string;
  price: number; // Price in cents
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Handle single item checkout
    if (body.stemId) {
      return handleSingleItemCheckout(body);
    }
    
    // Handle cart checkout with multiple items
    if (body.items && Array.isArray(body.items)) {
      return handleCartCheckout(body.items);
    }
    
    // Invalid request
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

async function handleSingleItemCheckout(body: any) {
  const { stemId, trackId, userId, stemName, trackName, price } = body;
  
  // Validate required fields
  if (!stemId || !stemName || !price) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }
  
  // Validate price
  if (isNaN(price) || price <= 0) {
    return NextResponse.json(
      { error: 'Invalid price' },
      { status: 400 }
    );
  }
  
  // Get domain for success and cancel URLs
  const domain = getDomain();
  
  // Create a Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: stemName,
            description: `Stem from ${trackName || 'music track'}`,
          },
          unit_amount: price, // Price in cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/checkout`,
    metadata: {
      stemId,
      trackId: trackId || '',
      userId: userId || 'anonymous',
    },
  });
  
  // Return the checkout URL
  return NextResponse.json({ url: session.url });
}

async function handleCartCheckout(items: CheckoutItem[]) {
  // Validate items
  if (items.length === 0) {
    return NextResponse.json(
      { error: 'Cart is empty' },
      { status: 400 }
    );
  }
  
  // Get domain for success and cancel URLs
  const domain = getDomain();
  
  // Create line items for Stripe
  const lineItems = items.map(item => ({
    price_data: {
      currency: 'eur',
      product_data: {
        name: item.stemName,
        description: `Stem from ${item.trackName || 'music track'}`,
      },
      unit_amount: item.price, // Price in cents
    },
    quantity: 1,
  }));
  
  // Store stem IDs in metadata - limited by Stripe metadata size restrictions
  // For multiple items, we'll store them as a comma-separated list
  const stemIds = items.map(item => item.stemId).join(',');
  
  // Create a Stripe checkout session for the cart
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${domain}/checkout`, // Return to checkout page if cancelled
    metadata: {
      stemIds,
      itemCount: items.length.toString(),
      userId: 'anonymous', // This should be updated if you have a logged-in user
    },
  });
  
  // Return the checkout URL
  return NextResponse.json({ url: session.url });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 