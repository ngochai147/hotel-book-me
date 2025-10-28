import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
    method: String,
});

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
        hotelId: String,
        hotelName: String,
        location: String,
        roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
        roomType: String,
        image: String,
        receipt: receiptSchema,
    },
    {
        timestamps: true,
    }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
