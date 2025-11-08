import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    name: String,
    type: String,
    price: Number,
    size: String,
    beds: String,
    capacity: Number,
    images: [String],
});

const Room = mongoose.model("Room", roomSchema);
export default Room;
