const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  _id: String,
  username: String,
  rating: Number,
  comment: String,
  _class: String
});

module.exports = mongoose.model("Review", reviewSchema);