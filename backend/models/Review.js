import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    _id: String,
    username: String,
    rating: Number,
    comment: String,
    _class: String,
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
