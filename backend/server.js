import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import admin from "firebase-admin";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Import middlewares
import errorHandler from "./middlewares/errorHandler.js";
import { logger, notFound } from "./middlewares/logger.js";

// Import config
import serviceAccount from "./config/serviceAccountKey.js";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(
    cors({
        origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware (development only)
if (process.env.NODE_ENV === "development") {
    app.use(logger);
}

// Initialize Firebase Admin
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY,
            }),
        });
        console.log("✅ Firebase Admin initialized");
    } catch (err) {
        console.error("❌ Firebase Admin initialization error:", err);
    }
}

console.log("✅ Firebase Admin initialized");

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

// Health check route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Hotel Booking API is running 🚀",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            hotels: "/api/hotels",
            bookings: "/api/bookings",
            reviews: "/api/reviews",
            users: "/api/users",
        },
    });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);

// Error handling middlewares (must be last)
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err);
    server.close(() => process.exit(1));
});

export default app;
