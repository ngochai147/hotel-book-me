import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";
import Booking from "../models/Booking.js";

/**
 * @desc    Get all reviews
 * @route   GET /api/reviews
 * @access  Public
 */
export const getAllReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find()
            .populate("userId", "userName avatar")
            .populate("hotelId", "name location")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get reviews by hotel
 * @route   GET /api/reviews/hotel/:hotelId
 * @access  Public
 */
export const getReviewsByHotel = async (req, res, next) => {
    try {
        const reviews = await Review.find({ hotelId: req.params.hotelId })
            .populate("userId", "userName avatar")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get reviews by user
 * @route   GET /api/reviews/user/:userId
 * @access  Public
 */
export const getReviewsByUser = async (req, res, next) => {
    try {
        const reviews = await Review.find({ userId: req.params.userId })
            .populate("hotelId", "name location photos")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            data: reviews,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new review
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = async (req, res, next) => {
    try {
        const { hotelId, rating, comment } = req.body;

        // Validate input
        if (!hotelId || !rating) {
            return res.status(400).json({
                success: false,
                message: "Hotel ID and rating are required",
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
        }

        // Check if hotel exists
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        // Check if user has a completed booking at this hotel
        const completedBooking = await Booking.findOne({
            userId: req.user._id,
            hotelId: hotelId,
            status: "completed",
        });

        if (!completedBooking) {
            return res.status(403).json({
                success: false,
                message:
                    "You can only review hotels where you have a completed booking",
            });
        }

        // // Check if user already reviewed this hotel
        // const existingReview = await Review.findOne({
        //     userId: req.user._id,
        //     hotelId,
        // });

        // if (existingReview) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "You have already reviewed this hotel",
        //     });
        // }

        // Create review
        const review = await Review.create({
            userId: req.user._id,
            hotelId,
            rating,
            comment,
        });

        // Update hotel's reviews array - keep only 5 latest reviews
        hotel.reviews.unshift({
            userName: req.user.userName,
            rating,
            comment,
            date: review.createdAt,
        });

        // Keep only 5 latest reviews in hotel document
        if (hotel.reviews.length > 5) {
            hotel.reviews = hotel.reviews.slice(0, 5);
        }

        // Recalculate hotel's average rating from all reviews
        const allReviews = await Review.find({ hotelId });
        const avgRating =
            allReviews.reduce((acc, item) => item.rating + acc, 0) /
            allReviews.length;
        hotel.rating = Math.round(avgRating * 10) / 10;

        await hotel.save();

        const populatedReview = await Review.findById(review._id)
            .populate("userId", "userName avatar")
            .populate("hotelId", "name location");

        res.status(201).json({
            success: true,
            message: "Review created successfully",
            data: populatedReview,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private
 */
export const deleteReview = async (req, res, next) => {
    try {
        console.log("=== DELETE REVIEW ULTRA SAFE ===");

        // Validate input cực kỳ chặt chẽ
        if (!req.params.id || req.params.id === "undefined") {
            return res.status(400).json({
                success: false,
                message: "Invalid review ID",
            });
        }

        if (!req.user || !req.user._id) {
            return res.status(401).json({
                success: false,
                message: "User authentication required",
            });
        }

        console.log("Review ID:", req.params.id);
        console.log("User ID:", req.user._id);

        // Tìm review - thêm try/catch cho find
        let review;
        try {
            review = await Review.findById(req.params.id);
        } catch (findError) {
            console.error("Error finding review:", findError);
            return res.status(400).json({
                success: false,
                message: "Invalid review ID format",
            });
        }

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        console.log("Review found - userId exists?", !!review.userId);

        // KIỂM TRA CỰC KỲ AN TOÀN
        let reviewUserId;
        try {
            // Thử nhiều cách để lấy userId
            reviewUserId = review.userId?._id || review.userId;

            if (!reviewUserId) {
                console.log("CRITICAL: Review has no userId at all");
                console.log(
                    "Review object:",
                    JSON.stringify(
                        {
                            _id: review._id,
                            userId: review.userId,
                            hotelId: review.hotelId,
                            rating: review.rating,
                            comment: review.comment,
                        },
                        null,
                        2
                    )
                );

                // QUYẾT ĐỊNH: Cho phép admin xóa hoặc từ chối
                // Tạm thời từ chối
                return res.status(400).json({
                    success: false,
                    message:
                        "Cannot delete review with missing user information",
                });
            }
        } catch (error) {
            console.error("Error accessing review userId:", error);
            return res.status(500).json({
                success: false,
                message: "Error processing review data",
            });
        }

        // SO SÁNH CỰC KỲ AN TOÀN
        try {
            const reviewUserIdString = reviewUserId.toString();
            const requestUserIdString = req.user._id.toString();

            console.log("Comparison:", {
                reviewUserId: reviewUserIdString,
                requestUserId: requestUserIdString,
            });

            if (reviewUserIdString !== requestUserIdString) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to delete this review",
                });
            }
        } catch (comparisonError) {
            console.error("Error comparing user IDs:", comparisonError);
            return res.status(500).json({
                success: false,
                message: "Error validating user authorization",
            });
        }

        // Phần còn lại của logic xóa...
        console.log("Authorization successful, deleting review...");

        // Xóa review
        await Review.findByIdAndDelete(req.params.id);

        // Cập nhật hotel (nếu cần)
        try {
            if (review.hotelId) {
                const hotel = await Hotel.findById(review.hotelId);
                if (hotel) {
                    // Logic cập nhật hotel...
                    await hotel.save();
                }
            }
        } catch (hotelError) {
            console.error("Error updating hotel:", hotelError);
            // Vẫn trả về success vì review đã được xóa
        }

        res.json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        console.error("FINAL DELETE REVIEW ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
