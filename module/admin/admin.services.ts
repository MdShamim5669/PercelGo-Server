import { getDB } from '../../config/db';
import { ObjectId } from 'mongodb';
// We should ideally export memoryStore from parcelServicecs, but due to circular dependencies/require changes, let's use it dynamically or directly
import { memoryStore as parcelMemoryStore } from '../parcel/parcel.services';
import AppError from '../utils/AppError';

const memoryStore: any = {
  users: [],
  parcels: [] // Note: ideally this should share state with parcelServicecs, but for memory mode we do what we can.
};

export async function getStatsService() {
  const db = getDB();
  if (!db) {
    return {
      totalUsers: memoryStore.users.length,
      totalParcels: memoryStore.parcels.length,
      activeRiders: memoryStore.users.filter((u: any) => u.role === 'rider' && u.riderStatus === 'approved').length,
      revenue: memoryStore.parcels.reduce((acc: number, p: any) => acc + (Number(p.cost) || 0), 0)
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

export async function updateRiderStatusService(id: string, status: string) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user: any) => user._id === id);
    if (userIndex === -1) {
      throw new AppError(404, 'Rider not found');
    }
    memoryStore.users[userIndex].riderStatus = status;
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateResult = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: { riderStatus: status } }
  );

  if (updateResult.matchedCount === 0) {
    throw new AppError(404, 'Rider not found');
  }

  return updateResult;
}

export async function updateUserRoleService(id: string, role: string) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user: any) => user._id === id);
    if (userIndex === -1) {
      throw new AppError(404, 'User not found');
    }
    memoryStore.users[userIndex].role = role;
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateDoc: any = { $set: { role } };
  
  if (role === 'rider') {
    updateDoc.$set.riderStatus = 'approved';
  } else if (role !== 'rider') {
    // If they are demoted from rider, maybe clear the status
    updateDoc.$unset = { riderStatus: "" };
  }

  const updateResult = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    updateDoc
  );

  if (updateResult.matchedCount === 0) {
    throw new AppError(404, 'User not found');
  }

  return updateResult;
}

function createTrackingEntry(parcelId: string, status: string, message: string) {
  return { parcelId, status, message, timestamp: new Date().toISOString() };
}

export async function assignPickupRiderService(id: string, riderEmail: string) {
  const db = getDB();
  const status = 'ready-to-pickup';
  const trackingEntry = createTrackingEntry(id, status, 'Admin assigned a pickup rider.');

  if (!db) {
    const parcelIndex = parcelMemoryStore.parcels.findIndex((parcel: any) => parcel._id === id);
    if (parcelIndex === -1) throw new AppError(404, 'Parcel not found');
    parcelMemoryStore.parcels[parcelIndex].pickupRider = riderEmail;
    parcelMemoryStore.parcels[parcelIndex].status = status;
    parcelMemoryStore.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { pickupRider: riderEmail, status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  } else {
    throw new AppError(404, 'Parcel not found');
  }
  return updateResult;
}

export async function confirmReceiveService(id: string) {
  const db = getDB();
  const status = 'reached-service-center';
  const trackingEntry = createTrackingEntry(id, status, 'Parcel received at the service center.');

  if (!db) {
    const parcelIndex = parcelMemoryStore.parcels.findIndex((parcel: any) => parcel._id === id);
    if (parcelIndex === -1) throw new AppError(404, 'Parcel not found');
    parcelMemoryStore.parcels[parcelIndex].status = status;
    parcelMemoryStore.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  } else {
    throw new AppError(404, 'Parcel not found');
  }
  return updateResult;
}

export async function shipParcelService(id: string) {
  const db = getDB();
  const status = 'shipped';
  const trackingEntry = createTrackingEntry(id, status, 'Parcel shipped to destination service center.');

  if (!db) {
    const parcelIndex = parcelMemoryStore.parcels.findIndex((parcel: any) => parcel._id === id);
    if (parcelIndex === -1) throw new AppError(404, 'Parcel not found');
    parcelMemoryStore.parcels[parcelIndex].status = status;
    parcelMemoryStore.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  } else {
    throw new AppError(404, 'Parcel not found');
  }
  return updateResult;
}

export async function assignDeliveryRiderService(id: string, riderEmail: string) {
  const db = getDB();
  const status = 'ready-for-delivery';
  const trackingEntry = createTrackingEntry(id, status, 'Admin assigned a delivery rider.');

  if (!db) {
    const parcelIndex = parcelMemoryStore.parcels.findIndex((parcel: any) => parcel._id === id);
    if (parcelIndex === -1) throw new AppError(404, 'Parcel not found');
    parcelMemoryStore.parcels[parcelIndex].deliveryRider = riderEmail;
    parcelMemoryStore.parcels[parcelIndex].status = status;
    parcelMemoryStore.tracking.push(trackingEntry);
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { deliveryRider: riderEmail, status } }
  );

  if (updateResult.matchedCount > 0) {
    await db.collection('tracking').insertOne(trackingEntry);
  } else {
    throw new AppError(404, 'Parcel not found');
  }
  return updateResult;
}

export async function deleteUserService(id: string) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user: any) => user._id === id);
    if (userIndex === -1) {
      throw new AppError(404, 'User not found');
    }
    memoryStore.users.splice(userIndex, 1);
    return { acknowledged: true, deletedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const deleteResult = await db.collection('users').deleteOne({ _id: new ObjectId(id) });

  if (deleteResult.deletedCount === 0) {
    throw new AppError(404, 'User not found');
  }

  return deleteResult;
}
