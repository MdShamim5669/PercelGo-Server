"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const user_controller_1 = require("./user.controller");
const validateRequest_1 = require("../middleware/validateRequest");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
router.post('/register', (0, validateRequest_1.validateRequest)(user_validation_1.userRegisterSchema), user_controller_1.registerUser);
router.post('/login', (0, validateRequest_1.validateRequest)(user_validation_1.userLoginSchema), user_controller_1.loginUser);
router.get('/', user_controller_1.getAllUsers);
router.get('/:id', user_controller_1.getUserProfile);
router.put('/:id', user_controller_1.updateUserProfile); // '/:id' is standard REST convention over '/:id/update'
exports.UserRoutes = router;
