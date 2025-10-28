import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    userName: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    avatar: String,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }],
});

const User = mongoose.model("User", userSchema);
export default User;
