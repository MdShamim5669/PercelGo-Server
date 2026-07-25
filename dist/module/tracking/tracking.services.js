"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrackingService = getTrackingService;
exports.getTrackingLogsService = getTrackingLogsService;
const db_1 = require("../../config/db");
const parcel_services_1 = require("../parcel/parcel.services");
const AppError_1 = __importDefault(require("../utils/AppError"));
async function getTrackingService(email) {
    const db = (0, db_1.getDB)();
    if (!db) {
        return email
            ? parcel_services_1.memoryStore.tracking.filter((entry) => entry.message?.includes(email) || entry.parcelId?.includes(email))
            : parcel_services_1.memoryStore.tracking;
    }
    return db.collection('tracking').find({}).toArray();
}
async function getTrackingLogsService(trackingId, decodedEmail) {
    const db = (0, db_1.getDB)();
    let parcel = null;
    let currentUser = null;
    if (!db) {
        parcel = parcel_services_1.memoryStore.parcels.find((p) => p.trackingNo === trackingId);
        currentUser = parcel_services_1.memoryStore.users?.find((u) => u.email === decodedEmail);
    }
    else {
        parcel = await db.collection('parcels').findOne({ trackingNo: trackingId });
        currentUser = await db.collection('users').findOne({ email: decodedEmail });
    }
    if (!parcel) {
        throw new AppError_1.default(404, 'tracking not found');
    }
    const isOwner = parcel.senderEmail === decodedEmail || parcel.senderContact === decodedEmail;
    const isAssignedRider = parcel.pickupRider === decodedEmail || parcel.deliveryRider === decodedEmail || parcel.riderEmail === decodedEmail;
    const isAdmin = currentUser && currentUser.role === 'admin';
    if (!isOwner && !isAssignedRider && !isAdmin) {
        throw new AppError_1.default(403, 'forbidden access');
    }
    if (!db) {
        return parcel_services_1.memoryStore.tracking.filter((t) => t.trackingNo === trackingId || t.parcelId === parcel._id);
    }
    const trackingLogs = await db.collection('tracking').find({
        $or: [
            { trackingNo: trackingId },
            { parcelId: parcel._id.toString() },
            { parcelId: parcel._id }
        ]
    }).toArray();
    return trackingLogs;
}
