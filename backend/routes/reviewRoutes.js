import express from "express";
import {
    getAllReviews,
    getReviewsByHotel,
    getReviewsByUser,
    getReviewById,
    createReview,
    updateReview,
    deleteReview,
} from "../controllers/reviewController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/", getAllReviews);
router.get("/hotel/:hotelId", getReviewsByHotel);
router.get("/user/:userId", getReviewsByUser);
router.get("/:id", getReviewById);

// Protected routes
router.post("/", verifyToken, createReview);
router.put("/:id", verifyToken, updateReview);
router.delete("/:id", verifyToken, deleteReview);

export default router;
