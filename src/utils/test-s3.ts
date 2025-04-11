import { generateS3Key, uploadToS3 } from './s3-utils';

export async function testS3Upload(file: File) {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('audio/')) {
      throw new Error('File must be an audio file');
    }

    console.log('Generating S3 key for file:', file.name);
    const key = generateS3Key(file.name, 'test');
    console.log('Generated S3 key:', key);

    console.log('Starting S3 upload...');
    const url = await uploadToS3({ 
      file,
      key,
      contentType: file.type 
    });
    
    // Verify the upload with explicit CORS handling
    try {
      console.log('Verifying upload...');
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'cors',
        headers: {
          'Accept': '*/*'
        }
      });
      
      if (response.ok) {
        console.log('File verified and accessible at URL:', url);
      } else {
        console.warn(
          'File uploaded but may not be immediately accessible.',
          'Status:', response.status,
          'Headers:', Object.fromEntries(response.headers.entries())
        );
      }
    } catch (verifyError) {
      console.warn('Error verifying upload accessibility:', verifyError);
      console.log('The file may still have uploaded successfully but is not immediately accessible');
    }

    return url;
  } catch (error) {
    console.error('Test upload failed:', error);
    // Enhance error message for common issues
    if (error instanceof Error) {
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        error.message += ' - This may be due to CORS configuration or network connectivity issues';
      }
      if (error.message.includes('Access-Control-Allow-Origin')) {
        error.message += ' - Please verify S3 bucket CORS configuration';
      }
    }
    throw error;
  }
} 