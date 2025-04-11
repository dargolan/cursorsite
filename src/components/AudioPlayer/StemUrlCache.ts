class StemUrlCache {
  private static instance: StemUrlCache;
  private cache: Record<string, string> = {};

  private constructor() {
    this.initializeFromLocalStorage();
  }

  static getInstance(): StemUrlCache {
    if (!StemUrlCache.instance) {
      StemUrlCache.instance = new StemUrlCache();
    }
    return StemUrlCache.instance;
  }

  private initializeFromLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      // Clear cache first to ensure we don't use old URLs (uncomment to reset cache)
      localStorage.removeItem('stemUrlCache');
      console.log('Cleared stem URL cache for fresh loading');
      
      const storedCache = localStorage.getItem('stemUrlCache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        Object.assign(this.cache, parsedCache);
        console.log('Loaded stem URL cache from localStorage:', Object.keys(parsedCache).length, 'entries');
      }
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
    }
  }

  saveUrl(trackTitle: string, stemName: string, url: string) {
    const cacheKey = this.getCacheKey(trackTitle, stemName);
    this.cache[cacheKey] = url;
    
    try {
      if (typeof window !== 'undefined') {
        const existingCache = localStorage.getItem('stemUrlCache');
        const cache = existingCache ? JSON.parse(existingCache) : {};
        cache[cacheKey] = url;
        localStorage.setItem('stemUrlCache', JSON.stringify(cache));
        console.log(`Cached URL for ${stemName} (${trackTitle}) to localStorage`);
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  getUrl(trackTitle: string, stemName: string): string | null {
    const cacheKey = this.getCacheKey(trackTitle, stemName);
    return this.cache[cacheKey] || null;
  }

  private getCacheKey(trackTitle: string, stemName: string): string {
    return `${trackTitle}:${stemName}`;
  }

  clearCache() {
    this.cache = {};
    if (typeof window !== 'undefined') {
      localStorage.removeItem('stemUrlCache');
    }
  }
}

export const stemUrlCache = StemUrlCache.getInstance(); 