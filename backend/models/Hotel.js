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
        userName: String,
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now },
    },
    {
        _id: false,
    }
);

const roomSchema = new mongoose.Schema(
    {
        name: String,
        type: String,
        price: Number,
        size: String,
        beds: String,
        capacity: Number,
        images: [String],
    },
    {
        _id: false,
    }
);

const hotelSchema = new mongoose.Schema({
    id: Number,
    name: String,
    location: String,
    address: String,
    price: Number,
    rating: Number,
    description: String,
    amenities: [String],
    checkInTime: String,
    checkOutTime: String,
    policies: [String],
    photos: [String],
    coordinates: coordinatesSchema,
    roomTypes: [roomSchema],
    reviews: [reviewSchema],
});

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
