import { factories } from '@strapi/strapi';

export default {
  async uploadToS3(file, options = {}) {
    try {
      const { name, buffer, mime } = file;
      
      // Generate a unique filename
      const timestamp = Date.now();
      const extension = name.split('.').pop();
      const uniqueFilename = `${timestamp}-${name}`;
      
      // Upload to S3
      const uploadedFile = await strapi.plugins.upload.services.upload.upload({
        data: {
          fileInfo: {
            name: uniqueFilename,
            alternativeText: name,
            caption: name,
          },
        },
        files: {
          path: buffer,
          name: uniqueFilename,
          type: mime,
        },
      });

      // Generate CDN URL
      const cdnUrl = this.generateCDNUrl(uploadedFile[0].url);

      return {
        ...uploadedFile[0],
        cdnUrl,
      };
    } catch (err) {
      strapi.log.error('Error uploading to S3:', err);
      throw err;
    }
  },

  generateCDNUrl(s3Url) {
    // Replace S3 URL with CDN URL if CDN is configured
    if (process.env.CDN_DOMAIN) {
      const s3Domain = process.env.AWS_BUCKET + '.s3.' + process.env.AWS_REGION + '.amazonaws.com';
      return s3Url.replace(s3Domain, process.env.CDN_DOMAIN);
    }
    return s3Url;
  },

  async deleteFromS3(fileUrl) {
    try {
      // Extract the key from the S3 URL
      const key = fileUrl.split('/').pop();
      
      // Delete from S3
      await strapi.plugins.upload.services.upload.remove({
        file: {
          url: fileUrl,
        },
      });

      return true;
    } catch (err) {
      strapi.log.error('Error deleting from S3:', err);
      throw err;
    }
  },

  async validateFile(file, allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/aiff', 'image/jpeg', 'image/png']) {
    if (!allowedTypes.includes(file.mime)) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Check file size (max 100MB for audio, 5MB for images)
    const maxSize = file.mime.startsWith('audio/') ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`);
    }

    return true;
  },

  async processTrackUpload(file, metadata) {
    try {
      // Validate file
      await this.validateFile(file, ['audio/mpeg', 'audio/wav', 'audio/aiff']);

      // Upload to S3
      const uploadedFile = await this.uploadToS3(file);

      return {
        url: uploadedFile.cdnUrl,
        size: file.size,
        format: file.mime,
      };
    } catch (err) {
      strapi.log.error('Error processing track upload:', err);
      throw err;
    }
  },

  async processStemUpload(file, metadata) {
    try {
      // Validate file
      await this.validateFile(file, ['audio/mpeg', 'audio/wav', 'audio/aiff']);

      // Upload to S3
      const uploadedFile = await this.uploadToS3(file);

      return {
        url: uploadedFile.cdnUrl,
        size: file.size,
        format: file.mime,
      };
    } catch (err) {
      strapi.log.error('Error processing stem upload:', err);
      throw err;
    }
  },

  async processImageUpload(file) {
    try {
      // Validate file
      await this.validateFile(file, ['image/jpeg', 'image/png']);

      // Upload to S3
      const uploadedFile = await this.uploadToS3(file);

      return {
        url: uploadedFile.cdnUrl,
        size: file.size,
        format: file.mime,
      };
    } catch (err) {
      strapi.log.error('Error processing image upload:', err);
      throw err;
    }
  },
}; 