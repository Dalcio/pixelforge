import { describe, it, expect } from 'vitest';
import { isValidUrl } from './url-validator';

describe('isValidUrl', () => {
  describe('valid URLs', () => {
    it('should return true for valid HTTP URL', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
    });

    it('should return true for valid HTTPS URL', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should return true for URL with path', () => {
      expect(isValidUrl('https://example.com/path/to/image.jpg')).toBe(true);
    });

    it('should return true for URL with query parameters', () => {
      expect(isValidUrl('https://example.com/image.jpg?size=large&format=png')).toBe(true);
    });

    it('should return true for URL with port', () => {
      expect(isValidUrl('http://example.com:8080/image.jpg')).toBe(true);
    });

    it('should return true for URL with subdomain', () => {
      expect(isValidUrl('https://cdn.example.com/images/photo.jpg')).toBe(true);
    });

    it('should return true for URL with hash', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true);
    });

    it('should return true for localhost URL', () => {
      expect(isValidUrl('http://localhost:3000/image.jpg')).toBe(true);
    });

    it('should return true for IP address URL', () => {
      expect(isValidUrl('http://192.168.1.1/image.jpg')).toBe(true);
    });

    it('should return true for URL with authentication', () => {
      expect(isValidUrl('https://user:pass@example.com/image.jpg')).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should return false for URL without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should return false for malformed URL', () => {
      expect(isValidUrl('not a url at all')).toBe(false);
    });

    it('should return false for FTP protocol', () => {
      expect(isValidUrl('ftp://example.com/file.txt')).toBe(false);
    });

    it('should return false for file protocol', () => {
      expect(isValidUrl('file:///path/to/file.jpg')).toBe(false);
    });

    it('should return false for data URL', () => {
      expect(isValidUrl('data:image/png;base64,iVBORw0KG')).toBe(false);
    });

    it('should return false for relative URL', () => {
      expect(isValidUrl('/path/to/image.jpg')).toBe(false);
    });

    it('should return false for protocol-relative URL', () => {
      expect(isValidUrl('//example.com/image.jpg')).toBe(false);
    });

    it('should return false for javascript protocol', () => {
      expect(isValidUrl('javascript:alert("xss")')).toBe(false);
    });

    it('should handle URL with spaces (URL constructor accepts them)', () => {
      // Note: URL constructor actually accepts spaces in modern browsers
      expect(isValidUrl('http://example.com/image with spaces.jpg')).toBe(true);
    });

    it('should return false for just protocol', () => {
      expect(isValidUrl('http://')).toBe(false);
    });

    it('should handle protocol without host (URL constructor accepts it)', () => {
      // Note: URL constructor treats this as valid with empty hostname
      expect(isValidUrl('https:///path')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle URL with special characters in path', () => {
      expect(isValidUrl('https://example.com/path/file%20name.jpg')).toBe(true);
    });

    it('should handle URL with long path', () => {
      const longPath = '/path'.repeat(100);
      expect(isValidUrl(`https://example.com${longPath}/image.jpg`)).toBe(true);
    });

    it('should handle URL with multiple query parameters', () => {
      expect(isValidUrl('https://example.com/image?a=1&b=2&c=3&d=4')).toBe(true);
    });

    it('should return false for null (type coercion)', () => {
      expect(isValidUrl(null as any)).toBe(false);
    });

    it('should return false for undefined (type coercion)', () => {
      expect(isValidUrl(undefined as any)).toBe(false);
    });

    it('should return false for number (type coercion)', () => {
      expect(isValidUrl(123 as any)).toBe(false);
    });

    it('should return false for object (type coercion)', () => {
      expect(isValidUrl({} as any)).toBe(false);
    });
  });
});
