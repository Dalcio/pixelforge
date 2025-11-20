import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApp } from "./app";
import type { Express } from "express";
import type { Server } from "http";

interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
}

describe("Health Endpoint", () => {
  let app: Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = createApp();

    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address !== "string") {
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

  it("should return 200 status", async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
  });

  it("should return correct response structure", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const data = (await response.json()) as HealthResponse;

    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("uptime");
    expect(data).toHaveProperty("timestamp");
  });

  it("should return status as 'ok'", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const data = (await response.json()) as HealthResponse;

    expect(data.status).toBe("ok");
  });

  it("should return uptime as a number", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const data = (await response.json()) as HealthResponse;

    expect(typeof data.uptime).toBe("number");
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it("should return timestamp in ISO format", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const data = (await response.json()) as HealthResponse;

    expect(data.timestamp).toBeDefined();
    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });

  it("should not require authentication", async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
  });

  it("should always return 200 even with multiple concurrent requests", async () => {
    const requests = Array.from({ length: 10 }, () =>
      fetch(`${baseUrl}/health`)
    );

    const responses = await Promise.all(requests);

    for (const response of responses) {
      expect(response.status).toBe(200);
      const data = (await response.json()) as HealthResponse;
      expect(data.status).toBe("ok");
    }
  });
});
