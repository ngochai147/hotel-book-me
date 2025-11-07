import User from "../models/User.js";

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select("-__v");

        res.json({
            success: true,
            count: users.length,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
export const getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("favorites", "name location photos price rating")
            .select("-__v");

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
 * @desc    Update user profile
 * @route   PUT /api/users/:id
 * @access  Private
 */
export const updateUser = async (req, res, next) => {
    try {
        const { userName, phone, avatar } = req.body;

        // Check if user is updating their own profile
        if (req.params.id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update this profile",
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Update fields
        if (userName) user.userName = userName;
        if (phone) user.phone = phone;
        if (avatar) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private
 */
export const deleteUser = async (req, res, next) => {
    try {
        // Check if user is deleting their own account
        if (req.params.id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this account",
            });
        }

        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add hotel to favorites
 * @route   POST /api/users/:id/favorites/:hotelId
 * @access  Private
 */
export const addToFavorites = async (req, res, next) => {
    try {
        const { id, hotelId } = req.params;

        // Check if user is updating their own favorites
        if (id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update favorites",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if hotel is already in favorites
        if (user.favorites.includes(hotelId)) {
            return res.status(400).json({
                success: false,
                message: "Hotel already in favorites",
            });
        }

        user.favorites.push(hotelId);
        await user.save();

        const updatedUser = await User.findById(id).populate(
            "favorites",
            "name location photos price rating"
        );

        res.json({
            success: true,
            message: "Hotel added to favorites",
            data: updatedUser.favorites,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Remove hotel from favorites
 * @route   DELETE /api/users/:id/favorites/:hotelId
 * @access  Private
 */
export const removeFromFavorites = async (req, res, next) => {
    try {
        const { id, hotelId } = req.params;

        // Check if user is updating their own favorites
        if (id !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to update favorites",
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        user.favorites = user.favorites.filter(
            (fav) => fav.toString() !== hotelId
        );
        await user.save();

        const updatedUser = await User.findById(id).populate(
            "favorites",
            "name location photos price rating"
        );

        res.json({
            success: true,
            message: "Hotel removed from favorites",
            data: updatedUser.favorites,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user favorites
 * @route   GET /api/users/:id/favorites
 * @access  Private
 */
export const getUserFavorites = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).populate(
            "favorites",
            "name location photos price rating amenities"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.json({
            success: true,
            count: user.favorites.length,
            data: user.favorites,
        });
    } catch (error) {
        next(error);
    }
};
