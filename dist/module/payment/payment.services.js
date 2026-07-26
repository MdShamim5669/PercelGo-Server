"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initPaymentService = initPaymentService;
exports.paymentSuccessService = paymentSuccessService;
exports.paymentFailService = paymentFailService;
exports.paymentCancelService = paymentCancelService;
// @ts-ignore
const sslcommerz_lts_1 = __importDefault(require("sslcommerz-lts"));
const db_1 = require("../../config/db");
const mongodb_1 = require("mongodb");
const AppError_1 = __importDefault(require("../utils/AppError"));
const parcel_services_1 = require("../parcel/parcel.services");
const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'testbox@ssl';
const is_live = false; // true for live, false for sandbox
async function initPaymentService(paymentData) {
    const { parcelId, amount, customerName, customerEmail, customerPhone, customerAddress } = paymentData;
    const tran_id = `REF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
    const data = {
        total_amount: amount,
        currency: 'BDT',
        tran_id: tran_id,
        success_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/success/${tran_id}`,
        fail_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/fail/${tran_id}`,
        cancel_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/cancel/${tran_id}`,
        ipn_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/ipn`,
        shipping_method: 'Courier',
        product_name: 'Parcel Delivery',
        product_category: 'Service',
        product_profile: 'general',
        cus_name: customerName || 'Customer',
        cus_email: customerEmail || 'customer@example.com',
        cus_add1: customerAddress || 'Dhaka',
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: customerPhone || '01711111111',
        cus_fax: '01711111111',
        ship_name: customerName || 'Customer',
        ship_add1: customerAddress || 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
        value_a: parcelId
    };
    const db = (0, db_1.getDB)();
    if (!db) {
        // Memory store fallback
        const parcelIndex = parcel_services_1.memoryStore.parcels.findIndex((p) => p._id?.toString() === parcelId);
        if (parcelIndex > -1) {
            parcel_services_1.memoryStore.parcels[parcelIndex].transactionId = tran_id;
        }
    }
    else {
        // DB Update
        const queryId = mongodb_1.ObjectId.isValid(parcelId) && String(new mongodb_1.ObjectId(parcelId)) === parcelId ? new mongodb_1.ObjectId(parcelId) : parcelId;
        await db.collection('parcels').updateOne({ _id: queryId }, { $set: { transactionId: tran_id } });
    }
    const sslcz = new sslcommerz_lts_1.default(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);
    return { GatewayPageURL: apiResponse?.GatewayPageURL };
}
async function paymentSuccessService(tranId) {
    const db = (0, db_1.getDB)();
    const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;
    if (!db) {
        const parcelIndex = parcel_services_1.memoryStore.parcels.findIndex((p) => p.transactionId === tranId);
        if (parcelIndex > -1) {
            parcel_services_1.memoryStore.parcels[parcelIndex].status = 'paid';
            parcel_services_1.memoryStore.parcels[parcelIndex].paymentStatus = 'Paid';
            parcel_services_1.memoryStore.parcels[parcelIndex].trackingNo = trackingNo;
            parcel_services_1.memoryStore.tracking.push({
                _id: `${Date.now()}`,
                parcelId: parcel_services_1.memoryStore.parcels[parcelIndex]._id,
                status: 'paid',
                message: 'Online payment successful. Parcel confirmed.',
                timestamp: new Date().toISOString()
            });
        }
        return;
    }
    const parcel = await db.collection('parcels').findOne({ transactionId: tranId });
    if (!parcel)
        throw new AppError_1.default(404, 'Transaction not found');
    await db.collection('parcels').updateOne({ transactionId: tranId }, { $set: { status: 'paid', paymentStatus: 'Paid', trackingNo } });
    await db.collection('tracking').insertOne({
        parcelId: parcel._id,
        status: 'paid',
        message: 'Online payment successful. Parcel confirmed.',
        timestamp: new Date().toISOString()
    });
}
async function paymentFailService(tranId) {
    // Logic for fail, maybe update paymentStatus to 'Failed'
}
async function paymentCancelService(tranId) {
    // Logic for cancel
}
