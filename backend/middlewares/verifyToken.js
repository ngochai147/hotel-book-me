import admin from "firebase-admin";
import User from "../models/User.js";

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
