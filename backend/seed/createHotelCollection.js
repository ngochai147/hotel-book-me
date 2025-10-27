const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Hotel = require("../models/Hotel");

dotenv.config();

async function createCollectionAndInsert() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const hotelData = {
      name: "Liberty Central Saigon Citypoint",
      location: "Quận 1, TP. Hồ Chí Minh",
      address: "59 Pasteur, Bến Nghé, Quận 1, TP. HCM",
      price: 2500000,
      rating: 8.8,
      reviews: 1247,
      image: "https://res.cloudinary.com/demo/image/upload/hotel.jpg",
      description: "Khách sạn 4 sao nằm ngay trung tâm Sài Gòn...",
      amenities: ["Hồ bơi", "Phòng gym", "Nhà hàng", "WiFi miễn phí"],
      roomTypes: [
        {
          name: "Phòng Deluxe",
          type: "Deluxe",
          price: 2500000,
          images: ["https://res.cloudinary.com/demo/image/upload/room1.jpg"],
          capacity: 2,
          size: "30m2",
          beds: "1 giường đôi"
        }
      ],
      photos: ["https://res.cloudinary.com/demo/image/upload/hotel.jpg"],
      coordinates: { latitude: 10.776, longitude: 106.701 },
      checkInTime: "14:00",
      checkOutTime: "12:00",
      policies: ["Không hút thuốc", "Không mang thú cưng"]
    };

    const hotel = new Hotel(hotelData);
    await hotel.save();

    console.log("✅ Collection 'hotels' created and sample document inserted!");
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }
}

createCollectionAndInsert();
