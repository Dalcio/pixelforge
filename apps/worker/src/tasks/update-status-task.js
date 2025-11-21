"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateJobProgress = exports.updateJobStatus = void 0;
const firestore_client_1 = require("../lib/firestore-client");
const utils_1 = require("@fluximage/utils");
const updateJobStatus = async (jobId, status) => {
    const db = (0, firestore_client_1.getFirestore)();
    await db
        .collection("jobs")
        .doc(jobId)
        .update({
        status,
        updatedAt: (0, utils_1.formatDate)(new Date()),
    });
};
exports.updateJobStatus = updateJobStatus;
const updateJobProgress = async (jobId, progress) => {
    const db = (0, firestore_client_1.getFirestore)();
    await db
        .collection("jobs")
        .doc(jobId)
        .update({
        progress,
        updatedAt: (0, utils_1.formatDate)(new Date()),
    });
};
exports.updateJobProgress = updateJobProgress;
//# sourceMappingURL=update-status-task.js.map