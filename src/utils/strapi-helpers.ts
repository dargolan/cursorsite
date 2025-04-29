import { STRAPI_URL, API_URL, API_TOKEN } from '../config/strapi';

/**
 * Try to find a file in Strapi's upload API by its name
 * @param filename The name of the file to find
 * @returns The URL of the file if found, null otherwise
 */
export async function findFileInStrapiByName(filename: string): Promise<string | null> {
  try {
    const apiUrl = `${API_URL}/upload/files`;
    console.log(`[DEBUG] Searching for file: ${filename} at ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(API_TOKEN ? { 'Authorization': `Bearer ${API_TOKEN}` } : {})
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching files: ${response.status}`);
    }

    const files = await response.json();
    const matchingFile = files.find((file: any) => 
      file.name.toLowerCase() === filename.toLowerCase()
    );

    if (matchingFile) {
      const url = `${STRAPI_URL}${matchingFile.url}`;
      console.log(`[DEBUG] Found file: ${url}`);
      return url;
    }

    console.log(`[DEBUG] File not found: ${filename}`);
    return null;
  } catch (error) {
    console.error('Error in findFileInStrapiByName:', error);
    return null;
  }
} 