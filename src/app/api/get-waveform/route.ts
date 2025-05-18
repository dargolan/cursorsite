import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const { s3Key } = await request.json();

    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3 key is required' },
        { status: 400 }
      );
    }

    // Construct the waveform JSON key from the audio key
    const waveformKey = s3Key.replace(/\.[^/.]+$/, '.waveform.json');

    try {
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: waveformKey,
      });

      const response = await s3Client.send(command);
      const waveformData = await response.Body?.transformToString();
      
      if (!waveformData) {
        throw new Error('No waveform data found');
      }

      const parsedData = JSON.parse(waveformData);
      
      // Handle different waveform data formats
      let waveform;
      if (Array.isArray(parsedData)) {
        waveform = parsedData;
      } else if (Array.isArray(parsedData.peaks)) {
        waveform = parsedData.peaks;
      } else if (Array.isArray(parsedData.data)) {
        waveform = parsedData.data;
      } else {
        throw new Error('Invalid waveform data format');
      }

      return NextResponse.json({
        success: true,
        waveform,
      });
    } catch (error) {
      console.error('Error fetching waveform from S3:', error);
      return NextResponse.json(
        { success: false, error: 'Waveform data not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error in get-waveform API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 