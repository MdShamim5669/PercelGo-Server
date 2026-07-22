const jwt = require('jsonwebtoken');
const { getDB } = require('../../config/db');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Assume the payload has at least { email, role }
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

const verifyAdmin = async (req, res, next) => {
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
    const user = await db.collection('users').findOne({ email: req.user.email });
    
    if (user && user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Access Denied: You do not have Admin privileges.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during authorization verification.' });
  }
};

const verifyRider = async (req, res, next) => {
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
    const user = await db.collection('users').findOne({ email: req.user.email });
    
    if (user && user.role === 'rider') {
      next();
    } else {
      res.status(403).json({ message: 'Access Denied: You do not have Rider privileges.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error during authorization verification.' });
  }
};

module.exports = { verifyToken, verifyAdmin, verifyRider };
