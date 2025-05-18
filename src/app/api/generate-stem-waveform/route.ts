import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { extractAudioFeatures } from '@/lib/audio-analysis';
import { uploadToS3 } from '@/lib/s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'wave-cave-audio';
const STRAPI_URL = process.env.STRAPI_URL;
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN || process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const { stemId, audioUrl } = await req.json();
    if (!audioUrl) {
      return NextResponse.json({ error: 'Missing audioUrl' }, { status: 400 });
    }

    // Robust S3 key extraction for any URL (S3, CloudFront, or custom CDN)
    console.log('audioUrl:', audioUrl);
    let s3Key = '';
    try {
      const urlObj = new URL(audioUrl);
      s3Key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));
    } catch (e) {
      // fallback to old method if URL parsing fails
      s3Key = decodeURIComponent(audioUrl.split('.amazonaws.com/')[1] || audioUrl.split('.cloudfront.net/')[1] || '');
    }
    console.log('s3Key:', s3Key);
    if (!s3Key) {
      return NextResponse.json({ error: 'Could not extract S3 key from audioUrl' }, { status: 400 });
    }

    // Use stemId if present, otherwise use base filename from s3Key
    const baseName = stemId || path.parse(s3Key).name;
    const tempAudioPath = path.join(os.tmpdir(), `${baseName}.audio`);
    const getCmd = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const s3Resp = await s3Client.send(getCmd);
    const stream = s3Resp.Body as NodeJS.ReadableStream;
    const writeStream = fs.createWriteStream(tempAudioPath);
    await new Promise((resolve, reject) => {
      stream.pipe(writeStream);
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    // Generate waveform
    const features = await extractAudioFeatures(tempAudioPath);
    const waveform = features.waveform;
    const waveformJsonPath = path.join(os.tmpdir(), `${baseName}.waveform.json`);
    fs.writeFileSync(waveformJsonPath, JSON.stringify(waveform));

    // Upload waveform JSON to S3 (same folder as audio, .waveform.json extension)
    const waveformS3Key = s3Key.replace(/\.(mp3|wav|flac)$/i, '.waveform.json');
    const waveformBuffer = fs.readFileSync(waveformJsonPath);
    const waveformUrl = await uploadToS3(waveformBuffer, waveformS3Key, 'application/json');

    // Clean up temp files
    fs.unlinkSync(tempAudioPath);
    fs.unlinkSync(waveformJsonPath);

    // Update Strapi stem with waveform URL if stemId is present
    if (stemId && STRAPI_URL && STRAPI_TOKEN) {
      await fetch(`${STRAPI_URL}/api/stems/${stemId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { waveform: waveformUrl } }),
      });
    }

    return NextResponse.json({ success: true, waveformUrl });
  } catch (err: any) {
    console.error('Error generating stem waveform:', err);
    return NextResponse.json({ error: err.message || 'Error generating waveform' }, { status: 500 });
  }
} 