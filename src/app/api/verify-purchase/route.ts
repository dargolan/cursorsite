import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any // Type assertion to fix version mismatch
});

export async function GET(request: Request) {
  try {
    // Get the session ID from the query string
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session ID' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if the payment was successful
    if (session.payment_status === 'paid') {
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Your purchase was successful!',
        session: {
          id: session.id,
          customer_email: session.customer_details?.email,
          payment_status: session.payment_status,
          amount_total: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
        }
      });
    } else {
      // Payment not completed
      return NextResponse.json(
        { 
          success: false, 
          error: 'Payment has not been completed',
          payment_status: session.payment_status
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying purchase:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to verify purchase'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 