"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryStore = void 0;
exports.createParcelService = createParcelService;
exports.getParcelsService = getParcelsService;
exports.getParcelByIdService = getParcelByIdService;
exports.createPaymentIntentService = createPaymentIntentService;
exports.payParcelService = payParcelService;
exports.updateParcelStatusService = updateParcelStatusService;
exports.getPaymentsService = getPaymentsService;
const db_1 = require("../../config/db");
const mongodb_1 = require("mongodb");
const AppError_1 = __importDefault(require("../utils/AppError"));
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET || '', {
    apiVersion: '2025-01-27.acacia',
});
exports.memoryStore = {
    parcels: [],
    tracking: [],
    payments: []
};
function buildParcelRecord(parcelData) {
    const parcel = {
        ...parcelData,
        creation_date: new Date().toISOString(),
        status: parcelData.status || 'unpaid',
        cost: calculateParcelCost(parcelData)
    };
    parcel._id = parcel._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return parcel;
}
function calculateParcelCost(parcel) {
    const type = (parcel.type || '').toLowerCase();
    const weight = Number(parcel.weight || 0);
    const sameCity = String(parcel.pickupRegion || '').toLowerCase() === String(parcel.deliveryRegion || '').toLowerCase()
        || String(parcel.pickupServiceCenter || '').toLowerCase() === String(parcel.deliveryServiceCenter || '').toLowerCase();
    if (type === 'document') {
        return sameCity ? 60 : 80;
    }
    if (weight <= 3) {
        return sameCity ? 110 : 150;
    }
    return sameCity ? 110 + (weight - 3) * 40 : 150 + (weight - 3) * 40 + 40;
}
function validateParcel(parcelData) {
    const requiredFields = [
        'title',
        'type',
        'senderName',
        'senderRegion',
        'senderAddress',
        'receiverName',
        'receiverRegion',
        'receiverAddress'
    ];
    const missing = requiredFields.filter((field) => !parcelData[field]);
    if (missing.length) {
        throw new AppError_1.default(400, `Missing required fields: ${missing.join(', ')}`);
    }
}
function createTrackingEntry(parcelId, status, message, extra = {}) {
    return {
        _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        parcelId,
        status,
        message,
        timestamp: new Date().toISOString(),
        ...extra
    };
}
async function createParcelService(parcelData) {
    validateParcel(parcelData);
    const db = (0, db_1.getDB)();
    const parcel = buildParcelRecord(parcelData);
    if (!db) {
        exports.memoryStore.parcels.push(parcel);
        return { acknowledged: true, insertedId: parcel._id, parcel };
    }
    return db.collection('parcels').insertOne(parcel);
}
async function getParcelsService(email) {
    const db = (0, db_1.getDB)();
    if (!db) {
        return email
            ? exports.memoryStore.parcels.filter((parcel) => parcel.senderEmail === email || parcel.senderContact === email)
            : exports.memoryStore.parcels;
    }
    const query = email ? { senderEmail: email } : {};
    return db.collection('parcels').find(query).toArray();
}
async function getParcelByIdService(id) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const parcel = exports.memoryStore.parcels.find((parcel) => parcel._id?.toString() === id) || null;
        if (!parcel)
            throw new AppError_1.default(404, 'Parcel not found');
        return parcel;
    }
    const queryId = mongodb_1.ObjectId.isValid(id) && String(new mongodb_1.ObjectId(id)) === id ? new mongodb_1.ObjectId(id) : id;
    const parcel = await db.collection('parcels').findOne({ _id: queryId });
    if (!parcel)
        throw new AppError_1.default(404, 'Parcel not found');
    return parcel;
}
async function createPaymentIntentService(id) {
    const parcel = await getParcelByIdService(id);
    if (!parcel)
        throw new AppError_1.default(404, 'Parcel not found');
    if (parcel.status === 'paid') {
        throw new AppError_1.default(400, 'Parcel is already paid');
    }
    // Cost is calculated during creation, but let's ensure it's available
    const amount = parcel.cost ? parcel.cost * 100 : calculateParcelCost(parcel) * 100;
    const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'bdt',
        metadata: {
            parcelId: id,
        },
    });
    return { clientSecret: paymentIntent.client_secret, amount: amount / 100 };
}
async function payParcelService(id, paymentInfo) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const parcelIndex = exports.memoryStore.parcels.findIndex((parcel) => parcel._id?.toString() === id);
        if (parcelIndex === -1) {
            throw new AppError_1.default(404, 'Parcel not found');
        }
        const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;
        const payment = {
            _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            parcelId: id,
            trackingNo,
            paidAt: new Date().toISOString(),
            ...paymentInfo
        };
        exports.memoryStore.parcels[parcelIndex] = {
            ...exports.memoryStore.parcels[parcelIndex],
            status: 'paid',
            trackingNo,
            paymentInfo: payment
        };
        exports.memoryStore.payments.push(payment);
        exports.memoryStore.tracking.push(createTrackingEntry(id, 'paid', 'Parcel payment received and tracking number assigned.', { trackingNo }));
        return { acknowledged: true, trackingNo, payment };
    }
    const queryId = mongodb_1.ObjectId.isValid(id) && String(new mongodb_1.ObjectId(id)) === id ? new mongodb_1.ObjectId(id) : id;
    const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;
    const payment = {
        parcelId: id,
        trackingNo,
        paidAt: new Date().toISOString(),
        ...paymentInfo
    };
    const updateResult = await db.collection('parcels').updateOne({ _id: queryId }, { $set: { status: 'paid', trackingNo, paymentInfo: payment } });
    if (updateResult.matchedCount === 0) {
        throw new AppError_1.default(404, 'Parcel not found');
    }
    if (updateResult.modifiedCount > 0) {
        await db.collection('payments').insertOne(payment);
        await db.collection('tracking').insertOne(createTrackingEntry(id, 'paid', 'Parcel payment received and tracking number assigned.', { trackingNo }));
    }
    return { acknowledged: updateResult.modifiedCount > 0, trackingNo, payment };
}
async function updateParcelStatusService(id, status, message, riderEmail) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const parcelIndex = exports.memoryStore.parcels.findIndex((parcel) => parcel._id?.toString() === id);
        if (parcelIndex === -1) {
            throw new AppError_1.default(404, 'Parcel not found');
        }
        exports.memoryStore.parcels[parcelIndex] = {
            ...exports.memoryStore.parcels[parcelIndex],
            status,
            ...(riderEmail ? { riderEmail } : {})
        };
        exports.memoryStore.tracking.push(createTrackingEntry(id, status, message || 'Parcel status updated.', { riderEmail }));
        return { acknowledged: true, modifiedCount: 1 };
    }
    const queryId = mongodb_1.ObjectId.isValid(id) && String(new mongodb_1.ObjectId(id)) === id ? new mongodb_1.ObjectId(id) : id;
    const updateResult = await db.collection('parcels').updateOne({ _id: queryId }, { $set: { status, ...(riderEmail ? { riderEmail } : {}) } });
    if (updateResult.matchedCount === 0) {
        throw new AppError_1.default(404, 'Parcel not found');
    }
    if (updateResult.modifiedCount > 0) {
        await db.collection('tracking').insertOne(createTrackingEntry(id, status, message || 'Parcel status updated.', { riderEmail }));
    }
    return updateResult;
}
async function getPaymentsService(email) {
    const db = (0, db_1.getDB)();
    if (!db) {
        return email
            ? exports.memoryStore.payments.filter((payment) => payment.email === email)
            : exports.memoryStore.payments;
    }
    const query = email ? { email } : {};
    return db.collection('payments').find(query).toArray();
}
