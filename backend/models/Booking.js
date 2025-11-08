import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        bookingNumber: String,
        checkIn: Date,
        checkOut: Date,
        guests: Number,
        totalPrice: Number,
        status: { type: String, default: "pending" },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        hotelId: Number,
        hotelName: String,
        location: String,
        roomType: String,
        image: String,
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
