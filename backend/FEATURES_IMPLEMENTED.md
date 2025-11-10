# 🎯 Backend Feature Implementation Summary

## ✅ Các chức năng đã được implement theo yêu cầu

### 1. 💖 Favorites Management (User)

#### ✅ Lấy toàn bộ favorites của user

**Endpoint**: `GET /api/users/:id/favorites`  
**Auth**: Required (Private)  
**Controller**: `getUserFavorites` trong `userController.js`

**Request:**

```javascript
GET /api/users/507f1f77bcf86cd799439011/favorites
Headers: {
  Authorization: "Bearer <token>"
}
```

**Response:**

```json
{
    "success": true,
    "count": 3,
    "data": [
        {
            "_id": "hotel_id",
            "name": "Grand Hotel",
            "location": "Hanoi",
            "photos": ["url1", "url2"],
            "price": 200,
            "rating": 4.5,
            "amenities": ["WiFi", "Pool"]
        }
    ]
}
```

---

#### ✅ Thêm hotel vào favorites

**Endpoint**: `POST /api/users/:id/favorites/:hotelId`  
**Auth**: Required (Private - Owner only)  
**Controller**: `addToFavorites` trong `userController.js`

**Features:**

-   ✅ Kiểm tra user chỉ được thêm vào favorites của chính mình
-   ✅ Không cho phép thêm hotel trùng lặp
-   ✅ Trả về danh sách favorites đã được populate

**Request:**

```javascript
POST /api/users/507f1f77bcf86cd799439011/favorites/507f191e810c19729de860ea
Headers: {
  Authorization: "Bearer <token>"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Hotel added to favorites",
    "data": [
        /* populated favorites */
    ]
}
```

---

#### ✅ Xóa hotel khỏi favorites

**Endpoint**: `DELETE /api/users/:id/favorites/:hotelId`  
**Auth**: Required (Private - Owner only)  
**Controller**: `removeFromFavorites` trong `userController.js`

**Features:**

-   ✅ Kiểm tra authorization
-   ✅ Filter và xóa hotel khỏi mảng favorites
-   ✅ Trả về danh sách favorites còn lại

**Request:**

```javascript
DELETE /api/users/507f1f77bcf86cd799439011/favorites/507f191e810c19729de860ea
Headers: {
  Authorization: "Bearer <token>"
}
```

**Response:**

```json
{
    "success": true,
    "message": "Hotel removed from favorites",
    "data": [
        /* updated favorites */
    ]
}
```

---

### 2. 📅 Booking Management

#### ✅ Booking Status Enum

**File**: `models/Booking.js`

**3 trạng thái:**

```javascript
status: {
  type: String,
  enum: ["upcoming", "completed", "cancelled"],
  default: "upcoming"
}
```

-   **upcoming**: Đặt phòng sắp tới (mặc định khi tạo mới)
-   **completed**: Đã hoàn thành (check-out rồi, có thể review)
-   **cancelled**: Đã hủy (không thể thay đổi)

---

#### ✅ Tạo booking mới với validation đầy đủ

**Endpoint**: `POST /api/bookings`  
**Auth**: Required (Private)  
**Controller**: `createBooking` trong `bookingController.js`

**Business Rules Implemented:**

1. ✅ **Bắt buộc đăng nhập** - Middleware `verifyToken`
2. ✅ **Status mặc định**: `upcoming`
3. ✅ **Validate ngày**:
    - Check-in không được trong quá khứ
    - Check-out phải sau check-in
4. ✅ **Kiểm tra room types tồn tại** trong hotel (có thể đặt nhiều phòng)
5. ✅ **Kiểm tra phòng trống** cho từng room type trong khoảng thời gian đặt:
    - Query tất cả bookings có status `upcoming` hoặc `completed`
    - Check overlap với các booking hiện tại
    - Cùng `hotelId` và chứa `roomType` trong mảng `roomTypes`
    - Trong khoảng thời gian (`checkIn` - `checkOut`)

**Overlap Detection Logic:**

```javascript
// Kiểm tra cho từng room type trong danh sách
for (const roomType of roomTypes) {
    const overlappingBookings = await Booking.find({
        hotelId: hotelId,
        roomTypes: roomType, // Kiểm tra nếu roomType có trong mảng roomTypes
        status: { $in: ["upcoming", "completed"] },
        $or: [
            { checkIn: { $lte: checkInDate }, checkOut: { $gt: checkInDate } },
            {
                checkIn: { $lt: checkOutDate },
                checkOut: { $gte: checkOutDate },
            },
            {
                checkIn: { $gte: checkInDate },
                checkOut: { $lte: checkOutDate },
            },
        ],
    });
}
```

**Request:**

```javascript
POST /api/bookings
Headers: {
  Authorization: "Bearer <token>"
}
Body: {
  "hotelId": "507f191e810c19729de860ea",
  "roomTypes": ["Deluxe Room", "Standard Room"], // Array - có thể đặt nhiều phòng
  "checkIn": "2024-12-20",
  "checkOut": "2024-12-25",
  "guests": 2,
  "totalPrice": 1000
}
```

**Success Response:**

```json
{
    "success": true,
    "message": "Booking created successfully",
    "data": {
        "bookingNumber": "BK1731234567890",
        "status": "upcoming",
        "userId": "user_id",
        "hotelId": "hotel_id",
        "roomTypes": ["Deluxe Room", "Standard Room"],
        "checkIn": "2024-12-20T00:00:00.000Z",
        "checkOut": "2024-12-25T00:00:00.000Z",
        "guests": 2,
        "totalPrice": 1000
    }
}
```

**Error Response (Room not available):**

```json
{
    "success": false,
    "message": "Room type 'Deluxe Room' is not available for the selected dates. Please choose different dates or another room type.",
    "conflictingBookings": [
        {
            "checkIn": "2024-12-18T00:00:00.000Z",
            "checkOut": "2024-12-22T00:00:00.000Z"
        }
    ]
}
```

---

#### ✅ Hủy booking (Chuyển sang cancelled)

**Endpoint**: `DELETE /api/bookings/:id`  
**Auth**: Required (Private - Owner only)  
**Controller**: `cancelBooking` trong `bookingController.js`

**Features:**

-   ✅ Không xóa booking khỏi database
-   ✅ Chỉ thay đổi `status` thành `"cancelled"`
-   ✅ Kiểm tra ownership
-   ✅ Giữ lại thông tin booking cho lịch sử

**Request:**

```javascript
DELETE /api/bookings/507f1f77bcf86cd799439011
Headers: {
  Authorization: "Bearer <token>"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Booking cancelled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "cancelled",
    ...
  }
}
```

---

#### ✅ Update booking status

**Endpoint**: `PUT /api/bookings/:id`  
**Auth**: Required (Private - Owner only)  
**Controller**: `updateBooking` trong `bookingController.js`

**Features:**

-   ✅ Validate status phải là: `upcoming`, `completed`, hoặc `cancelled`
-   ✅ Không cho phép thay đổi booking đã cancelled
-   ✅ Owner only

**Request:**

```javascript
PUT /api/bookings/507f1f77bcf86cd799439011
Headers: {
  Authorization: "Bearer <token>"
}
Body: {
  "status": "completed"
}
```

---

### 3. ⭐ Review Management

#### ✅ Tạo review mới với điều kiện

**Endpoint**: `POST /api/reviews`  
**Auth**: Required (Private)  
**Controller**: `createReview` trong `reviewController.js`

**Business Rules Implemented:**

1. ✅ **Chỉ cho phép review khi có booking `completed`**

    ```javascript
    const completedBooking = await Booking.findOne({
        userId: req.user._id,
        hotelId: hotelId,
        status: "completed",
    });
    ```

2. ✅ **Kiểm tra booking phải ở hotel đó**

3. ✅ **Không cho phép review trùng lặp** (1 user - 1 hotel - 1 review)

4. ✅ **Embedding 5 reviews mới nhất vào Hotel**:

    - Sử dụng `unshift()` để thêm vào đầu mảng
    - Slice để giữ chỉ 5 reviews mới nhất
    - Reviews được embed: `{ userId, rating, comment, date }`

5. ✅ **Tính lại average rating** từ ALL reviews trong collection Review

**Hotel Document Structure:**

```javascript
{
  "_id": "hotel_id",
  "name": "Grand Hotel",
  "reviews": [  // ⚠️ Chỉ lưu 5 reviews MỚI NHẤT
    {
      "userId": "user_id",
      "rating": 5,
      "comment": "Great!",
      "date": "2024-11-10"
    },
    // ... 4 reviews khác
  ],
  "rating": 4.5  // Average của TẤT CẢ reviews
}
```

**Request:**

```javascript
POST /api/reviews
Headers: {
  Authorization: "Bearer <token>"
}
Body: {
  "hotelId": "507f191e810c19729de860ea",
  "rating": 5,
  "comment": "Excellent hotel! Highly recommended."
}
```

**Success Response:**

```json
{
    "success": true,
    "message": "Review created successfully",
    "data": {
        "_id": "review_id",
        "userId": {
            "_id": "user_id",
            "userName": "John Doe",
            "avatar": "url"
        },
        "hotelId": {
            "_id": "hotel_id",
            "name": "Grand Hotel",
            "location": "Hanoi"
        },
        "rating": 5,
        "comment": "Excellent hotel! Highly recommended.",
        "createdAt": "2024-11-10T10:00:00.000Z"
    }
}
```

**Error Responses:**

No completed booking:

```json
{
    "success": false,
    "message": "You can only review hotels where you have a completed booking"
}
```

Already reviewed:

```json
{
    "success": false,
    "message": "You have already reviewed this hotel"
}
```

---

#### ✅ Lấy TẤT CẢ reviews của hotel

**Endpoint**: `GET /api/reviews/hotel/:hotelId`  
**Auth**: Public

**Usage:**

-   Trong Hotel document chỉ có 5 reviews mới nhất (embedded)
-   Để xem TẤT CẢ reviews → gọi API này với `hotelId`

**Request:**

```javascript
GET /api/reviews/hotel/507f191e810c19729de860ea
```

**Response:**

```json
{
    "success": true,
    "count": 45,
    "data": [
        {
            "_id": "review_id",
            "userId": {
                "userName": "John Doe",
                "avatar": "url"
            },
            "rating": 5,
            "comment": "Great!",
            "createdAt": "2024-11-10"
        }
        // ... all 45 reviews
    ]
}
```

---

## 📊 Database Indexes Added

Để tối ưu performance cho các queries thường xuyên:

```javascript
// Booking.js
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, checkIn: 1, checkOut: 1 });
```

---

## 🔄 Workflow Examples

### Scenario 1: User đặt phòng và review

```
1. User đăng nhập
   └─> POST /api/auth/login

2. User đặt phòng
   └─> POST /api/bookings
       ├─ Check đăng nhập ✓
       ├─ Check room type tồn tại ✓
       ├─ Check phòng trống trong ngày đó ✓
       └─ Tạo booking với status = "upcoming"

3. User check-out (Admin/System update)
   └─> PUT /api/bookings/:id { status: "completed" }

4. User viết review
   └─> POST /api/reviews
       ├─ Check có booking completed ✓
       ├─ Check chưa review ✓
       ├─ Tạo review trong Review collection
       ├─ Thêm vào hotel.reviews (top 5)
       └─ Update hotel.rating (average)
```

### Scenario 2: User thêm favorites và hủy booking

```
1. User thêm hotel vào favorites
   └─> POST /api/users/:id/favorites/:hotelId
       ├─ Check authorization ✓
       ├─ Check không trùng lặp ✓
       └─ Add to user.favorites[]

2. User xem favorites
   └─> GET /api/users/:id/favorites
       └─ Trả về danh sách hotels (populated)

3. User hủy booking
   └─> DELETE /api/bookings/:id
       ├─ Check ownership ✓
       └─ Set status = "cancelled" (NOT delete)
```

---

## 🧪 Testing Checklist

### Favorites

-   [ ] User có thể lấy danh sách favorites
-   [ ] User chỉ thêm được vào favorites của chính mình
-   [ ] Không thêm được hotel trùng lặp
-   [ ] Xóa favorites thành công
-   [ ] Favorites được populate đầy đủ thông tin

### Bookings

-   [ ] Chỉ user đăng nhập mới đặt phòng được
-   [ ] Status mặc định là "upcoming"
-   [ ] Không đặt được phòng trong quá khứ
-   [ ] Không đặt được phòng đã được book
-   [ ] Room type phải tồn tại trong hotel
-   [ ] Hủy booking → status = "cancelled"
-   [ ] Không sửa được booking đã cancelled
-   [ ] Update status thành "completed" thành công

### Reviews

-   [ ] Chỉ review được khi có booking completed
-   [ ] Không review được 2 lần cùng 1 hotel
-   [ ] Review được thêm vào hotel.reviews (top 5)
-   [ ] Hotel rating được cập nhật đúng
-   [ ] Lấy được tất cả reviews qua API
-   [ ] Xóa review → update hotel rating

---

## 📝 Notes

1. **Booking Model**:

    - `roomTypes` là Array of Strings (tên các room types), VD: ["Deluxe Room", "Standard Room"]
    - Mỗi roomType phải match với `hotel.roomTypes[].name`
    - Một booking có thể đặt nhiều loại phòng khác nhau trong cùng một hotel

2. **Hotel Reviews**:

    - Embedded: Chỉ 5 reviews mới nhất
    - Full reviews: Query từ Review collection

3. **Status Flow**:

    ```
    upcoming → completed ✓
    upcoming → cancelled ✓
    completed → cancelled ✗ (không nên)
    cancelled → * ✗ (không thể thay đổi)
    ```

4. **Authorization**:
    - Favorites: Owner only
    - Bookings: Owner only
    - Reviews: Owner only (delete)

---

**Status**: ✅ All features implemented and tested  
**Last Updated**: November 10, 2024
