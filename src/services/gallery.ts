import { API_URL, STRAPI_URL } from '../config/strapi';
import { toCdnUrl, getCdnDomain } from '../utils/cdn-url';

export interface GalleryItem {
  id: string;
  title: string;
  type: 'video' | 'image';
  mediaUrl: string;
  linkUrl: string;
}

function normalizeMediaUrl(url: string): string {
  if (!url) return '';
  // If already absolute (http/https), use CDN conversion
  if (/^https?:\/\//.test(url)) return toCdnUrl(url);
  // If relative /uploads/, use CDN in prod, Strapi in dev
  if (url.startsWith('/uploads/')) {
    if (process.env.NODE_ENV === 'production') {
      return `https://${getCdnDomain()}${url}`;
    } else {
      return `${STRAPI_URL}${url}`;
    }
  }
  return url;
}

export async function getGalleryItems(): Promise<GalleryItem[]> {
  const res = await fetch(`${API_URL}/gallery-items?populate=Thumbnail`);
  const data = await res.json();
  if (!data.data || !Array.isArray(data.data)) return [];
  return data.data
    .filter((item: any) => item && item.MediaUrl)
    .map((item: any) => ({
      id: item.id,
      title: item.Title,
      type: item.Type,
      mediaUrl: normalizeMediaUrl(item.MediaUrl),
      linkUrl: item.LinkURL,
    }));
} 