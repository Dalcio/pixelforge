import axios from 'axios';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export const downloadImage = async (url: string): Promise<Buffer> => {
  // First, check Content-Length with HEAD request to avoid downloading large files
  try {
    const headResponse = await axios.head(url, {
      timeout: 10000,
    });

    const contentLength = headResponse.headers['content-length'];
    if (contentLength) {
      const fileSize = parseInt(contentLength, 10);
      if (fileSize > MAX_FILE_SIZE) {
        throw new Error(
          `File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
        );
      }
    }
  } catch (error) {
    // If HEAD request fails, we'll still attempt GET but with size limits
    if (error instanceof Error && error.message.includes('exceeds maximum')) {
      throw error; // Re-throw file size errors
    }
    // Continue with GET request for other errors (e.g., HEAD not supported)
  }

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    maxContentLength: MAX_FILE_SIZE,
    maxBodyLength: MAX_FILE_SIZE,
  });

  return Buffer.from(response.data);
};
