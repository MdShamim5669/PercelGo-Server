// @ts-ignore
import SSLCommerzPayment from 'sslcommerz-lts';
import { getDB } from '../../config/db';
import { ObjectId } from 'mongodb';
import AppError from '../utils/AppError';
import { memoryStore } from '../parcel/parcel.services';

const store_id = process.env.SSLCOMMERZ_STORE_ID || 'testbox';
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD || 'testbox@ssl';
const is_live = false; // true for live, false for sandbox

export async function initPaymentService(paymentData: any) {
  const { parcelId, amount, customerName, customerEmail, customerPhone, customerAddress } = paymentData;
  const tran_id = `REF-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  const data = {
    total_amount: amount,
    currency: 'BDT',
    tran_id: tran_id,
    success_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/success/${tran_id}`,
    fail_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/fail/${tran_id}`,
    cancel_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/cancel/${tran_id}`,
    ipn_url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/v1/payments/ipn`,
    shipping_method: 'Courier',
    product_name: 'Parcel Delivery',
    product_category: 'Service',
    product_profile: 'general',
    cus_name: customerName || 'Customer',
    cus_email: customerEmail || 'customer@example.com',
    cus_add1: customerAddress || 'Dhaka',
    cus_add2: 'Dhaka',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: customerPhone || '01711111111',
    cus_fax: '01711111111',
    ship_name: customerName || 'Customer',
    ship_add1: customerAddress || 'Dhaka',
    ship_add2: 'Dhaka',
    ship_city: 'Dhaka',
    ship_state: 'Dhaka',
    ship_postcode: 1000,
    ship_country: 'Bangladesh',
    value_a: parcelId
  };

  const db = getDB();
  
  if (!db) {
    // Memory store fallback
    const parcelIndex = memoryStore.parcels.findIndex((p: any) => p._id?.toString() === parcelId);
    if (parcelIndex > -1) {
      memoryStore.parcels[parcelIndex].transactionId = tran_id;
    }
  } else {
    // DB Update
    const queryId: any = ObjectId.isValid(parcelId) && String(new ObjectId(parcelId)) === parcelId ? new ObjectId(parcelId) : parcelId;
    await db.collection('parcels').updateOne(
      { _id: queryId },
      { $set: { transactionId: tran_id } }
    );
  }

  const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
  const apiResponse = await sslcz.init(data);
  return { GatewayPageURL: apiResponse?.GatewayPageURL };
}

export async function paymentSuccessService(tranId: string) {
  const db = getDB();
  const trackingNo = `${100000 + Math.floor(Math.random() * 900000)}`;

  if (!db) {
    const parcelIndex = memoryStore.parcels.findIndex((p: any) => p.transactionId === tranId);
    if (parcelIndex > -1) {
      memoryStore.parcels[parcelIndex].status = 'paid';
      memoryStore.parcels[parcelIndex].paymentStatus = 'Paid';
      memoryStore.parcels[parcelIndex].trackingNo = trackingNo;
      memoryStore.tracking.push({
        _id: `${Date.now()}`,
        parcelId: memoryStore.parcels[parcelIndex]._id,
        status: 'paid',
        message: 'Online payment successful. Parcel confirmed.',
        timestamp: new Date().toISOString()
      });
    }
    return;
  }

  const parcel = await db.collection('parcels').findOne({ transactionId: tranId });
  if (!parcel) throw new AppError(404, 'Transaction not found');

  await db.collection('parcels').updateOne(
    { transactionId: tranId },
    { $set: { status: 'paid', paymentStatus: 'Paid', trackingNo } }
  );

  await db.collection('tracking').insertOne({
    parcelId: parcel._id,
    status: 'paid',
    message: 'Online payment successful. Parcel confirmed.',
    timestamp: new Date().toISOString()
  });
}

export async function paymentFailService(tranId: string) {
  // Logic for fail, maybe update paymentStatus to 'Failed'
}

export async function paymentCancelService(tranId: string) {
  // Logic for cancel
}
