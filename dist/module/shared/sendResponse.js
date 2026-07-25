"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, data) => {
    res.status(data.statusCode).json({
        httpStatusCode: data.statusCode,
        success: data.success,
        message: data.message,
        meta: data.meta || null,
        data: data.data,
    });
};
exports.default = sendResponse;
