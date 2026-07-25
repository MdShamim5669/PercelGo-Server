"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.getDB = getDB;
exports.isDBReady = isDBReady;
exports.getConnectError = getConnectError;
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const uri = process.env.MONGODB_URI;
const client = new mongodb_1.MongoClient(uri, {
    serverApi: {
        version: mongodb_1.ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
let database = null;
let connectError = null;
async function connectDB() {
    if (database)
        return database;
    try {
        await client.connect();
        database = client.db(process.env.DB_NAME || 'PerCelGo');
        connectError = null;
        console.log('MongoDB Connected Successfully!');
        return database;
    }
    catch (error) {
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
