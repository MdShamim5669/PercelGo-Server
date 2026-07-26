"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParcelStatus = exports.getPayments = exports.payParcel = exports.createPaymentIntent = exports.getParcelById = exports.getRiderParcels = exports.getParcels = exports.createParcel = void 0;
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../shared/sendResponse"));
const parcel_services_1 = require("./parcel.services");
// Create Parcel
exports.createParcel = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.createParcelService)(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'Parcel created successfully',
        data: result
    });
});
// Get Parcels (with optional email filter)
exports.getParcels = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.getParcelsService)(req.query.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Parcels retrieved successfully',
        data: result
    });
});
// Get Rider Parcels
exports.getRiderParcels = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.getRiderParcelsService)(req.params.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Rider parcels retrieved successfully',
        data: result
    });
});
exports.getParcelById = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.getParcelByIdService)(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Parcel retrieved successfully',
        data: result
    });
});
exports.createPaymentIntent = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.createPaymentIntentService)(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Payment intent created successfully',
        data: result
    });
});
exports.payParcel = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.payParcelService)(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Parcel paid successfully',
        data: result
    });
});
exports.getPayments = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, parcel_services_1.getPaymentsService)(req.query.email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Payments retrieved successfully',
        data: result
    });
});
// Update Parcel Status & Track Log
exports.updateParcelStatus = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const { status, message, riderEmail } = req.body;
    const result = await (0, parcel_services_1.updateParcelStatusService)(id, status, message, riderEmail);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Parcel status updated successfully',
        data: result
    });
});
