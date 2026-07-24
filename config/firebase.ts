import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import dotenv from 'dotenv';
dotenv.config();

let app = null;

if (process.env.FB_SERVICE_KEY) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8'));
    app = initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK. Please check your FB_SERVICE_KEY.', error);
  }
} else {
  console.warn('FB_SERVICE_KEY is missing in .env. Firebase Admin SDK might not verify tokens correctly unless default credentials are available.');
  // Fallback to default credentials (e.g. if deployed to Google Cloud)
  try {
    app = initializeApp({
      credential: applicationDefault()
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin with default credentials:', error);
  }
}

export default app;
