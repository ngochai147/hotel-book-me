# 📖 Backend Architecture Documentation

Tài liệu mô tả kiến trúc và cấu trúc của backend API.

## 🏗️ Kiến trúc tổng quan

```
┌─────────────────┐
│  React Native   │
│    Frontend     │  (Expo)
└────────┬────────┘
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│   Express.js    │
│   REST API      │  (Node.js + Express)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────────┐
│ Mongo │ │  Firebase   │
│ Atlas │ │    Auth     │
└───────┘ └─────────────┘
```

## 📂 Cấu trúc thư mục chi tiết

```
backend/
│
├── config/                          # Cấu hình ứng dụng
│   ├── database.js                  # MongoDB connection handler
│   ├── firebaseConfig.js            # Firebase config (optional)
│   └── serviceAccountKey.js         # Firebase admin credentials
│
├── controllers/                     # Business Logic Layer
│   ├── authController.js            # Xử lý authentication & authorization
│   │   ├── register()               # Đăng ký user mới
│   │   ├── login()                  # Đăng nhập & verify token
│   │   ├── getMe()                  # Lấy thông tin user hiện tại
│   │   └── logout()                 # Đăng xuất
│   │
│   ├── hotelController.js           # Quản lý hotels
│   │   ├── getAllHotels()           # Lấy danh sách hotels (có filter, pagination)
│   │   ├── getHotelById()           # Lấy chi tiết hotel
│   │   ├── createHotel()            # Tạo hotel mới (Admin)
│   │   ├── updateHotel()            # Cập nhật hotel (Admin)
│   │   ├── deleteHotel()            # Xóa hotel (Admin)
│   │   ├── searchHotelsByLocation() # Tìm kiếm theo địa điểm
│   │   └── getHotelReviews()        # Lấy reviews của hotel
│   │
│   ├── bookingController.js         # Quản lý bookings
│   │   ├── getAllBookings()         # Lấy tất cả bookings (Admin)
│   │   ├── getUserBookings()        # Lấy bookings của user
│   │   ├── getBookingById()         # Lấy chi tiết booking
│   │   ├── createBooking()          # Tạo booking mới
│   │   ├── updateBooking()          # Cập nhật booking status
│   │   ├── cancelBooking()          # Hủy booking
│   │   └── getBookingStats()        # Thống kê bookings (Admin)
│   │
│   ├── reviewController.js          # Quản lý reviews
│   │   ├── getAllReviews()          # Lấy tất cả reviews
│   │   ├── getReviewsByHotel()      # Lấy reviews theo hotel
│   │   ├── getReviewsByUser()       # Lấy reviews theo user
│   │   ├── getReviewById()          # Lấy chi tiết review
│   │   ├── createReview()           # Tạo review mới
│   │   ├── updateReview()           # Cập nhật review
│   │   └── deleteReview()           # Xóa review
│   │
│   └── userController.js            # Quản lý users
│       ├── getAllUsers()            # Lấy tất cả users (Admin)
│       ├── getUserById()            # Lấy thông tin user
│       ├── updateUser()             # Cập nhật profile
│       ├── deleteUser()             # Xóa account
│       ├── addToFavorites()         # Thêm hotel vào yêu thích
│       ├── removeFromFavorites()    # Xóa khỏi yêu thích
│       └── getUserFavorites()       # Lấy danh sách yêu thích
│
├── middlewares/                     # Middleware Layer
│   ├── errorHandler.js              # Global error handler
│   │   └── Xử lý tất cả errors: validation, mongoose, firebase, etc.
│   │
│   ├── verifyToken.js               # Authentication middleware
│   │   └── verifyToken()            # Verify Firebase ID token
│   │
│   └── logger.js                    # Logging middleware
│       ├── logger()                 # Log requests (development)
│       └── notFound()               # 404 handler
│
├── models/                          # Data Models (Mongoose Schemas)
│   ├── User.js                      # User schema
│   │   ├── uid: String (Firebase)   # Unique, required
│   │   ├── userName: String
│   │   ├── email: String            # Unique
│   │   ├── phone: String
│   │   ├── avatar: String
│   │   └── favorites: [ObjectId]    # Ref: Hotel
│   │
│   ├── Hotel.js                     # Hotel schema
│   │   ├── id: Number
│   │   ├── name: String
│   │   ├── location: String
│   │   ├── address: String
│   │   ├── price: Number
│   │   ├── rating: Number
│   │   ├── description: String
│   │   ├── amenities: [String]
│   │   ├── checkInTime: Date
│   │   ├── checkOutTime: Date
│   │   ├── policies: [String]
│   │   ├── photos: [String]
│   │   ├── coordinates: {lat, lng}
│   │   ├── roomTypes: [RoomSchema]
│   │   └── reviews: [ReviewSchema]
│   │
│   ├── Booking.js                   # Booking schema
│   │   ├── bookingNumber: String    # Unique identifier
│   │   ├── userId: ObjectId         # Ref: User
│   │   ├── hotelId: Number
│   │   ├── hotelName: String
│   │   ├── location: String
│   │   ├── roomType: String
│   │   ├── checkIn: Date
│   │   ├── checkOut: Date
│   │   ├── guests: Number
│   │   ├── totalPrice: Number
│   │   ├── status: String           # pending|confirmed|cancelled|completed
│   │   ├── image: String
│   │   ├── createdAt: Date
│   │   └── updatedAt: Date
│   │
│   ├── Review.js                    # Review schema
│   │   ├── userId: ObjectId         # Ref: User
│   │   ├── hotelId: ObjectId        # Ref: Hotel
│   │   ├── rating: Number           # 1-5
│   │   ├── comment: String
│   │   ├── createdAt: Date
│   │   └── updatedAt: Date
│   │
│   └── Room.js                      # Room schema
│       ├── name: String
│       ├── type: String
│       ├── price: Number
│       ├── size: String
│       ├── beds: String
│       ├── capacity: Number
│       └── images: [String]
│
├── routes/                          # Route Definitions
│   ├── authRoutes.js                # /api/auth/*
│   │   ├── POST   /register         # Public
│   │   ├── POST   /login            # Public
│   │   ├── GET    /me               # Private
│   │   └── POST   /logout           # Private
│   │
│   ├── hotelRoutes.js               # /api/hotels/*
│   │   ├── GET    /                 # Public (with query filters)
│   │   ├── GET    /search/:location # Public
│   │   ├── GET    /:id              # Public
│   │   ├── GET    /:id/reviews      # Public
│   │   ├── POST   /                 # Private (Admin)
│   │   ├── PUT    /:id              # Private (Admin)
│   │   └── DELETE /:id              # Private (Admin)
│   │
│   ├── bookingRoutes.js             # /api/bookings/*
│   │   ├── GET    /                 # Private (Admin)
│   │   ├── GET    /my-bookings      # Private
│   │   ├── GET    /stats            # Private (Admin)
│   │   ├── GET    /:id              # Private
│   │   ├── POST   /                 # Private
│   │   ├── PUT    /:id              # Private
│   │   └── DELETE /:id              # Private
│   │
│   ├── reviewRoutes.js              # /api/reviews/*
│   │   ├── GET    /                 # Public
│   │   ├── GET    /hotel/:hotelId   # Public
│   │   ├── GET    /user/:userId     # Public
│   │   ├── GET    /:id              # Public
│   │   ├── POST   /                 # Private
│   │   ├── PUT    /:id              # Private
│   │   └── DELETE /:id              # Private
│   │
│   └── userRoutes.js                # /api/users/*
│       ├── GET    /                 # Private (Admin)
│       ├── GET    /:id              # Private
│       ├── PUT    /:id              # Private
│       ├── DELETE /:id              # Private
│       ├── GET    /:id/favorites    # Private
│       ├── POST   /:id/favorites/:hotelId    # Private
│       └── DELETE /:id/favorites/:hotelId    # Private
│
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore rules
├── API_DOCUMENTATION.js             # API documentation
├── DEPLOYMENT_GUIDE.md              # Deployment instructions
├── package.json                     # Dependencies & scripts
├── README.md                        # Project overview
├── render.yaml                      # Render deployment config
└── server.js                        # Application entry point

```

## 🔄 Request Flow

### 1. Authenticated Request Flow

```
Client Request
    ↓
Express Middleware Stack
    ↓
CORS Middleware
    ↓
JSON Parser
    ↓
Logger (dev only)
    ↓
Route Matching (/api/bookings/my-bookings)
    ↓
verifyToken Middleware
    ├── Extract Bearer token
    ├── Verify with Firebase Admin
    ├── Get user from MongoDB
    └── Attach user to req.user
    ↓
Controller (getUserBookings)
    ├── Get userId from req.user
    ├── Query MongoDB
    └── Return response
    ↓
Success Response or Error
    ↓
Error Handler Middleware (if error)
    ├── Format error
    └── Send error response
    ↓
Client receives response
```

### 2. Public Request Flow

```
Client Request
    ↓
Express Middleware Stack
    ↓
Route Matching (/api/hotels)
    ↓
Controller (getAllHotels)
    ├── Parse query parameters
    ├── Build MongoDB query
    ├── Execute query with pagination
    └── Return response
    ↓
Client receives response
```

## 🔐 Authentication Flow

### Registration

```
Client (Frontend)
    ↓
POST /api/auth/register
    { email, password, userName, phone }
    ↓
authController.register()
    ├── 1. Validate input
    ├── 2. Create user in Firebase Auth
    │      └── admin.auth().createUser()
    ├── 3. Save user to MongoDB
    │      └── new User({ uid, email, userName })
    └── 4. Return success response
    ↓
Client receives { uid, email, userName }
```

### Login

```
Client (Frontend)
    ├── 1. Login with Firebase Client SDK
    │      firebase.auth().signInWithEmailAndPassword()
    ├── 2. Get Firebase ID token
    │      user.getIdToken()
    └── 3. Send token to backend
    ↓
POST /api/auth/login
    { token }
    ↓
authController.login()
    ├── 1. Verify Firebase ID token
    │      └── admin.auth().verifyIdToken(token)
    ├── 2. Find or create user in MongoDB
    └── 3. Return user data
    ↓
Client receives user data
Client stores token for future requests
```

### Authenticated Requests

```
Client
    ├── Get current Firebase ID token
    │   └── firebase.auth().currentUser.getIdToken()
    └── Include in request header
    ↓
Header: Authorization: Bearer <token>
    ↓
verifyToken Middleware
    ├── 1. Extract token from header
    ├── 2. Verify with Firebase Admin
    ├── 3. Get user from MongoDB
    ├── 4. Attach to req.user
    └── 5. Call next()
    ↓
Controller can access req.user
```

## 💾 Database Design

### Collections in MongoDB

1. **users**

    - Stores user profile information
    - Links to Firebase via `uid`
    - Contains favorites array

2. **hotels**

    - Main hotel information
    - Embedded room types
    - Embedded reviews (denormalized for performance)

3. **bookings**

    - Booking transactions
    - References users via `userId`
    - Contains snapshot of hotel data

4. **reviews**

    - User reviews for hotels
    - References users and hotels
    - Auto-updates hotel's rating

5. **rooms**
    - Room type definitions
    - Can be embedded in hotels or separate

### Relationships

```
User (1) ──────── (N) Booking
User (1) ──────── (N) Review
User (N) ──────── (N) Hotel (Favorites)
Hotel (1) ─────── (N) Review
Hotel (1) ─────── (N) Room
```

## 🛡️ Security Measures

1. **Authentication**

    - Firebase Admin SDK for token verification
    - No passwords stored in MongoDB
    - Token-based authentication

2. **Authorization**

    - Ownership checks (user can only modify their data)
    - Admin checks (for sensitive operations)
    - Route-level protection with middleware

3. **Input Validation**

    - Mongoose schema validation
    - Express-validator (can be added)
    - Type checking

4. **Error Handling**

    - Centralized error handler
    - No sensitive info in error messages
    - Proper HTTP status codes

5. **Environment Variables**
    - Sensitive data in .env
    - Never committed to Git
    - Different configs for dev/prod

## 📊 Response Format Standard

### Success Response

```json
{
    "success": true,
    "message": "Optional success message",
    "data": {
        // Response data
    },
    // For lists:
    "count": 10,
    "total": 100,
    "page": 1,
    "pages": 10
}
```

### Error Response

```json
{
    "success": false,
    "message": "Error description",
    "errors": ["validation error 1", "validation error 2"]
}
```

## 🚀 Performance Optimizations

1. **Database Indexing**

    - Index on User.uid
    - Index on User.email
    - Index on Hotel.location
    - Index on Booking.userId

2. **Query Optimization**

    - Pagination for large datasets
    - Select only needed fields
    - Populate strategically

3. **Caching** (Can be implemented)

    - Redis for frequently accessed data
    - Cache hotel listings
    - Cache user sessions

4. **Connection Pooling**
    - MongoDB connection pooling (default in Mongoose)
    - Keep connections alive

## 📈 Monitoring & Logging

### Development

-   Console logs with timestamps
-   Request logging middleware
-   Error stack traces

### Production

-   Structured logging
-   Error tracking (Sentry can be added)
-   Performance monitoring (can be added)
-   Uptime monitoring

## 🔧 Development Workflow

1. **Local Development**

    ```bash
    npm run dev  # Nodemon watches for changes
    ```

2. **Testing**

    - Manual testing with Postman/Thunder Client
    - Unit tests (can be added with Jest)
    - Integration tests (can be added)

3. **Git Workflow**

    ```bash
    git checkout -b feature/new-feature
    # Make changes
    git commit -m "Add new feature"
    git push origin feature/new-feature
    # Create PR
    ```

4. **Deployment**
    - Push to main branch
    - Render auto-deploys
    - Check logs for errors

## 📚 Tech Stack Summary

| Layer               | Technology         | Purpose                        |
| ------------------- | ------------------ | ------------------------------ |
| **Runtime**         | Node.js            | JavaScript runtime             |
| **Framework**       | Express.js         | Web framework                  |
| **Database**        | MongoDB Atlas      | Cloud NoSQL database           |
| **ODM**             | Mongoose           | MongoDB object modeling        |
| **Auth**            | Firebase Admin SDK | Authentication & authorization |
| **Hosting**         | Render             | Cloud hosting platform         |
| **Version Control** | Git/GitHub         | Source control                 |

## 🎯 Best Practices Implemented

-   ✅ MVC architecture (Model-View-Controller)
-   ✅ RESTful API design
-   ✅ Async/await for async operations
-   ✅ Error handling with try-catch
-   ✅ Environment variables for config
-   ✅ Middleware for cross-cutting concerns
-   ✅ Consistent response format
-   ✅ Proper HTTP status codes
-   ✅ Code organization and separation of concerns
-   ✅ Git ignore for sensitive files
-   ✅ Documentation (README, API docs, deployment guide)

## 🔄 Future Improvements

1. **Features**

    - [ ] Email notifications
    - [ ] Payment integration (Stripe, PayPal)
    - [ ] Real-time chat with Socket.io
    - [ ] Image upload to Cloudinary
    - [ ] Advanced search filters
    - [ ] Hotel recommendations (ML)

2. **Technical**

    - [ ] Rate limiting
    - [ ] Request validation with express-validator
    - [ ] Unit & integration tests
    - [ ] API documentation with Swagger
    - [ ] CI/CD pipeline
    - [ ] Docker containerization
    - [ ] Microservices architecture
    - [ ] GraphQL API (alternative to REST)

3. **Performance**

    - [ ] Redis caching
    - [ ] Database query optimization
    - [ ] CDN for static assets
    - [ ] Load balancing
    - [ ] Database sharding

4. **Security**
    - [ ] Rate limiting per IP
    - [ ] Helmet.js for security headers
    - [ ] CSRF protection
    - [ ] SQL injection prevention (already handled by Mongoose)
    - [ ] XSS protection
    - [ ] Data encryption at rest

---

**Last Updated**: November 2024  
**Maintainer**: Your Name
