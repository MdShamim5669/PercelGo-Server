"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentCancel = exports.paymentFail = exports.paymentSuccess = exports.initPayment = void 0;
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../shared/sendResponse"));
const payment_services_1 = require("./payment.services");
exports.initPayment = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, payment_services_1.initPaymentService)(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Payment initialized successfully',
        data: result
    });
});
exports.paymentSuccess = (0, catchAsync_1.default)(async (req, res) => {
    const tranId = req.query.transactionId;
    await (0, payment_services_1.paymentSuccessService)(tranId);
    // Redirect to frontend success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payment/success?transactionId=${tranId}`);
});
exports.paymentFail = (0, catchAsync_1.default)(async (req, res) => {
    const tranId = req.query.transactionId;
    await (0, payment_services_1.paymentFailService)(tranId);
    // Redirect to frontend fail page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payment/fail`);
});
exports.paymentCancel = (0, catchAsync_1.default)(async (req, res) => {
    const tranId = req.query.transactionId;
    await (0, payment_services_1.paymentCancelService)(tranId);
    // Redirect to frontend fail page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/payment/fail`);
});
