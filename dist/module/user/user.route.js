"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../middleware/validateRequest");
const user_validation_1 = require("./user.validation");
const authMiddleware_1 = require("../middleware/authMiddleware");
const catchAsync_1 = __importDefault(require("../shared/catchAsync"));
const db_1 = require("../../config/db");
const router = (0, express_1.Router)();
router.post('/jwt', user_controller_1.createToken);
router.post('/register', (0, validateRequest_1.validateRequest)(user_validation_1.userRegisterSchema), user_controller_1.registerUser);
router.post('/login', (0, validateRequest_1.validateRequest)(user_validation_1.userLoginSchema), user_controller_1.loginUser);
// Protect sensitive admin endpoint
router.get('/', authMiddleware_1.verifyToken, authMiddleware_1.verifyAdmin, user_controller_1.getAllUsers);
// Secure role endpoint for users to verify their own roles
router.get('/role/:email', authMiddleware_1.verifyToken, user_controller_1.getUserRole);
router.patch('/apply-rider/:email', authMiddleware_1.verifyToken, (0, catchAsync_1.default)(async (req, res) => {
    const email = req.params.email;
    const applicationData = req.body;
    const db = (0, db_1.getDB)();
    if (!db)
        return res.status(500).json({ success: false, message: 'DB not connected' });
    await db.collection('users').updateOne({ email }, {
        $set: {
            riderStatus: 'pending',
            riderApplication: applicationData
        }
    });
    res.json({ success: true, message: 'Rider application submitted successfully' });
}));
router.get('/:id', user_controller_1.getUserProfile);
router.put('/:id', user_controller_1.updateUserProfile);
exports.UserRoutes = router;
