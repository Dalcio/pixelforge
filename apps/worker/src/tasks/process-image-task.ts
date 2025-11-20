import sharp from "sharp";
import type { TransformationOptions } from "@fluximage/types";

export const processImage = async (
  buffer: Buffer,
  transformations?: TransformationOptions
): Promise<Buffer> => {
  const options = transformations || {};

  let pipeline = sharp(buffer);

  // Rotation
  if (options.rotate) {
    pipeline = pipeline.rotate(options.rotate);
  }

  // Flip/Flop
  if (options.flip) {
    pipeline = pipeline.flip();
  }
  if (options.flop) {
    pipeline = pipeline.flop();
  }

  // Resize
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

  // Grayscale
  if (options.grayscale) {
    pipeline = pipeline.grayscale();
  }

  // Blur
  if (options.blur && options.blur > 0) {
    pipeline = pipeline.blur(options.blur);
  }

  // Sharpen
  if (options.sharpen) {
    pipeline = pipeline.sharpen();
  }

  // Convert to JPEG with quality
  return pipeline
    .jpeg({
      quality: options.quality || 85,
      progressive: true,
    })
    .toBuffer();
};
