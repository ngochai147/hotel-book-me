/**
 * API Documentation
 *
 * Base URL: http://localhost:8080 (development)
 * Production URL: https://your-app.onrender.com
 */

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 *
 * @body
 * {
 *   "email": "user@example.com",
 *   "password": "password123",
 *   "userName": "John Doe",
 *   "phone": "0123456789"
 * }
 *
 * @response 201
 * {
 *   "success": true,
 *   "message": "User created successfully",
 *   "data": {
 *     "uid": "firebase-uid",
 *     "email": "user@example.com",
 *     "userName": "John Doe"
 *   }
 * }
 */

/**
 * @route   POST /api/auth/login
 * @desc    Login user / Verify Firebase token
 * @access  Public
 *
 * @body
 * {
 *   "token": "firebase-id-token"
 * }
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": {
 *       "uid": "firebase-uid",
 *       "email": "user@example.com",
 *       "userName": "John Doe",
 *       "phone": "0123456789",
 *       "avatar": "url"
 *     }
 *   }
 * }
 */

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @response 200
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "mongodb-id",
 *     "uid": "firebase-uid",
 *     "email": "user@example.com",
 *     "userName": "John Doe",
 *     "phone": "0123456789",
 *     "avatar": "url",
 *     "favorites": []
 *   }
 * }
 */

// ============================================
// HOTEL ENDPOINTS
// ============================================

/**
 * @route   GET /api/hotels
 * @desc    Get all hotels with filtering and pagination
 * @access  Public
 *
 * @query
 * - location: string (search by location)
 * - minPrice: number
 * - maxPrice: number
 * - rating: number (minimum rating)
 * - amenities: string (comma-separated)
 * - page: number (default: 1)
 * - limit: number (default: 10)
 *
 * @example GET /api/hotels?location=hanoi&minPrice=100&maxPrice=500&rating=4&page=1&limit=10
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 10,
 *   "total": 45,
 *   "page": 1,
 *   "pages": 5,
 *   "data": [...]
 * }
 */

/**
 * @route   GET /api/hotels/:id
 * @desc    Get single hotel by ID
 * @access  Public
 *
 * @response 200
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "hotel-id",
 *     "name": "Hotel Name",
 *     "location": "Hanoi",
 *     "address": "123 Street",
 *     "price": 200,
 *     "rating": 4.5,
 *     "amenities": ["WiFi", "Pool"],
 *     "photos": ["url1", "url2"],
 *     "roomTypes": [...],
 *     "reviews": [...]
 *   }
 * }
 */

/**
 * @route   GET /api/hotels/search/:location
 * @desc    Search hotels by location
 * @access  Public
 *
 * @example GET /api/hotels/search/hanoi
 */

/**
 * @route   POST /api/hotels
 * @desc    Create new hotel (Admin)
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "name": "Hotel Name",
 *   "location": "Hanoi",
 *   "address": "123 Street",
 *   "price": 200,
 *   "amenities": ["WiFi", "Pool"],
 *   "photos": ["url1", "url2"],
 *   ...
 * }
 */

// ============================================
// BOOKING ENDPOINTS
// ============================================

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get user's bookings
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [...]
 * }
 */

/**
 * @route   POST /api/bookings
 * @desc    Create new booking
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "hotelId": 1,
 *   "checkIn": "2024-12-20",
 *   "checkOut": "2024-12-25",
 *   "guests": 2,
 *   "roomType": "Deluxe",
 *   "totalPrice": 1000
 * }
 *
 * @response 201
 * {
 *   "success": true,
 *   "message": "Booking created successfully",
 *   "data": {
 *     "bookingNumber": "BK1234567890",
 *     "status": "pending",
 *     ...
 *   }
 * }
 */

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking status
 * @access  Private
 *
 * @body
 * {
 *   "status": "confirmed" // pending | confirmed | cancelled | completed
 * }
 */

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel booking
 * @access  Private
 */

// ============================================
// REVIEW ENDPOINTS
// ============================================

/**
 * @route   GET /api/reviews/hotel/:hotelId
 * @desc    Get reviews by hotel
 * @access  Public
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 5,
 *   "data": [...]
 * }
 */

/**
 * @route   POST /api/reviews
 * @desc    Create new review
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "hotelId": "hotel-mongodb-id",
 *   "rating": 5,
 *   "comment": "Great hotel!"
 * }
 *
 * @response 201
 * {
 *   "success": true,
 *   "message": "Review created successfully",
 *   "data": {...}
 * }
 */

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update review
 * @access  Private (Owner only)
 *
 * @body
 * {
 *   "rating": 4,
 *   "comment": "Updated comment"
 * }
 */

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private (Owner only)
 */

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private
 *
 * @response 200
 * {
 *   "success": true,
 *   "data": {
 *     "_id": "user-id",
 *     "userName": "John Doe",
 *     "email": "user@example.com",
 *     "phone": "0123456789",
 *     "favorites": [...]
 *   }
 * }
 */

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Owner only)
 *
 * @body
 * {
 *   "userName": "New Name",
 *   "phone": "0987654321",
 *   "avatar": "new-url"
 * }
 */

/**
 * @route   GET /api/users/:id/favorites
 * @desc    Get user's favorite hotels
 * @access  Private
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [...]
 * }
 */

/**
 * @route   POST /api/users/:id/favorites/:hotelId
 * @desc    Add hotel to favorites
 * @access  Private (Owner only)
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Hotel added to favorites",
 *   "data": [...]
 * }
 */

/**
 * @route   DELETE /api/users/:id/favorites/:hotelId
 * @desc    Remove hotel from favorites
 * @access  Private (Owner only)
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Hotel removed from favorites",
 *   "data": [...]
 * }
 */

// ============================================
// ERROR RESPONSES
// ============================================

/**
 * @error 400 Bad Request
 * {
 *   "success": false,
 *   "message": "Error message",
 *   "errors": ["validation error 1", "validation error 2"]
 * }
 */

/**
 * @error 401 Unauthorized
 * {
 *   "success": false,
 *   "message": "No token provided. Authorization denied"
 * }
 */

/**
 * @error 403 Forbidden
 * {
 *   "success": false,
 *   "message": "Not authorized to access this resource"
 * }
 */

/**
 * @error 404 Not Found
 * {
 *   "success": false,
 *   "message": "Resource not found"
 * }
 */

/**
 * @error 500 Internal Server Error
 * {
 *   "success": false,
 *   "message": "Server error"
 * }
 */
