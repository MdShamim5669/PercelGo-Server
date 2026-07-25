"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarnings = exports.deliverParcel = exports.confirmPickup = exports.getDeliveryParcels = exports.getPickupParcels = void 0;
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../shared/sendResponse"));
const rider_services_1 = require("./rider.services");
exports.getPickupParcels = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, rider_services_1.getPickupParcelsService)(req.user?.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Pickup parcels retrieved successfully',
        data: result
    });
});
exports.getDeliveryParcels = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, rider_services_1.getDeliveryParcelsService)(req.user?.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Delivery parcels retrieved successfully',
        data: result
    });
});
exports.confirmPickup = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, rider_services_1.confirmPickupService)(req.params.id, req.body.tracking_no, req.user?.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: result.message || 'Pickup confirmed successfully',
        data: result
    });
});
exports.deliverParcel = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, rider_services_1.deliverParcelService)(req.params.id, req.body.tracking_no, req.user?.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: result.message || 'Parcel delivered successfully',
        data: result
    });
});
exports.getEarnings = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, rider_services_1.getRiderEarningsService)(req.user?.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Earnings retrieved successfully',
        data: result
    });
});
