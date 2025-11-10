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
 * @desc    Get user bookings with optional status filter
 * @route   GET /api/bookings/my-bookings?status=upcoming
 * @access  Private
 */
export const getUserBookings = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;

        // Build query
        const query = { userId };

        // Add status filter if provided
        if (status) {
            const validStatuses = ["upcoming", "completed", "cancelled"];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid status. Valid statuses are: ${validStatuses.join(
                        ", "
                    )}`,
                });
            }
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .populate("hotelId", "name location photos rating")
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
            !Array.isArray(roomType) ||
            roomType.length === 0 ||
            !totalPrice
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Please provide all required fields. roomType must be a non-empty array.",
            });
        }

        // Validate dates
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Normalize dates to ignore time (set to start of day)
        checkInDate.setHours(0, 0, 0, 0);
        checkOutDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            return res.status(400).json({
                success: false,
                message: "Check-in date cannot be in the past",
            });
        }

        if (checkOutDate <= checkInDate) {
            return res.status(400).json({
                success: false,
                message: "Check-out date must be after check-in date",
            });
        }

        // Get hotel information
        const hotel = await Hotel.findById(hotelId);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        // Verify all room types exist in hotel
        const invalidRoomTypes = [];
        for (const roomTypeName of roomType) {
            const exists = hotel.roomTypes.some(
                (room) => room.name === roomTypeName
            );
            if (!exists) {
                invalidRoomTypes.push(roomTypeName);
            }
        }

        if (invalidRoomTypes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `The following room types are not available in this hotel: ${invalidRoomTypes.join(
                    ", "
                )}`,
            });
        }

        // Check availability for each room type
        // Only check against "upcoming" bookings (ignore completed and cancelled)
        const unavailableRooms = [];

        // Create end of day for checkout to handle same-day bookings correctly
        const checkInEndOfDay = new Date(checkInDate);
        checkInEndOfDay.setHours(23, 59, 59, 999);

        const checkOutEndOfDay = new Date(checkOutDate);
        checkOutEndOfDay.setHours(23, 59, 59, 999);

        for (const roomTypeName of roomType) {
            // Get all upcoming bookings for this room type
            const allUpcomingBookings = await Booking.find({
                hotelId: hotelId,
                roomType: roomTypeName,
                status: "upcoming",
            });

            // Filter overlapping bookings by comparing dates only (ignore time)
            const overlappingBookings = allUpcomingBookings.filter(
                (booking) => {
                    // Normalize existing booking dates to start of day for comparison
                    const existingCheckIn = new Date(booking.checkIn);
                    existingCheckIn.setHours(0, 0, 0, 0);

                    const existingCheckOut = new Date(booking.checkOut);
                    existingCheckOut.setHours(0, 0, 0, 0);

                    // Check if dates overlap (comparing only dates, not times)
                    // Overlap occurs if:
                    // 1. Existing booking starts on or before new checkIn and ends after new checkIn
                    // 2. Existing booking starts before new checkOut and ends on or after new checkOut
                    // 3. Existing booking is completely within new booking dates
                    const hasOverlap =
                        (existingCheckIn <= checkInDate &&
                            existingCheckOut > checkInDate) ||
                        (existingCheckIn < checkOutDate &&
                            existingCheckOut >= checkOutDate) ||
                        (existingCheckIn >= checkInDate &&
                            existingCheckOut <= checkOutDate);

                    return hasOverlap;
                }
            );

            if (overlappingBookings.length > 0) {
                unavailableRooms.push({
                    roomType: roomTypeName,
                    conflicts: overlappingBookings.map((b) => ({
                        bookingNumber: b.bookingNumber,
                        checkIn: b.checkIn,
                        checkOut: b.checkOut,
                        status: b.status,
                    })),
                });
            }
        }

        if (unavailableRooms.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Some room types are not available for the selected dates.`,
                unavailableRooms,
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
            hotelId: hotel._id,
            hotelName: hotel.name,
            location: hotel.location,
            roomType, // Lưu mảng room types
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests,
            totalPrice,
            status: "upcoming",
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

        // Validate status
        const validStatuses = ["upcoming", "completed", "cancelled"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(
                    ", "
                )}`,
            });
        }

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

        // Prevent changing from cancelled
        if (booking.status === "cancelled") {
            return res.status(400).json({
                success: false,
                message: "Cannot modify a cancelled booking",
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
