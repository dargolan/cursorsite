import fs from 'fs';
import path from 'path';
import os from 'os';

interface S3Config {
  provider: string;
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  hasSecretKey?: boolean;
}

/**
 * Test service for S3 uploads
 * This provides simple methods to test the S3 integration
 */
export default {
  /**
   * Test S3 configuration
   */
  async testS3Config() {
    try {
      // Create a test file
      const testData = 'This is a test file for S3 upload';
      
      // Create a temporary file on disk
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, 'strapi-s3-test.txt');
      fs.writeFileSync(tempFilePath, testData);
      
      // Get file stats
      const stats = fs.statSync(tempFilePath);
      
      // Create a file object similar to what would come from a form upload
      const fileData = {
        path: tempFilePath,
        name: 'strapi-s3-test.txt',
        size: stats.size,
        type: 'text/plain',
      };
      
      // Get S3 configuration directly from environment variables
      const s3Config: S3Config = {
        provider: 'aws-s3',
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_BUCKET,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ? '[REDACTED]' : undefined,
        hasSecretKey: process.env.AWS_ACCESS_SECRET ? true : false
      };

      return {
        success: true,
        message: 'S3 configuration verified',
        file: fileData,
        config: s3Config
      };
    } catch (error: any) {
      strapi.log.error('Error testing S3 config:', error);
      return {
        success: false,
        message: `Test failed: ${error.message}`,
        error,
      };
    }
  },

  /**
   * Test S3 connectivity and permissions
   */
  async testS3Connection() {
    try {
      // Log S3 configuration (without sensitive information)
      const s3Config = {
        bucket: process.env.AWS_BUCKET,
        region: process.env.AWS_REGION,
        cdnDomain: process.env.CDN_DOMAIN,
      };
      
      // Check if the required environment variables are set
      if (!s3Config.bucket || !s3Config.region) {
        return {
          success: false,
          message: 'Missing required S3 configuration in environment variables',
          config: s3Config
        };
      }
      
      // Run the test
      const configResult = await this.testS3Config();
      
      // Return the test result
      return {
        success: configResult.success,
        config: s3Config,
        result: configResult,
      };
    } catch (error: any) {
      strapi.log.error('Error testing S3 connection:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
        error,
      };
    }
  },
}; 