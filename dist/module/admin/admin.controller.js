"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.assignDeliveryRider = exports.shipParcel = exports.confirmReceive = exports.assignPickupRider = exports.updateUserRole = exports.updateRiderStatus = exports.getStats = void 0;
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../shared/sendResponse"));
const admin_services_1 = require("./admin.services");
exports.getStats = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.getStatsService)();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Stats retrieved successfully',
        data: result
    });
});
exports.updateRiderStatus = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.updateRiderStatusService)(req.params.id, req.body.status);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Rider status updated successfully',
        data: result
    });
});
exports.updateUserRole = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.updateUserRoleService)(req.params.id, req.body.role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User role updated successfully',
        data: result
    });
});
exports.assignPickupRider = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.assignPickupRiderService)(req.params.id, req.body.riderEmail);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Pickup rider assigned successfully',
        data: result
    });
});
exports.confirmReceive = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.confirmReceiveService)(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Parcel received successfully',
        data: result
    });
});
exports.shipParcel = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.shipParcelService)(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Parcel shipped successfully',
        data: result
    });
});
exports.assignDeliveryRider = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.assignDeliveryRiderService)(req.params.id, req.body.riderEmail);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Delivery rider assigned successfully',
        data: result
    });
});
exports.deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, admin_services_1.deleteUserService)(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User deleted successfully',
        data: result
    });
});
