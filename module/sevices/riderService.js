const { getDB } = require('../../config/db');
const { ObjectId } = require('mongodb');
const { memoryStore } = require('./parcelServicecs');

const memoryRiderEarnings = {};

function calculateEarning(riderEmail, parcelId, db) {
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

async function getPickupParcelsService(riderEmail) {
  const db = getDB();
  if (!db) {
    return memoryStore.parcels.filter(p => p.pickupRider === riderEmail && p.status === 'ready-to-pickup');
  }
  return db.collection('parcels').find({ pickupRider: riderEmail, status: 'ready-to-pickup' }).toArray();
}

async function getDeliveryParcelsService(riderEmail) {
  const db = getDB();
  if (!db) {
    return memoryStore.parcels.filter(p => p.deliveryRider === riderEmail && p.status === 'ready-for-delivery');
  }
  return db.collection('parcels').find({ deliveryRider: riderEmail, status: 'ready-for-delivery' }).toArray();
}

async function confirmPickupService(parcelId, trackingNo, riderEmail) {
  const db = getDB();
  let parcel = null;

  if (!db) {
    const idx = memoryStore.parcels.findIndex(p => p._id === parcelId && p.pickupRider === riderEmail && p.status === 'ready-to-pickup');
    if (idx === -1) return { status: 404, message: 'Parcel not found or not assigned for pickup' };
    parcel = memoryStore.parcels[idx];
    
    if (parcel.trackingNo !== trackingNo) return { status: 400, message: 'Invalid Tracking Number' };
    
    const isSameCity = String(parcel.pickupRegion || '').toLowerCase() === String(parcel.deliveryRegion || '').toLowerCase() || 
                       String(parcel.pickupServiceCenter || '').toLowerCase() === String(parcel.deliveryServiceCenter || '').toLowerCase();
    
    const newStatus = isSameCity ? 'ready-for-delivery' : 'in-transit';
    memoryStore.parcels[idx].status = newStatus;
    
    memoryStore.tracking.push({ parcelId, status: newStatus, message: `Parcel picked up by rider. Status updated to ${newStatus}.`, timestamp: new Date().toISOString() });
    
    calculateEarning(riderEmail, parcelId, db);
    return { success: true, message: `Parcel picked up successfully. Status is now ${newStatus}.`, earning: 20 };
  } else {
    if (!ObjectId.isValid(parcelId)) return { status: 400, message: 'Invalid parcel ID' };
    parcel = await db.collection('parcels').findOne({ _id: new ObjectId(parcelId), pickupRider: riderEmail, status: 'ready-to-pickup' });
    if (!parcel) return { status: 404, message: 'Parcel not found or not assigned for pickup' };

    if (parcel.trackingNo !== trackingNo) return { status: 400, message: 'Invalid Tracking Number' };

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

async function deliverParcelService(parcelId, trackingNo, riderEmail) {
  const db = getDB();
  let parcel = null;

  if (!db) {
    const idx = memoryStore.parcels.findIndex(p => p._id === parcelId && p.deliveryRider === riderEmail && p.status === 'ready-for-delivery');
    if (idx === -1) return { status: 404, message: 'Parcel not found or not assigned for delivery' };
    parcel = memoryStore.parcels[idx];
    
    if (parcel.trackingNo !== trackingNo) return { status: 400, message: 'Invalid Tracking Number' };
    
    memoryStore.parcels[idx].status = 'Delivered';
    
    memoryStore.tracking.push({ parcelId, status: 'Delivered', message: 'Parcel successfully delivered to customer.', timestamp: new Date().toISOString() });
    
    calculateEarning(riderEmail, parcelId, db);
    return { success: true, message: 'Parcel delivered successfully', earning: 20 };
  } else {
    if (!ObjectId.isValid(parcelId)) return { status: 400, message: 'Invalid parcel ID' };
    parcel = await db.collection('parcels').findOne({ _id: new ObjectId(parcelId), deliveryRider: riderEmail, status: 'ready-for-delivery' });
    if (!parcel) return { status: 404, message: 'Parcel not found or not assigned for delivery' };

    if (parcel.trackingNo !== trackingNo) return { status: 400, message: 'Invalid Tracking Number' };

    await db.collection('parcels').updateOne(
      { _id: new ObjectId(parcelId) },
      { $set: { status: 'Delivered' } }
    );
    
    await db.collection('tracking').insertOne({ parcelId, status: 'Delivered', message: 'Parcel successfully delivered to customer.', timestamp: new Date().toISOString() });
    await calculateEarning(riderEmail, parcelId, db);
    
    return { success: true, message: 'Parcel delivered successfully', earning: 20 };
  }
}

async function getRiderEarningsService(riderEmail) {
  const db = getDB();
  
  if (!db) {
    const earnings = memoryRiderEarnings[riderEmail] || [];
    const total = earnings.reduce((sum, e) => sum + e.earning, 0);
    return { totalEarnings: total, deliveries: earnings.length, details: earnings };
  }

  const earnings = await db.collection('earnings').find({ riderEmail }).toArray();
  const total = earnings.reduce((sum, e) => sum + e.earning, 0);
  return { totalEarnings: total, deliveries: earnings.length, details: earnings };
}

module.exports = {
  getPickupParcelsService,
  getDeliveryParcelsService,
  confirmPickupService,
  deliverParcelService,
  getRiderEarningsService
};
