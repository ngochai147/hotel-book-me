import admin from "firebase-admin";
import User from "../models/User.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res, next) => {
    try {
        const { email, password, userName, phone } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Create user in Firebase
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: userName,
        });

        // Save user to MongoDB
        const newUser = new User({
            uid: userRecord.uid,
            email,
            userName: userName || email.split("@")[0],
            phone: phone || "",
            avatar: "",
            favorites: [],
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: {
                uid: newUser.uid,
                email: newUser.email,
                userName: newUser.userName,
            },
        });
    } catch (error) {
        console.error("Register error:", error);

        // Handle Firebase errors
        if (error.code === "auth/email-already-exists") {
            return res.status(400).json({
                success: false,
                message: "Email already exists",
            });
        }

        next(error);
    }
};

/**
 * @desc    Login user / Verify Firebase token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Token is required",
            });
        }

        // Verify Firebase token
        const decoded = await admin.auth().verifyIdToken(token);

        // Find or create user in MongoDB
        let user = await User.findOne({ uid: decoded.uid });

        if (!user) {
            // Create user if doesn't exist
            user = new User({
                uid: decoded.uid,
                email: decoded.email,
                userName: decoded.name || decoded.email.split("@")[0],
                avatar: decoded.picture || "",
            });
            await user.save();
        }

        res.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    uid: user.uid,
                    email: user.email,
                    userName: user.userName,
                    phone: user.phone,
                    avatar: user.avatar,
                },
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
    try {
        const user = await User.findOne({ uid: req.user.uid }).select("-__v");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Logout user (optional - handled on client side)
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req, res) => {
    res.json({
        success: true,
        message: "Logout successful",
    });
};
