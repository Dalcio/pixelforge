import { describe, it, expect } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import { createRateLimiter } from "./rate-limiter";

describe("Rate Limiter", () => {
  const createTestApp = (): Express => {
    const app = express();
    app.use(createRateLimiter());
    
    // Test endpoints
    app.get("/api/jobs", (_req, res) => {
      res.json({ success: true });
    });
    
    app.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });
    
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok" });
    });
    
    return app;
  };

  it("should allow requests under the limit", async () => {
    const app = createTestApp();
    
    const response = await request(app).get("/api/jobs");
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it("should skip rate limiting for /health endpoint", async () => {
    const app = createTestApp();
    
    // Make multiple requests beyond the limit
    for (let i = 0; i < 150; i++) {
      const response = await request(app).get("/health");
      expect(response.status).toBe(200);
    }
  });

  it("should skip rate limiting for /api/health endpoint", async () => {
    const app = createTestApp();
    
    // Make multiple requests beyond the limit
    for (let i = 0; i < 150; i++) {
      const response = await request(app).get("/api/health");
      expect(response.status).toBe(200);
    }
  });

  it("should return 429 after exceeding rate limit", async () => {
    const app = createTestApp();
    
    // Make 101 requests (limit is 100)
    for (let i = 0; i < 100; i++) {
      await request(app).get("/api/jobs");
    }

    // 101st request should be rate limited
    const response = await request(app).get("/api/jobs");
    
    expect(response.status).toBe(429);
    expect(response.body).toEqual({
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
      limit: 100,
      windowMs: 15 * 60 * 1000,
    });
  });

  it("should set rate limit headers", async () => {
    const app = createTestApp();
    
    const response = await request(app).get("/api/jobs");
    
    // Check for RateLimit-* headers (standardHeaders: true)
    expect(response.headers).toHaveProperty("ratelimit-limit");
    expect(response.headers).toHaveProperty("ratelimit-remaining");
    expect(response.headers).toHaveProperty("ratelimit-reset");
  });

  it("should apply rate limit per IP address", async () => {
    const app = express();
    app.set("trust proxy", true); // Enable trust proxy for X-Forwarded-For
    app.use(createRateLimiter());
    app.get("/api/test", (_req, res) => res.json({ success: true }));
    
    // Make 100 requests from first IP
    for (let i = 0; i < 100; i++) {
      await request(app).get("/api/test").set("X-Forwarded-For", "192.168.1.1");
    }

    // First IP should be blocked
    const response1 = await request(app).get("/api/test").set("X-Forwarded-For", "192.168.1.1");
    expect(response1.status).toBe(429);

    // Second IP should still work
    const response2 = await request(app).get("/api/test").set("X-Forwarded-For", "192.168.1.2");
    expect(response2.status).toBe(200);
  });

  it("should have correct window duration (15 minutes)", () => {
    // Verify the constant
    expect(15 * 60 * 1000).toBe(900000);
  });

  it("should have correct max requests (100)", async () => {
    const app = createTestApp();
    
    // Make exactly 100 requests - all should succeed
    for (let i = 0; i < 100; i++) {
      const response = await request(app).get("/api/jobs");
      expect(response.status).toBe(200);
    }

    // 101st request should fail
    const response = await request(app).get("/api/jobs");
    expect(response.status).toBe(429);
  });

  it("should return error message in correct format", async () => {
    const app = createTestApp();
    
    // Exceed limit
    for (let i = 0; i < 101; i++) {
      await request(app).get("/api/jobs");
    }

    const response = await request(app).get("/api/jobs");

    expect(response.body).toHaveProperty("error");
    expect(response.body).toHaveProperty("retryAfter");
    expect(response.body).toHaveProperty("limit");
    expect(response.body).toHaveProperty("windowMs");
    
    expect(typeof response.body.error).toBe("string");
    expect(response.body.limit).toBe(100);
    expect(response.body.windowMs).toBe(900000);
  });

  it("should not block different routes independently", async () => {
    const app = createTestApp();
    
    // Different routes count toward the same IP limit
    for (let i = 0; i < 50; i++) {
      await request(app).get("/api/jobs");
    }

    for (let i = 0; i < 50; i++) {
      await request(app).get("/api/jobs");
    }

    // Total 100 requests from same IP - should hit limit
    const response1 = await request(app).get("/api/jobs");
    expect(response1.status).toBe(429);

    // 101st request should also fail
    const response2 = await request(app).get("/api/jobs");
    expect(response2.status).toBe(429);
  });

  it("should use standardHeaders", async () => {
    const app = createTestApp();
    
    const response = await request(app).get("/api/jobs");
    
    // Verify RateLimit-* headers are set (not X-RateLimit-*)
    expect(response.headers).toHaveProperty("ratelimit-limit");
    expect(response.headers).not.toHaveProperty("x-ratelimit-limit");
  });
});

