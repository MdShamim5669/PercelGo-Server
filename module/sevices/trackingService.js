const { getDB } = require('../../config/db');
const { memoryStore } = require('./parcelServicecs');

async function getTrackingService(email) {
  const db = getDB();

  if (!db) {
    return email
      ? memoryStore.tracking.filter((entry) => entry.message?.includes(email) || entry.parcelId?.includes(email))
      : memoryStore.tracking;
  }

  return db.collection('tracking').find({}).toArray();
}

module.exports = {
  getTrackingService
};
