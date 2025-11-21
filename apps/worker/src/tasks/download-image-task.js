"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadImage = exports.DownloadError = void 0;
const axios_1 = __importDefault(require("axios"));
const MAX_FILE_SIZE = 10 * 1024 * 1024;
class DownloadError extends Error {
    url;
    cause;
    constructor(message, url, cause) {
        super(message);
        this.url = url;
        this.cause = cause;
        this.name = "DownloadError";
    }
}
exports.DownloadError = DownloadError;
const downloadImage = async (url) => {
    try {
        try {
            const headResponse = await axios_1.default.head(url, {
                timeout: 10000,
                validateStatus: (status) => status < 500,
            });
            if (headResponse.status >= 400) {
                throw new DownloadError(`URL is not accessible (HTTP ${headResponse.status})`, url);
            }
            const contentType = headResponse.headers["content-type"];
            if (!contentType) {
                throw new DownloadError("URL does not point to an image - Content-Type header missing", url);
            }
            const normalizedContentType = contentType
                .split(";")[0]
                .trim()
                .toLowerCase();
            if (!normalizedContentType.startsWith("image/")) {
                throw new DownloadError(`URL does not point to an image - received Content-Type: ${normalizedContentType}`, url);
            }
            const contentLength = headResponse.headers["content-length"];
            if (contentLength) {
                const fileSize = parseInt(contentLength, 10);
                if (fileSize > MAX_FILE_SIZE) {
                    throw new DownloadError(`File size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`, url);
                }
            }
        }
        catch (error) {
            if (error instanceof DownloadError) {
                throw error;
            }
        }
        const response = await axios_1.default.get(url, {
            responseType: "arraybuffer",
            timeout: 30000,
            maxContentLength: MAX_FILE_SIZE,
            maxBodyLength: MAX_FILE_SIZE,
        });
        return Buffer.from(response.data);
    }
    catch (error) {
        if (error instanceof DownloadError) {
            throw error;
        }
        if (axios_1.default.isAxiosError(error)) {
            const axiosError = error;
            if (axiosError.code === "ENOTFOUND") {
                throw new DownloadError("Domain not found or DNS lookup failed", url, error);
            }
            if (axiosError.code === "ETIMEDOUT" ||
                axiosError.code === "ECONNABORTED") {
                throw new DownloadError("Connection timed out", url, error);
            }
            if (axiosError.code === "ECONNREFUSED") {
                throw new DownloadError("Connection refused by server", url, error);
            }
            if (axiosError.response?.status === 404) {
                throw new DownloadError("Image not found (HTTP 404)", url, error);
            }
            if (axiosError.response?.status) {
                throw new DownloadError(`Server returned error status: ${axiosError.response.status}`, url, error);
            }
            throw new DownloadError(`Network error: ${axiosError.message}`, url, error);
        }
        throw new DownloadError(`Failed to download image: ${error instanceof Error ? error.message : "Unknown error"}`, url, error instanceof Error ? error : undefined);
    }
};
exports.downloadImage = downloadImage;
//# sourceMappingURL=download-image-task.js.map