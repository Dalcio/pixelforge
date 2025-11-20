import { describe, it, expect, vi, beforeEach } from "vitest";
import { downloadImage } from "./download-image-task";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("downloadImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should download image successfully when size is under limit", async () => {
    const mockImageData = Buffer.from("mock-image-data");

    // Mock HEAD request with valid Content-Length
    vi.mocked(axios.head).mockResolvedValue({
      headers: { "content-length": "1048576" }, // 1MB
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const url = "https://example.com/image.jpg";
    const result = await downloadImage(url);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe("mock-image-data");
    expect(axios.head).toHaveBeenCalledWith(url, {
      timeout: 10000,
    });
    expect(axios.get).toHaveBeenCalledWith(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      maxContentLength: 10 * 1024 * 1024,
      maxBodyLength: 10 * 1024 * 1024,
    });
  });

  it("should reject files larger than 10MB based on Content-Length header", async () => {
    const largeFileSize = 15 * 1024 * 1024; // 15MB

    vi.mocked(axios.head).mockResolvedValue({
      headers: { "content-length": largeFileSize.toString() },
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    const url = "https://example.com/large-image.jpg";

    await expect(downloadImage(url)).rejects.toThrow(
      /File size.*15\.00MB.*exceeds maximum allowed size of 10MB/
    );

    expect(axios.get).not.toHaveBeenCalled();
  });

  it("should reject files exactly at 10MB + 1 byte", async () => {
    const fileSize = 10 * 1024 * 1024 + 1; // 10MB + 1 byte

    vi.mocked(axios.head).mockResolvedValue({
      headers: { "content-length": fileSize.toString() },
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    await expect(
      downloadImage("https://example.com/image.jpg")
    ).rejects.toThrow(/exceeds maximum allowed size of 10MB/);
  });

  it("should allow files exactly at 10MB", async () => {
    const fileSize = 10 * 1024 * 1024; // Exactly 10MB
    const mockImageData = Buffer.from("mock-image-data");

    vi.mocked(axios.head).mockResolvedValue({
      headers: { "content-length": fileSize.toString() },
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await downloadImage("https://example.com/image.jpg");
    expect(result).toBeInstanceOf(Buffer);
  });

  it("should continue with GET if HEAD fails (server does not support HEAD)", async () => {
    const mockImageData = Buffer.from("mock-image-data");

    // Mock HEAD request failure
    vi.mocked(axios.head).mockRejectedValue(new Error("Method not allowed"));

    // Mock GET request success
    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await downloadImage("https://example.com/image.jpg");
    expect(result).toBeInstanceOf(Buffer);
    expect(axios.get).toHaveBeenCalled();
  });

  it("should continue with GET if Content-Length header is missing", async () => {
    const mockImageData = Buffer.from("mock-image-data");

    vi.mocked(axios.head).mockResolvedValue({
      headers: {}, // No Content-Length
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await downloadImage("https://example.com/image.jpg");
    expect(result).toBeInstanceOf(Buffer);
  });

  it("should throw error if axios GET exceeds maxContentLength", async () => {
    vi.mocked(axios.head).mockResolvedValue({
      headers: {},
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockRejectedValue(
      new Error("maxContentLength size of 10485760 exceeded")
    );

    await expect(
      downloadImage("https://example.com/huge.jpg")
    ).rejects.toThrow("maxContentLength");
  });

  it("should handle large image downloads under 10MB", async () => {
    const largeImageData = Buffer.alloc(5 * 1024 * 1024); // 5MB

    vi.mocked(axios.head).mockResolvedValue({
      headers: { "content-length": (5 * 1024 * 1024).toString() },
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: largeImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const url = "https://example.com/large-image.jpg";
    const result = await downloadImage(url);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBe(5 * 1024 * 1024);
  });

  it("should throw error on network failure", async () => {
    vi.mocked(axios.head).mockRejectedValue(new Error("Network error"));
    vi.mocked(axios.get).mockRejectedValue(new Error("Network error"));

    const url = "https://example.com/image.jpg";

    await expect(downloadImage(url)).rejects.toThrow("Network error");
  });

  it("should throw error on timeout", async () => {
    vi.mocked(axios.head).mockResolvedValue({
      headers: {},
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockRejectedValue(
      new Error("timeout of 30000ms exceeded")
    );

    const url = "https://slow-server.com/image.jpg";

    await expect(downloadImage(url)).rejects.toThrow("timeout");
  });

  it("should throw error on 404", async () => {
    vi.mocked(axios.head).mockResolvedValue({
      headers: {},
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    const error: any = new Error("Request failed with status code 404");
    error.response = {
      status: 404,
      statusText: "Not Found",
    };

    vi.mocked(axios.get).mockRejectedValue(error);

    const url = "https://example.com/not-found.jpg";

    await expect(downloadImage(url)).rejects.toThrow("404");
  });

  it("should throw error on 500", async () => {
    vi.mocked(axios.head).mockResolvedValue({
      headers: {},
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    const error: any = new Error("Request failed with status code 500");
    error.response = {
      status: 500,
      statusText: "Internal Server Error",
    };

    vi.mocked(axios.get).mockRejectedValue(error);

    const url = "https://example.com/error.jpg";

    await expect(downloadImage(url)).rejects.toThrow("500");
  });

  it("should download from HTTP URL", async () => {
    const mockImageData = Buffer.from("http-image-data");

    vi.mocked(axios.head).mockResolvedValue({
      headers: { "content-length": "100" },
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const url = "http://example.com/image.jpg";
    const result = await downloadImage(url);

    expect(result).toBeInstanceOf(Buffer);
    expect(axios.get).toHaveBeenCalledWith(
      url,
      expect.objectContaining({
        maxContentLength: 10 * 1024 * 1024,
        maxBodyLength: 10 * 1024 * 1024,
      })
    );
  });

  it("should handle different image formats", async () => {
    const formats = ["jpg", "png", "gif", "webp"];

    for (const format of formats) {
      const mockImageData = Buffer.from(`${format}-data`);

      vi.mocked(axios.head).mockResolvedValue({
        headers: { "content-length": "1000" },
        status: 200,
        statusText: "OK",
        config: {} as any,
        data: undefined,
      });

      vi.mocked(axios.get).mockResolvedValue({
        data: mockImageData,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });

      const url = `https://example.com/image.${format}`;
      const result = await downloadImage(url);

      expect(result).toBeInstanceOf(Buffer);
    }
  });

  it("should use 30 second timeout for GET request", async () => {
    const mockImageData = Buffer.from("image-data");

    vi.mocked(axios.head).mockResolvedValue({
      headers: {},
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    await downloadImage("https://example.com/image.jpg");

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        timeout: 30000,
      })
    );
  });

  it("should use arraybuffer response type", async () => {
    const mockImageData = Buffer.from("image-data");

    vi.mocked(axios.head).mockResolvedValue({
      headers: {},
      status: 200,
      statusText: "OK",
      config: {} as any,
      data: undefined,
    });

    vi.mocked(axios.get).mockResolvedValue({
      data: mockImageData,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    await downloadImage("https://example.com/image.jpg");

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        responseType: "arraybuffer",
      })
    );
  });
});
