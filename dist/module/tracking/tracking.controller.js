"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingLogs = exports.getTracking = void 0;
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../shared/sendResponse"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const tracking_services_1 = require("./tracking.services");
exports.getTracking = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, tracking_services_1.getTrackingService)(req.query.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Tracking data retrieved successfully',
        data: result
    });
});
exports.getTrackingLogs = (0, catchAsync_1.default)(async (req, res) => {
    const trackingId = req.params.trackingId;
    const email = req.user?.email; // From verifyToken middleware
    if (!email) {
        throw new AppError_1.default(401, 'Unauthorized');
    }
    const result = await (0, tracking_services_1.getTrackingLogsService)(trackingId, email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Tracking logs retrieved successfully',
        data: result
    });
});
