// sync-strapi-with-s3.js
require('dotenv').config({ path: '.env.local' });
const AWS = require('aws-sdk');
const axios = require('axios');
const path = require('path');

const {
  NEXT_PUBLIC_STRAPI_API_URL,
  NEXT_PUBLIC_STRAPI_API_TOKEN,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME
} = process.env;

if (!NEXT_PUBLIC_STRAPI_API_URL || !NEXT_PUBLIC_STRAPI_API_TOKEN || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !S3_BUCKET_NAME) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const strapi = axios.create({
  baseURL: NEXT_PUBLIC_STRAPI_API_URL,
  headers: {
    Authorization: `Bearer ${NEXT_PUBLIC_STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Helper to check if a folder exists in S3
async function s3FolderExists(prefix) {
  const resp = await s3.listObjectsV2({
    Bucket: S3_BUCKET_NAME,
    Prefix: prefix,
    MaxKeys: 1,
  }).promise();
  return resp.Contents && resp.Contents.length > 0;
}

// Helper to check if a file exists in S3
async function s3FileExists(key) {
  try {
    await s3.headObject({ Bucket: S3_BUCKET_NAME, Key: key }).promise();
    return true;
  } catch (err) {
    if (err.code === 'NotFound') return false;
    throw err;
  }
}

(async () => {
  // 0. List all folders under 'tracks/' in S3
  const s3FoldersResp = await s3.listObjectsV2({
    Bucket: S3_BUCKET_NAME,
    Prefix: 'tracks/',
    Delimiter: '/',
  }).promise();
  const s3Folders = (s3FoldersResp.CommonPrefixes || []).map(cp => cp.Prefix.replace('tracks/', '').replace(/\/$/, ''));
  console.log('S3 folders under tracks/:', s3Folders);

  let deletedTracks = 0, deletedStems = 0;
  // 1. Get all tracks from Strapi
  let page = 1, pageSize = 100, more = true;
  let allTracks = [];
  while (more) {
    const resp = await strapi.get(`/tracks?pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
    const tracks = resp.data.data;
    allTracks = allTracks.concat(tracks);
    more = tracks.length === pageSize;
    page++;
  }
  console.log(`Found ${allTracks.length} tracks in Strapi.`);
  // Print out the structure of the first 3 tracks for debugging
  console.log('First 3 tracks from Strapi:', JSON.stringify(allTracks.slice(0, 3), null, 2));
  for (const track of allTracks) {
    if (!track.Title) {
      console.log(`Skipping track with ID ${track.id} - missing Title`);
      continue;
    }
    // Build the expected S3 folder name (e.g., 'A new era of eras' => 'a-new-era-of-eras')
    const folderBase = track.Title.replace(/ /g, '-').toLowerCase();
    // Find a folder in S3 that starts with this base (to handle suffixes)
    const matchingFolder = s3Folders.find(f => f.startsWith(folderBase));
    if (!matchingFolder) {
      // Delete track from Strapi and print response or error
      try {
        const deleteResp = await strapi.delete(`/tracks/${track.id}`);
        deletedTracks++;
        console.log(`Deleted orphaned track: ${track.Title} (ID: ${track.id})`, deleteResp.data);
      } catch (err) {
        if (err.response) {
          console.error(`Failed to delete track: ${track.Title} (ID: ${track.id})`, err.response.status, err.response.data);
        } else {
          console.error(`Failed to delete track: ${track.Title} (ID: ${track.id})`, err.message);
        }
      }
      continue;
    }
    // Handle 404 errors gracefully when fetching stems
    try {
      const stemsResp = await strapi.get(`/stems?filters[parentTrackId][$eq]=${track.id}`);
      const stems = stemsResp.data.data || [];
      for (const stem of stems) {
        const mp3Url = stem.attributes.mp3Url;
        const wavUrl = stem.attributes.wavUrl;
        let fileKey = '';
        if (mp3Url && mp3Url.includes('.amazonaws.com/')) {
          fileKey = mp3Url.split('.amazonaws.com/')[1];
        } else if (wavUrl && wavUrl.includes('.amazonaws.com/')) {
          fileKey = wavUrl.split('.amazonaws.com/')[1];
        }
        if (fileKey && !(await s3FileExists(fileKey))) {
          await strapi.delete(`/stems/${stem.id}`);
          deletedStems++;
          console.log(`  Deleted orphaned stem: ${stem.attributes.name}`);
        }
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        console.log(`No stems found for track: ${track.Title} (ID: ${track.id})`);
      } else {
        throw err;
      }
    }
  }
  console.log(`Done. Deleted ${deletedTracks} orphaned tracks and ${deletedStems} orphaned stems.`);
})(); 