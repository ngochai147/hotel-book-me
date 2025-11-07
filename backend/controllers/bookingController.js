import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";

/**
 * @desc    Get all bookings
 * @route   GET /api/bookings
 * @access  Private (Admin)
 */
export const getAllBookings = async (req, res, next) => {
    try {
        const bookings = await Booking.find()
            .populate("userId", "userName email phone")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
export const getUserBookings = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const bookings = await Booking.find({ userId }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: bookings.length,
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private
 */
export const getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id).populate(
            "userId",
            "userName email phone"
        );

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check if user owns this booking or is admin
        if (booking.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to access this booking",
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private
 */
export const createBooking = async (req, res, next) => {
    try {
        const { hotelId, checkIn, checkOut, guests, roomType, totalPrice } =
            req.body;

        // Validate required fields
        if (
            !hotelId ||
            !checkIn ||
            !checkOut ||
            !guests ||
            !roomType ||
            !totalPrice
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields",
            });
        }

        // Get hotel information
        const hotel = await Hotel.findOne({ id: hotelId });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        // Generate booking number
        const bookingNumber = `BK${Date.now()}${Math.floor(
            Math.random() * 1000
        )}`;

        // Create booking
        const booking = await Booking.create({
            bookingNumber,
            userId: req.user._id,
            hotelId: hotel.id,
            hotelName: hotel.name,
            location: hotel.location,
            roomType,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            guests,
            totalPrice,
            status: "pending",
            image: hotel.photos[0] || "",
        });

        res.status(201).json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update booking status
 * @route   PUT /api/bookings/:id
 * @access  Private
 */
export const updateBooking = async (req, res, next) => {
    try {
        const { status } = req.body;

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check if user owns this booking
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this booking",
            });
        }

        // Update status
        if (status) {
            booking.status = status;
        }

        await booking.save();

        res.json({
            success: true,
            message: "Booking updated successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Cancel booking
 * @route   DELETE /api/bookings/:id
 * @access  Private
 */
export const cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // Check if user owns this booking
        if (booking.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to cancel this booking",
            });
        }

        // Update status to cancelled instead of deleting
        booking.status = "cancelled";
        await booking.save();

        res.json({
            success: true,
            message: "Booking cancelled successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get booking statistics
 * @route   GET /api/bookings/stats
 * @access  Private (Admin)
 */
export const getBookingStats = async (req, res, next) => {
    try {
        const stats = await Booking.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" },
                },
            },
        ]);

        res.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        next(error);
    }
};
