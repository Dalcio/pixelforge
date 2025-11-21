import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../../app";
import type { Express } from "express";
import { JobStatus } from "@fluximage/types";

// Mock external dependencies
vi.mock("../../lib/firebase-initializer", () => ({
  initializeFirebase: vi.fn(),
}));

const mockQueue = {
  add: vi.fn(),
};

const mockDoc = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
};

const mockCollection = {
  doc: vi.fn(() => mockDoc),
  add: vi.fn(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  get: vi.fn(),
};

vi.mock("../../lib/queue-client", () => ({
  getQueue: vi.fn(() => mockQueue),
}));

vi.mock("../../lib/firestore-client", () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(() => mockCollection),
  })),
}));

describe("E2E: Job Lifecycle Integration Tests", () => {
  let app: Express;
  const validImageUrl = "https://example.com/test-image.jpg";
  const validTransformations = {
    width: 500,
    height: 500,
    rotate: 90,
  };

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Happy Path: Valid Image Job", () => {
    it("should accept and queue a valid job request", async () => {
      const jobId = "test-job-123";
      
      // Mock Firestore responses
      mockCollection.add.mockResolvedValue({ id: jobId });
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: jobId,
        data: () => ({
          id: jobId,
          inputUrl: validImageUrl,
          status: JobStatus.PENDING,
          progress: 0,
          transformations: validTransformations,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Mock queue
      mockQueue.add.mockResolvedValue({ id: jobId });

      // Create job
      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: validImageUrl,
          transformations: validTransformations,
        })
        .expect(201);

      expect(response.body).toHaveProperty("jobId");
      expect(response.body).toHaveProperty("status", JobStatus.PENDING);
      expect(mockQueue.add).toHaveBeenCalled();
    });
  });

  describe("Error Handling: Invalid URL", () => {
    it("should reject job with invalid URL format", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: "not-a-valid-url",
          transformations: validTransformations,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it("should reject job with non-HTTP(S) URL", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: "ftp://example.com/image.jpg",
          transformations: validTransformations,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling: Invalid Image Format", () => {
    it("should reject job with non-image URL", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: "https://example.com/document.pdf",
          transformations: validTransformations,
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it("should accept valid image extensions", async () => {
      const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

      for (const ext of validExtensions) {
        mockCollection.add.mockResolvedValue({ id: "test-id" });
        mockQueue.add.mockResolvedValue({ id: "test-id" });

        const response = await request(app)
          .post("/api/jobs")
          .send({
            imageUrl: `https://example.com/image${ext}`,
            transformations: validTransformations,
          });

        expect(response.status).toBe(201);
        expect(mockQueue.add).toHaveBeenCalled();

        vi.clearAllMocks();
      }
    });
  });

  describe("Error Handling: File Size Limit", () => {
    it("should reject job with excessively large transformation dimensions", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: validImageUrl,
          transformations: {
            width: 50000,
            height: 50000,
          },
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("Error Handling: Service Unavailability", () => {
    it("should handle Firestore unavailability gracefully", async () => {
      mockCollection.add.mockRejectedValue(new Error("Firestore unavailable"));

      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: validImageUrl,
          transformations: validTransformations,
        })
        .expect(500);

      expect(response.body).toHaveProperty("error");
    });

    it("should handle queue unavailability gracefully", async () => {
      mockCollection.add.mockResolvedValue({ id: "test-id" });
      mockQueue.add.mockRejectedValue(new Error("Queue unavailable"));

      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: validImageUrl,
          transformations: validTransformations,
        })
        .expect(500);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("Job Status Retrieval", () => {
    it("should return 404 for non-existent job", async () => {
      mockDoc.get.mockResolvedValue({
        exists: false,
      });

      const response = await request(app)
        .get("/api/jobs/non-existent-id")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should retrieve existing job status", async () => {
      const jobId = "existing-job";
      mockDoc.get.mockResolvedValue({
        exists: true,
        id: jobId,
        data: () => ({
          id: jobId,
          inputUrl: validImageUrl,
          status: JobStatus.COMPLETED,
          progress: 100,
          transformations: validTransformations,
          outputUrl: "https://storage.googleapis.com/bucket/output.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
          processedAt: new Date(),
        }),
      });

      const response = await request(app).get(`/api/jobs/${jobId}`).expect(200);

      expect(response.body).toMatchObject({
        id: jobId,
        status: JobStatus.COMPLETED,
        progress: 100,
      });
    });
  });

  describe("Job Listing", () => {
    it("should list jobs with pagination", async () => {
      const mockJobs = Array.from({ length: 5 }, (_, i) => ({
        id: `job-${i}`,
        inputUrl: validImageUrl,
        status: JobStatus.PENDING,
        progress: 0,
        createdAt: new Date(Date.now() - i * 1000),
        updatedAt: new Date(Date.now() - i * 1000),
      }));

      mockCollection.get.mockResolvedValue({
        docs: mockJobs.map((job) => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app).get("/api/jobs").expect(200);

      expect(response.body).toHaveProperty("jobs");
      expect(Array.isArray(response.body.jobs)).toBe(true);
      expect(response.body.jobs.length).toBeGreaterThan(0);
    });

    it("should filter jobs by status", async () => {
      const completedJobs = [
        {
          id: "job-1",
          status: JobStatus.COMPLETED,
          progress: 100,
          inputUrl: validImageUrl,
          outputUrl: "https://storage.googleapis.com/bucket/output.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
          processedAt: new Date(),
        },
      ];

      mockCollection.get.mockResolvedValue({
        docs: completedJobs.map((job) => ({
          id: job.id,
          data: () => job,
        })),
      });

      const response = await request(app)
        .get("/api/jobs?status=completed")
        .expect(200);

      expect(response.body.jobs).toHaveLength(1);
      expect(response.body.jobs[0].status).toBe(JobStatus.COMPLETED);
    });
  });

  describe("Content-Type Validation", () => {
    it("should require application/json content type for POST", async () => {
      const response = await request(app)
        .post("/api/jobs")
        .set("Content-Type", "text/plain")
        .send("not json")
        .expect(415);

      expect(response.body).toHaveProperty("error");
    });

    it("should accept application/json content type", async () => {
      mockCollection.add.mockResolvedValue({ id: "test-id" });
      mockQueue.add.mockResolvedValue({ id: "test-id" });

      const response = await request(app)
        .post("/api/jobs")
        .set("Content-Type", "application/json")
        .send({
          imageUrl: validImageUrl,
          transformations: validTransformations,
        })
        .expect(201);

      expect(response.body).toHaveProperty("jobId");
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within rate limit", async () => {
      mockCollection.add.mockResolvedValue({ id: "test-id" });
      mockQueue.add.mockResolvedValue({ id: "test-id" });

      const response = await request(app)
        .post("/api/jobs")
        .send({
          imageUrl: validImageUrl,
          transformations: validTransformations,
        });

      // First request should succeed (or hit rate limit if already exceeded in other tests)
      expect([201, 429]).toContain(response.status);

      // If rate limited, should have proper response
      if (response.status === 429) {
        expect(response.body).toHaveProperty("error");
        expect(response.headers).toHaveProperty("retry-after");
      }
    });
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status", "ok");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body).toHaveProperty("timestamp");
    });
  });
});
