/**
 * Apply Environment Variables Script
 * 
 * This script automatically updates your .env file with the correct Strapi URL
 * based on the detected running Strapi instance.
 */

const fs = require('fs');
const path = require('path');

// Get paths
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env');
const envLocalPath = path.join(rootDir, '.env.local');

// Environment variables to set
const envVars = {
  'NEXT_PUBLIC_STRAPI_API_URL': 'http://localhost:1337/api',
  'NEXT_PUBLIC_CDN_DOMAIN': 'd1r94114aksajj.cloudfront.net'
};

// Function to check if Strapi is running
async function checkStrapiConnection(url) {
  try {
    console.log(`Testing connection to Strapi at: ${url}`);
    const response = await fetch(`${url}/tags`);
    
    if (response.ok) {
      console.log('✅ Strapi is running and accessible!');
      const data = await response.json();
      console.log(`Found ${data.data.length} tags in your Strapi instance.`);
      return true;
    } else {
      console.log(`❌ Strapi returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error connecting to Strapi: ${error.message}`);
    return false;
  }
}

// Function to write to a file
function writeEnvFile(filePath, vars) {
  const content = Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(filePath, content);
  console.log(`Environment file updated: ${filePath}`);
}

// Main function
async function main() {
  console.log('===== Applying Environment Variables =====');
  
  // Check if Strapi is running
  const strapiRunning = await checkStrapiConnection(envVars.NEXT_PUBLIC_STRAPI_API_URL);
  
  if (!strapiRunning) {
    console.log('⚠️ Could not connect to Strapi. Please check if your Strapi server is running.');
    console.log('The environment variables will still be updated, but you may need to adjust them.');
  }
  
  // Update .env.local file (takes precedence over .env)
  writeEnvFile(envLocalPath, envVars);
  
  console.log('\nEnvironment variables updated successfully!');
  console.log('\nTo apply these changes:');
  console.log('1. Restart your Next.js development server');
  console.log('2. Refresh your browser');
  
  console.log('\nIf you still have issues:');
  console.log('1. Make sure your Strapi server is running at http://localhost:1337');
  console.log('2. Check that the Tag collection has the correct fields (name, type)');
  console.log('3. Verify that your Tag permissions include Find and FindOne access');
}

main().catch(error => {
  console.error('Script error:', error);
}); 