import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        bookingNumber: String,
        checkIn: Date,
        checkOut: Date,
        guests: Number,
        totalPrice: Number,
        status: {
            type: String,
            enum: ["upcoming", "completed", "cancelled"],
            default: "upcoming",
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        hotelId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Hotel",
            required: true,
        },
        hotelName: String,
        location: String,
        roomType: [String], // Danh sách room types đã đặt (có thể đặt nhiều phòng)
        image: String,
    },
    {
        timestamps: true,
    }
);

// Index để tìm kiếm bookings theo user và status nhanh hơn
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
