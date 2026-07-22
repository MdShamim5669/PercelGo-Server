const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/zapShiftDB';
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let database = null;
let connectError = null;

async function connectDB() {
  if (database) return database;
  try {
    await client.connect();
    database = client.db(process.env.DB_NAME || 'PerCelGo');
    connectError = null;
    console.log('MongoDB Connected Successfully!');
    return database;
  } catch (error) {
    connectError = error;
    database = null;
    console.error('MongoDB Connection Error Details:', error.message);
    console.warn('MongoDB connection unavailable. Continuing in memory mode.');
    return null;
  }
}

function getDB() {
  return database;
}

function isDBReady() {
  return Boolean(database);
}

function getConnectError() {
  return connectError;
}

module.exports = { connectDB, getDB, isDBReady, getConnectError };