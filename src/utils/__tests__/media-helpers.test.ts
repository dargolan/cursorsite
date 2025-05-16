import { getProxiedMediaUrl, isRelativeUrl, getAbsoluteUrl, getTrackCoverImageUrl } from '../media-helpers';
import { STRAPI_URL } from '../../config/strapi';

describe('Media Helper Utilities', () => {
  describe('getProxiedMediaUrl', () => {
    it('should convert S3 URL to CDN URL', () => {
      const s3Url = 'https://wave-cave-audio.s3.amazonaws.com/tracks/song.mp3';
      const expectedCdnUrl = 'https://d1r94114aksajj.cloudfront.net/tracks/song.mp3';
      expect(getProxiedMediaUrl(s3Url)).toBe(expectedCdnUrl);
    });

    it('should return empty string for empty input', () => {
      expect(getProxiedMediaUrl('')).toBe('');
    });

    it('should return original URL if already a CDN URL', () => {
      const cdnUrl = 'https://d1r94114aksajj.cloudfront.net/tracks/song.mp3';
      expect(getProxiedMediaUrl(cdnUrl)).toBe(cdnUrl);
    });
  });

  describe('isRelativeUrl', () => {
    it('should return true for relative URLs', () => {
      expect(isRelativeUrl('/uploads/image.jpg')).toBe(true);
      expect(isRelativeUrl('uploads/image.jpg')).toBe(true);
    });

    it('should return false for absolute URLs', () => {
      expect(isRelativeUrl('https://example.com/image.jpg')).toBe(false);
      expect(isRelativeUrl('http://localhost:1337/uploads/image.jpg')).toBe(false);
    });
  });

  describe('getAbsoluteUrl', () => {
    it('should convert relative URL to absolute URL', () => {
      const relativeUrl = '/uploads/image.jpg';
      const expectedUrl = `${STRAPI_URL}${relativeUrl}`;
      expect(getAbsoluteUrl(relativeUrl)).toBe(expectedUrl);
    });

    it('should return original URL if already absolute', () => {
      const absoluteUrl = 'https://example.com/image.jpg';
      expect(getAbsoluteUrl(absoluteUrl)).toBe(absoluteUrl);
    });

    it('should return empty string for empty input', () => {
      expect(getAbsoluteUrl('')).toBe('');
    });
  });

  describe('getTrackCoverImageUrl', () => {
    it('should return proxied URL for track with imageUrl', () => {
      const track = {
        id: '123',
        imageUrl: 'https://wave-cave-audio.s3.amazonaws.com/covers/song.jpg'
      };
      const expectedUrl = 'https://d1r94114aksajj.cloudfront.net/covers/song.jpg';
      expect(getTrackCoverImageUrl(track)).toBe(expectedUrl);
    });

    it('should return empty string for track without imageUrl', () => {
      const track = { id: '123' };
      expect(getTrackCoverImageUrl(track)).toBe('');
    });
  });
}); 