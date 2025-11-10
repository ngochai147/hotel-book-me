import express from "express";
import {
    getAllHotels,
    getHotelById,
    searchHotelsByLocation,
} from "../controllers/hotelController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Public routes
router.get("/", getAllHotels);
router.get("/search/:location", searchHotelsByLocation);
router.get("/:id", getHotelById);


export default router;
