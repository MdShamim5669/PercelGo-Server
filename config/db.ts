import { MongoClient, ServerApiVersion, Db } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let database: Db | null = null;
let connectError: Error | null = null;

export async function connectDB(): Promise<Db | null> {
  if (database) return database;
  try {
    await client.connect();
    database = client.db(process.env.DB_NAME || 'PerCelGo');
    connectError = null;
    console.log('MongoDB Connected Successfully!');
    return database;
  } catch (error: any) {
    connectError = error;
    database = null;
    console.error('MongoDB Connection Error Details:', error.message);
    console.warn('MongoDB connection unavailable. Continuing in memory mode.');
    return null;
  }
}

export function getDB(): Db | null {
  return database;
}

export function isDBReady(): boolean {
  return Boolean(database);
}

export function getConnectError(): Error | null {
  return connectError;
}