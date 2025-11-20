import { describe, it, expect } from 'vitest';
import { isImageUrl } from './image-validator';

describe('isImageUrl', () => {
  describe('valid image URLs', () => {
    it('should return true for .jpg extension', () => {
      expect(isImageUrl('https://example.com/image.jpg')).toBe(true);
    });

    it('should return true for .jpeg extension', () => {
      expect(isImageUrl('https://example.com/photo.jpeg')).toBe(true);
    });

    it('should return true for .png extension', () => {
      expect(isImageUrl('https://example.com/graphic.png')).toBe(true);
    });

    it('should return true for .gif extension', () => {
      expect(isImageUrl('https://example.com/animation.gif')).toBe(true);
    });

    it('should return true for .webp extension', () => {
      expect(isImageUrl('https://example.com/modern.webp')).toBe(true);
    });

    it('should return true for .bmp extension', () => {
      expect(isImageUrl('https://example.com/bitmap.bmp')).toBe(true);
    });

    it('should be case-insensitive for extensions', () => {
      expect(isImageUrl('https://example.com/IMAGE.JPG')).toBe(true);
      expect(isImageUrl('https://example.com/photo.JPEG')).toBe(true);
      expect(isImageUrl('https://example.com/Graphic.PNG')).toBe(true);
    });

    it('should work with mixed case extensions', () => {
      expect(isImageUrl('https://example.com/file.JpG')).toBe(true);
      expect(isImageUrl('https://example.com/file.PnG')).toBe(true);
    });

    it('should work with query parameters after extension', () => {
      expect(isImageUrl('https://example.com/image.jpg?size=large')).toBe(true);
    });

    it('should work with hash after extension', () => {
      expect(isImageUrl('https://example.com/image.png#anchor')).toBe(true);
    });

    it('should work with path containing extension in directory', () => {
      expect(isImageUrl('https://example.com/images.jpg/photo.png')).toBe(true);
    });
  });

  describe('invalid image URLs', () => {
    it('should return false for non-image extensions', () => {
      expect(isImageUrl('https://example.com/document.pdf')).toBe(false);
    });

    it('should return false for text files', () => {
      expect(isImageUrl('https://example.com/file.txt')).toBe(false);
    });

    it('should return false for video files', () => {
      expect(isImageUrl('https://example.com/video.mp4')).toBe(false);
    });

    it('should return false for URLs without extensions', () => {
      expect(isImageUrl('https://example.com/image')).toBe(false);
    });

    it('should return false for HTML pages', () => {
      expect(isImageUrl('https://example.com/page.html')).toBe(false);
    });

    it('should return false for JavaScript files', () => {
      expect(isImageUrl('https://example.com/script.js')).toBe(false);
    });

    it('should return false for CSS files', () => {
      expect(isImageUrl('https://example.com/style.css')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isImageUrl('')).toBe(false);
    });

    it('should return false for URL with no extension', () => {
      expect(isImageUrl('https://example.com/')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle URLs with multiple dots', () => {
      expect(isImageUrl('https://example.com/my.image.file.jpg')).toBe(true);
    });

    it('should handle S3-style URLs', () => {
      expect(isImageUrl('https://bucket.s3.amazonaws.com/path/to/image.jpg')).toBe(true);
    });

    it('should handle CDN URLs', () => {
      expect(isImageUrl('https://cdn.example.com/images/photo.png')).toBe(true);
    });

    it('should handle URLs with encoded characters', () => {
      expect(isImageUrl('https://example.com/my%20image.jpg')).toBe(true);
    });

    it('should return true even if extension appears multiple times', () => {
      expect(isImageUrl('https://example.com/jpg.jpg')).toBe(true);
    });

    it('should handle localhost URLs', () => {
      expect(isImageUrl('http://localhost:3000/uploads/image.png')).toBe(true);
    });

    it('should handle IP address URLs', () => {
      expect(isImageUrl('http://192.168.1.1/image.jpg')).toBe(true);
    });

    it('should return false for URLs with image extension in query param only', () => {
      expect(isImageUrl('https://example.com/file?format=jpg')).toBe(false);
    });

    it('should return false for data URLs without image file extension', () => {
      // Data URLs don't have file extensions in the path
      expect(isImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg')).toBe(false);
    });

    it('should handle very long URLs', () => {
      const longPath = '/path'.repeat(50);
      expect(isImageUrl(`https://example.com${longPath}/image.jpg`)).toBe(true);
    });
  });

  describe('security considerations', () => {
    it('should detect image extension anywhere in URL (current behavior)', () => {
      // Current implementation checks if extension appears anywhere in URL
      // This detects .jpg in the path, so returns true
      expect(isImageUrl('https://example.com/folder.jpg/malicious.txt')).toBe(true);
    });

    it('should detect image extension anywhere in URL', () => {
      // Current implementation checks if extension appears anywhere
      // This might be intentional or could be a security consideration
      expect(isImageUrl('https://example.com/photos.jpg/data')).toBe(true);
    });
  });
});
