'use strict';

/**
 * Custom implementation of the Upload service to apply consistent file naming.
 */
module.exports = ({ strapi }) => ({
  /**
   * Override the upload process to customize file naming
   * @param {object} file - The file being uploaded
   * @param {object} config - The upload configuration
   */
  async enhanceFile(file, config) {
    // Call the original enhanceFile method first
    await strapi.plugin('upload').service('upload').enhanceFile(file, config);
    
    // Check if this is an audio file
    if (file.mime && file.mime.startsWith('audio/')) {
      // Get metadata from file context if available
      const context = file.related || {};
      
      // Try to determine if this is a stem and which stem type it is
      const isStem = context.component === 'music.stem';
      const stemName = isStem && context.data && context.data.name 
        ? context.data.name  // Get stem name from metadata
        : null;
        
      // Try to get track title from metadata
      const trackName = context.data && context.data.track && context.data.track.title
        ? context.data.track.title
        : (context.data && context.data.title ? context.data.title : null);
      
      if (stemName && trackName) {
        // Format the stem name (capitalize first letter)
        const formattedStemName = stemName.charAt(0).toUpperCase() + stemName.slice(1);
        
        // Format the track name (lowercase with underscores)
        const formattedTrackName = trackName.toLowerCase().replace(/\s+/g, '_');
        
        // Build the filename following our convention: StemName_trackname.mp3
        const newFileName = `${formattedStemName}_${formattedTrackName}.${file.ext}`;
        
        // Get just the filename without path
        const oldFileName = file.name;
        
        // Update file name, hash, and path properties
        file.name = newFileName;
        file.hash = `${file.hash.split('_')[0]}_${newFileName}`; // Maintain hash prefix
        file.path = file.path.replace(oldFileName, newFileName);
        
        strapi.log.info(`Renamed audio stem file to: ${file.name}`);
      } else {
        // For fallback cases where metadata is not available, use a simple naming approach
        if (file.name.toLowerCase().includes('drums')) {
          const stemName = 'Drums';
          const trackName = file.name.replace(/drums[-_ ]?/i, '').replace(/\.[^/.]+$/, '');
          
          // Format the track name (lowercase with underscores)
          const formattedTrackName = trackName.toLowerCase().replace(/\s+/g, '_');
          
          // Build the filename: Drums_trackname.mp3
          const newFileName = `${stemName}_${formattedTrackName}.${file.ext}`;
          
          // Update file name, hash, and path properties
          file.name = newFileName;
          file.hash = `${file.hash.split('_')[0]}_${newFileName}`; // Maintain hash prefix
          file.path = file.path.replace(file.name, newFileName);
          
          strapi.log.info(`Renamed drums audio file to: ${file.name}`);
        } else if (file.name.toLowerCase().includes('bass')) {
          const stemName = 'Bass';
          const trackName = file.name.replace(/bass[-_ ]?/i, '').replace(/\.[^/.]+$/, '');
          
          // Format the track name (lowercase with underscores)
          const formattedTrackName = trackName.toLowerCase().replace(/\s+/g, '_');
          
          // Build the filename: Bass_trackname.mp3
          const newFileName = `${stemName}_${formattedTrackName}.${file.ext}`;
          
          // Update file name, hash, and path properties
          file.name = newFileName;
          file.hash = `${file.hash.split('_')[0]}_${newFileName}`; // Maintain hash prefix
          file.path = file.path.replace(file.name, newFileName);
          
          strapi.log.info(`Renamed bass audio file to: ${file.name}`);
        }
      }
    }
    
    return file;
  }
}); 