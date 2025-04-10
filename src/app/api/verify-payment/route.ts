import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { STRAPI_URL } from '../../../services/strapi';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil' as any,
});

// Function to generate a secure download token
function generateDownloadToken(stemId: string): string {
  // In production, use a proper JWT
  return Buffer.from(`${stemId}:${Date.now()}`).toString('base64');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paymentIntentId = searchParams.get('payment_intent');

  if (!paymentIntentId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Payment intent ID is required' 
    }, { status: 400 });
  }

  try {
    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    // Verify that payment was successful
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        success: false, 
        error: `Payment not successful. Status: ${paymentIntent.status}` 
      }, { status: 400 });
    }

    // Parse the purchased items from metadata
    const purchasedItems = paymentIntent.metadata.items ? 
      JSON.parse(paymentIntent.metadata.items) : [];
    
    // Generate download URLs for each purchased stem
    const purchases = await Promise.all(
      purchasedItems.map(async (item: any) => {
        try {
          // Fetch stem and track details
          const stemResponse = await fetch(`${STRAPI_URL}/api/stems/${item.stemId}?populate=*`);
          const trackResponse = await fetch(`${STRAPI_URL}/api/tracks/${item.trackId}?populate=*`);
          
          if (!stemResponse.ok || !trackResponse.ok) {
            console.error(`Error fetching item details: stem=${stemResponse.status}, track=${trackResponse.status}`);
            return null;
          }
          
          const stemData = await stemResponse.json();
          const trackData = await trackResponse.json();
          
          // Create a secure download token
          const downloadToken = generateDownloadToken(item.stemId);
          const downloadUrl = `/api/download/${item.stemId}?token=${downloadToken}`;
          
          return {
            id: item.stemId,
            stem: stemData.data,
            track: trackData.data,
            downloadUrl
          };
        } catch (error) {
          console.error(`Error processing item ${item.stemId}:`, error);
          return null;
        }
      })
    );

    // Filter out any null values from failed item processing
    const validPurchases = purchases.filter(item => item !== null);

    // Return success response with purchased items
    return NextResponse.json({ 
      success: true, 
      paymentIntent: paymentIntentId,
      purchases: validPurchases
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 