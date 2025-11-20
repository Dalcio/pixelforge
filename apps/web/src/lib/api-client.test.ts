import { describe, it, expect, vi, beforeEach } from "vitest";
import { createJob } from "./api-client";

describe("api-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createJob", () => {
    it("should successfully create a job", async () => {
      const mockResponse = {
        id: "test-job-id",
        status: "pending",
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => mockResponse,
        } as Response)
      );

      const result = await createJob({
        inputUrl: "https://example.com/image.jpg",
      });

      expect(result).toEqual(mockResponse);
      vi.unstubAllGlobals();
    });

    it("should handle 503 service unavailable with user-friendly message", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 503,
          text: async () =>
            JSON.stringify({
              error:
                "Service temporarily unavailable. Queue system is not connected.",
            }),
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/image.jpg" })
      ).rejects.toThrow(
        "⚠️ Service temporarily unavailable. Please try again in a moment."
      );

      vi.unstubAllGlobals();
    });

    it("should handle 400 validation errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: async () => JSON.stringify({ error: "URL is not reachable" }),
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/invalid.jpg" })
      ).rejects.toThrow("URL is not reachable");

      vi.unstubAllGlobals();
    });

    it("should handle 404 not found", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          text: async () => JSON.stringify({ error: "Not found" }),
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/missing.jpg" })
      ).rejects.toThrow("🔍 Resource not found.");

      vi.unstubAllGlobals();
    });

    it("should handle 429 rate limiting", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 429,
          text: async () => JSON.stringify({ error: "Too many requests" }),
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/image.jpg" })
      ).rejects.toThrow("⏱️ Too many requests. Please slow down.");

      vi.unstubAllGlobals();
    });

    it("should handle 500 server errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => JSON.stringify({ error: "Internal server error" }),
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/image.jpg" })
      ).rejects.toThrow(
        "❌ Server error occurred. Please try again or contact support if the issue persists."
      );

      vi.unstubAllGlobals();
    });

    it("should handle network errors", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockRejectedValue(new TypeError("Failed to fetch"))
      );

      await expect(
        createJob({ inputUrl: "https://example.com/image.jpg" })
      ).rejects.toThrow(
        "🌐 Cannot connect to server. Please check your internet connection."
      );

      vi.unstubAllGlobals();
    });

    it("should handle non-JSON error responses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          text: async () => "Plain text error",
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/image.jpg" })
      ).rejects.toThrow("Plain text error");

      vi.unstubAllGlobals();
    });

    it("should handle empty error responses", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          text: async () => "",
        } as Response)
      );

      await expect(
        createJob({ inputUrl: "https://example.com/image.jpg" })
      ).rejects.toThrow(
        "❌ Server error occurred. Please try again or contact support if the issue persists."
      );

      vi.unstubAllGlobals();
    });

    it("should pass transformations to the API", async () => {
      const mockResponse = {
        id: "test-job-id",
        status: "pending",
      };

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      vi.stubGlobal("fetch", mockFetch);

      const transformations = {
        width: 800,
        height: 600,
        grayscale: true,
      };

      await createJob({
        inputUrl: "https://example.com/image.jpg",
        transformations,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/jobs"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputUrl: "https://example.com/image.jpg",
            transformations,
          }),
        })
      );

      vi.unstubAllGlobals();
    });
  });
});
