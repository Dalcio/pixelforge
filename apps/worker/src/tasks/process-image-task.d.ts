import type { TransformationOptions } from "@fluximage/types";
export type OutputFormat = "jpeg" | "png" | "webp" | "auto";
export interface ProcessImageOptions extends TransformationOptions {
    outputFormat?: OutputFormat;
    stripMetadata?: boolean;
}
export declare class ProcessingError extends Error {
    readonly step: string;
    readonly cause?: Error | undefined;
    constructor(message: string, step: string, cause?: Error | undefined);
}
export declare const processImage: (buffer: Buffer, transformations?: ProcessImageOptions) => Promise<Buffer>;
//# sourceMappingURL=process-image-task.d.ts.map