import sharp from "sharp";
import type { TransformationOptions } from "@fluximage/types";

export class ProcessingError extends Error {
  constructor(message: string, public readonly step: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export const processImage = async (
  buffer: Buffer,
  transformations?: TransformationOptions
): Promise<Buffer> => {
  try {
    const options = transformations || {};

    let pipeline = sharp(buffer);

    // Rotation
    if (options.rotate) {
      try {
        pipeline = pipeline.rotate(options.rotate);
      } catch (error) {
        throw new ProcessingError(
          `Failed to rotate image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'rotate',
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
          `Failed to flip image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'flip',
          error instanceof Error ? error : undefined
        );
      }
    }
    if (options.flop) {
      try {
        pipeline = pipeline.flop();
      } catch (error) {
        throw new ProcessingError(
          `Failed to flop image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'flop',
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
        `Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'resize',
        error instanceof Error ? error : undefined
      );
    }

    // Grayscale
    if (options.grayscale) {
      try {
        pipeline = pipeline.grayscale();
      } catch (error) {
        throw new ProcessingError(
          `Failed to apply grayscale: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'grayscale',
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
          `Failed to apply blur: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'blur',
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
          `Failed to sharpen image: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'sharpen',
          error instanceof Error ? error : undefined
        );
      }
    }

    // Convert to JPEG with quality
    try {
      return await pipeline
        .jpeg({
          quality: options.quality || 85,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      throw new ProcessingError(
        `Failed to convert to JPEG: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'jpeg-conversion',
        error instanceof Error ? error : undefined
      );
    }
  } catch (error) {
    if (error instanceof ProcessingError) {
      throw error;
    }

    throw new ProcessingError(
      `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'unknown',
      error instanceof Error ? error : undefined
    );
  }
};
