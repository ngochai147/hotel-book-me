import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    type: { type: String, required: true },
    price: { type: Number, required: true },
    size: String,
    beds: String,
});

const Room = mongoose.model("Room", roomSchema);
export default Room;
