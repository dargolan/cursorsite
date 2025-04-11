declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_STRAPI_API_URL: string;
      NEXT_PUBLIC_STRAPI_API_TOKEN: string;
      NEXT_PUBLIC_STRAPI_MEDIA_URL: string;
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      NEXT_PUBLIC_AWS_ACCESS_KEY_ID: string;
      NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY: string;
      NEXT_PUBLIC_AWS_REGION: string;
      NEXT_PUBLIC_AWS_BUCKET_NAME: string;
    }
  }
} 