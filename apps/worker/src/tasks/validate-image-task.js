"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImage = void 0;
const sharp_1 = __importDefault(require("sharp"));
const validateImage = async (buffer) => {
    try {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        return metadata.width !== undefined && metadata.height !== undefined;
    }
    catch {
        return false;
    }
};
exports.validateImage = validateImage;
//# sourceMappingURL=validate-image-task.js.map