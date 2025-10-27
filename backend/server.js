const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Review = require("./models/Review");
const Hotel = require("./models/Hotel");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

// Routes
app.get("/", (req, res) => res.send("API is running..."));

// Lấy tất cả review
app.get("/api/reviews", async (req, res) => {
  const reviews = await Review.find();
  res.json(reviews);
});

app.get("/api/hotels", async (req, res) => {
  const hotels = await Hotel.find();
  res.json(hotels);
});

// Thêm mới review
app.post("/api/reviews", async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
