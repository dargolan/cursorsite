import { toCdnUrl, isCdnUrl, getCdnDomain, getS3Domain } from '../cdn-url';

describe('CDN URL Utilities', () => {
  const mockS3Url = 'https://wave-cave-audio.s3.amazonaws.com/tracks/song.mp3';
  const mockCdnUrl = 'https://d1r94114aksajj.cloudfront.net/tracks/song.mp3';
  
  describe('toCdnUrl', () => {
    it('should convert S3 URL to CDN URL', () => {
      expect(toCdnUrl(mockS3Url)).toBe(mockCdnUrl);
    });

    it('should return empty string for empty input', () => {
      expect(toCdnUrl('')).toBe('');
    });

    it('should return original URL if not an S3 URL', () => {
      const otherUrl = 'https://example.com/image.jpg';
      expect(toCdnUrl(otherUrl)).toBe(otherUrl);
    });
  });

  describe('isCdnUrl', () => {
    it('should return true for CDN URLs', () => {
      expect(isCdnUrl(mockCdnUrl)).toBe(true);
    });

    it('should return false for non-CDN URLs', () => {
      expect(isCdnUrl(mockS3Url)).toBe(false);
    });
  });

  describe('getCdnDomain', () => {
    it('should return the CDN domain', () => {
      expect(getCdnDomain()).toBe('d1r94114aksajj.cloudfront.net');
    });
  });

  describe('getS3Domain', () => {
    it('should return the S3 domain', () => {
      expect(getS3Domain()).toBe('wave-cave-audio.s3.amazonaws.com');
    });
  });
}); 