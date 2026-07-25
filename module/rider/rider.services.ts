import { getDB } from '../../config/db';
import { ObjectId } from 'mongodb';
import { memoryStore } from '../parcel/parcel.services';
import AppError from '../utils/AppError';

const memoryRiderEarnings: any = {};

async function calculateEarning(riderEmail: string, parcelId: string, db: any) {
  const earningRecord = {
    riderEmail,
    parcelId,
    earning: 20, // Flat 20 as per requirement.md
    timestamp: new Date().toISOString()
  };

  if (!db) {
    if (!memoryRiderEarnings[riderEmail]) memoryRiderEarnings[riderEmail] = [];
    memoryRiderEarnings[riderEmail].push(earningRecord);
  } else {
    return db.collection('earnings').insertOne(earningRecord);
  }
}

export async function getPickupParcelsService(riderEmail: string) {
  const db = getDB();
  if (!db) {
    return memoryStore.parcels.filter((p: any) => p.pickupRider === riderEmail && p.status === 'ready-to-pickup');
  }
  return db.collection('parcels').find({ pickupRider: riderEmail, status: 'ready-to-pickup' }).toArray();
}

export async function getDeliveryParcelsService(riderEmail: string) {
  const db = getDB();
  if (!db) {
    return memoryStore.parcels.filter((p: any) => p.deliveryRider === riderEmail && p.status === 'ready-for-delivery');
  }
  return db.collection('parcels').find({ deliveryRider: riderEmail, status: 'ready-for-delivery' }).toArray();
}

export async function confirmPickupService(parcelId: string, trackingNo: string, riderEmail: string) {
  const db = getDB();
  let parcel: any = null;

  if (!db) {
    const idx = memoryStore.parcels.findIndex((p: any) => p._id === parcelId && p.pickupRider === riderEmail && p.status === 'ready-to-pickup');
    if (idx === -1) throw new AppError(404, 'Parcel not found or not assigned for pickup');
    parcel = memoryStore.parcels[idx];
    
    if (parcel.trackingNo !== trackingNo) throw new AppError(400, 'Invalid Tracking Number');
    
    const isSameCity = String(parcel.pickupRegion || '').toLowerCase() === String(parcel.deliveryRegion || '').toLowerCase() || 
                       String(parcel.pickupServiceCenter || '').toLowerCase() === String(parcel.deliveryServiceCenter || '').toLowerCase();
    
    const newStatus = isSameCity ? 'ready-for-delivery' : 'in-transit';
    memoryStore.parcels[idx].status = newStatus;
    
    memoryStore.tracking.push({ parcelId, status: newStatus, message: `Parcel picked up by rider. Status updated to ${newStatus}.`, timestamp: new Date().toISOString() });
    
    calculateEarning(riderEmail, parcelId, db);
    return { success: true, message: `Parcel picked up successfully. Status is now ${newStatus}.`, earning: 20 };
  } else {
    if (!ObjectId.isValid(parcelId)) throw new AppError(400, 'Invalid parcel ID');
    parcel = await db.collection('parcels').findOne({ _id: new ObjectId(parcelId), pickupRider: riderEmail, status: 'ready-to-pickup' });
    if (!parcel) throw new AppError(404, 'Parcel not found or not assigned for pickup');

    if (parcel.trackingNo !== trackingNo) throw new AppError(400, 'Invalid Tracking Number');

    const isSameCity = String(parcel.pickupRegion || '').toLowerCase() === String(parcel.deliveryRegion || '').toLowerCase() || 
                       String(parcel.pickupServiceCenter || '').toLowerCase() === String(parcel.deliveryServiceCenter || '').toLowerCase();
    
    const newStatus = isSameCity ? 'ready-for-delivery' : 'in-transit';

    await db.collection('parcels').updateOne(
      { _id: new ObjectId(parcelId) },
      { $set: { status: newStatus } }
    );
    
    await db.collection('tracking').insertOne({ parcelId, status: newStatus, message: `Parcel picked up by rider. Status updated to ${newStatus}.`, timestamp: new Date().toISOString() });
    await calculateEarning(riderEmail, parcelId, db);
    
    return { success: true, message: `Parcel picked up successfully. Status is now ${newStatus}.`, earning: 20 };
  }
}

export async function deliverParcelService(parcelId: string, trackingNo: string, riderEmail: string, otp?: string) {
  const db = getDB();
  let parcel: any = null;

  if (!db) {
    const idx = memoryStore.parcels.findIndex((p: any) => p._id === parcelId && p.deliveryRider === riderEmail && p.status === 'ready-for-delivery');
    if (idx === -1) throw new AppError(404, 'Parcel not found or not assigned for delivery');
    parcel = memoryStore.parcels[idx];
    
    if (parcel.trackingNo !== trackingNo) throw new AppError(400, 'Invalid Tracking Number');
    if (parcel.paymentMethod === 'COD' && parcel.deliveryOtp && parcel.deliveryOtp !== otp) {
      throw new AppError(400, 'Invalid OTP. Delivery cannot be completed.');
    }
    
    memoryStore.parcels[idx].status = 'Delivered';
    
    memoryStore.tracking.push({ parcelId, status: 'Delivered', message: 'Parcel successfully delivered to customer.', timestamp: new Date().toISOString() });
    
    calculateEarning(riderEmail, parcelId, db);
    return { success: true, message: 'Parcel delivered successfully', earning: 20 };
  } else {
    if (!ObjectId.isValid(parcelId)) throw new AppError(400, 'Invalid parcel ID');
    parcel = await db.collection('parcels').findOne({ _id: new ObjectId(parcelId), deliveryRider: riderEmail, status: 'ready-for-delivery' });
    if (!parcel) throw new AppError(404, 'Parcel not found or not assigned for delivery');

    if (parcel.trackingNo !== trackingNo) throw new AppError(400, 'Invalid Tracking Number');
    if (parcel.paymentMethod === 'COD' && parcel.deliveryOtp && parcel.deliveryOtp !== otp) {
      throw new AppError(400, 'Invalid OTP. Delivery cannot be completed.');
    }

    await db.collection('parcels').updateOne(
      { _id: new ObjectId(parcelId) },
      { $set: { status: 'Delivered' } }
    );
    
    await db.collection('tracking').insertOne({ parcelId, status: 'Delivered', message: 'Parcel successfully delivered to customer.', timestamp: new Date().toISOString() });
    await calculateEarning(riderEmail, parcelId, db);
    
    return { success: true, message: 'Parcel delivered successfully', earning: 20 };
  }
}

export async function getRiderEarningsService(riderEmail: string) {
  const db = getDB();
  if (!db) {
    return memoryRiderEarnings[riderEmail] || [];
  }
  return db.collection('earnings').find({ riderEmail }).toArray();
}
