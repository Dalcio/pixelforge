"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImage = exports.ProcessingError = void 0;
const sharp_1 = __importDefault(require("sharp"));
class ProcessingError extends Error {
    step;
    cause;
    constructor(message, step, cause) {
        super(message);
        this.step = step;
        this.cause = cause;
        this.name = "ProcessingError";
    }
}
exports.ProcessingError = ProcessingError;
const processImage = async (buffer, transformations) => {
    try {
        const options = transformations || {};
        let pipeline = (0, sharp_1.default)(buffer);
        if (options.stripMetadata !== false) {
            try {
                pipeline = pipeline.withMetadata({
                    orientation: undefined,
                });
            }
            catch (error) {
                throw new ProcessingError(`Failed to strip metadata: ${error instanceof Error ? error.message : "Unknown error"}`, "strip-metadata", error instanceof Error ? error : undefined);
            }
        }
        if (options.rotate) {
            try {
                pipeline = pipeline.rotate(options.rotate);
            }
            catch (error) {
                throw new ProcessingError(`Failed to rotate image: ${error instanceof Error ? error.message : "Unknown error"}`, "rotate", error instanceof Error ? error : undefined);
            }
        }
        if (options.flip) {
            try {
                pipeline = pipeline.flip();
            }
            catch (error) {
                throw new ProcessingError(`Failed to flip image: ${error instanceof Error ? error.message : "Unknown error"}`, "flip", error instanceof Error ? error : undefined);
            }
        }
        if (options.flop) {
            try {
                pipeline = pipeline.flop();
            }
            catch (error) {
                throw new ProcessingError(`Failed to flop image: ${error instanceof Error ? error.message : "Unknown error"}`, "flop", error instanceof Error ? error : undefined);
            }
        }
        try {
            if (options.width || options.height) {
                pipeline = pipeline.resize(options.width, options.height, {
                    fit: "inside",
                    withoutEnlargement: true,
                });
            }
            else {
                pipeline = pipeline.resize(800, 800, {
                    fit: "inside",
                    withoutEnlargement: true,
                });
            }
        }
        catch (error) {
            throw new ProcessingError(`Failed to resize image: ${error instanceof Error ? error.message : "Unknown error"}`, "resize", error instanceof Error ? error : undefined);
        }
        if (options.grayscale) {
            try {
                pipeline = pipeline.grayscale();
            }
            catch (error) {
                throw new ProcessingError(`Failed to apply grayscale: ${error instanceof Error ? error.message : "Unknown error"}`, "grayscale", error instanceof Error ? error : undefined);
            }
        }
        if (options.blur && options.blur > 0) {
            try {
                pipeline = pipeline.blur(options.blur);
            }
            catch (error) {
                throw new ProcessingError(`Failed to apply blur: ${error instanceof Error ? error.message : "Unknown error"}`, "blur", error instanceof Error ? error : undefined);
            }
        }
        if (options.sharpen) {
            try {
                pipeline = pipeline.sharpen();
            }
            catch (error) {
                throw new ProcessingError(`Failed to sharpen image: ${error instanceof Error ? error.message : "Unknown error"}`, "sharpen", error instanceof Error ? error : undefined);
            }
        }
        try {
            const outputFormat = options.outputFormat || "jpeg";
            const quality = options.quality || 85;
            switch (outputFormat) {
                case "jpeg":
                    return await pipeline
                        .jpeg({
                        quality,
                        progressive: true,
                        mozjpeg: true,
                        chromaSubsampling: "4:2:0",
                    })
                        .toBuffer();
                case "png":
                    return await pipeline
                        .png({
                        compressionLevel: 9,
                        adaptiveFiltering: true,
                        palette: true,
                    })
                        .toBuffer();
                case "webp":
                    return await pipeline
                        .webp({
                        quality,
                        effort: 6,
                        lossless: false,
                    })
                        .toBuffer();
                case "auto":
                    const metadata = await (0, sharp_1.default)(buffer).metadata();
                    if (metadata.hasAlpha) {
                        return await pipeline
                            .png({
                            compressionLevel: 9,
                            adaptiveFiltering: true,
                            palette: true,
                        })
                            .toBuffer();
                    }
                    else {
                        return await pipeline
                            .webp({
                            quality,
                            effort: 6,
                            lossless: false,
                        })
                            .toBuffer();
                    }
                default:
                    throw new ProcessingError(`Unsupported output format: ${outputFormat}`, "format-conversion", undefined);
            }
        }
        catch (error) {
            throw new ProcessingError(`Failed to convert image format: ${error instanceof Error ? error.message : "Unknown error"}`, "format-conversion", error instanceof Error ? error : undefined);
        }
    }
    catch (error) {
        if (error instanceof ProcessingError) {
            throw error;
        }
        throw new ProcessingError(`Image processing failed: ${error instanceof Error ? error.message : "Unknown error"}`, "unknown", error instanceof Error ? error : undefined);
    }
};
exports.processImage = processImage;
//# sourceMappingURL=process-image-task.js.map