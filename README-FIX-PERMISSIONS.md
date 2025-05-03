# Fixing API Connection Issues

These steps will help you fix the API connection issues you're experiencing with the WaveCave app.

## 1. Change Populate Format

We've already fixed the `populate=deep` issue by changing it to `populate=*` in the code.

## 2. Setting Up Strapi Permissions

The main issue is likely related to Strapi permissions. Follow these steps to fix it:

1. Access your Strapi admin panel at http://localhost:1337/admin
2. Log in with your admin credentials
3. Navigate to Settings > USERS & PERMISSIONS PLUGIN > Roles
4. Click on "Public"
5. In the permissions section, find:
   - Tag content type
   - Track content type
6. For both Tag and Track, ensure that the following permissions are checked:
   - find
   - findOne
7. Click the "Save" button at the top right

## 3. Restart Your Application

1. Stop both your Strapi server and Next.js app if they're running
2. Start the Strapi server first:
   ```
   cd strapi-backend
   npm run develop
   ```
3. Once Strapi is running, start the Next.js app:
   ```
   npm run dev
   ```
4. Access your app at http://localhost:3000

## 4. Testing the Fix

To verify the API is working correctly, you can test the endpoints directly:

1. Try accessing: http://localhost:1337/api/tags?populate=*
2. Try accessing: http://localhost:1337/api/tracks?populate=*

Both should return JSON data instead of "Forbidden" errors.

## If Problems Persist

If you still see the "API Connection Issue" after following these steps:

1. Check browser console for specific error messages
2. Make sure your .env.local file has the correct Strapi URL:
   ```
   NEXT_PUBLIC_STRAPI_API_URL=http://localhost:1337/api
   NEXT_PUBLIC_STRAPI_MEDIA_URL=http://localhost:1337
   ```
3. Check if there are any CORS errors in the console and update the Strapi CORS configuration if needed
4. Ensure both the Next.js app and Strapi server are running simultaneously 