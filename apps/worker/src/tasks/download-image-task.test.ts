import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadImage } from './download-image-task';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('downloadImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should download image successfully', async () => {
    const mockImageData = Buffer.from('mock-image-data');
    
    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const url = 'https://example.com/image.jpg';
    const result = await downloadImage(url);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('mock-image-data');
    expect(axios.get).toHaveBeenCalledWith(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
  });

  it('should handle large image downloads', async () => {
    const largeImageData = Buffer.alloc(5 * 1024 * 1024); // 5MB
    
    vi.mocked(axios.get).mockResolvedValue({
      data: largeImageData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const url = 'https://example.com/large-image.jpg';
    const result = await downloadImage(url);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(5 * 1024 * 1024);
  });

  it('should throw error on network failure', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('Network error'));

    const url = 'https://example.com/image.jpg';
    
    await expect(downloadImage(url)).rejects.toThrow('Network error');
  });

  it('should throw error on timeout', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('timeout of 30000ms exceeded'));

    const url = 'https://slow-server.com/image.jpg';
    
    await expect(downloadImage(url)).rejects.toThrow('timeout');
  });

  it('should throw error on 404', async () => {
    const error: any = new Error('Request failed with status code 404');
    error.response = {
      status: 404,
      statusText: 'Not Found',
    };
    
    vi.mocked(axios.get).mockRejectedValue(error);

    const url = 'https://example.com/not-found.jpg';
    
    await expect(downloadImage(url)).rejects.toThrow('404');
  });

  it('should throw error on 500', async () => {
    const error: any = new Error('Request failed with status code 500');
    error.response = {
      status: 500,
      statusText: 'Internal Server Error',
    };
    
    vi.mocked(axios.get).mockRejectedValue(error);

    const url = 'https://example.com/error.jpg';
    
    await expect(downloadImage(url)).rejects.toThrow('500');
  });

  it('should download from HTTP URL', async () => {
    const mockImageData = Buffer.from('http-image-data');
    
    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const url = 'http://example.com/image.jpg';
    const result = await downloadImage(url);

    expect(result).toBeInstanceOf(Buffer);
    expect(axios.get).toHaveBeenCalledWith(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
    });
  });

  it('should handle different image formats', async () => {
    const formats = ['jpg', 'png', 'gif', 'webp'];
    
    for (const format of formats) {
      const mockImageData = Buffer.from(`${format}-data`);
      
      vi.mocked(axios.get).mockResolvedValue({
        data: mockImageData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      });

      const url = `https://example.com/image.${format}`;
      const result = await downloadImage(url);

      expect(result).toBeInstanceOf(Buffer);
    }
  });

  it('should use 30 second timeout', async () => {
    const mockImageData = Buffer.from('image-data');
    
    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    await downloadImage('https://example.com/image.jpg');

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        timeout: 30000,
      })
    );
  });

  it('should use arraybuffer response type', async () => {
    const mockImageData = Buffer.from('image-data');
    
    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    await downloadImage('https://example.com/image.jpg');

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        responseType: 'arraybuffer',
      })
    );
  });
});
