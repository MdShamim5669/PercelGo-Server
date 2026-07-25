"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    status;
    isOperational;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.default = AppError;
