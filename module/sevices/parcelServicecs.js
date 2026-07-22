const { getDB } = require('../../config/db');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

const memoryStore = {
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
    // Made senderContact, receiverContact, pickupServiceCenter, deliveryServiceCenter optional for now
  ];

  const missing = requiredFields.filter((field) => !parcelData[field]);
  if (missing.length) {
    const error = new Error(`Missing required fields: ${missing.join(', ')}`);
    error.status = 400;
    throw error;
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

  const db = getDB();
  const parcel = buildParcelRecord(parcelData);

  if (!db) {
    memoryStore.parcels.push(parcel);
    return { acknowledged: true, insertedId: parcel._id, parcel };
  }

  return db.collection('parcels').insertOne(parcel);
}

async function getParcelsService(email) {
  const db = getDB();

  if (!db) {
    return email
      ? memoryStore.parcels.filter((parcel) => parcel.senderEmail === email || parcel.senderContact === email)
      : memoryStore.parcels;
  }

  const query = email ? { senderEmail: email } : {};
  return db.collection('parcels').find(query).toArray();
}

async function getParcelByIdService(id) {
  const db = getDB();

  if (!db) {
    return memoryStore.parcels.find((parcel) => parcel._id?.toString() === id) || null;
  }

  if (!ObjectId.isValid(id)) return null;

  return db.collection('parcels').findOne({ _id: new ObjectId(id) });
}

async function payParcelService(id, paymentInfo) {
  const db = getDB();

  if (!db) {
    const parcelIndex = memoryStore.parcels.findIndex((parcel) => parcel._id?.toString() === id);
    if (parcelIndex === -1) {
      return { status: 404, message: 'Parcel not found' };
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

  const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;
  const payment = {
    parcelId: id,
    trackingNo,
    paidAt: new Date().toISOString(),
    ...paymentInfo
  };

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: 'paid', trackingNo, paymentInfo: payment } }
  );

  if (updateResult.modifiedCount > 0) {
    await db.collection('tracking').insertOne(createTrackingEntry(id, 'paid', 'Parcel payment received and tracking number assigned.', { trackingNo }));
  }

  return { acknowledged: updateResult.modifiedCount > 0, trackingNo, payment };
}

async function updateParcelStatusService(id, status, message, riderEmail) {
  const db = getDB();

  if (!db) {
    const parcelIndex = memoryStore.parcels.findIndex((parcel) => parcel._id?.toString() === id);
    if (parcelIndex === -1) {
      return { status: 404, message: 'Parcel not found' };
    }

    memoryStore.parcels[parcelIndex] = {
      ...memoryStore.parcels[parcelIndex],
      status,
      ...(riderEmail ? { riderEmail } : {})
    };
    memoryStore.tracking.push(createTrackingEntry(id, status, message || 'Parcel status updated.', { riderEmail }));

    return { acknowledged: true, modifiedCount: 1 };
  }

  const updateResult = await db.collection('parcels').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, ...(riderEmail ? { riderEmail } : {}) } }
  );

  if (updateResult.modifiedCount > 0) {
    await db.collection('tracking').insertOne(createTrackingEntry(id, status, message || 'Parcel status updated.', { riderEmail }));
  }

  return updateResult;
}


async function getPaymentsService(email) {
  const db = getDB();

  if (!db) {
    return email
      ? memoryStore.payments.filter((payment) => payment.email === email)
      : memoryStore.payments;
  }

  const query = email ? { email } : {};
  return db.collection('payments').find(query).toArray();
}

module.exports = {
  memoryStore,
  createParcelService,
  getParcelsService,
  getParcelByIdService,
  payParcelService,
  updateParcelStatusService,
  getPaymentsService
};
