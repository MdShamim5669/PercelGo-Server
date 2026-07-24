import { getDB } from '../../config/db';
import { ObjectId } from 'mongodb';
import AppError from '../utils/AppError';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET || '', {
  apiVersion: '2025-01-27.acacia' as any,
});

export const memoryStore: any = {
  parcels: [],
  tracking: [],
  payments: []
};

function buildParcelRecord(parcelData: any) {
  const parcel = {
    ...parcelData,
    creation_date: new Date().toISOString(),
    status: parcelData.status || 'unpaid',
    cost: calculateParcelCost(parcelData)
  };

  parcel._id = parcel._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return parcel;
}

function calculateParcelCost(parcel: any) {
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

function validateParcel(parcelData: any) {
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
    throw new AppError(400, `Missing required fields: ${missing.join(', ')}`);
  }
}

function createTrackingEntry(parcelId: string, status: string, message: string, extra: any = {}) {
  return {
    _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    parcelId,
    status,
    message,
    timestamp: new Date().toISOString(),
    ...extra
  };
}

export async function createParcelService(parcelData: any) {
  validateParcel(parcelData);

  const db = getDB();
  const parcel = buildParcelRecord(parcelData);

  if (!db) {
    memoryStore.parcels.push(parcel);
    return { acknowledged: true, insertedId: parcel._id, parcel };
  }

  return db.collection('parcels').insertOne(parcel);
}

export async function getParcelsService(email?: string) {
  const db = getDB();

  if (!db) {
    return email
      ? memoryStore.parcels.filter((parcel: any) => parcel.senderEmail === email || parcel.senderContact === email)
      : memoryStore.parcels;
  }

  const query = email ? { senderEmail: email } : {};
  return db.collection('parcels').find(query).toArray();
}

export async function getParcelByIdService(id: string) {
  const db = getDB();

  if (!db) {
    const parcel = memoryStore.parcels.find((parcel: any) => parcel._id?.toString() === id) || null;
    if (!parcel) throw new AppError(404, 'Parcel not found');
    return parcel;
  }

  const queryId: any = ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : id;
  const parcel = await db.collection('parcels').findOne({ _id: queryId });
  if (!parcel) throw new AppError(404, 'Parcel not found');
  return parcel;
}

export async function createPaymentIntentService(id: string) {
  const parcel = await getParcelByIdService(id);
  if (!parcel) throw new AppError(404, 'Parcel not found');
  
  if (parcel.status === 'paid') {
    throw new AppError(400, 'Parcel is already paid');
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

export async function payParcelService(id: string, paymentInfo: any) {
  const db = getDB();

  if (!db) {
    const parcelIndex = memoryStore.parcels.findIndex((parcel: any) => parcel._id?.toString() === id);
    if (parcelIndex === -1) {
      throw new AppError(404, 'Parcel not found');
    }

    const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;
    const payment = {
      _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      parcelId: id,
      trackingNo,
      paidAt: new Date().toISOString(),
      ...paymentInfo
    };

    memoryStore.parcels[parcelIndex] = {
      ...memoryStore.parcels[parcelIndex],
      status: 'paid',
      trackingNo,
      paymentInfo: payment
    };
    memoryStore.payments.push(payment);
    memoryStore.tracking.push(createTrackingEntry(id, 'paid', 'Parcel payment received and tracking number assigned.', { trackingNo }));

    return { acknowledged: true, trackingNo, payment };
  }
  
  const queryId: any = ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : id;

  const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;
  const payment = {
    parcelId: id,
    trackingNo,
    paidAt: new Date().toISOString(),
    ...paymentInfo
  };

  const updateResult = await db.collection('parcels').updateOne(
    { _id: queryId },
    { $set: { status: 'paid', trackingNo, paymentInfo: payment } }
  );
  
  if (updateResult.matchedCount === 0) {
      throw new AppError(404, 'Parcel not found');
  }

  if (updateResult.modifiedCount > 0) {
    await db.collection('payments').insertOne(payment);
    await db.collection('tracking').insertOne(createTrackingEntry(id, 'paid', 'Parcel payment received and tracking number assigned.', { trackingNo }));
  }

  return { acknowledged: updateResult.modifiedCount > 0, trackingNo, payment };
}

export async function updateParcelStatusService(id: string, status: string, message: string, riderEmail?: string) {
  const db = getDB();

  if (!db) {
    const parcelIndex = memoryStore.parcels.findIndex((parcel: any) => parcel._id?.toString() === id);
    if (parcelIndex === -1) {
      throw new AppError(404, 'Parcel not found');
    }

    memoryStore.parcels[parcelIndex] = {
      ...memoryStore.parcels[parcelIndex],
      status,
      ...(riderEmail ? { riderEmail } : {})
    };
    memoryStore.tracking.push(createTrackingEntry(id, status, message || 'Parcel status updated.', { riderEmail }));

    return { acknowledged: true, modifiedCount: 1 };
  }
  
  const queryId: any = ObjectId.isValid(id) && String(new ObjectId(id)) === id ? new ObjectId(id) : id;

  const updateResult = await db.collection('parcels').updateOne(
    { _id: queryId },
    { $set: { status, ...(riderEmail ? { riderEmail } : {}) } }
  );
  
  if (updateResult.matchedCount === 0) {
      throw new AppError(404, 'Parcel not found');
  }

  if (updateResult.modifiedCount > 0) {
    await db.collection('tracking').insertOne(createTrackingEntry(id, status, message || 'Parcel status updated.', { riderEmail }));
  }

  return updateResult;
}


export async function getPaymentsService(email?: string) {
  const db = getDB();

  if (!db) {
    return email
      ? memoryStore.payments.filter((payment: any) => payment.email === email)
      : memoryStore.payments;
  }

  const query = email ? { email } : {};
  return db.collection('payments').find(query).toArray();
}
