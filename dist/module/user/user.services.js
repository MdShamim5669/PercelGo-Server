"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllUsersService = getAllUsersService;
exports.getUserProfileService = getUserProfileService;
exports.getUserRoleService = getUserRoleService;
exports.updateUserProfileService = updateUserProfileService;
exports.registerUserService = registerUserService;
exports.loginUserService = loginUserService;
const db_1 = require("../../config/db");
const mongodb_1 = require("mongodb");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const memoryStore = {
    users: []
};
async function getAllUsersService(role, searchText = null, limit = 0) {
    const db = (0, db_1.getDB)();
    if (!db) {
        let users = memoryStore.users;
        if (role) {
            users = users.filter((u) => u.role === role);
        }
        if (searchText) {
            const lowerSearch = searchText.toLowerCase();
            users = users.filter((u) => u.name?.toLowerCase().includes(lowerSearch) || u.email?.toLowerCase().includes(lowerSearch));
        }
        if (limit > 0) {
            users = users.slice(0, limit);
        }
        return users.map((u) => {
            const { password, ...userWithoutPassword } = u;
            return userWithoutPassword;
        });
    }
    const query = {};
    if (role)
        query.role = role;
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
async function getUserProfileService(id) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const user = memoryStore.users.find((user) => user._id === id || user.email === id) || null;
        if (!user)
            throw new AppError_1.default(404, 'User not found');
        return user;
    }
    const query = id.includes('@') ? { email: id } : { _id: new mongodb_1.ObjectId(id) };
    if (!id.includes('@') && !mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    const user = await db.collection('users').findOne(query);
    if (!user)
        throw new AppError_1.default(404, 'User not found');
    return user;
}
async function getUserRoleService(email) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const user = memoryStore.users.find((user) => user.email === email) || null;
        if (!user)
            throw new AppError_1.default(404, 'User not found');
        return { admin: user.role === 'admin', rider: user.role === 'rider' };
    }
    const user = await db.collection('users').findOne({ email });
    if (!user)
        throw new AppError_1.default(404, 'User not found');
    return { admin: user.role === 'admin', rider: user.role === 'rider' };
}
async function updateUserProfileService(id, profileData) {
    const db = (0, db_1.getDB)();
    if (!db) {
        const userIndex = memoryStore.users.findIndex((user) => user._id === id || user.email === id);
        if (userIndex === -1) {
            throw new AppError_1.default(404, 'User not found');
        }
        memoryStore.users[userIndex] = { ...memoryStore.users[userIndex], ...profileData };
        return { acknowledged: true, modifiedCount: 1 };
    }
    const query = id.includes('@') ? { email: id } : { _id: new mongodb_1.ObjectId(id) };
    if (!id.includes('@') && !mongodb_1.ObjectId.isValid(id))
        throw new AppError_1.default(400, 'Invalid ID format');
    // Prevent email updates to maintain system integrity
    delete profileData.email;
    const updateResult = await db.collection('users').updateOne(query, { $set: profileData }, { upsert: false });
    if (updateResult.matchedCount === 0) {
        throw new AppError_1.default(404, 'User not found');
    }
    return updateResult;
}
async function registerUserService(userData) {
    const db = (0, db_1.getDB)();
    const { name, email, password, role } = userData;
    if (!name || !email || !password) {
        throw new AppError_1.default(400, 'Name, email, and password are required');
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = {
        _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        email,
        password: hashedPassword,
        role: role || 'user',
        createdAt: new Date().toISOString()
    };
    if (!db) {
        const existing = memoryStore.users.find((u) => u.email === email);
        if (existing)
            throw new AppError_1.default(409, 'User already exists');
        memoryStore.users.push(newUser);
        return { acknowledged: true, insertedId: newUser._id, user: { name: newUser.name, email: newUser.email, role: newUser.role } };
    }
    const existing = await db.collection('users').findOne({ email });
    if (existing)
        throw new AppError_1.default(409, 'User already exists');
    newUser._id = new mongodb_1.ObjectId(); // use real ObjectId for MongoDB
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
    }
    else {
        throw new AppError_1.default(500, 'User registration failed');
    }
}
async function loginUserService(email, password) {
    const db = (0, db_1.getDB)();
    if (!email || !password) {
        throw new AppError_1.default(400, 'Email and password are required');
    }
    let user = null;
    if (!db) {
        user = memoryStore.users.find((u) => u.email === email);
    }
    else {
        user = await db.collection('users').findOne({ email });
    }
    if (!user)
        throw new AppError_1.default(401, 'Invalid credentials');
    const isMatch = await bcryptjs_1.default.compare(password, user.password);
    if (!isMatch)
        throw new AppError_1.default(401, 'Invalid credentials');
    const token = jsonwebtoken_1.default.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    return {
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role }
    };
}
