/**
 * API Documentation - Hotel Booking System
 *
 * Base URL: http://localhost:8080 (development)
 * Production URL: https://your-app.onrender.com
 *
 * All protected routes require Firebase Authentication Token in headers:
 * Authorization: Bearer <firebase-id-token>
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

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (mainly client-side, token revocation)
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
 *   "message": "Logout successful"
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

// ============================================
// BOOKING ENDPOINTS
// ============================================

/**
 * @route   GET /api/bookings
 * @desc    Get all bookings (Admin only)
 * @access  Private/Admin
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 50,
 *   "data": [
 *     {
 *       "_id": "booking-id",
 *       "bookingNumber": "BK1731234567890",
 *       "userId": {
 *         "_id": "user-id",
 *         "userName": "John Doe",
 *         "email": "user@example.com",
 *         "phone": "0123456789"
 *       },
 *       "hotelId": "hotel-id",
 *       "status": "upcoming",
 *       "checkIn": "2024-12-20T00:00:00.000Z",
 *       "checkOut": "2024-12-25T00:00:00.000Z",
 *       "guests": 2,
 *       "roomType": ["Deluxe Room"],
 *       "totalPrice": 1000,
 *       "createdAt": "2024-11-10T10:00:00.000Z"
 *     }
 *   ]
 * }
 */

/**
 * @route   GET /api/bookings/my-bookings
 * @desc    Get user's bookings (with optional status filter)
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @query
 * - status: string (optional) - Filter by "upcoming", "completed", or "cancelled"
 *
 * @example GET /api/bookings/my-bookings
 * @example GET /api/bookings/my-bookings?status=upcoming
 * @example GET /api/bookings/my-bookings?status=completed
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "_id": "booking-id",
 *       "bookingNumber": "BK1731234567890",
 *       "status": "upcoming",
 *       "hotelId": {
 *         "_id": "hotel-id",
 *         "name": "Grand Hotel",
 *         "location": "Hanoi",
 *         "photos": ["url"],
 *         "rating": 4.5
 *       },
 *       "roomType": ["Deluxe Room"],
 *       "checkIn": "2024-12-20T00:00:00.000Z",
 *       "checkOut": "2024-12-25T00:00:00.000Z",
 *       "guests": 2,
 *       "totalPrice": 1000
 *     }
 *   ]
 * }
 *
 * @response 400 Invalid Status
 * {
 *   "success": false,
 *   "message": "Invalid status. Valid statuses are: upcoming, completed, cancelled"
 * }
 */

/**
 * @route   POST /api/bookings
 * @desc    Create new booking with room availability check
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "hotelId": "507f191e810c19729de860ea",
 *   "checkIn": "2024-12-20",
 *   "checkOut": "2024-12-25",
 *   "guests": 2,
 *   "roomType": ["Deluxe Room", "Standard Room"],
 *   "totalPrice": 1000
 * }
 *
 * @businessRules
 * - User must be authenticated
 * - checkIn date cannot be in the past
 * - checkOut date must be after checkIn date
 * - roomType must be a non-empty array
 * - Each roomType must exist in hotel.roomTypes[].name
 * - Each roomType must be available (not booked by UPCOMING bookings) for the selected dates
 * - Completed and cancelled bookings do NOT block availability
 * - Date comparison ignores time component (only compares dates)
 * - Status will be set to "upcoming" automatically
 * - Booking number is auto-generated: "BK" + timestamp + random
 *
 * @response 201 Success
 * {
 *   "success": true,
 *   "message": "Booking created successfully",
 *   "data": {
 *     "bookingNumber": "BK1731234567890123",
 *     "status": "upcoming",
 *     "userId": "user-id",
 *     "hotelId": "hotel-id",
 *     "hotelName": "Grand Hotel",
 *     "location": "Hanoi",
 *     "roomType": ["Deluxe Room", "Standard Room"],
 *     "checkIn": "2024-12-20T00:00:00.000Z",
 *     "checkOut": "2024-12-25T00:00:00.000Z",
 *     "guests": 2,
 *     "totalPrice": 1000,
 *     "image": "hotel-photo-url",
 *     "createdAt": "2024-11-10T10:00:00.000Z"
 *   }
 * }
 *
 * @response 400 Past Check-in Date
 * {
 *   "success": false,
 *   "message": "Check-in date cannot be in the past"
 * }
 *
 * @response 400 Invalid Date Range
 * {
 *   "success": false,
 *   "message": "Check-out date must be after check-in date"
 * }
 *
 * @response 400 Room Not Available
 * {
 *   "success": false,
 *   "message": "Some room types are not available for the selected dates.",
 *   "unavailableRooms": [
 *     {
 *       "roomType": "Deluxe Room",
 *       "conflicts": [
 *         {
 *           "bookingNumber": "BK1731234567890",
 *           "checkIn": "2024-12-18T00:00:00.000Z",
 *           "checkOut": "2024-12-22T00:00:00.000Z",
 *           "status": "upcoming"
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * @response 400 Invalid Room Type
 * {
 *   "success": false,
 *   "message": "The following room types are not available in this hotel: Premium Suite"
 * }
 *
 * @response 404 Hotel Not Found
 * {
 *   "success": false,
 *   "message": "Hotel not found"
 * }
 */

/**
 * @route   PUT /api/bookings/:id
 * @desc    Update booking status
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "status": "completed"
 * }
 *
 * @businessRules
 * - Only booking owner can update
 * - Status must be one of: "upcoming", "completed", "cancelled"
 * - Cannot modify a cancelled booking
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Booking updated successfully",
 *   "data": {
 *     "_id": "booking-id",
 *     "bookingNumber": "BK1731234567890",
 *     "status": "completed",
 *     ...
 *   }
 * }
 *
 * @response 400 Invalid Status
 * {
 *   "success": false,
 *   "message": "Invalid status. Must be one of: upcoming, completed, cancelled"
 * }
 *
 * @response 400 Cancelled Booking
 * {
 *   "success": false,
 *   "message": "Cannot modify a cancelled booking"
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to update this booking"
 * }
 */

/**
 * @route   GET /api/bookings/:id
 * @desc    Get booking by ID
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
 *     "_id": "booking-id",
 *     "bookingNumber": "BK1731234567890",
 *     "status": "upcoming",
 *     "userId": "user-id",
 *     "hotelId": "hotel-id",
 *     "roomTypes": ["Deluxe Room", "Standard Room"],
 *     "checkIn": "2024-12-20T00:00:00.000Z",
 *     "checkOut": "2024-12-25T00:00:00.000Z",
 *     "guests": 2,
 *     "totalPrice": 1000
 *   }
 * }
 */

/**
 * @route   DELETE /api/bookings/:id
 * @desc    Cancel booking (set status to "cancelled")
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - Only the booking owner can cancel
 * - Booking is NOT deleted from database
 * - Status is changed to "cancelled"
 * - Keeps booking history for records
 * - Cancelled bookings do NOT block room availability
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Booking cancelled successfully",
 *   "data": {
 *     "_id": "booking-id",
 *     "bookingNumber": "BK1731234567890",
 *     "status": "cancelled",
 *     "hotelId": "hotel-id",
 *     "checkIn": "2024-12-20T00:00:00.000Z",
 *     "checkOut": "2024-12-25T00:00:00.000Z"
 *   }
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to cancel this booking"
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "Booking not found"
 * }
 */

// ============================================
// REVIEW ENDPOINTS
// ============================================

/**
 * @route   GET /api/reviews
 * @desc    Get all reviews (all hotels)
 * @access  Public
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 50,
 *   "data": [
 *     {
 *       "_id": "review-id",
 *       "rating": 5,
 *       "comment": "Excellent hotel!",
 *       "userId": {
 *         "_id": "user-id",
 *         "userName": "John Doe",
 *         "avatar": "url"
 *       },
 *       "hotelId": {
 *         "_id": "hotel-id",
 *         "name": "Grand Hotel",
 *         "location": "Hanoi"
 *       },
 *       "createdAt": "2024-11-10T10:00:00.000Z"
 *     }
 *   ]
 * }
 */

/**
 * @route   GET /api/reviews/hotel/:hotelId
 * @desc    Get reviews by hotel ID
 * @access  Public
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 5,
 *   "data": [
 *     {
 *       "_id": "review-id",
 *       "rating": 5,
 *       "comment": "Great experience!",
 *       "userId": {
 *         "_id": "user-id",
 *         "userName": "John Doe",
 *         "avatar": "url"
 *       },
 *       "hotelId": "hotel-id",
 *       "createdAt": "2024-11-10T10:00:00.000Z"
 *     }
 *   ]
 * }
 */

/**
 * @route   GET /api/reviews/user/:userId
 * @desc    Get reviews by user ID
 * @access  Public
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "_id": "review-id",
 *       "rating": 4,
 *       "comment": "Nice hotel",
 *       "userId": "user-id",
 *       "hotelId": {
 *         "_id": "hotel-id",
 *         "name": "Grand Hotel",
 *         "location": "Hanoi",
 *         "photos": ["url"]
 *       },
 *       "createdAt": "2024-11-10T10:00:00.000Z"
 *     }
 *   ]
 * }
 */

/**
 * @route   POST /api/reviews
 * @desc    Create new review (only for completed bookings)
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "hotelId": "507f191e810c19729de860ea",
 *   "rating": 5,
 *   "comment": "Great hotel! Excellent service and clean rooms."
 * }
 *
 * @businessRules
 * - User must be authenticated
 * - User must have at least ONE COMPLETED booking at this hotel
 * - User CAN write multiple reviews (duplicate check is commented out)
 * - Rating must be between 1 and 5
 * - Review is automatically embedded in hotel.reviews array
 * - Only 5 latest reviews are kept in hotel.reviews array
 * - Hotel's average rating is recalculated from ALL reviews in Review collection
 *
 * @response 201 Success
 * {
 *   "success": true,
 *   "message": "Review created successfully",
 *   "data": {
 *     "_id": "review-id",
 *     "userId": {
 *       "_id": "user-id",
 *       "userName": "John Doe",
 *       "avatar": "url"
 *     },
 *     "hotelId": "hotel-id",
 *     "rating": 5,
 *     "comment": "Great hotel!",
 *     "createdAt": "2024-11-10T10:00:00.000Z"
 *   }
 * }
 *
 * @response 403 No Completed Booking
 * {
 *   "success": false,
 *   "message": "You can only review hotels where you have a completed booking"
 * }
 *
 * @response 400 Invalid Rating
 * {
 *   "success": false,
 *   "message": "Rating must be between 1 and 5"
 * }
 *
 * @response 400 Missing Required Fields
 * {
 *   "success": false,
 *   "message": "Hotel ID and rating are required"
 * }
 *
 * @response 404 Hotel Not Found
 * {
 *   "success": false,
 *   "message": "Hotel not found"
 * }
 */

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete review
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - Only the review owner can delete
 * - Review is permanently removed from Review collection
 * - Review is removed from hotel.reviews array (if present)
 * - Hotel's average rating is recalculated from remaining reviews
 * - If no reviews remain, hotel rating is set to 0
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Review deleted successfully"
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to delete this review"
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "Review not found"
 * }
 */

// ============================================
// USER ENDPOINTS
// ============================================

/**
 * @route   GET /api/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 50,
 *   "data": [
 *     {
 *       "_id": "user-id",
 *       "uid": "firebase-uid",
 *       "userName": "John Doe",
 *       "email": "user@example.com",
 *       "phone": "0123456789",
 *       "avatar": "url",
 *       "favorites": ["hotel-id-1", "hotel-id-2"]
 *     }
 *   ]
 * }
 */

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
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
 *     "_id": "user-id",
 *     "uid": "firebase-uid",
 *     "userName": "John Doe",
 *     "email": "user@example.com",
 *     "phone": "0123456789",
 *     "avatar": "url",
 *     "favorites": [
 *       {
 *         "_id": "hotel-id",
 *         "name": "Grand Hotel",
 *         "location": "Hanoi",
 *         "photos": ["url"],
 *         "price": 150,
 *         "rating": 4.5
 *       }
 *     ]
 *   }
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 */

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @body
 * {
 *   "userName": "New Name",
 *   "phone": "0987654321",
 *   "avatar": "new-avatar-url"
 * }
 *
 * @businessRules
 * - User can only update their own profile
 * - Only userName, phone, and avatar can be updated
 * - Email and uid cannot be changed
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "User updated successfully",
 *   "data": {
 *     "_id": "user-id",
 *     "userName": "New Name",
 *     "phone": "0987654321",
 *     "avatar": "new-avatar-url",
 *     ...
 *   }
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to update this profile"
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 */

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user account
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - User can only delete their own account
 * - Account is permanently removed
 * - Related bookings and reviews remain in database
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "User deleted successfully"
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to delete this account"
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 */

/**
 * @route   GET /api/users/:id/favorites
 * @desc    Get user's favorite hotels (populated with full hotel details)
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - Returns full hotel details (populated)
 * - Shows name, location, photos, price, rating, amenities
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "_id": "hotel-id-1",
 *       "name": "Grand Hotel",
 *       "location": "Hanoi",
 *       "photos": ["url1", "url2"],
 *       "price": 200,
 *       "rating": 4.5,
 *       "amenities": ["WiFi", "Pool", "Gym"]
 *     },
 *     {
 *       "_id": "hotel-id-2",
 *       "name": "Beach Resort",
 *       "location": "Da Nang",
 *       "photos": ["url"],
 *       "price": 250,
 *       "rating": 4.8,
 *       "amenities": ["WiFi", "Pool", "Beach Access"]
 *     }
 *   ]
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 */

/**
 * @route   POST /api/users/:id/favorites/:hotelId
 * @desc    Add hotel to favorites
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - User can only add to their own favorites
 * - Hotel must exist in database
 * - Duplicate prevention - returns error if already in favorites
 * - Returns populated favorites list after adding
 *
 * @response 200 Success
 * {
 *   "success": true,
 *   "message": "Hotel added to favorites",
 *   "data": [
 *     {
 *       "_id": "hotel-id-1",
 *       "name": "Grand Hotel",
 *       "location": "Hanoi",
 *       "photos": ["url"],
 *       "price": 150,
 *       "rating": 4.5
 *     },
 *     {
 *       "_id": "hotel-id-2",
 *       "name": "Beach Resort",
 *       "location": "Da Nang",
 *       "photos": ["url"],
 *       "price": 200,
 *       "rating": 4.8
 *     }
 *   ]
 * }
 *
 * @response 400 Already in Favorites
 * {
 *   "success": false,
 *   "message": "Hotel already in favorites"
 * }
 *
 * @response 404 User Not Found
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to update favorites"
 * }
 */

/**
 * @route   DELETE /api/users/:id/favorites/:hotelId
 * @desc    Remove hotel from favorites
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - User can only remove from their own favorites
 * - Returns populated favorites list after removal
 * - No error if hotel was not in favorites
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Hotel removed from favorites",
 *   "data": [
 *     {
 *       "_id": "hotel-id-1",
 *       "name": "Grand Hotel",
 *       "location": "Hanoi",
 *       "photos": ["url"],
 *       "price": 150,
 *       "rating": 4.5
 *     }
 *   ]
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "User not found"
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to update favorites"
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

// ============================================
// TESTING WORKFLOWS
// ============================================

/**
 * WORKFLOW 1: Complete Booking Flow
 * ================================
 *
 * 1. Register/Login User
 *    POST /api/auth/register or POST /api/auth/login
 *    -> Get token
 *
 * 2. Browse Hotels
 *    GET /api/hotels?location=hanoi&rating=4
 *    -> Get hotel list with IDs
 *
 * 3. View Hotel Details
 *    GET /api/hotels/:hotelId
 *    -> Check roomTypes and availability
 *
 * 4. Create Booking
 *    POST /api/bookings
 *    Body: {
 *      hotelId, roomTypes: ["Deluxe Room"], checkIn, checkOut, guests, totalPrice
 *    }
 *    -> Status: "upcoming", Get bookingNumber
 *
 * 5. View My Bookings
 *    GET /api/bookings/my-bookings?status=upcoming
 *    -> See all upcoming bookings
 *
 * 6. Cancel Booking (if needed)
 *    DELETE /api/bookings/:bookingId
 *    -> Status changes to "cancelled"
 */

/**
 * WORKFLOW 2: Review After Completed Stay
 * ========================================
 *
 * 1. Complete Booking
 *    - Booking status must be "completed" (set by admin/system)
 *    - User stayed at the hotel
 *
 * 2. Check Completed Bookings
 *    GET /api/bookings/my-bookings?status=completed
 *    -> Get hotels where review is allowed
 *
 * 3. Create Review
 *    POST /api/reviews
 *    Body: {
 *      hotelId: "hotel-id-from-completed-booking",
 *      rating: 5,
 *      comment: "Great experience!"
 *    }
 *    -> Review created and added to hotel
 *
 * 4. View Hotel Reviews
 *    GET /api/reviews/hotel/:hotelId
 *    -> See all reviews including yours
 *
 * 5. Delete Review (if needed)
 *    DELETE /api/reviews/:reviewId
 *    -> Review removed from hotel
 */

/**
 * WORKFLOW 3: Favorites Management
 * =================================
 *
 * 1. Login User
 *    POST /api/auth/login
 *    -> Get userId and token
 *
 * 2. Browse Hotels
 *    GET /api/hotels
 *    -> Find interesting hotels
 *
 * 3. Add to Favorites
 *    POST /api/users/:userId/favorites/:hotelId
 *    -> Hotel added to favorites list
 *
 * 4. View Favorites
 *    GET /api/users/:userId/favorites
 *    -> Get full details of favorite hotels
 *
 * 5. Remove from Favorites
 *    DELETE /api/users/:userId/favorites/:hotelId
 *    -> Hotel removed from list
 */

/**
 * WORKFLOW 4: Room Availability Testing
 * ======================================
 *
 * Scenario: Test overlapping bookings
 *
 * 1. Create First Booking
 *    POST /api/bookings
 *    Body: {
 *      hotelId: "hotel123",
 *      roomTypes: ["Deluxe Room"],
 *      checkIn: "2024-12-20",
 *      checkOut: "2024-12-25",
 *      guests: 2,
 *      totalPrice: 1000
 *    }
 *    -> Success, status: "upcoming"
 *
 * 2. Try Overlapping Booking (Same Room Type)
 *    POST /api/bookings
 *    Body: {
 *      hotelId: "hotel123",
 *      roomTypes: ["Deluxe Room"],
 *      checkIn: "2024-12-22", // Overlaps with first booking
 *      checkOut: "2024-12-27",
 *      guests: 2,
 *      totalPrice: 1000
 *    }
 *    -> FAIL: Error 400 - Room not available
 *    -> Returns conflicting booking details
 *
 * 3. Book Different Room Type (Should Succeed)
 *    POST /api/bookings
 *    Body: {
 *      hotelId: "hotel123",
 *      roomTypes: ["Standard Room"], // Different room type
 *      checkIn: "2024-12-22",
 *      checkOut: "2024-12-27",
 *      guests: 2,
 *      totalPrice: 800
 *    }
 *    -> Success, different room type available
 *
 * 4. Book Multiple Room Types
 *    POST /api/bookings
 *    Body: {
 *      hotelId: "hotel123",
 *      roomTypes: ["Suite", "Standard Room"], // Multiple rooms
 *      checkIn: "2024-12-28",
 *      checkOut: "2025-01-02",
 *      guests: 4,
 *      totalPrice: 2000
 *    }
 *    -> Success if all room types are available
 */

/**
 * KEY BUSINESS RULES SUMMARY
 * ==========================
 *
 * BOOKINGS:
 * - Status flow: "upcoming" -> "completed" or "cancelled"
 * - Room availability checked per room type
 * - Only UPCOMING bookings block room availability
 * - Completed and cancelled bookings do NOT block rooms
 * - Date comparison ignores time component (normalized to 00:00:00)
 * - Overlapping dates block same room type
 * - Can book multiple room types in one booking
 * - Cancellation keeps booking record (soft delete)
 *
 * REVIEWS:
 * - Requires at least one completed booking at hotel
 * - Multiple reviews per user per hotel allowed (duplicate check commented out)
 * - Rating: 1-5 stars (required)
 * - Comment is optional
 * - Auto-updates hotel average rating from all reviews
 * - Max 5 latest reviews embedded in hotel.reviews array
 * - Full review history stored in Review collection
 *
 * FAVORITES:
 * - User can add/remove any hotel
 * - Duplicate prevention (error if already in favorites)
 * - Returns populated hotel details (name, location, photos, price, rating, amenities)
 * - User can only manage their own favorites
 * - GET /api/users/:id/favorites returns full hotel objects
 * - POST/DELETE return updated favorites list
 *
 * AUTHENTICATION:
 * - Firebase Auth required for all private routes
 * - Token passed in Authorization header
 * - Ownership validation for user-specific actions
 */
