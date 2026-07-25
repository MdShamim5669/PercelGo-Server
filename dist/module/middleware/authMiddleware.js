"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRider = exports.verifyAdmin = exports.verifyToken = void 0;
const auth_1 = require("firebase-admin/auth");
const db_1 = require("../../config/db");
const verifyToken = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No token provided.' });
    }
    try {
        const decodedToken = await (0, auth_1.getAuth)().verifyIdToken(token);
        req.user = decodedToken; // Firebase token payload will have email, uid, etc.
        next();
    }
    catch (error) {
        console.error('Error verifying Firebase token:', error);
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};
exports.verifyToken = verifyToken;
const verifyAdmin = async (req, res, next) => {
    try {
        const db = (0, db_1.getDB)();
        // In memory mode or if DB isn't connected, fallback to token's role
        if (!db) {
            if (req.user && req.user.role === 'admin') {
                return next();
            }
            return res.status(403).json({ message: 'Access Denied: You do not have Admin privileges.' });
        }
        // Verify role directly from the database for better security
        const user = await db.collection('users').findOne({ email: req.user?.email });
        if (user && user.role === 'admin') {
            next();
        }
        else {
            res.status(403).json({ message: 'Access Denied: You do not have Admin privileges.' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error during authorization verification.' });
    }
};
exports.verifyAdmin = verifyAdmin;
const verifyRider = async (req, res, next) => {
    try {
        const db = (0, db_1.getDB)();
        // In memory mode or if DB isn't connected, fallback to token's role
        if (!db) {
            if (req.user && req.user.role === 'rider') {
                return next();
            }
            return res.status(403).json({ message: 'Access Denied: You do not have Rider privileges.' });
        }
        // Verify role directly from the database for better security
        const user = await db.collection('users').findOne({ email: req.user?.email });
        if (user && user.role === 'rider') {
            next();
        }
        else {
            res.status(403).json({ message: 'Access Denied: You do not have Rider privileges.' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Internal server error during authorization verification.' });
    }
};
exports.verifyRider = verifyRider;
