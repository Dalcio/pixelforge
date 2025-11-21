import sharp from "sharp";
import type { TransformationOptions } from "@fluximage/types";

export type OutputFormat = "jpeg" | "png" | "webp" | "auto";

export interface ProcessImageOptions extends TransformationOptions {
  outputFormat?: OutputFormat;
  stripMetadata?: boolean;
}

export class ProcessingError extends Error {
  constructor(
    message: string,
    public readonly step: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "ProcessingError";
  }
}

export const processImage = async (
  buffer: Buffer,
  transformations?: ProcessImageOptions
): Promise<Buffer> => {
  try {
    const options = transformations || {};

    let pipeline = sharp(buffer);

    // Strip metadata by default for privacy and smaller file size
    if (options.stripMetadata !== false) {
      try {
        pipeline = pipeline.withMetadata({
          // Keep orientation, remove everything else
          orientation: undefined,
        });
      } catch (error) {
        throw new ProcessingError(
          `Failed to strip metadata: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "strip-metadata",
          error instanceof Error ? error : undefined
        );
      }
    }

    // Rotation
    if (options.rotate) {
      try {
        pipeline = pipeline.rotate(options.rotate);
      } catch (error) {
        throw new ProcessingError(
          `Failed to rotate image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "rotate",
          error instanceof Error ? error : undefined
        );
      }
    }

    // Flip/Flop
    if (options.flip) {
      try {
        pipeline = pipeline.flip();
      } catch (error) {
        throw new ProcessingError(
          `Failed to flip image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "flip",
          error instanceof Error ? error : undefined
        );
      }
    }
    if (options.flop) {
      try {
        pipeline = pipeline.flop();
      } catch (error) {
        throw new ProcessingError(
          `Failed to flop image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "flop",
          error instanceof Error ? error : undefined
        );
      }
    }

    // Resize
    try {
      if (options.width || options.height) {
        pipeline = pipeline.resize(options.width, options.height, {
          fit: "inside",
          withoutEnlargement: true,
        });
      } else {
        // Default resize if no dimensions specified
        pipeline = pipeline.resize(800, 800, {
          fit: "inside",
          withoutEnlargement: true,
        });
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to resize image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "resize",
        error instanceof Error ? error : undefined
      );
    }

    // Grayscale
    if (options.grayscale) {
      try {
        pipeline = pipeline.grayscale();
      } catch (error) {
        throw new ProcessingError(
          `Failed to apply grayscale: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "grayscale",
          error instanceof Error ? error : undefined
        );
      }
    }

    // Blur
    if (options.blur && options.blur > 0) {
      try {
        pipeline = pipeline.blur(options.blur);
      } catch (error) {
        throw new ProcessingError(
          `Failed to apply blur: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "blur",
          error instanceof Error ? error : undefined
        );
      }
    }

    // Sharpen
    if (options.sharpen) {
      try {
        pipeline = pipeline.sharpen();
      } catch (error) {
        throw new ProcessingError(
          `Failed to sharpen image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          "sharpen",
          error instanceof Error ? error : undefined
        );
      }
    }

    // Convert to output format with optimizations
    try {
      const outputFormat = options.outputFormat || "jpeg";
      const quality = options.quality || 85;

      switch (outputFormat) {
        case "jpeg":
          return await pipeline
            .jpeg({
              quality,
              progressive: true,
              mozjpeg: true, // Use mozjpeg for better compression
              chromaSubsampling: "4:2:0", // Standard chroma subsampling
            })
            .toBuffer();

        case "png":
          return await pipeline
            .png({
              compressionLevel: 9, // Maximum compression (0-9)
              adaptiveFiltering: true,
              palette: true, // Use palette if possible (8-bit)
            })
            .toBuffer();

        case "webp":
          return await pipeline
            .webp({
              quality,
              effort: 6, // Higher effort = better compression (0-6)
              lossless: false,
            })
            .toBuffer();

        case "auto":
          // Auto-detect best format based on source
          const metadata = await sharp(buffer).metadata();
          if (metadata.hasAlpha) {
            // Use PNG for images with transparency
            return await pipeline
              .png({
                compressionLevel: 9,
                adaptiveFiltering: true,
                palette: true,
              })
              .toBuffer();
          } else {
            // Use WebP for other images (best compression)
            return await pipeline
              .webp({
                quality,
                effort: 6,
                lossless: false,
              })
              .toBuffer();
          }

        default:
          throw new ProcessingError(
            `Unsupported output format: ${outputFormat}`,
            "format-conversion",
            undefined
          );
      }
    } catch (error) {
      throw new ProcessingError(
        `Failed to convert image format: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "format-conversion",
        error instanceof Error ? error : undefined
      );
    }
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }

    throw new ProcessingError(
      `Image processing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      "unknown",
      error instanceof Error ? error : undefined
    );
  }
};
