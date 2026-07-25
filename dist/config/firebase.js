"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let app = null;
if (process.env.FB_SERVICE_KEY) {
    try {
        const serviceAccount = JSON.parse(Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8'));
        app = (0, app_1.initializeApp)({
            credential: (0, app_1.cert)(serviceAccount)
        });
        console.log('Firebase Admin SDK initialized successfully.');
    }
    catch (error) {
        console.error('Failed to initialize Firebase Admin SDK. Please check your FB_SERVICE_KEY.', error);
    }
}
else {
    console.warn('FB_SERVICE_KEY is missing in .env. Firebase Admin SDK might not verify tokens correctly unless default credentials are available.');
    // Fallback to default credentials (e.g. if deployed to Google Cloud)
    try {
        app = (0, app_1.initializeApp)({
            credential: (0, app_1.applicationDefault)()
        });
    }
    catch (error) {
        console.error('Failed to initialize Firebase Admin with default credentials:', error);
    }
}
exports.default = app;
