"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParcelStatusSchema = exports.createParcelSchema = void 0;
const zod_1 = require("zod");
exports.createParcelSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Title cannot be empty'),
    type: zod_1.z.enum(['document', 'non-document']),
    senderName: zod_1.z.string().min(1, 'Sender Name is required'),
    senderContact: zod_1.z.string().optional(),
    senderRegion: zod_1.z.string().min(1, 'Sender Region is required'),
    senderAddress: zod_1.z.string().min(1, 'Sender Address is required'),
    receiverName: zod_1.z.string().min(1, 'Receiver Name is required'),
    receiverContact: zod_1.z.string().optional(),
    receiverRegion: zod_1.z.string().min(1, 'Receiver Region is required'),
    receiverAddress: zod_1.z.string().min(1, 'Receiver Address is required'),
    weight: zod_1.z.number().optional().or(zod_1.z.string().optional()),
    pickupServiceCenter: zod_1.z.string().optional(),
    deliveryServiceCenter: zod_1.z.string().optional()
});
exports.updateParcelStatusSchema = zod_1.z.object({
    status: zod_1.z.string().min(1, 'Status is required'),
    message: zod_1.z.string().optional(),
    riderEmail: zod_1.z.string().email().optional()
});
