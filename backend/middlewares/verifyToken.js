import admin from "firebase-admin";
import User from "../models/User.js";
// Special guest token for anonymous users (read-only access to bookings)
const GUEST_TOKEN = "guest_read_only_token_12345";

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split("Bearer ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided. Authorization denied",
            });
        }

        // Verify Firebase token
        const decoded = await admin.auth().verifyIdToken(token);

        // Get user from database
        const user = await User.findOne({ uid: decoded.uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Attach user to request object
        req.user = {
            _id: user._id,
            uid: user.uid,
            email: user.email,
            userName: user.userName,
        };

        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

/**
 * Middleware that allows both authenticated users AND guest users with special token
 * Guest users can only READ data (GET requests)
 * Used for public availability checking
 */
export const verifyTokenOrGuest = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split("Bearer ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided. Authorization denied",
            });
        }

        // Check if it's the special guest token
        if (token === GUEST_TOKEN) {
            // Only allow GET requests for guest token
            if (req.method !== "GET") {
                return res.status(403).json({
                    success: false,
                    message: "Guest token only allows read operations",
                });
            }

            // Set a guest user object
            req.user = {
                _id: "guest",
                uid: "guest",
                email: "guest@system",
                role: "guest",
                isGuest: true,
            };

            return next();
        }

        // Otherwise, verify as normal Firebase token
        const decoded = await admin.auth().verifyIdToken(token);

        // Get user from database
        const user = await User.findOne({ uid: decoded.uid });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Attach user to request object
        req.user = {
            _id: user._id,
            uid: user.uid,
            email: user.email,
            role: user.role,
            isGuest: false,
        };

        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid token. Authorization denied",
        });
    }
};
