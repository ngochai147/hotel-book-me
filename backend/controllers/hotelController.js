import Hotel from "../models/Hotel.js";

/**
 * @desc    Get all hotels
 * @route   GET /api/hotels
 * @access  Public
 */
export const getAllHotels = async (req, res, next) => {
    try {
        const {
            location,
            minPrice,
            maxPrice,
            rating,
            amenities,
            page = 1,
            limit = 10,
        } = req.query;

        // Build query
        const query = {};

        if (location) {
            query.location = { $regex: location, $options: "i" };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        if (rating) {
            query.rating = { $gte: Number(rating) };
        }

        if (amenities) {
            const amenitiesArray = amenities.split(",");
            query.amenities = { $all: amenitiesArray };
        }

        // Pagination
        const skip = (page - 1) * limit;

        const hotels = await Hotel.find(query)
            .limit(Number(limit))
            .skip(skip)
            .sort({ rating: -1 });

        const total = await Hotel.countDocuments(query);

        res.json({
            success: true,
            count: hotels.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            data: hotels,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get single hotel by ID
 * @route   GET /api/hotels/:id
 * @access  Public
 */
export const getHotelById = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id)
            .populate("reviews.userId", "userName avatar")

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        res.json({
            success: true,
            data: hotel,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Create new hotel
 * @route   POST /api/hotels
 * @access  Private (Admin only)
 */
export const createHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.create(req.body);

        res.status(201).json({
            success: true,
            message: "Hotel created successfully",
            data: hotel,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update hotel
 * @route   PUT /api/hotels/:id
 * @access  Private (Admin only)
 */
export const updateHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        res.json({
            success: true,
            message: "Hotel updated successfully",
            data: hotel,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete hotel
 * @route   DELETE /api/hotels/:id
 * @access  Private (Admin only)
 */
export const deleteHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findByIdAndDelete(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        res.json({
            success: true,
            message: "Hotel deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Search hotels by location
 * @route   GET /api/hotels/search/:location
 * @access  Public
 */
export const searchHotelsByLocation = async (req, res, next) => {
    try {
        const { location } = req.params;

        const hotels = await Hotel.find({
            $or: [
                { location: { $regex: location, $options: "i" } },
                { address: { $regex: location, $options: "i" } },
                { name: { $regex: location, $options: "i" } },
            ],
        }).sort({ rating: -1 });

        res.json({
            success: true,
            count: hotels.length,
            data: hotels,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get hotel reviews
 * @route   GET /api/hotels/:id/reviews
 * @access  Public
 */
export const getHotelReviews = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id)
            .populate("reviews.userId", "userName avatar")
            .select("reviews");

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: "Hotel not found",
            });
        }

        res.json({
            success: true,
            count: hotel.reviews.length,
            data: hotel.reviews,
        });
    } catch (error) {
        next(error);
    }
};
