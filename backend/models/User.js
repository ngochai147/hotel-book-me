import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    userName: String,
    email: { type: String, unique: true },
    phone: String,
    avatar: String,
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }],
});

const User = mongoose.model("User", userSchema);
export default User;
