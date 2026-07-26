"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParcelRoutes = void 0;
const express_1 = require("express");
const parcel_controller_1 = require("./parcel.controller");
const validateRequest_1 = require("../middleware/validateRequest");
const parcel_validation_1 = require("./parcel.validation");
const router = (0, express_1.Router)();
router.post('/', (0, validateRequest_1.validateRequest)(parcel_validation_1.createParcelSchema), parcel_controller_1.createParcel);
router.get('/', parcel_controller_1.getParcels);
router.get('/rider/:email', parcel_controller_1.getRiderParcels);
// Specific routes must come before parameter routes like /:id
router.get('/payments', parcel_controller_1.getPayments);
router.get('/:id', parcel_controller_1.getParcelById);
router.post('/:id/pay', parcel_controller_1.payParcel);
router.post('/:id/create-payment-intent', parcel_controller_1.createPaymentIntent);
router.patch('/:id/status', (0, validateRequest_1.validateRequest)(parcel_validation_1.updateParcelStatusSchema), parcel_controller_1.updateParcelStatus);
exports.ParcelRoutes = router;
