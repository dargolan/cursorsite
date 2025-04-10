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

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { stemId, trackId, userId, stemName, trackName, price } = body;
    
    // Validate required fields
    if (!stemId || !trackId || !stemName || !trackName || !price) {
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
            currency: 'usd',
            product_data: {
              name: stemName,
              description: `Stem from ${trackName}`,
            },
            unit_amount: price, // Price in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/stems/${trackId}`,
      metadata: {
        stemId,
        trackId,
        userId: userId || 'anonymous',
      },
    });
    
    // Return the checkout URL
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
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