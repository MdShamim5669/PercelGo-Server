"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = exports.getUserRole = exports.updateUserProfile = exports.getUserProfile = exports.getAllUsers = exports.createToken = void 0;
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../shared/sendResponse"));
const user_services_1 = require("./user.services");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../../config/db");
exports.createToken = (0, catchAsync_1.default)(async (req, res) => {
    const user = req.body; // expects { email, name }
    const db = (0, db_1.getDB)();
    if (db && user.email) {
        const existing = await db.collection('users').findOne({ email: user.email });
        if (!existing) {
            await db.collection('users').insertOne({
                name: user.name || 'User',
                email: user.email,
                role: 'user', // Default role
                createdAt: new Date().toISOString()
            });
        }
    }
    const token = jsonwebtoken_1.default.sign(user, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
    res.send({ token });
});
exports.getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const role = req.query.role;
    const result = await (0, user_services_1.getAllUsersService)(role);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'Users retrieved successfully',
        data: result
    });
});
exports.getUserProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, user_services_1.getUserProfileService)(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User profile retrieved successfully',
        data: result
    });
});
exports.updateUserProfile = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, user_services_1.updateUserProfileService)(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User profile updated successfully',
        data: result
    });
});
exports.getUserRole = (0, catchAsync_1.default)(async (req, res) => {
    const email = req.params.email;
    // Security check: Only allow users to check their own role, or admins
    if (req.user?.email !== email && req.user?.role !== 'admin') {
        return (0, sendResponse_1.default)(res, {
            statusCode: 403,
            success: false,
            message: 'Forbidden access',
            data: null
        });
    }
    const result = await (0, user_services_1.getUserRoleService)(email);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User role retrieved successfully',
        data: result
    });
});
exports.registerUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await (0, user_services_1.registerUserService)(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: 201,
        success: true,
        message: 'User registered successfully',
        data: result
    });
});
exports.loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const { email, password } = req.body;
    const result = await (0, user_services_1.loginUserService)(email, password);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: 'User logged in successfully',
        data: result
    });
});
