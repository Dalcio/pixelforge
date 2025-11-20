import axios, { AxiosError } from "axios";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export class DownloadError extends Error {
  constructor(
    message: string,
    public readonly url: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "DownloadError";
  }
}

export const downloadImage = async (url: string): Promise<Buffer> => {
  try {
    // First, check Content-Length with HEAD request to avoid downloading large files
    try {
      const headResponse = await axios.head(url, {
        timeout: 10000,
      });

      const contentLength = headResponse.headers["content-length"];
      if (contentLength) {
        const fileSize = parseInt(contentLength, 10);
        if (fileSize > MAX_FILE_SIZE) {
          throw new DownloadError(
            `File size (${(fileSize / 1024 / 1024).toFixed(
              2
            )}MB) exceeds maximum allowed size of ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB`,
            url
          );
        }
      }

      const contentType = headResponse.headers["content-type"];
      if (contentType && !contentType.startsWith("image/")) {
        throw new DownloadError(
          `Invalid content type: ${contentType}. Expected image/* type.`,
          url
        );
      }
    } catch (error) {
      if (error instanceof DownloadError) {
        throw error;
      }
      // Continue with GET request for other errors (e.g., HEAD not supported)
    }

    const response = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: MAX_FILE_SIZE,
      maxBodyLength: MAX_FILE_SIZE,
    });

    return Buffer.from(response.data);
  } catch (error) {
    if (error instanceof DownloadError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === "ENOTFOUND") {
        throw new DownloadError(
          "Domain not found or DNS lookup failed",
          url,
          error
        );
      }

      if (
        axiosError.code === "ETIMEDOUT" ||
        axiosError.code === "ECONNABORTED"
      ) {
        throw new DownloadError("Connection timed out", url, error);
      }

      if (axiosError.code === "ECONNREFUSED") {
        throw new DownloadError("Connection refused by server", url, error);
      }

      if (axiosError.response?.status === 404) {
        throw new DownloadError("Image not found (HTTP 404)", url, error);
      }

      if (axiosError.response?.status) {
        throw new DownloadError(
          `Server returned error status: ${axiosError.response.status}`,
          url,
          error
        );
      }

      throw new DownloadError(
        `Network error: ${axiosError.message}`,
        url,
        error
      );
    }

    throw new DownloadError(
      `Failed to download image: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      url,
      error instanceof Error ? error : undefined
    );
  }
};
