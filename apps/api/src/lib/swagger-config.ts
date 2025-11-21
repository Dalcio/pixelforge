import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PixelForge API",
      version: "1.0.0",
      description:
        "Real-time Image Processing System - A production-ready, cloud-based image transformation service",
      contact: {
        name: "Dalcio",
        url: "https://github.com/Dalcio/pixelforge",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "https://pixelforge-smp3.onrender.com",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    tags: [
      {
        name: "Jobs",
        description: "Image processing job management",
      },
      {
        name: "Health",
        description: "Service health check",
      },
    ],
    components: {
      schemas: {
        Transformations: {
          type: "object",
          properties: {
            width: {
              type: "integer",
              minimum: 1,
              maximum: 4000,
              description: "Target width in pixels",
              example: 800,
            },
            height: {
              type: "integer",
              minimum: 1,
              maximum: 4000,
              description: "Target height in pixels",
              example: 600,
            },
            grayscale: {
              type: "boolean",
              description: "Convert to grayscale",
              example: true,
            },
            blur: {
              type: "number",
              minimum: 0,
              maximum: 10,
              description: "Blur amount",
              example: 2.5,
            },
            sharpen: {
              type: "boolean",
              description: "Apply sharpening",
              example: false,
            },
            rotate: {
              type: "integer",
              enum: [0, 90, 180, 270],
              description: "Rotation angle in degrees",
              example: 90,
            },
            flip: {
              type: "boolean",
              description: "Flip vertically",
              example: false,
            },
            flop: {
              type: "boolean",
              description: "Flip horizontally",
              example: false,
            },
            quality: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "JPEG quality",
              example: 85,
            },
          },
          minProperties: 1,
          description: "At least one transformation property is required",
        },
        CreateJobRequest: {
          type: "object",
          required: ["inputUrl"],
          properties: {
            inputUrl: {
              type: "string",
              format: "uri",
              description: "URL of the image to process",
              example: "https://example.com/image.jpg",
            },
            transformations: {
              $ref: "#/components/schemas/Transformations",
            },
          },
        },
        CreateJobResponse: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique job identifier",
              example: "abc123def456",
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "completed", "failed"],
              description: "Current job status",
              example: "pending",
            },
          },
        },
        Job: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Unique job identifier",
              example: "abc123def456",
            },
            status: {
              type: "string",
              enum: ["pending", "processing", "completed", "failed"],
              description: "Current job status",
              example: "completed",
            },
            progress: {
              type: "integer",
              minimum: 0,
              maximum: 100,
              description: "Processing progress percentage",
              example: 100,
            },
            inputUrl: {
              type: "string",
              format: "uri",
              description: "Original image URL",
              example: "https://example.com/image.jpg",
            },
            outputUrl: {
              type: "string",
              format: "uri",
              description: "Processed image URL (available when completed)",
              example:
                "https://storage.googleapis.com/bucket/processed/abc123.jpg",
            },
            error: {
              type: "string",
              description: "Error message (present if status is failed)",
              example: "Failed to download image",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Job creation timestamp",
              example: "2024-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Last update timestamp",
              example: "2024-01-01T00:01:00.000Z",
            },
            transformations: {
              $ref: "#/components/schemas/Transformations",
            },
          },
        },
        JobList: {
          type: "object",
          properties: {
            jobs: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Job",
              },
              description: "Array of jobs",
            },
            total: {
              type: "integer",
              description: "Total number of jobs",
              example: 10,
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
              example: "Job not found",
            },
          },
        },
        HealthCheck: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "ok",
            },
            uptime: {
              type: "number",
              description: "Server uptime in seconds",
              example: 123456.789,
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2024-01-01T00:00:00.000Z",
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad Request - Invalid input",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Validation error: inputUrl is required",
              },
            },
          },
        },
        NotFound: {
          description: "Not Found - Resource does not exist",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Job not found",
              },
            },
          },
        },
        TooLarge: {
          description: "Payload Too Large - Request body exceeds limit",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Payload too large",
              },
            },
          },
        },
        TooManyRequests: {
          description: "Too Many Requests - Rate limit exceeded",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Too many requests, please try again later",
              },
            },
          },
        },
        InternalServerError: {
          description: "Internal Server Error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Internal server error",
              },
            },
          },
        },
        ServiceUnavailable: {
          description: "Service Unavailable - External service down",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                error: "Redis connection failed",
              },
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/app.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
