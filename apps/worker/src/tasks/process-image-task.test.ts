import { describe, it, expect, vi, beforeEach } from "vitest";
import { processImage } from "./process-image-task";
import sharp from "sharp";
import type { TransformationOptions } from "@fluximage/types";

// Mock sharp
vi.mock("sharp");

describe("processImage", () => {
  let mockPipeline: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a mock pipeline that chains methods
    mockPipeline = {
      rotate: vi.fn().mockReturnThis(),
      flip: vi.fn().mockReturnThis(),
      flop: vi.fn().mockReturnThis(),
      resize: vi.fn().mockReturnThis(),
      grayscale: vi.fn().mockReturnThis(),
      blur: vi.fn().mockReturnThis(),
      sharpen: vi.fn().mockReturnThis(),
      jpeg: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image")),
    };

    vi.mocked(sharp).mockReturnValue(mockPipeline);
  });

  it("should process image with default settings when no transformations provided", async () => {
    const buffer = Buffer.from("original-image");
    const result = await processImage(buffer);

    expect(sharp).toHaveBeenCalledWith(buffer);
    expect(mockPipeline.resize).toHaveBeenCalledWith(800, 800, {
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(mockPipeline.jpeg).toHaveBeenCalledWith({
      quality: 85,
      progressive: true,
    });
    expect(result).toBeInstanceOf(Buffer);
  });

  it("should apply width and height transformations", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      width: 1920,
      height: 1080,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.resize).toHaveBeenCalledWith(1920, 1080, {
      fit: "inside",
      withoutEnlargement: true,
    });
  });

  it("should apply rotation transformation", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      rotate: 90,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.rotate).toHaveBeenCalledWith(90);
  });

  it("should apply all rotation values", async () => {
    const buffer = Buffer.from("original-image");
    const rotations = [0, 90, 180, 270];

    for (const rotate of rotations) {
      vi.clearAllMocks();
      mockPipeline.rotate = vi.fn().mockReturnThis();
      mockPipeline.toBuffer = vi
        .fn()
        .mockResolvedValue(Buffer.from("processed"));
      vi.mocked(sharp).mockReturnValue(mockPipeline);

      await processImage(buffer, { rotate });

      if (rotate > 0) {
        expect(mockPipeline.rotate).toHaveBeenCalledWith(rotate);
      }
    }
  });

  it("should apply flip transformation", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      flip: true,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.flip).toHaveBeenCalled();
  });

  it("should apply flop transformation", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      flop: true,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.flop).toHaveBeenCalled();
  });

  it("should not apply flip when false", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      flip: false,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.flip).not.toHaveBeenCalled();
  });

  it("should apply grayscale transformation", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      grayscale: true,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.grayscale).toHaveBeenCalled();
  });

  it("should apply blur transformation", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      blur: 5,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.blur).toHaveBeenCalledWith(5);
  });

  it("should not apply blur when value is 0", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      blur: 0,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.blur).not.toHaveBeenCalled();
  });

  it("should apply sharpen transformation", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      sharpen: true,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.sharpen).toHaveBeenCalled();
  });

  it("should apply custom quality", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      quality: 95,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.jpeg).toHaveBeenCalledWith({
      quality: 95,
      progressive: true,
    });
  });

  it("should apply multiple transformations together", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      width: 1920,
      height: 1080,
      rotate: 90,
      flip: true,
      grayscale: true,
      blur: 3,
      sharpen: true,
      quality: 90,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.rotate).toHaveBeenCalledWith(90);
    expect(mockPipeline.flip).toHaveBeenCalled();
    expect(mockPipeline.resize).toHaveBeenCalledWith(1920, 1080, {
      fit: "inside",
      withoutEnlargement: true,
    });
    expect(mockPipeline.grayscale).toHaveBeenCalled();
    expect(mockPipeline.blur).toHaveBeenCalledWith(3);
    expect(mockPipeline.sharpen).toHaveBeenCalled();
    expect(mockPipeline.jpeg).toHaveBeenCalledWith({
      quality: 90,
      progressive: true,
    });
  });

  it("should use width only for resize", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      width: 1000,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.resize).toHaveBeenCalledWith(1000, undefined, {
      fit: "inside",
      withoutEnlargement: true,
    });
  });

  it("should use height only for resize", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      height: 720,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.resize).toHaveBeenCalledWith(undefined, 720, {
      fit: "inside",
      withoutEnlargement: true,
    });
  });

  it("should always output JPEG format", async () => {
    const buffer = Buffer.from("original-image");

    await processImage(buffer, {});

    expect(mockPipeline.jpeg).toHaveBeenCalled();
    expect(mockPipeline.toBuffer).toHaveBeenCalled();
  });

  it("should use progressive JPEG encoding", async () => {
    const buffer = Buffer.from("original-image");

    await processImage(buffer, {});

    expect(mockPipeline.jpeg).toHaveBeenCalledWith(
      expect.objectContaining({
        progressive: true,
      })
    );
  });

  it("should handle empty transformations object", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {};

    const result = await processImage(buffer, transformations);

    expect(result).toBeInstanceOf(Buffer);
    expect(mockPipeline.resize).toHaveBeenCalledWith(800, 800, {
      fit: "inside",
      withoutEnlargement: true,
    });
  });

  it("should use fit inside and withoutEnlargement for resize", async () => {
    const buffer = Buffer.from("original-image");
    const transformations: TransformationOptions = {
      width: 500,
      height: 500,
    };

    await processImage(buffer, transformations);

    expect(mockPipeline.resize).toHaveBeenCalledWith(
      500,
      500,
      expect.objectContaining({
        fit: "inside",
        withoutEnlargement: true,
      })
    );
  });
});
