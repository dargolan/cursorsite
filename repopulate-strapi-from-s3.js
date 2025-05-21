// repopulate-strapi-from-s3.js
require('dotenv').config();
const AWS = require('aws-sdk');
const axios = require('axios');
const path = require('path');

// Load config from .env.local
const {
  NEXT_PUBLIC_STRAPI_API_URL,
  NEXT_PUBLIC_STRAPI_API_TOKEN,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  S3_BUCKET_NAME,
  NEXT_PUBLIC_CDN_DOMAIN
} = process.env;

if (!NEXT_PUBLIC_STRAPI_API_URL || !NEXT_PUBLIC_STRAPI_API_TOKEN || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION || !S3_BUCKET_NAME) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

// Configure Strapi API
const strapi = axios.create({
  baseURL: NEXT_PUBLIC_STRAPI_API_URL,
  headers: {
    Authorization: `Bearer ${NEXT_PUBLIC_STRAPI_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Helper to convert S3 URL to CDN URL
function toCdnUrl(s3Url) {
  if (!s3Url) return '';
  return s3Url.replace(/^https?:\/\/[^\/]+/, `https://${NEXT_PUBLIC_CDN_DOMAIN}`);
}

// Helper to get all objects under a prefix
async function listAllObjects(Prefix) {
  let Contents = [];
  let ContinuationToken;
  do {
    const resp = await s3.listObjectsV2({
      Bucket: S3_BUCKET_NAME,
      Prefix,
      ContinuationToken,
    }).promise();
    Contents = Contents.concat(resp.Contents);
    ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (ContinuationToken);
  return Contents;
}

// Helper to check if a track exists in Strapi
async function trackExists(title) {
  const resp = await strapi.get(`/tracks?filters[title][$eq]=${encodeURIComponent(title)}`);
  return resp.data && resp.data.data && resp.data.data.length > 0 ? resp.data.data[0] : null;
}

// Helper to check if a stem exists for a track in Strapi
async function stemExists(trackId, stemName) {
  const resp = await strapi.get(`/stems?filters[name][$eq]=${encodeURIComponent(stemName)}&filters[parentTrackId][$eq]=${trackId}`);
  return resp.data && resp.data.data && resp.data.data.length > 0;
}

// Main function
(async () => {
  console.log('Scanning S3 for tracks...');
  const listResp = await s3.listObjectsV2({
    Bucket: S3_BUCKET_NAME,
    Prefix: 'tracks/',
    Delimiter: '/',
  }).promise();
  const trackFolders = (listResp.CommonPrefixes || []).map(p => p.Prefix);
  let createdTracks = 0, createdStems = 0;

  for (const trackPrefix of trackFolders) {
    const trackName = path.basename(trackPrefix.replace(/\/$/, ''));
    // Try to get cover image, main.mp3, main.waveform.json
    const objects = await listAllObjects(trackPrefix);
    const coverObj = objects.find(o => /cover\.(jpg|jpeg|png)$/i.test(o.Key));
    const audioObj = objects.find(o => /main\.mp3$/i.test(o.Key));
    const waveformObj = objects.find(o => /main\.waveform\.json$/i.test(o.Key));
    const stemsPrefix = objects.find(o => /stems\/$/.test(o.Key));
    // Parse metadata from folder name if possible
    // (You may want to improve this to parse more metadata)
    const title = trackName.replace(/_/g, ' ');
    // Check if track exists
    let track = await trackExists(title);
    if (!track) {
      // Create track in Strapi
      const trackData = {
        title,
        imageUrl: coverObj ? toCdnUrl(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${coverObj.Key}`) : '',
        audioUrl: audioObj ? toCdnUrl(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${audioObj.Key}`) : '',
        waveformDataUrl: waveformObj ? toCdnUrl(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${waveformObj.Key}`) : '',
        // Add more fields as needed
      };
      const resp = await strapi.post('/tracks', { data: trackData });
      track = resp.data.data;
      createdTracks++;
      console.log(`Created track: ${title}`);
    } else {
      console.log(`Track exists: ${title}`);
    }
    // Now handle stems
    if (stemsPrefix) {
      const stemsObjects = await listAllObjects(stemsPrefix.Key);
      // Group stems by name
      const stemNames = Array.from(new Set(stemsObjects.map(o => o.Key.split('/').pop().split('.')[0])));
      for (const stemName of stemNames) {
        if (!stemName) continue;
        if (await stemExists(track.id, stemName)) {
          console.log(`  Stem exists: ${stemName}`);
          continue;
        }
        // Find files for this stem
        const mp3Obj = stemsObjects.find(o => o.Key.endsWith(`${stemName}.mp3`));
        const wavObj = stemsObjects.find(o => o.Key.endsWith(`${stemName}.wav`));
        const waveformObj = stemsObjects.find(o => o.Key.endsWith(`${stemName}.waveform.json`));
        const stemData = {
          name: stemName,
          parentTrackId: track.id,
          mp3Url: mp3Obj ? toCdnUrl(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${mp3Obj.Key}`) : '',
          wavUrl: wavObj ? toCdnUrl(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${wavObj.Key}`) : '',
          waveformDataUrl: waveformObj ? toCdnUrl(`https://${S3_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${waveformObj.Key}`) : '',
          // Add more fields as needed
        };
        await strapi.post('/stems', { data: stemData });
        createdStems++;
        console.log(`  Created stem: ${stemName}`);
      }
    }
  }
  console.log(`Done. Created ${createdTracks} tracks and ${createdStems} stems.`);
})(); 