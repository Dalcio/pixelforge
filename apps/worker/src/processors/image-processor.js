"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processImageJob = void 0;
const types_1 = require("@fluximage/types");
const update_status_task_1 = require("../tasks/update-status-task");
const download_image_task_1 = require("../tasks/download-image-task");
const validate_image_task_1 = require("../tasks/validate-image-task");
const process_image_task_1 = require("../tasks/process-image-task");
const upload_image_task_1 = require("../tasks/upload-image-task");
const complete_job_task_1 = require("../tasks/complete-job-task");
const fail_job_task_1 = require("../tasks/fail-job-task");
const processImageJob = async (job) => {
    const { jobId, inputUrl, transformations } = job.data;
    const timestamp = new Date().toISOString();
    try {
        await (0, update_status_task_1.updateJobStatus)(jobId, types_1.JobStatus.PROCESSING);
        await (0, update_status_task_1.updateJobProgress)(jobId, 0);
        let imageBuffer;
        try {
            await (0, update_status_task_1.updateJobProgress)(jobId, 20);
            imageBuffer = await (0, download_image_task_1.downloadImage)(inputUrl);
        }
        catch (error) {
            if (error instanceof download_image_task_1.DownloadError) {
                const jobError = {
                    message: error.message,
                    step: "download",
                    url: inputUrl,
                    jobId,
                    timestamp,
                };
                await (0, fail_job_task_1.failJob)(jobId, `Download failed: ${error.message}`);
                throw new Error(JSON.stringify(jobError));
            }
            throw error;
        }
        let isValid;
        try {
            await (0, update_status_task_1.updateJobProgress)(jobId, 40);
            isValid = await (0, validate_image_task_1.validateImage)(imageBuffer);
        }
        catch (error) {
            const jobError = {
                message: error instanceof Error ? error.message : "Validation failed",
                step: "validate",
                url: inputUrl,
                jobId,
                timestamp,
            };
            await (0, fail_job_task_1.failJob)(jobId, `Validation failed: ${jobError.message}`);
            throw new Error(JSON.stringify(jobError));
        }
        if (!isValid) {
            const jobError = {
                message: "Invalid image format or corrupted image data",
                step: "validate",
                url: inputUrl,
                jobId,
                timestamp,
            };
            await (0, fail_job_task_1.failJob)(jobId, jobError.message);
            throw new Error(JSON.stringify(jobError));
        }
        let processedBuffer;
        try {
            await (0, update_status_task_1.updateJobProgress)(jobId, 60);
            processedBuffer = await (0, process_image_task_1.processImage)(imageBuffer, transformations);
        }
        catch (error) {
            if (error instanceof process_image_task_1.ProcessingError) {
                const jobError = {
                    message: error.message,
                    step: `processing:${error.step}`,
                    url: inputUrl,
                    jobId,
                    timestamp,
                };
                await (0, fail_job_task_1.failJob)(jobId, `Processing failed: ${error.message}`);
                throw new Error(JSON.stringify(jobError));
            }
            throw error;
        }
        let outputUrl;
        try {
            await (0, update_status_task_1.updateJobProgress)(jobId, 80);
            outputUrl = await (0, upload_image_task_1.uploadImage)(jobId, processedBuffer);
        }
        catch (error) {
            const jobError = {
                message: error instanceof Error ? error.message : "Upload failed",
                step: "upload",
                url: inputUrl,
                jobId,
                timestamp,
            };
            await (0, fail_job_task_1.failJob)(jobId, `Upload failed: ${jobError.message}`);
            throw new Error(JSON.stringify(jobError));
        }
        await (0, complete_job_task_1.completeJob)(jobId, outputUrl);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        try {
            JSON.parse(errorMessage);
            throw error;
        }
        catch {
            const jobError = {
                message: errorMessage,
                step: "unknown",
                url: inputUrl,
                jobId,
                timestamp,
            };
            throw new Error(JSON.stringify(jobError));
        }
    }
};
exports.processImageJob = processImageJob;
//# sourceMappingURL=image-processor.js.map