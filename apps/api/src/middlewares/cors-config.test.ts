import { describe, it, expect, beforeEach, afterEach } from "vitest";
import express, { Express } from "express";
import request from "supertest";
import { createCorsMiddleware, handleCorsError } from "./cors-config";

describe("CORS Configuration", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original environment variable
    originalEnv = process.env.ALLOWED_ORIGINS;
  });

  afterEach(() => {
    // Restore original environment variable
    if (originalEnv !== undefined) {
      process.env.ALLOWED_ORIGINS = originalEnv;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }
  });

  const createTestApp = (allowedOrigins?: string): Express => {
    if (allowedOrigins !== undefined) {
      process.env.ALLOWED_ORIGINS = allowedOrigins;
    } else {
      delete process.env.ALLOWED_ORIGINS;
    }

    const app = express();
    app.use(createCorsMiddleware());
    app.use(handleCorsError);

    app.get("/api/test", (_req, res) => {
      res.json({ success: true });
    });

    return app;
  };

  describe("Default behavior (no ALLOWED_ORIGINS set)", () => {
    it("should allow localhost:5173 by default", async () => {
      const app = createTestApp();

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "http://localhost:5173");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173"
      );
    });

    it("should reject non-localhost origins when not configured", async () => {
      const app = createTestApp();

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://malicious.com");

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error", "Forbidden");
      expect(response.body.message).toContain("not allowed by CORS");
    });

    it("should allow requests with no origin", async () => {
      const app = createTestApp();

      const response = await request(app).get("/api/test");

      expect(response.status).toBe(200);
    });
  });

  describe("Single origin configuration", () => {
    it("should allow configured single origin", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://example.com");

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://example.com"
      );
    });

    it("should reject origin not in whitelist", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://attacker.com");

      expect(response.status).toBe(403);
      expect(response.body.message).toContain("not allowed by CORS");
    });
  });

  describe("Multiple origins configuration", () => {
    it("should allow multiple configured origins", async () => {
      const app = createTestApp(
        "http://localhost:5173,https://example.com,https://app.example.com"
      );

      // Test first origin
      const response1 = await request(app)
        .get("/api/test")
        .set("Origin", "http://localhost:5173");
      expect(response1.status).toBe(200);
      expect(response1.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173"
      );

      // Test second origin
      const response2 = await request(app)
        .get("/api/test")
        .set("Origin", "https://example.com");
      expect(response2.status).toBe(200);
      expect(response2.headers["access-control-allow-origin"]).toBe(
        "https://example.com"
      );

      // Test third origin
      const response3 = await request(app)
        .get("/api/test")
        .set("Origin", "https://app.example.com");
      expect(response3.status).toBe(200);
      expect(response3.headers["access-control-allow-origin"]).toBe(
        "https://app.example.com"
      );
    });

    it("should reject origin not in multi-origin whitelist", async () => {
      const app = createTestApp("http://localhost:5173,https://example.com");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://malicious.com");

      expect(response.status).toBe(403);
    });
  });

  describe("Whitespace handling", () => {
    it("should handle whitespace in ALLOWED_ORIGINS", async () => {
      const app = createTestApp(
        "http://localhost:5173 , https://example.com , https://app.example.com"
      );

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://example.com");

      expect(response.status).toBe(200);
    });

    it("should ignore empty entries", async () => {
      const app = createTestApp("http://localhost:5173,,https://example.com,");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://example.com");

      expect(response.status).toBe(200);
    });
  });

  describe("CORS preflight (OPTIONS)", () => {
    it("should handle OPTIONS preflight requests", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .options("/api/test")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(204);
      expect(response.headers["access-control-allow-origin"]).toBe(
        "https://example.com"
      );
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
    });

    it("should reject preflight from non-whitelisted origin", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .options("/api/test")
        .set("Origin", "https://malicious.com")
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(403);
    });
  });

  describe("CORS headers", () => {
    it("should set credentials: true", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://example.com");

      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("should allow specific HTTP methods", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .options("/api/test")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Method", "DELETE");

      expect(response.headers["access-control-allow-methods"]).toContain("GET");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "POST"
      );
      expect(response.headers["access-control-allow-methods"]).toContain("PUT");
      expect(response.headers["access-control-allow-methods"]).toContain(
        "DELETE"
      );
    });

    it("should allow specific headers", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .options("/api/test")
        .set("Origin", "https://example.com")
        .set("Access-Control-Request-Headers", "Content-Type,Authorization");

      expect(response.headers["access-control-allow-headers"]).toContain(
        "Content-Type"
      );
      expect(response.headers["access-control-allow-headers"]).toContain(
        "Authorization"
      );
    });
  });

  describe("Production scenarios", () => {
    it("should allow localhost:5173 and production domain", async () => {
      const app = createTestApp(
        "http://localhost:5173,https://pixelforge.example.com"
      );

      // Dev origin
      const devResponse = await request(app)
        .get("/api/test")
        .set("Origin", "http://localhost:5173");
      expect(devResponse.status).toBe(200);

      // Production origin
      const prodResponse = await request(app)
        .get("/api/test")
        .set("Origin", "https://pixelforge.example.com");
      expect(prodResponse.status).toBe(200);
    });

    it("should reject subdomain not in whitelist", async () => {
      const app = createTestApp("https://app.example.com");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://malicious.app.example.com");

      expect(response.status).toBe(403);
    });
  });

  describe("Error message format", () => {
    it("should return proper error structure for rejected origins", async () => {
      const app = createTestApp("https://example.com");

      const response = await request(app)
        .get("/api/test")
        .set("Origin", "https://attacker.com");

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty("error");
      expect(response.body).toHaveProperty("message");
      expect(response.body.error).toBe("Forbidden");
      expect(response.body.message).toContain("https://attacker.com");
      expect(response.body.message).toContain("not allowed by CORS");
    });
  });
});
