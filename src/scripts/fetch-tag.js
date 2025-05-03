/**
 * Fetch and display a single tag from Strapi
 */

const fetchTag = async () => {
  try {
    const response = await fetch('http://localhost:1337/api/tags?populate=*');
    const data = await response.json();
    
    if (data.data && data.data.length > 0) {
      console.log('First tag sample (raw structure):');
      console.log(JSON.stringify(data.data[0], null, 2));
      
      // Extract all field names from the first tag to understand the structure
      const tag = data.data[0];
      console.log('\nTag fields available:');
      
      // Get all direct fields
      const directFields = Object.keys(tag);
      console.log('Direct fields:', directFields.join(', '));
      
      // Check if attributes field exists and get its fields
      if (tag.attributes) {
        console.log('Fields in attributes:', Object.keys(tag.attributes).join(', '));
      }
      
      // Check for specific fields we need
      console.log('\nRequired field values:');
      console.log(`ID: ${tag.id}`);
      console.log(`Name field: ${tag.name !== undefined ? `"${tag.name}" (direct)` : (tag.attributes?.name !== undefined ? `"${tag.attributes.name}" (in attributes)` : 'Not found')}`);
      console.log(`Type field: ${tag.type !== undefined ? `"${tag.type}" (direct)` : (tag.attributes?.type !== undefined ? `"${tag.attributes.type}" (in attributes)` : 'Not found')}`);
      
      // Check valid types
      const validTypes = ['genre', 'mood', 'instrument'];
      const typeValue = tag.type || tag.attributes?.type;
      if (typeValue) {
        console.log(`Type value "${typeValue}" is ${validTypes.includes(typeValue) ? 'valid ✅' : 'NOT valid ❌'}`);
      }
      
      // Count tags by type
      console.log('\nAll tags in system:');
      data.data.forEach((tag, index) => {
        const id = tag.id;
        const name = tag.name || tag.attributes?.name || 'Unknown';
        const type = tag.type || tag.attributes?.type || 'unknown';
        console.log(`${index + 1}. [${id}] ${name} (${type})`);
      });
      
      // Tag counts by type
      const tagsByType = {};
      data.data.forEach(tag => {
        const type = tag.type || tag.attributes?.type || 'unknown';
        tagsByType[type] = (tagsByType[type] || 0) + 1;
      });
      
      console.log('\nTag counts by type:');
      Object.entries(tagsByType).forEach(([type, count]) => {
        console.log(`- ${type}: ${count} tags`);
      });
      
      // Suggest needed changes
      console.log('\nRecommendations:');
      if (!validTypes.includes(typeValue)) {
        console.log('❌ Update your Tag collection in Strapi to use the correct type values: genre, mood, instrument');
      } else {
        console.log('✅ Your tag structure looks compatible with the upload page');
      }
    } else {
      console.log('No tags found in Strapi');
    }
  } catch (error) {
    console.error('Error fetching tag:', error);
  }
};

fetchTag(); 