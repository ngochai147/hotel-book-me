import mongoose from "mongoose";

const roomTypeSchema = new mongoose.Schema({
    name: String,
    type: String,
    price: Number,
    images: [String],
    capacity: Number,
    size: String,
    beds: String,
});

const coordinatesSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
});

const hotelSchema = new mongoose.Schema({
    name: String,
    location: String,
    address: String,
    price: Number,
    rating: Number,
    reviews: Number,
    image: String,
    description: String,
    amenities: [String],
    roomTypes: [roomTypeSchema],
    photos: [String],
    coordinates: coordinatesSchema,
    checkInTime: String,
    checkOutTime: String,
    policies: [String],
});

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;
