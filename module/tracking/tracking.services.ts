import { getDB } from '../../config/db';
import { memoryStore } from '../parcel/parcel.services';
import AppError from '../utils/AppError';

export async function getTrackingService(email?: string) {
  const db = getDB();

  if (!db) {
    return email
      ? memoryStore.tracking.filter((entry: any) => entry.message?.includes(email) || entry.parcelId?.includes(email))
      : memoryStore.tracking;
  }

  return db.collection('tracking').find({}).toArray();
}

export async function getTrackingLogsService(trackingId: string, decodedEmail: string) {
  const db = getDB();

  let parcel = null;
  let currentUser = null;

  if (!db) {
    parcel = memoryStore.parcels.find((p: any) => p.trackingNo === trackingId);
    currentUser = memoryStore.users?.find((u: any) => u.email === decodedEmail);
  } else {
    parcel = await db.collection('parcels').findOne({ trackingNo: trackingId });
    currentUser = await db.collection('users').findOne({ email: decodedEmail });
  }

  if (!parcel) {
    throw new AppError(404, 'tracking not found');
  }

  const isOwner = parcel.senderEmail === decodedEmail || parcel.senderContact === decodedEmail;
  const isAssignedRider = parcel.pickupRider === decodedEmail || parcel.deliveryRider === decodedEmail || parcel.riderEmail === decodedEmail;
  const isAdmin = currentUser && currentUser.role === 'admin';

  if (!isOwner && !isAssignedRider && !isAdmin) {
    throw new AppError(403, 'forbidden access');
  }

  if (!db) {
    return memoryStore.tracking.filter((t: any) => t.trackingNo === trackingId || t.parcelId === parcel._id);
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
