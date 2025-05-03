/**
 * Debug utility functions
 */

/**
 * Check if a URL exists and is accessible
 * @param url - The URL to check
 * @returns Promise resolving to true if the URL exists and is accessible
 */
export async function testUrlAccess(url: string): Promise<boolean> {
  console.log(`[DEBUG] Testing URL access: ${url}`);
  
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors'
    });
    
    console.log(`[DEBUG] URL ${url} status: ${response.status}`);
    return response.ok;
  } catch (e) {
    console.error(`[DEBUG] URL ${url} is not accessible:`, e);
    return false;
  }
}

/**
 * Check localStorage for debugging purposes
 */
export function inspectLocalStorage(): Record<string, unknown> {
  console.log('[DEBUG] All localStorage keys:');
  const result: Record<string, unknown> = {};
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        result[key] = value;
        console.log(`- ${key}`);
      }
    }
  } catch (e) {
    console.error('[DEBUG] Error listing localStorage keys:', e);
  }
  
  return result;
} 