import type { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

console.log('LOADING HERO IMAGE API ROUTE FILE');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;
const HERO_IMAGE_PREFIX = 'hero image/';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('HERO IMAGE API ROUTE CALLED');
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: HERO_IMAGE_PREFIX,
    });
    const data = await s3.send(command);
    // Log the S3 response for debugging
    console.log('S3 ListObjectsV2Command result:', data.Contents);
    const images = data.Contents?.filter(obj => obj.Key && /\.(jpg|jpeg|png|webp)$/i.test(obj.Key));
    if (!images || images.length === 0) {
      console.log('No images found in S3:', data.Contents);
      return res.status(404).json({ error: 'No hero image found' });
    }
    // Use the first image found
    const heroImageKey = images[0].Key!;
    const heroImageUrl = `https://${process.env.NEXT_PUBLIC_CDN_DOMAIN}/${heroImageKey.split('/').map(encodeURIComponent).join('/')}`;
    res.status(200).json({ url: heroImageUrl });
  } catch (err) {
    console.error('Error fetching hero image:', err);
    res.status(500).json({ error: 'Failed to fetch hero image' });
  }
} 