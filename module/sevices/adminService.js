const { getDB } = require('../../config/db');
const { ObjectId } = require('mongodb');

const memoryStore = {
  users: [],
  parcels: [] // Note: ideally this should share state with parcelServicecs, but for memory mode we do what we can.
};

async function getStatsService() {
  const db = getDB();
  if (!db) {
    return {
      totalUsers: memoryStore.users.length,
      totalParcels: memoryStore.parcels.length
    };
  }

  const totalUsers = await db.collection('users').countDocuments();
  const totalParcels = await db.collection('parcels').countDocuments();
  return { totalUsers, totalParcels };
}

async function updateRiderStatusService(id, status) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user) => user._id === id);
    if (userIndex === -1) {
      return { status: 404, message: 'Rider not found' };
    }
    memoryStore.users[userIndex].riderStatus = status;
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: { riderStatus: status } }
  );

  if (updateResult.matchedCount === 0) {
    return { status: 404, message: 'Rider not found' };
  }

  return updateResult;
}

async function updateUserRoleService(id, role) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user) => user._id === id);
    if (userIndex === -1) {
      return { status: 404, message: 'User not found' };
    }
    memoryStore.users[userIndex].role = role;
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: { role } }
  );

  if (updateResult.matchedCount === 0) {
    return { status: 404, message: 'User not found' };
  }

  return updateResult;
}

function createTrackingEntry(parcelId, status, message) {
  return { parcelId, status, message, timestamp: new Date().toISOString() };
}

async function assignPickupRiderService(id, riderEmail) {
  const db = getDB();
  const status = 'ready-to-pickup';
  const trackingEntry = createTrackingEntry(id, status, 'Admin assigned a pickup rider.');

  if (!db) {
    const memoryStoreObj = require('./parcelServicecs').memoryStore;
    const parcelIndex = memoryStoreObj.parcels.findIndex((parcel) => parcel._id === id);
    if (parcelIndex === -1) return { status: 404, message: 'Parcel not found' };
    memoryStoreObj.parcels[parcelIndex].pickupRider = riderEmail;
    memoryStoreObj.parcels[parcelIndex].status = status;
    memoryStoreObj.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { pickupRider: riderEmail, status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  }
  return updateResult;
}

async function confirmReceiveService(id) {
  const db = getDB();
  const status = 'reached-service-center';
  const trackingEntry = createTrackingEntry(id, status, 'Parcel received at the service center.');

  if (!db) {
    const memoryStoreObj = require('./parcelServicecs').memoryStore;
    const parcelIndex = memoryStoreObj.parcels.findIndex((parcel) => parcel._id === id);
    if (parcelIndex === -1) return { status: 404, message: 'Parcel not found' };
    memoryStoreObj.parcels[parcelIndex].status = status;
    memoryStoreObj.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  }
  return updateResult;
}

async function shipParcelService(id) {
  const db = getDB();
  const status = 'shipped';
  const trackingEntry = createTrackingEntry(id, status, 'Parcel shipped to destination service center.');

  if (!db) {
    const memoryStoreObj = require('./parcelServicecs').memoryStore;
    const parcelIndex = memoryStoreObj.parcels.findIndex((parcel) => parcel._id === id);
    if (parcelIndex === -1) return { status: 404, message: 'Parcel not found' };
    memoryStoreObj.parcels[parcelIndex].status = status;
    memoryStoreObj.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  }
  return updateResult;
}

async function assignDeliveryRiderService(id, riderEmail) {
  const db = getDB();
  const status = 'ready-for-delivery';
  const trackingEntry = createTrackingEntry(id, status, 'Admin assigned a delivery rider.');

  if (!db) {
    const memoryStoreObj = require('./parcelServicecs').memoryStore;
    const parcelIndex = memoryStoreObj.parcels.findIndex((parcel) => parcel._id === id);
    if (parcelIndex === -1) return { status: 404, message: 'Parcel not found' };
    memoryStoreObj.parcels[parcelIndex].deliveryRider = riderEmail;
    memoryStoreObj.parcels[parcelIndex].status = status;
    memoryStoreObj.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { deliveryRider: riderEmail, status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  }
  return updateResult;
}

module.exports = {
  getStatsService,
  updateRiderStatusService,
  updateUserRoleService,
  assignPickupRiderService,
  confirmReceiveService,
  shipParcelService,
  assignDeliveryRiderService
};
