import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "../app";
import type { Express } from "express";
import type { Server } from "http";

describe("Body Size Limit", () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = createApp();
    
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== 'string') {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    return new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  it("should accept request body within 1mb limit", async () => {
    // Create a small valid JSON body (well under 1MB)
    const smallBody = {
      inputUrl: "https://example.com/image.jpg",
      transformations: {
        width: 800,
        height: 600,
      },
    };

    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(smallBody),
    });

    // Should not be rejected due to size (might fail for other reasons like Redis)
    expect(response.status).not.toBe(413);
  });

  it("should reject request body exceeding 1mb limit with 413 status", async () => {
    // Create a body larger than 1MB
    const largeString = "x".repeat(1024 * 1024 + 1000); // 1MB + 1000 bytes
    const largeBody = {
      inputUrl: "https://example.com/image.jpg",
      data: largeString,
    };

    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(largeBody),
    });

    expect(response.status).toBe(413);
  });

  it("should return appropriate error message for oversized body", async () => {
    // Create a body larger than 1MB
    const largeString = "x".repeat(1024 * 1024 + 1000);
    const largeBody = {
      inputUrl: "https://example.com/image.jpg",
      data: largeString,
    };

    const response = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(largeBody),
    });

    expect(response.status).toBe(413);
    
    const data = await response.json() as { error: string };
    expect(data.error).toBe("Request body too large");
  });
});
