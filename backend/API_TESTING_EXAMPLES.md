# 🧪 API Testing Examples

Các ví dụ test API với cURL và JavaScript/Axios

## 📝 Setup

```bash
# Base URL
LOCAL_URL="http://localhost:8080"
PRODUCTION_URL="https://your-app.onrender.com"

# Lấy token từ Firebase sau khi login
TOKEN="your-firebase-id-token"
```

---

## 1. 💖 Favorites Management

### Get User Favorites

```bash
curl -X GET "$LOCAL_URL/api/users/USER_ID/favorites" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**

```javascript
const getUserFavorites = async (userId, token) => {
    const response = await axios.get(
        `http://localhost:8080/api/users/${userId}/favorites`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
```

---

### Add to Favorites

```bash
curl -X POST "$LOCAL_URL/api/users/USER_ID/favorites/HOTEL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**

```javascript
const addToFavorites = async (userId, hotelId, token) => {
    const response = await axios.post(
        `http://localhost:8080/api/users/${userId}/favorites/${hotelId}`,
        {},
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
```

---

### Remove from Favorites

```bash
curl -X DELETE "$LOCAL_URL/api/users/USER_ID/favorites/HOTEL_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**

```javascript
const removeFromFavorites = async (userId, hotelId, token) => {
    const response = await axios.delete(
        `http://localhost:8080/api/users/${userId}/favorites/${hotelId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
```

---

## 2. 📅 Booking Management

### Create Booking (with room availability check)

```bash
curl -X POST "$LOCAL_URL/api/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "507f191e810c19729de860ea",
    "roomTypes": ["Deluxe Room", "Standard Room"],
    "checkIn": "2024-12-20",
    "checkOut": "2024-12-25",
    "guests": 2,
    "totalPrice": 1000
  }'
```

**JavaScript:**

```javascript
const createBooking = async (bookingData, token) => {
    try {
        const response = await axios.post(
            "http://localhost:8080/api/bookings",
            {
                hotelId: bookingData.hotelId,
                roomTypes: bookingData.roomTypes, // Array - Must match hotel.roomTypes[].name
                checkIn: bookingData.checkIn, // "YYYY-MM-DD"
                checkOut: bookingData.checkOut, // "YYYY-MM-DD"
                guests: bookingData.guests,
                totalPrice: bookingData.totalPrice,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 400) {
            console.log("Room not available:", error.response.data);
        }
        throw error;
    }
};

// Usage
const booking = await createBooking(
    {
        hotelId: "507f191e810c19729de860ea",
        roomTypes: ["Deluxe Room", "Standard Room"],
        checkIn: "2024-12-20",
        checkOut: "2024-12-25",
        guests: 2,
        totalPrice: 1000,
    },
    token
);
```

**Expected Errors:**

```javascript
// Room already booked
{
  "success": false,
  "message": "Room type 'Deluxe Room' is not available for the selected dates...",
  "conflictingBookings": [
    {
      "checkIn": "2024-12-18T00:00:00.000Z",
      "checkOut": "2024-12-22T00:00:00.000Z"
    }
  ]
}

// Room type not exist
{
  "success": false,
  "message": "Room type 'Invalid Room' not available in this hotel"
}

// Date in past
{
  "success": false,
  "message": "Check-in date cannot be in the past"
}
```

---

### Get My Bookings

```bash
curl -X GET "$LOCAL_URL/api/bookings/my-bookings" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**

```javascript
const getMyBookings = async (token) => {
    const response = await axios.get(
        "http://localhost:8080/api/bookings/my-bookings",
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
```

---

### Update Booking Status

```bash
# Mark as completed
curl -X PUT "$LOCAL_URL/api/bookings/BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

**JavaScript:**

```javascript
const updateBookingStatus = async (bookingId, status, token) => {
    // status: "upcoming" | "completed" | "cancelled"
    const response = await axios.put(
        `http://localhost:8080/api/bookings/${bookingId}`,
        { status },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

// Mark as completed (to enable review)
await updateBookingStatus(bookingId, "completed", token);
```

---

### Cancel Booking

```bash
curl -X DELETE "$LOCAL_URL/api/bookings/BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**

```javascript
const cancelBooking = async (bookingId, token) => {
    const response = await axios.delete(
        `http://localhost:8080/api/bookings/${bookingId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
```

---

## 3. ⭐ Review Management

### Create Review (requires completed booking)

```bash
curl -X POST "$LOCAL_URL/api/reviews" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "507f191e810c19729de860ea",
    "rating": 5,
    "comment": "Excellent hotel! Highly recommended."
  }'
```

**JavaScript:**

```javascript
const createReview = async (reviewData, token) => {
    try {
        const response = await axios.post(
            "http://localhost:8080/api/reviews",
            {
                hotelId: reviewData.hotelId,
                rating: reviewData.rating, // 1-5
                comment: reviewData.comment,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        if (error.response?.status === 403) {
            console.log("Need completed booking to review");
        } else if (error.response?.status === 400) {
            console.log("Already reviewed this hotel");
        }
        throw error;
    }
};

// Usage
const review = await createReview(
    {
        hotelId: "507f191e810c19729de860ea",
        rating: 5,
        comment: "Great experience!",
    },
    token
);
```

**Expected Errors:**

```javascript
// No completed booking
{
  "success": false,
  "message": "You can only review hotels where you have a completed booking"
}

// Already reviewed
{
  "success": false,
  "message": "You have already reviewed this hotel"
}
```

---

### Get All Reviews of a Hotel

```bash
curl -X GET "$LOCAL_URL/api/reviews/hotel/HOTEL_ID"
```

**JavaScript:**

```javascript
const getAllHotelReviews = async (hotelId) => {
    const response = await axios.get(
        `http://localhost:8080/api/reviews/hotel/${hotelId}`
    );
    return response.data;
};

// Note: Hotel document only has 5 latest reviews embedded
// Use this API to get ALL reviews
```

---

### Delete Review

```bash
curl -X DELETE "$LOCAL_URL/api/reviews/REVIEW_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**JavaScript:**

```javascript
const deleteReview = async (reviewId, token) => {
    const response = await axios.delete(
        `http://localhost:8080/api/reviews/${reviewId}`,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
    return response.data;
};
```

---

## 🔄 Complete Workflow Examples

### Example 1: Book Room and Review

```javascript
// 1. Login and get token
const loginResponse = await firebase
    .auth()
    .signInWithEmailAndPassword(email, password);
const token = await loginResponse.user.getIdToken();

// 2. Check hotel and available rooms
const hotel = await axios.get(`http://localhost:8080/api/hotels/${hotelId}`);
console.log("Available room types:", hotel.data.data.roomTypes);

// 3. Create booking
const booking = await createBooking(
    {
        hotelId: hotelId,
        roomType: "Deluxe Room",
        checkIn: "2024-12-20",
        checkOut: "2024-12-25",
        guests: 2,
        totalPrice: 1000,
    },
    token
);

console.log("Booking created:", booking.data.bookingNumber);

// 4. After checkout, mark as completed (admin/system)
await updateBookingStatus(booking.data._id, "completed", adminToken);

// 5. User can now write review
const review = await createReview(
    {
        hotelId: hotelId,
        rating: 5,
        comment: "Excellent stay!",
    },
    token
);

console.log("Review created:", review.data._id);

// 6. View all reviews
const allReviews = await getAllHotelReviews(hotelId);
console.log(`Total reviews: ${allReviews.count}`);
```

---

### Example 2: Manage Favorites

```javascript
const token = await getFirebaseToken();
const userId = "USER_ID";

// Add multiple hotels to favorites
const hotelIds = ["hotel1", "hotel2", "hotel3"];

for (const hotelId of hotelIds) {
    try {
        await addToFavorites(userId, hotelId, token);
        console.log(`Added ${hotelId} to favorites`);
    } catch (error) {
        console.log(`Already in favorites: ${hotelId}`);
    }
}

// Get favorites
const favorites = await getUserFavorites(userId, token);
console.log(`You have ${favorites.count} favorite hotels`);

// Remove one
await removeFromFavorites(userId, hotelIds[0], token);
console.log("Removed from favorites");
```

---

### Example 3: Check Room Availability

```javascript
const checkRoomAvailability = async (
    hotelId,
    roomTypes,
    checkIn,
    checkOut,
    token
) => {
    try {
        const booking = await createBooking(
            {
                hotelId,
                roomTypes,
                checkIn,
                checkOut,
                guests: 2,
                totalPrice: 500,
            },
            token
        );

        console.log(
            "✅ Room available! Booking created:",
            booking.data.bookingNumber
        );
        return true;
    } catch (error) {
        if (error.response?.data?.conflictingBookings) {
            console.log("❌ Room not available in these dates:");
            error.response.data.conflictingBookings.forEach((conflict) => {
                console.log(`  - ${conflict.checkIn} to ${conflict.checkOut}`);
            });
            return false;
        }
        throw error;
    }
};

// Usage
const available = await checkRoomAvailability(
    "hotelId",
    "Deluxe Room",
    "2024-12-20",
    "2024-12-25",
    token
);
```

---

## 🧪 Testing Tips

### 1. Test Room Availability Logic

```javascript
// Create first booking
const booking1 = await createBooking(
    {
        hotelId: "hotel123",
        roomTypes: ["Deluxe Room"],
        checkIn: "2024-12-20",
        checkOut: "2024-12-25",
        guests: 2,
        totalPrice: 1000,
    },
    token
);

// Try overlapping dates (should fail)
try {
    const booking2 = await createBooking(
        {
            hotelId: "hotel123",
            roomTypes: ["Deluxe Room"],
            checkIn: "2024-12-22", // Overlaps with booking1
            checkOut: "2024-12-27",
            guests: 2,
            totalPrice: 1000,
        },
        token
    );
} catch (error) {
    console.log("✅ Correctly blocked:", error.response.data.message);
}

// Try different room type (should succeed)
const booking3 = await createBooking(
    {
        hotelId: "hotel123",
        roomTypes: ["Standard Room"], // Different room type
        checkIn: "2024-12-22",
        checkOut: "2024-12-27",
        guests: 2,
        totalPrice: 800,
    },
    token
);
console.log("✅ Different room type available");
```

---

### 2. Test Review Authorization

```javascript
// Book and complete
const booking = await createBooking({...}, token);
await updateBookingStatus(booking.data._id, 'completed', adminToken);

// Try to review (should succeed)
const review = await createReview({
  hotelId: booking.data.hotelId,
  rating: 5,
  comment: 'Great!'
}, token);

// Try to review again (should fail)
try {
  await createReview({
    hotelId: booking.data.hotelId,
    rating: 4,
    comment: 'Changed my mind'
  }, token);
} catch (error) {
  console.log('✅ Correctly blocked duplicate review');
}
```

---

### 3. Test Booking Status Flow

```javascript
const booking = await createBooking({...}, token);
console.log('Initial status:', booking.data.status); // "upcoming"

// Update to completed
await updateBookingStatus(booking.data._id, 'completed', token);

// Cancel
await cancelBooking(booking.data._id, token);

// Try to update cancelled booking (should fail)
try {
  await updateBookingStatus(booking.data._id, 'upcoming', token);
} catch (error) {
  console.log('✅ Cannot modify cancelled booking');
}
```

---

## 📊 Status Codes Reference

| Code | Meaning      | Common Causes                        |
| ---- | ------------ | ------------------------------------ |
| 200  | OK           | Successful GET, PUT                  |
| 201  | Created      | Successful POST                      |
| 400  | Bad Request  | Validation error, room not available |
| 401  | Unauthorized | No/invalid token                     |
| 403  | Forbidden    | No completed booking, not owner      |
| 404  | Not Found    | Resource not found                   |
| 500  | Server Error | Unexpected error                     |

---

**Note**: Thay thế `USER_ID`, `HOTEL_ID`, `BOOKING_ID`, `REVIEW_ID` bằng các ID thực tế từ database của bạn.
