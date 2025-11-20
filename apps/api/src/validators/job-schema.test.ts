import { describe, it, expect } from "vitest";
import { createJobSchema } from "./job-schema";

describe("createJobSchema", () => {
  describe("inputUrl validation", () => {
    it("should accept valid HTTP URL", () => {
      const { error, value } = createJobSchema.validate({
        inputUrl: "http://example.com/image.jpg",
      });
      expect(error).toBeUndefined();
      expect(value.inputUrl).toBe("http://example.com/image.jpg");
    });

    it("should accept valid HTTPS URL", () => {
      const { error, value } = createJobSchema.validate({
        inputUrl: "https://example.com/image.png",
      });
      expect(error).toBeUndefined();
      expect(value.inputUrl).toBe("https://example.com/image.png");
    });

    it("should reject URL without protocol", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "example.com/image.jpg",
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain('"inputUrl" must be a valid uri');
    });

    it("should reject empty string", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "",
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain('"inputUrl"');
    });
  });

  describe("transformations validation", () => {
    it("should accept valid width", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { width: 800 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject width below minimum (0)", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { width: 0 },
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain(
        '"transformations.width" must be greater than or equal to 1'
      );
    });

    it("should reject width above maximum (4001)", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { width: 4001 },
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain(
        '"transformations.width" must be less than or equal to 4000'
      );
    });

    it("should accept valid height", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { height: 600 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject non-integer width", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { width: 800.5 },
      });
      expect(error).toBeDefined();
      expect(error?.message).toContain(
        '"transformations.width" must be an integer'
      );
    });

    it("should accept blur within range (0-10)", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { blur: 5 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject blur below 0", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { blur: -1 },
      });
      expect(error).toBeDefined();
    });

    it("should reject blur above 10", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { blur: 11 },
      });
      expect(error).toBeDefined();
    });

    it("should accept valid rotation values", () => {
      for (const rotate of [0, 90, 180, 270]) {
        const { error } = createJobSchema.validate({
          inputUrl: "https://example.com/image.jpg",
          transformations: { rotate },
        });
        expect(error).toBeUndefined();
      }
    });

    it("should reject invalid rotation values", () => {
      for (const rotate of [45, 135, 225, 360]) {
        const { error } = createJobSchema.validate({
          inputUrl: "https://example.com/image.jpg",
          transformations: { rotate },
        });
        expect(error).toBeDefined();
      }
    });

    it("should accept boolean values for grayscale, sharpen, flip, flop", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: {
          grayscale: true,
          sharpen: false,
          flip: true,
          flop: false,
        },
      });
      expect(error).toBeUndefined();
    });

    it("should accept quality within range (1-100)", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { quality: 85 },
      });
      expect(error).toBeUndefined();
    });

    it("should reject quality below 1", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { quality: 0 },
      });
      expect(error).toBeDefined();
    });

    it("should reject quality above 100", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: { quality: 101 },
      });
      expect(error).toBeDefined();
    });

    it("should accept multiple transformations", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: {
          width: 1920,
          height: 1080,
          quality: 90,
          grayscale: false,
          sharpen: true,
          rotate: 90,
        },
      });
      expect(error).toBeUndefined();
    });

    it("should accept empty transformations object", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: {},
      });
      expect(error).toBeUndefined();
    });

    it("should reject unknown transformation properties", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        transformations: {
          unknownProperty: "value",
        },
      });
      expect(error).toBeDefined();
    });
  });

  describe("edge cases", () => {
    it("should work without transformations", () => {
      const { error, value } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
      });
      expect(error).toBeUndefined();
      expect(value.transformations).toBeUndefined();
    });

    it("should handle extra properties at root level", () => {
      const { error } = createJobSchema.validate({
        inputUrl: "https://example.com/image.jpg",
        extraProperty: "should be ignored or rejected",
      });
      expect(error).toBeDefined();
    });
  });
});
