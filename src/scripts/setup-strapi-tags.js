/**
 * Strapi Tag Setup Script
 * 
 * This script checks if the Tag collection exists in Strapi and creates or updates it if needed.
 * It also creates default tags for genre, mood, and instrument categories.
 * 
 * To run this script:
 * 1. Make sure Strapi is running
 * 2. Run: node src/scripts/setup-strapi-tags.js
 */

// Load environment variables
require('dotenv').config();

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_ADMIN_URL = STRAPI_URL.replace('/api', '');
const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN || '';

// Sample tag data to create
const defaultTags = [
  { name: 'Pop', type: 'genre' },
  { name: 'Rock', type: 'genre' },
  { name: 'Hip-Hop', type: 'genre' },
  { name: 'Electronic', type: 'genre' },
  { name: 'Jazz', type: 'genre' },
  { name: 'Classical', type: 'genre' },
  { name: 'Other', type: 'genre' },
  
  { name: 'Happy', type: 'mood' },
  { name: 'Sad', type: 'mood' },
  { name: 'Chill', type: 'mood' },
  { name: 'Energetic', type: 'mood' },
  { name: 'Neutral', type: 'mood' },
  
  { name: 'Guitar', type: 'instrument' },
  { name: 'Piano', type: 'instrument' },
  { name: 'Drums', type: 'instrument' },
  { name: 'Bass', type: 'instrument' },
  { name: 'Synth', type: 'instrument' },
  { name: 'Various', type: 'instrument' }
];

// Headers for requests
const headers = {
  'Content-Type': 'application/json',
  ...(STRAPI_TOKEN ? { 'Authorization': `Bearer ${STRAPI_TOKEN}` } : {})
};

// Check if the Tag collection exists
async function checkIfTagCollectionExists() {
  try {
    console.log('Checking if Tag collection exists...');
    const response = await fetch(`${STRAPI_URL}/tags?pagination[pageSize]=1`, {
      method: 'GET',
      headers
    });
    
    if (response.ok) {
      console.log('Tag collection exists.');
      return true;
    } else {
      console.log(`Tag collection check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('Error checking if Tag collection exists:', error);
    return false;
  }
}

// Create a tag
async function createTag(tagData) {
  try {
    console.log(`Creating tag: ${tagData.name} (${tagData.type})`);
    const response = await fetch(`${STRAPI_URL}/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: tagData })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Tag created successfully: ${tagData.name}`);
      return data;
    } else {
      const error = await response.text();
      console.error(`Failed to create tag: ${tagData.name}`, error);
      return null;
    }
  } catch (error) {
    console.error(`Error creating tag: ${tagData.name}`, error);
    return null;
  }
}

// Create all default tags
async function createDefaultTags() {
  console.log('Creating default tags...');
  
  for (const tag of defaultTags) {
    await createTag(tag);
  }
  
  console.log('Default tags creation completed.');
}

// Main function
async function main() {
  console.log('===== Strapi Tag Setup Script =====');
  console.log(`Strapi URL: ${STRAPI_URL}`);
  console.log(`Strapi Token available: ${!!STRAPI_TOKEN}`);
  
  // Check if Tag collection exists
  const tagCollectionExists = await checkIfTagCollectionExists();
  
  if (tagCollectionExists) {
    console.log('Tag collection exists, proceeding to create default tags...');
    await createDefaultTags();
  } else {
    console.log('Tag collection may not exist or there might be connection issues.');
    console.log('Please ensure:');
    console.log('1. Strapi is running at the correct URL');
    console.log('2. You have created a "Tag" collection type in Strapi with the following fields:');
    console.log('   - name (Text)');
    console.log('   - type (Enumeration: genre, mood, instrument)');
    console.log('3. You have set proper permissions for public access to Tag collection');
    console.log('4. Your API token has the necessary permissions');
    console.log('\nOnce you have confirmed these settings, run this script again.');
  }
}

main().catch(error => {
  console.error('Script error:', error);
  process.exit(1);
}); 