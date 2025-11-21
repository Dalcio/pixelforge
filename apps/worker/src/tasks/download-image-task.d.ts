export declare class DownloadError extends Error {
    readonly url: string;
    readonly cause?: Error | undefined;
    constructor(message: string, url: string, cause?: Error | undefined);
}
export declare const downloadImage: (url: string) => Promise<Buffer>;
//# sourceMappingURL=download-image-task.d.ts.map