import express from "express";
import {
    getAllHotels,
    getHotelById,
    createHotel,
    updateHotel,
    deleteHotel,
    searchHotelsByLocation,
    getHotelReviews,
} from "../controllers/hotelController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/", getAllHotels);
router.get("/search/:location", searchHotelsByLocation);
router.get("/:id", getHotelById);
router.get("/:id/reviews", getHotelReviews);

export default router;
