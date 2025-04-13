import { factories } from '@strapi/strapi';

export default {
  async validateStemData(data) {
    const requiredFields = ['name', 'type', 'price', 'duration', 'audioUrl', 'track'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate file format
    if (!data.audioUrl.match(/\.(mp3|wav|aiff)$/i)) {
      throw new Error('Invalid audio file format');
    }

    // Validate price
    if (data.price < 0) {
      throw new Error('Price cannot be negative');
    }

    // Validate track exists
    const track = await strapi.entityService.findOne('api::track.track', data.track);
    if (!track) {
      throw new Error('Parent track not found');
    }

    return true;
  },

  async processStemUpload(file, metadata) {
    try {
      // TODO: Implement S3 upload
      // This will be implemented when we set up S3 integration
      return {
        url: '',
        size: 0,
        format: '',
      };
    } catch (err) {
      strapi.log.error('Error processing stem upload:', err);
      throw err;
    }
  },

  async updateAnalytics(stemId, type) {
    try {
      const stem = await strapi.entityService.findOne('api::stem.stem', stemId);
      const updateData = {};

      switch (type) {
        case 'preview':
          updateData.previewCount = (stem.previewCount || 0) + 1;
          break;
        case 'purchase':
          updateData.purchaseCount = (stem.purchaseCount || 0) + 1;
          break;
        default:
          throw new Error('Invalid analytics type');
      }

      await strapi.entityService.update('api::stem.stem', stemId, {
        data: updateData,
      });

      return true;
    } catch (err) {
      strapi.log.error('Error updating analytics:', err);
      throw err;
    }
  },

  async getTrackStems(trackId) {
    try {
      const stems = await strapi.entityService.findMany('api::stem.stem', {
        filters: {
          track: trackId,
        },
        sort: { type: 'asc' },
      });
      return stems;
    } catch (err) {
      strapi.log.error('Error getting track stems:', err);
      throw err;
    }
  },

  async generateSKU(stemData) {
    try {
      const track = await strapi.entityService.findOne('api::track.track', stemData.track);
      const trackPrefix = track.title.substring(0, 3).toUpperCase();
      const stemType = stemData.type.substring(0, 3).toUpperCase();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      
      return `${trackPrefix}-${stemType}-${randomNum}`;
    } catch (err) {
      strapi.log.error('Error generating SKU:', err);
      throw err;
    }
  },
}; 