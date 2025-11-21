"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const storage_client_1 = require("../lib/storage-client");
const uploadImage = async (jobId, buffer) => {
    const storage = (0, storage_client_1.getStorage)();
    const bucket = storage.bucket();
    const fileName = `processed/${jobId}.jpg`;
    const file = bucket.file(fileName);
    await file.save(buffer, {
        metadata: {
            contentType: 'image/jpeg',
        },
    });
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=upload-image-task.js.map