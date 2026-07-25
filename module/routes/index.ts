import { Router } from "express";
import { AdminRoutes } from "../admin/admin.route";
import { ParcelRoutes } from "../parcel/parcel.route";
import { RiderRoutes } from "../rider/rider.route";
import { TrackingRoutes } from "../tracking/tracking.route";
import { UserRoutes } from "../user/user.route";
import { PaymentRoutes } from "../payment/payment.route";

const router = Router();
router.use("/admin", AdminRoutes);
router.use("/parcels", ParcelRoutes);
router.use("/riders", RiderRoutes);
router.use("/tracking", TrackingRoutes);
router.use("/users", UserRoutes);
router.use("/payments", PaymentRoutes);

export const IndexRoutes = router;
