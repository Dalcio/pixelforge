import { describe, it, expect } from "vitest";
import { validateCreateJob } from "./job-validator";

describe("validateCreateJob", () => {
  // Core requirement: valid URL test
  it("should validate a valid URL", () => {
    const validData = {
      inputUrl: "https://example.com/image.jpg",
    };

    const result = validateCreateJob(validData);

    expect(result).toEqual({
      inputUrl: "https://example.com/image.jpg",
    });
  });

  // Core requirement: invalid URL test
  it("should reject an invalid URL", () => {
    const invalidData = {
      inputUrl: "not-a-valid-url",
    };

    expect(() => validateCreateJob(invalidData)).toThrow(
      '"inputUrl" must be a valid uri'
    );
  });

  // Core requirement: missing URL test
  it("should reject missing URL", () => {
    const missingUrlData = {};

    expect(() => validateCreateJob(missingUrlData)).toThrow(
      '"inputUrl" is required'
    );
  });

  // Additional coverage: URL with valid transformations
  it("should validate URL with transformations", () => {
    const dataWithTransformations = {
      inputUrl: "https://example.com/image.png",
      transformations: {
        width: 800,
        height: 600,
        grayscale: true,
        quality: 90,
      },
    };

    const result = validateCreateJob(dataWithTransformations);

    expect(result).toEqual({
      inputUrl: "https://example.com/image.png",
      transformations: {
        width: 800,
        height: 600,
        grayscale: true,
        quality: 90,
      },
    });
  });

  // Additional coverage: invalid transformation width
  it("should reject invalid transformation values", () => {
    const invalidTransformations = {
      inputUrl: "https://example.com/image.jpg",
      transformations: {
        width: 5000, // exceeds max of 4000
      },
    };

    expect(() => validateCreateJob(invalidTransformations)).toThrow(
      '"transformations.width" must be less than or equal to 4000'
    );
  });

  // Additional coverage: invalid quality
  it("should reject invalid quality value", () => {
    const invalidQuality = {
      inputUrl: "https://example.com/image.jpg",
      transformations: {
        quality: 150, // exceeds max of 100
      },
    };

    expect(() => validateCreateJob(invalidQuality)).toThrow(
      '"transformations.quality" must be less than or equal to 100'
    );
  });

  // Additional coverage: invalid rotate value
  it("should reject invalid rotate value", () => {
    const invalidRotate = {
      inputUrl: "https://example.com/image.jpg",
      transformations: {
        rotate: 45, // not in valid values [0, 90, 180, 270]
      },
    };

    expect(() => validateCreateJob(invalidRotate)).toThrow(
      '"transformations.rotate" must be one of [0, 90, 180, 270]'
    );
  });

  // Additional coverage: null input
  it("should handle null input", () => {
    expect(() => validateCreateJob(null)).toThrow();
  });
});
