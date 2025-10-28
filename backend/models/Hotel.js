import mongoose from "mongoose";

const coordinatesSchema = new mongoose.Schema(
    {
        latitude: Number,
        longitude: Number,
    },
    {
        _id: false,
    }
);

const reviewSchema = new mongoose.Schema(
    {
        reviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Review" },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        rating: String,
        comment: String,
        date: { type: Date, default: Date.now },
    },
    {
        _id: false,
    }
);

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            require: true,
        },
        type: String,
        price: Number,
        size: String,
        beds: String,
    },
    {
        _id: false,
    }
);

const hotelSchema = new mongoose.Schema({
    id: String,
    name: String,
    location: String,
    address: String,
    price: String,
    rating: String,
    description: String,
    amenities: [String],
    checkInTime: Date,
    checkOutTime: Date,
    policies: [String],
    coordinates: coordinatesSchema,
    roomTypes: [roomSchema],
    reviews: [reviewSchema],
});

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
