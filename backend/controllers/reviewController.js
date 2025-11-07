import Review from "../models/Review.js";
import Hotel from "../models/Hotel.js";

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
 * @desc    Get single review
 * @route   GET /api/reviews/:id
 * @access  Public
 */
export const getReviewById = async (req, res, next) => {
    try {
        const review = await Review.findById(req.params.id)
            .populate("userId", "userName avatar")
            .populate("hotelId", "name location");

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        res.json({
            success: true,
            data: review,
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

        // Check if hotel exists
        const hotel = await Hotel.findById(hotelId);
        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        // Check if user already reviewed this hotel
        const existingReview = await Review.findOne({
            userId: req.user._id,
            hotelId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this hotel",
            });
        }

        // Create review
        const review = await Review.create({
            userId: req.user._id,
            hotelId,
            rating,
            comment,
        });

        // Update hotel's reviews array
        hotel.reviews.push({
            reviewId: review._id,
            userId: req.user._id,
            rating,
            comment,
            date: review.createdAt,
        });

        // Recalculate hotel's average rating
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
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private
 */
export const updateReview = async (req, res, next) => {
    try {
        const { rating, comment } = req.body;

        let review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this review",
            });
        }

        // Update review
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        await review.save();

        // Update hotel's average rating
        const hotel = await Hotel.findById(review.hotelId);
        const allReviews = await Review.find({ hotelId: review.hotelId });
        const avgRating =
            allReviews.reduce((acc, item) => item.rating + acc, 0) /
            allReviews.length;
        hotel.rating = Math.round(avgRating * 10) / 10;

        // Update review in hotel's reviews array
        const reviewIndex = hotel.reviews.findIndex(
            (r) => r.reviewId.toString() === review._id.toString()
        );
        if (reviewIndex !== -1) {
            hotel.reviews[reviewIndex].rating = review.rating;
            hotel.reviews[reviewIndex].comment = review.comment;
        }

        await hotel.save();

        const populatedReview = await Review.findById(review._id)
            .populate("userId", "userName avatar")
            .populate("hotelId", "name location");

        res.json({
            success: true,
            message: "Review updated successfully",
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
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        // Check if user owns this review
        if (review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this review",
            });
        }

        // Remove review from hotel's reviews array
        const hotel = await Hotel.findById(review.hotelId);
        hotel.reviews = hotel.reviews.filter(
            (r) => r.reviewId.toString() !== review._id.toString()
        );

        // Recalculate hotel's average rating
        const allReviews = await Review.find({
            hotelId: review.hotelId,
            _id: { $ne: review._id },
        });

        if (allReviews.length > 0) {
            const avgRating =
                allReviews.reduce((acc, item) => item.rating + acc, 0) /
                allReviews.length;
            hotel.rating = Math.round(avgRating * 10) / 10;
        } else {
            hotel.rating = 0;
        }

        await hotel.save();
        await review.deleteOne();

        res.json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};
