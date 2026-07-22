const { getDB } = require('../../config/db');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const memoryStore = {
  users: []
};

async function getAllUsersService(role) {
  const db = getDB();

  if (!db) {
    // Exclude password from returned memory users and apply role filter if provided
    let users = memoryStore.users;
    if (role) {
      users = users.filter(u => u.role === role);
    }
    return users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  }

  // Fetch from DB and exclude passwords, applying role filter if provided
  const query = role ? { role } : {};
  return db.collection('users').find(query, { projection: { password: 0 } }).toArray();
}

async function getUserProfileService(id) {
  const db = getDB();

  if (!db) {
    return memoryStore.users.find((user) => user._id === id) || null;
  }

  if (!ObjectId.isValid(id)) return null;
  return db.collection('users').findOne({ _id: new ObjectId(id) });
}

async function updateUserProfileService(id, profileData) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user) => user._id === id);
    if (userIndex === -1) {
      const newUser = { _id: id, ...profileData };
      memoryStore.users.push(newUser);
      return { acknowledged: true, newUser: true, user: newUser };
    }

    memoryStore.users[userIndex] = { ...memoryStore.users[userIndex], ...profileData };
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) return { status: 400, message: 'Invalid ID format' };

  const updateResult = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: profileData },
    { upsert: false } // removed upsert for safety since we're updating an existing id
  );

  if (updateResult.matchedCount === 0) {
    return { status: 404, message: 'User not found' };
  }

  return updateResult;
}

async function registerUserService(userData) {
  const db = getDB();
  const { name, email, password, role } = userData;

  if (!name || !email || !password) {
    return { status: 400, message: 'Name, email, and password are required' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
    createdAt: new Date().toISOString()
  };

  if (!db) {
    const existing = memoryStore.users.find(u => u.email === email);
    if (existing) return { status: 409, message: 'User already exists' };
    memoryStore.users.push(newUser);
    return { acknowledged: true, insertedId: newUser._id, user: { name: newUser.name, email: newUser.email, role: newUser.role } };
  }

  const existing = await db.collection('users').findOne({ email });
  if (existing) return { status: 409, message: 'User already exists' };

  newUser._id = new ObjectId(); // use real ObjectId for MongoDB
  let users = await db.collection('users').insertOne(newUser);
  if (users.acknowledged) {
      return {
      acknowledged: true, insertedId: newUser._id, user: {
        id: newUser._id.toString(), name: newUser.name, email: newUser.email, role: newUser.role,
        message: 'User registered successfully',
        success: true,
        users
      }
    };
  } else {
    return { status: 500, message: 'User registration failed' };
  }
}

async function loginUserService(email, password) {
  const db = getDB();

  if (!email || !password) {
    return { status: 400, message: 'Email and password are required' };
  }

  let user = null;
  if (!db) {
    user = memoryStore.users.find(u => u.email === email);
  } else {
    user = await db.collection('users').findOne({ email });
  }

  if (!user) return { status: 401, message: 'Invalid credentials' };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { status: 401, message: 'Invalid credentials' };

  const token = jwt.sign(
    { email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { 
    success: true,
    message: 'Login successful',
    token, 
    user: { 
      id: user._id.toString(), 
      name: user.name || '', 
      email: user.email, 
      role: user.role || 'user' 
    } 
  };
}

module.exports = {
  getAllUsersService,
  getUserProfileService,
  updateUserProfileService,
  registerUserService,
  loginUserService
};
