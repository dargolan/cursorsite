// Strapi configuration
export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_MEDIA_URL || 'http://localhost:1337';
export const API_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
export const API_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

// For debugging
if (typeof window !== 'undefined') {
  console.log('Strapi Configuration:', {
    STRAPI_URL,
    API_URL,
    hasToken: !!API_TOKEN
  });
} 