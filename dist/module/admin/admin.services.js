"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatsService = getStatsService;
exports.updateRiderStatusService = updateRiderStatusService;
exports.updateUserRoleService = updateUserRoleService;
exports.assignPickupRiderService = assignPickupRiderService;
exports.confirmReceiveService = confirmReceiveService;
exports.shipParcelService = shipParcelService;
exports.assignDeliveryRiderService = assignDeliveryRiderService;
exports.deleteUserService = deleteUserService;
const db_1 = require("../../config/db");
const mongodb_1 = require("mongodb");
// We should ideally export memoryStore from parcelServicecs, but due to circular dependencies/require changes, let's use it dynamically or directly
const parcel_services_1 = require("../parcel/parcel.services");
const AppError_1 = __importDefault(require("../utils/AppError"));
const memoryStore = {
    users: [],
    parcels: [] // Note: ideally this should share state with parcelServicecs, but for memory mode we do what we can.
};
async function getStatsService() {
    const db = (0, db_1.getDB)();
    if (!db) {
        return {
            totalUsers: memoryStore.users.length,
            totalParcels: memoryStore.parcels.length,
            activeRiders: memoryStore.users.filter((u) => u.role === 'rider' && u.riderStatus === 'approved').length,
            revenue: memoryStore.parcels.reduce((acc, p) => acc + (Number(p.cost) || 0), 0)
        };
    }
    const totalUsers = await db.collection('users').countDocuments();
    const totalParcels = await db.collection('parcels').countDocuments();
    const activeRiders = await db.collection('users').countDocuments({ role: 'rider', riderStatus: 'approved' });
    const revenueAgg = await db.collection('parcels').aggregate([
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: { $toDouble: "$cost" } }
            }
        }
    ]).toArray();
    const revenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;
    return { totalUsers, totalParcels, activeRiders, revenue };
}
async function updateRiderStatusService(id, status) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const userIndex = memoryStore.users.findIndex((user) => user._id === id);
        if (userIndex === -1) {
            throw new AppError_1.default(404, 'Rider not found');
        }
        memoryStore.users[userIndex].riderStatus = status;
        return { acknowledged: true, modifiedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const updateResult = await db.collection('users').updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { riderStatus: status } });
    if (updateResult.matchedCount === 0) {
        throw new AppError_1.default(404, 'Rider not found');
    }
    return updateResult;
}
async function updateUserRoleService(id, role) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const userIndex = memoryStore.users.findIndex((user) => user._id === id);
        if (userIndex === -1) {
            throw new AppError_1.default(404, 'User not found');
        }
        memoryStore.users[userIndex].role = role;
        return { acknowledged: true, modifiedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const updateDoc = { $set: { role } };
    if (role === 'rider') {
        updateDoc.$set.riderStatus = 'approved';
    }
    else if (role !== 'rider') {
        // If they are demoted from rider, maybe clear the status
        updateDoc.$unset = { riderStatus: "" };
    }
    const updateResult = await db.collection('users').updateOne({ _id: new mongodb_1.ObjectId(id) }, updateDoc);
    if (updateResult.matchedCount === 0) {
        throw new AppError_1.default(404, 'User not found');
    }
    return updateResult;
}
function createTrackingEntry(parcelId, status, message) {
    return { parcelId, status, message, timestamp: new Date().toISOString() };
}
async function assignPickupRiderService(id, riderEmail) {
    const db = (0, db_1.getDB)();
    const status = 'ready-to-pickup';
    const trackingEntry = createTrackingEntry(id, status, 'Admin assigned a pickup rider.');
    if (!db) {
        const parcelIndex = parcel_services_1.memoryStore.parcels.findIndex((parcel) => parcel._id === id);
        if (parcelIndex === -1)
            throw new AppError_1.default(404, 'Parcel not found');
        parcel_services_1.memoryStore.parcels[parcelIndex].pickupRider = riderEmail;
        parcel_services_1.memoryStore.parcels[parcelIndex].status = status;
        parcel_services_1.memoryStore.tracking.push(trackingEntry);
        return { acknowledged: true, modifiedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const updateResult = await db.collection('parcels').updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { pickupRider: riderEmail, status } });
    if (updateResult.matchedCount > 0) {
        await db.collection('tracking').insertOne(trackingEntry);
    }
    else {
        throw new AppError_1.default(404, 'Parcel not found');
    }
    return updateResult;
}
async function confirmReceiveService(id) {
    const db = (0, db_1.getDB)();
    const status = 'reached-service-center';
    const trackingEntry = createTrackingEntry(id, status, 'Parcel received at the service center.');
    if (!db) {
        const parcelIndex = parcel_services_1.memoryStore.parcels.findIndex((parcel) => parcel._id === id);
        if (parcelIndex === -1)
            throw new AppError_1.default(404, 'Parcel not found');
        parcel_services_1.memoryStore.parcels[parcelIndex].status = status;
        parcel_services_1.memoryStore.tracking.push(trackingEntry);
        return { acknowledged: true, modifiedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const updateResult = await db.collection('parcels').updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { status } });
    if (updateResult.matchedCount > 0) {
        await db.collection('tracking').insertOne(trackingEntry);
    }
    else {
        throw new AppError_1.default(404, 'Parcel not found');
    }
    return updateResult;
}
async function shipParcelService(id) {
    const db = (0, db_1.getDB)();
    const status = 'shipped';
    const trackingEntry = createTrackingEntry(id, status, 'Parcel shipped to destination service center.');
    if (!db) {
        const parcelIndex = parcel_services_1.memoryStore.parcels.findIndex((parcel) => parcel._id === id);
        if (parcelIndex === -1)
            throw new AppError_1.default(404, 'Parcel not found');
        parcel_services_1.memoryStore.parcels[parcelIndex].status = status;
        parcel_services_1.memoryStore.tracking.push(trackingEntry);
        return { acknowledged: true, modifiedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const updateResult = await db.collection('parcels').updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { status } });
    if (updateResult.matchedCount > 0) {
        await db.collection('tracking').insertOne(trackingEntry);
    }
    else {
        throw new AppError_1.default(404, 'Parcel not found');
    }
    return updateResult;
}
async function assignDeliveryRiderService(id, riderEmail) {
    const db = (0, db_1.getDB)();
    const status = 'ready-for-delivery';
    const trackingEntry = createTrackingEntry(id, status, 'Admin assigned a delivery rider.');
    if (!db) {
        const parcelIndex = parcel_services_1.memoryStore.parcels.findIndex((parcel) => parcel._id === id);
        if (parcelIndex === -1)
            throw new AppError_1.default(404, 'Parcel not found');
        parcel_services_1.memoryStore.parcels[parcelIndex].deliveryRider = riderEmail;
        parcel_services_1.memoryStore.parcels[parcelIndex].status = status;
        parcel_services_1.memoryStore.tracking.push(trackingEntry);
        return { acknowledged: true, modifiedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const updateResult = await db.collection('parcels').updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: { deliveryRider: riderEmail, status } });
    if (updateResult.matchedCount > 0) {
        await db.collection('tracking').insertOne(trackingEntry);
    }
    else {
        throw new AppError_1.default(404, 'Parcel not found');
    }
    return updateResult;
}
async function deleteUserService(id) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const userIndex = memoryStore.users.findIndex((user) => user._id === id);
        if (userIndex === -1) {
            throw new AppError_1.default(404, 'User not found');
        }
        memoryStore.users.splice(userIndex, 1);
        return { acknowledged: true, deletedCount: 1 };
    }
    if (!mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const deleteResult = await db.collection('users').deleteOne({ _id: new mongodb_1.ObjectId(id) });
    if (deleteResult.deletedCount === 0) {
        throw new AppError_1.default(404, 'User not found');
    }
    return deleteResult;
}
