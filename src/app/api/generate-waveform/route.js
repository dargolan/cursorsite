import { exec } from 'child_process';

export async function POST(req) {
  const { s3Key } = await req.json();
  if (!s3Key) {
    return new Response(JSON.stringify({ error: 'Missing s3Key' }), { status: 400 });
  }

  const scriptPath = 'scripts/generate-s3-waveforms.js';
  const bucket = 'wave-cave-audio';
  const command = `node ${scriptPath} ${bucket} ${s3Key}`;

  return new Promise((resolve) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Waveform generation error:', stderr);
        resolve(new Response(JSON.stringify({ success: false, error: stderr }), { status: 500 }));
      } else {
        resolve(new Response(JSON.stringify({ success: true, output: stdout }), { status: 200 }));
      }
    });
  });
} 