import express from "express";
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    addToFavorites,
    removeFromFavorites,
    getUserFavorites,
} from "../controllers/userController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// All routes are protected
router.use(verifyToken);

// User routes
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

// Favorites routes
router.get("/:id/favorites", getUserFavorites);
router.post("/:id/favorites/:hotelId", addToFavorites);
router.delete("/:id/favorites/:hotelId", removeFromFavorites);

export default router;
