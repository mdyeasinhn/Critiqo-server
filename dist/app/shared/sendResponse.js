"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, jsonData) => {
    var _a, _b;
    res.status(jsonData.statusCode).json({
        success: jsonData.success,
        message: jsonData.message,
        meta: (_a = jsonData.meta) !== null && _a !== void 0 ? _a : null,
        data: (_b = jsonData.data) !== null && _b !== void 0 ? _b : null,
    });
};
exports.default = sendResponse;
