/**
 * Simple Strapi Connection Test
 * 
 * This script tests the connection to your Strapi instance with detailed information.
 */

// Get the Strapi URL from command line or use default
const strapiUrl = process.argv[2] || 'http://localhost:1337';

console.log(`Testing connection to Strapi at: ${strapiUrl}`);

// Try multiple endpoints
const endpoints = [
  '',                 // Root
  '/admin',           // Admin panel
  '/api',             // API root
  '/api/tags',        // Tags endpoint
  '/api/tags?populate=*', // Tags with relations
];

async function testEndpoint(url) {
  try {
    console.log(`\nTesting: ${url}`);
    const start = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    const time = Date.now() - start;
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Time: ${time}ms`);
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log('Response data type:', typeof data);
        console.log('Response structure:', Object.keys(data).length ? Object.keys(data) : 'Empty object');
        
        if (data && data.data && Array.isArray(data.data)) {
          console.log(`Found ${data.data.length} items in the response`);
          
          if (data.data.length > 0) {
            console.log('Sample item structure:', Object.keys(data.data[0]));
            if (data.data[0].attributes) {
              console.log('Sample attributes:', Object.keys(data.data[0].attributes));
            }
          }
        }
      } catch (parseError) {
        console.log('Not a JSON response');
      }
    }
    return response.ok;
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return false;
  }
}

// Test all endpoints
async function testAllEndpoints() {
  console.log('===============================================');
  let successCount = 0;
  
  for (const endpoint of endpoints) {
    const url = `${strapiUrl}${endpoint}`;
    const success = await testEndpoint(url);
    if (success) successCount++;
  }
  
  console.log('===============================================');
  console.log(`Results: ${successCount}/${endpoints.length} endpoints reachable`);
  
  if (successCount === 0) {
    console.log('\nPossible issues:');
    console.log('1. Strapi server is not running');
    console.log('2. The URL is incorrect');
    console.log('3. Firewall or network issues');
    console.log('\nSuggestions:');
    console.log('- Check if Strapi is running on the correct port');
    console.log('- Verify that your Strapi URL is correct');
    console.log('- Check your Strapi console for any error messages');
  } else if (successCount < endpoints.length) {
    console.log('\nPartial success - some endpoints are not accessible.');
    console.log('Check your Strapi permissions and API configuration.');
  } else {
    console.log('\nAll endpoints are accessible! Your Strapi connection looks good.');
  }
}

testAllEndpoints().catch(error => {
  console.error('Script error:', error);
}); 