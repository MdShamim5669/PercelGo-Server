import { getDB } from '../../config/db';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AppError from '../utils/AppError';

const memoryStore: any = {
  users: []
};

export async function getAllUsersService(role?: string, searchText: string | null = null, limit: number = 0) {
  const db = getDB();

  if (!db) {
    let users = memoryStore.users;
    if (role) {
      users = users.filter((u: any) => u.role === role);
    }
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      users = users.filter((u: any) => u.name?.toLowerCase().includes(lowerSearch) || u.email?.toLowerCase().includes(lowerSearch));
    }
    if (limit > 0) {
      users = users.slice(0, limit);
    }
    return users.map((u: any) => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  }

  const query: any = {};
  if (role) query.role = role;
  if (searchText) {
    query.$or = [
      { name: { $regex: searchText, $options: 'i' } },
      { email: { $regex: searchText, $options: 'i' } },
    ];
  }

  let cursor = db.collection('users').find(query, { projection: { password: 0 } }).sort({ createdAt: -1 });
  if (limit > 0) {
    cursor = cursor.limit(limit);
  }
  
  return cursor.toArray();
}

export async function getUserProfileService(id: string) {
  const db = getDB();

  if (!db) {
    const user = memoryStore.users.find((user: any) => user._id === id) || null;
    if (!user) throw new AppError(404, 'User not found');
    return user;
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');
  const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
  if (!user) throw new AppError(404, 'User not found');
  return user;
}

export async function getUserRoleService(email: string) {
  const db = getDB();

  if (!db) {
    const user = memoryStore.users.find((user: any) => user.email === email) || null;
    if (!user) throw new AppError(404, 'User not found');
    return { admin: user.role === 'admin', rider: user.role === 'rider' };
  }

  const user = await db.collection('users').findOne({ email });
  if (!user) throw new AppError(404, 'User not found');
  return { admin: user.role === 'admin', rider: user.role === 'rider' };
}

export async function updateUserProfileService(id: string, profileData: any) {
  const db = getDB();

  if (!db) {
    const userIndex = memoryStore.users.findIndex((user: any) => user._id === id);
    if (userIndex === -1) {
      throw new AppError(404, 'User not found');
    }

    memoryStore.users[userIndex] = { ...memoryStore.users[userIndex], ...profileData };
    return { acknowledged: true, modifiedCount: 1 };
  }

  if (!ObjectId.isValid(id)) throw new AppError(400, 'Invalid ID format');

  const updateResult = await db.collection('users').updateOne(
    { _id: new ObjectId(id) },
    { $set: profileData },
    { upsert: false }
  );

  if (updateResult.matchedCount === 0) {
    throw new AppError(404, 'User not found');
  }

  return updateResult;
}

export async function registerUserService(userData: any) {
  const db = getDB();
  const { name, email, password, role } = userData;

  if (!name || !email || !password) {
    throw new AppError(400, 'Name, email, and password are required');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: any = {
    _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    email,
    password: hashedPassword,
    role: role || 'user',
    createdAt: new Date().toISOString()
  };

  if (!db) {
    const existing = memoryStore.users.find((u: any) => u.email === email);
    if (existing) throw new AppError(409, 'User already exists');
    memoryStore.users.push(newUser);
    return { acknowledged: true, insertedId: newUser._id, user: { name: newUser.name, email: newUser.email, role: newUser.role } };
  }

  const existing = await db.collection('users').findOne({ email });
  if (existing) throw new AppError(409, 'User already exists');

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
    throw new AppError(500, 'User registration failed');
  }
}

export async function loginUserService(email: string, password: any) {
  const db = getDB();

  if (!email || !password) {
    throw new AppError(400, 'Email and password are required');
  }

  let user = null;
  if (!db) {
    user = memoryStore.users.find((u: any) => u.email === email);
  } else {
    user = await db.collection('users').findOne({ email });
  }

  if (!user) throw new AppError(401, 'Invalid credentials');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new AppError(401, 'Invalid credentials');

  const token = jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
  );

  return {
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role }
  };
}
