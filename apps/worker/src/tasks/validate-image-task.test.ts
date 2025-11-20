import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateImage } from './validate-image-task';
import sharp from 'sharp';

// Mock sharp
vi.mock('sharp');

describe('validateImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for valid image with width and height', async () => {
    const mockMetadata = {
      width: 800,
      height: 600,
      format: 'jpeg',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('fake-image-data');
    const result = await validateImage(buffer);

    expect(result).toBe(true);
    expect(sharp).toHaveBeenCalledWith(buffer);
  });

  it('should return true for valid PNG image', async () => {
    const mockMetadata = {
      width: 1920,
      height: 1080,
      format: 'png',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('fake-png-data');
    const result = await validateImage(buffer);

    expect(result).toBe(true);
  });

  it('should return false for image without width', async () => {
    const mockMetadata = {
      height: 600,
      format: 'jpeg',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('fake-image-data');
    const result = await validateImage(buffer);

    expect(result).toBe(false);
  });

  it('should return false for image without height', async () => {
    const mockMetadata = {
      width: 800,
      format: 'jpeg',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('fake-image-data');
    const result = await validateImage(buffer);

    expect(result).toBe(false);
  });

  it('should return false for corrupted image data', async () => {
    const mockSharp = {
      metadata: vi.fn().mockRejectedValue(new Error('Invalid image')),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('corrupted-data');
    const result = await validateImage(buffer);

    expect(result).toBe(false);
  });

  it('should return false when sharp throws error', async () => {
    const mockSharp = {
      metadata: vi.fn().mockRejectedValue(new Error('Sharp processing error')),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('invalid-data');
    const result = await validateImage(buffer);

    expect(result).toBe(false);
  });

  it('should handle empty buffer', async () => {
    const mockSharp = {
      metadata: vi.fn().mockRejectedValue(new Error('Input buffer is empty')),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('');
    const result = await validateImage(buffer);

    expect(result).toBe(false);
  });

  it('should validate very small images', async () => {
    const mockMetadata = {
      width: 1,
      height: 1,
      format: 'png',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('tiny-image');
    const result = await validateImage(buffer);

    expect(result).toBe(true);
  });

  it('should validate very large images', async () => {
    const mockMetadata = {
      width: 10000,
      height: 8000,
      format: 'jpeg',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('large-image');
    const result = await validateImage(buffer);

    expect(result).toBe(true);
  });

  it('should return true for metadata with zero dimensions (edge case)', async () => {
    const mockMetadata = {
      width: 0,
      height: 0,
      format: 'jpeg',
    };

    const mockSharp = {
      metadata: vi.fn().mockResolvedValue(mockMetadata),
    };

    vi.mocked(sharp).mockReturnValue(mockSharp as any);

    const buffer = Buffer.from('zero-dimensions');
    const result = await validateImage(buffer);

    // Zero is technically defined, so it passes the validation check
    expect(result).toBe(true);
  });
});
