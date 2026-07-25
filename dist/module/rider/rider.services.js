"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPickupParcelsService = getPickupParcelsService;
exports.getDeliveryParcelsService = getDeliveryParcelsService;
exports.confirmPickupService = confirmPickupService;
exports.deliverParcelService = deliverParcelService;
exports.getRiderEarningsService = getRiderEarningsService;
const db_1 = require("../../config/db");
const mongodb_1 = require("mongodb");
const parcel_services_1 = require("../parcel/parcel.services");
const AppError_1 = __importDefault(require("../utils/AppError"));
const memoryRiderEarnings = {};
async function calculateEarning(riderEmail, parcelId, db) {
    const earningRecord = {
        riderEmail,
        parcelId,
        earning: 20, // Flat 20 as per requirement.md
        timestamp: new Date().toISOString()
    };
    if (!db) {
        if (!memoryRiderEarnings[riderEmail])
            memoryRiderEarnings[riderEmail] = [];
        memoryRiderEarnings[riderEmail].push(earningRecord);
    }
    else {
        return db.collection('earnings').insertOne(earningRecord);
    }
}
async function getPickupParcelsService(riderEmail) {
    const db = (0, db_1.getDB)();
    if (!db) {
        return parcel_services_1.memoryStore.parcels.filter((p) => p.pickupRider === riderEmail && p.status === 'ready-to-pickup');
    }
    return db.collection('parcels').find({ pickupRider: riderEmail, status: 'ready-to-pickup' }).toArray();
}
async function getDeliveryParcelsService(riderEmail) {
    const db = (0, db_1.getDB)();
    if (!db) {
        return parcel_services_1.memoryStore.parcels.filter((p) => p.deliveryRider === riderEmail && p.status === 'ready-for-delivery');
    }
    return db.collection('parcels').find({ deliveryRider: riderEmail, status: 'ready-for-delivery' }).toArray();
}
async function confirmPickupService(parcelId, trackingNo, riderEmail) {
    const db = (0, db_1.getDB)();
    let parcel = null;
    if (!db) {
        const idx = parcel_services_1.memoryStore.parcels.findIndex((p) => p._id === parcelId && p.pickupRider === riderEmail && p.status === 'ready-to-pickup');
        if (idx === -1)
            throw new AppError_1.default(404, 'Parcel not found or not assigned for pickup');
        parcel = parcel_services_1.memoryStore.parcels[idx];
        if (parcel.trackingNo !== trackingNo)
            throw new AppError_1.default(400, 'Invalid Tracking Number');
        const isSameCity = String(parcel.pickupRegion || '').toLowerCase() === String(parcel.deliveryRegion || '').toLowerCase() ||
            String(parcel.pickupServiceCenter || '').toLowerCase() === String(parcel.deliveryServiceCenter || '').toLowerCase();
        const newStatus = isSameCity ? 'ready-for-delivery' : 'in-transit';
        parcel_services_1.memoryStore.parcels[idx].status = newStatus;
        parcel_services_1.memoryStore.tracking.push({ parcelId, status: newStatus, message: `Parcel picked up by rider. Status updated to ${newStatus}.`, timestamp: new Date().toISOString() });
        calculateEarning(riderEmail, parcelId, db);
        return { success: true, message: `Parcel picked up successfully. Status is now ${newStatus}.`, earning: 20 };
    }
    else {
        if (!mongodb_1.ObjectId.isValid(parcelId))
            throw new AppError_1.default(400, 'Invalid parcel ID');
        parcel = await db.collection('parcels').findOne({ _id: new mongodb_1.ObjectId(parcelId), pickupRider: riderEmail, status: 'ready-to-pickup' });
        if (!parcel)
            throw new AppError_1.default(404, 'Parcel not found or not assigned for pickup');
        if (parcel.trackingNo !== trackingNo)
            throw new AppError_1.default(400, 'Invalid Tracking Number');
        const isSameCity = String(parcel.pickupRegion || '').toLowerCase() === String(parcel.deliveryRegion || '').toLowerCase() ||
            String(parcel.pickupServiceCenter || '').toLowerCase() === String(parcel.deliveryServiceCenter || '').toLowerCase();
        const newStatus = isSameCity ? 'ready-for-delivery' : 'in-transit';
        await db.collection('parcels').updateOne({ _id: new mongodb_1.ObjectId(parcelId) }, { $set: { status: newStatus } });
        await db.collection('tracking').insertOne({ parcelId, status: newStatus, message: `Parcel picked up by rider. Status updated to ${newStatus}.`, timestamp: new Date().toISOString() });
        await calculateEarning(riderEmail, parcelId, db);
        return { success: true, message: `Parcel picked up successfully. Status is now ${newStatus}.`, earning: 20 };
    }
}
async function deliverParcelService(parcelId, trackingNo, riderEmail) {
    const db = (0, db_1.getDB)();
    let parcel = null;
    if (!db) {
        const idx = parcel_services_1.memoryStore.parcels.findIndex((p) => p._id === parcelId && p.deliveryRider === riderEmail && p.status === 'ready-for-delivery');
        if (idx === -1)
            throw new AppError_1.default(404, 'Parcel not found or not assigned for delivery');
        parcel = parcel_services_1.memoryStore.parcels[idx];
        if (parcel.trackingNo !== trackingNo)
            throw new AppError_1.default(400, 'Invalid Tracking Number');
        parcel_services_1.memoryStore.parcels[idx].status = 'Delivered';
        parcel_services_1.memoryStore.tracking.push({ parcelId, status: 'Delivered', message: 'Parcel successfully delivered to customer.', timestamp: new Date().toISOString() });
        calculateEarning(riderEmail, parcelId, db);
        return { success: true, message: 'Parcel delivered successfully', earning: 20 };
    }
    else {
        if (!mongodb_1.ObjectId.isValid(parcelId))
            throw new AppError_1.default(400, 'Invalid parcel ID');
        parcel = await db.collection('parcels').findOne({ _id: new mongodb_1.ObjectId(parcelId), deliveryRider: riderEmail, status: 'ready-for-delivery' });
        if (!parcel)
            throw new AppError_1.default(404, 'Parcel not found or not assigned for delivery');
        if (parcel.trackingNo !== trackingNo)
            throw new AppError_1.default(400, 'Invalid Tracking Number');
        await db.collection('parcels').updateOne({ _id: new mongodb_1.ObjectId(parcelId) }, { $set: { status: 'Delivered' } });
        await db.collection('tracking').insertOne({ parcelId, status: 'Delivered', message: 'Parcel successfully delivered to customer.', timestamp: new Date().toISOString() });
        await calculateEarning(riderEmail, parcelId, db);
        return { success: true, message: 'Parcel delivered successfully', earning: 20 };
    }
}
async function getRiderEarningsService(riderEmail) {
    const db = (0, db_1.getDB)();
    if (!db) {
        return memoryRiderEarnings[riderEmail] || [];
    }
    return db.collection('earnings').find({ riderEmail }).toArray();
}
