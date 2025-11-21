"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeJob = void 0;
const types_1 = require("@fluximage/types");
const firestore_client_1 = require("../lib/firestore-client");
const utils_1 = require("@fluximage/utils");
const completeJob = async (jobId, outputUrl) => {
    const db = (0, firestore_client_1.getFirestore)();
    await db
        .collection("jobs")
        .doc(jobId)
        .update({
        status: types_1.JobStatus.COMPLETED,
        progress: 100,
        outputUrl,
        processedAt: (0, utils_1.formatDate)(new Date()),
        updatedAt: (0, utils_1.formatDate)(new Date()),
    });
};
exports.completeJob = completeJob;
//# sourceMappingURL=complete-job-task.js.map