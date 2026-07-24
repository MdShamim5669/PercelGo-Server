import { Request, Response, NextFunction } from 'express';
import admin from '../../config/firebase';
import { getAuth } from 'firebase-admin/auth';
import { getDB } from '../../config/db';

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided.' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken; // Firebase token payload will have email, uid, etc.
    next();
  } catch (error) {
    console.error('Error verifying Firebase token:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDB();
    
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
    } else {
      res.status(403).json({ message: 'Access Denied: You do not have Admin privileges.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during authorization verification.' });
  }
};

export const verifyRider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDB();
    
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
    } else {
      res.status(403).json({ message: 'Access Denied: You do not have Rider privileges.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during authorization verification.' });
  }
};
