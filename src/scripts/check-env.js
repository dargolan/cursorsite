/**
 * Environment Variables Checker & Setup Script
 * 
 * This script checks if the required environment variables for Strapi integration
 * are set correctly and helps set them up if missing.
 * 
 * Run this script to diagnose connection issues with Strapi:
 * node src/scripts/check-env.js
 */

// Load environment variables
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Get paths
const rootDir = path.resolve(__dirname, '../../');
const envPath = path.join(rootDir, '.env');
const envExamplePath = path.join(rootDir, '.env.example');

// Required environment variables
const requiredVars = [
  {
    key: 'NEXT_PUBLIC_STRAPI_API_URL',
    default: 'http://localhost:1337/api',
    description: 'URL of your Strapi API (including /api at the end)'
  },
  {
    key: 'NEXT_PUBLIC_STRAPI_API_TOKEN',
    default: '',
    description: 'API token from Strapi to authenticate requests'
  },
  {
    key: 'NEXT_PUBLIC_CDN_DOMAIN',
    default: 'd1r94114aksajj.cloudfront.net',
    description: 'CloudFront domain for serving media files'
  }
];

// Check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Create or update .env file
async function createOrUpdateEnvFile(envVars) {
  let envContent = '';
  let existingContent = '';
  
  if (fileExists(envPath)) {
    existingContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Parse existing content into key-value pairs
  const existingVars = {};
  if (existingContent) {
    existingContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        existingVars[key.trim()] = valueParts.join('=').trim();
      }
    });
  }
  
  // Add or update the variables
  for (const envVar of envVars) {
    const { key, value } = envVar;
    existingVars[key] = value;
  }
  
  // Convert back to string
  envContent = Object.entries(existingVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Write to file
  fs.writeFileSync(envPath, envContent);
  console.log(`\n.env file ${fileExists(envPath) ? 'updated' : 'created'} at: ${envPath}`);
}

// Prompt for environment variable
function promptForEnvVar(variable) {
  return new Promise((resolve) => {
    rl.question(`Enter value for ${variable.key} [${variable.default}]: `, (answer) => {
      resolve({
        key: variable.key,
        value: answer.trim() || variable.default
      });
    });
  });
}

// Test Strapi connection
async function testStrapiConnection(apiUrl, apiToken) {
  try {
    console.log(`Testing connection to Strapi at: ${apiUrl}`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      console.log('✅ Successfully connected to Strapi API!');
      return true;
    } else {
      console.log(`❌ Failed to connect to Strapi: ${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to Strapi:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('===== Environment Variables Checker & Setup =====\n');
  
  // Check for .env file
  if (!fileExists(envPath)) {
    console.log('No .env file found, creating a new one...');
    
    // Create .env from .env.example if available
    if (fileExists(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      console.log('Created .env file from .env.example');
    }
  }
  
  // Get current env values
  const currentEnv = {};
  requiredVars.forEach(v => {
    currentEnv[v.key] = process.env[v.key] || '';
  });
  
  console.log('Current environment variables:');
  requiredVars.forEach(v => {
    console.log(`${v.key}: ${currentEnv[v.key] || 'Not set'}`);
  });
  
  // Ask if user wants to update
  rl.question('\nDo you want to update these variables? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      const updatedVars = [];
      
      // Prompt for each variable
      for (const v of requiredVars) {
        const envVar = await promptForEnvVar(v);
        updatedVars.push(envVar);
      }
      
      // Save to .env file
      await createOrUpdateEnvFile(updatedVars);
      
      // Test Strapi connection
      const strapiUrl = updatedVars.find(v => v.key === 'NEXT_PUBLIC_STRAPI_API_URL')?.value;
      const strapiToken = updatedVars.find(v => v.key === 'NEXT_PUBLIC_STRAPI_API_TOKEN')?.value;
      
      if (strapiUrl) {
        await testStrapiConnection(strapiUrl, strapiToken);
      }
      
      console.log('\nTo apply these changes:');
      console.log('1. Restart your Next.js development server');
      console.log('2. Refresh your browser\n');
    }
    
    rl.close();
  });
}

main().catch(error => {
  console.error('Script error:', error);
  rl.close();
}); 