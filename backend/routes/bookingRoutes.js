import express from "express";
import {
    getAllBookings,
    getUserBookings,
    getBookingById,
    createBooking,
    updateBooking,
    cancelBooking,
    getBookingStats,
} from "../controllers/bookingController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// User routes
router.get("/my-bookings", getUserBookings);
router.get("/:id", getBookingById);
router.post("/", createBooking);
router.put("/:id", updateBooking);
router.delete("/:id", cancelBooking);

// Admin routes (you can add admin middleware)
router.get("/", getAllBookings);
router.get("/stats", getBookingStats);

export default router;
