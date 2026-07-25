"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTokenResponse = void 0;
const jwt_1 = require("./jwt");
const cookies_1 = require("./cookies");
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = (0, jwt_1.generateToken)({ email: user.email, role: user.role });
    // Set cookie
    (0, cookies_1.setCookie)(res, 'token', token);
    // Send JSON response
    res.status(statusCode).json({
        success: true,
        message: 'Authentication successful',
        token,
        user
    });
};
exports.sendTokenResponse = sendTokenResponse;
