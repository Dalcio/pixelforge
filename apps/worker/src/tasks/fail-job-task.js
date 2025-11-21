"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.failJob = void 0;
const types_1 = require("@fluximage/types");
const firestore_client_1 = require("../lib/firestore-client");
const utils_1 = require("@fluximage/utils");
const failJob = async (jobId, error) => {
    const db = (0, firestore_client_1.getFirestore)();
    await db
        .collection("jobs")
        .doc(jobId)
        .update({
        status: types_1.JobStatus.FAILED,
        progress: 100,
        error,
        updatedAt: (0, utils_1.formatDate)(new Date()),
    });
};
exports.failJob = failJob;
//# sourceMappingURL=fail-job-task.js.map