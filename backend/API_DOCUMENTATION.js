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
 *   "roomTypes": ["Deluxe Room", "Standard Room"],
 *   "totalPrice": 1000
 * }
 *
 * @businessRules
 * - User must be authenticated
 * - checkIn date must be before checkOut date
 * - roomTypes must be a non-empty array
 * - Each roomType must exist in hotel.roomTypes[].name
 * - Each roomType must be available (not booked) for the selected dates
 * - Status will be set to "upcoming" automatically
 * - Booking number is auto-generated: "BK" + timestamp
 *
 * @response 201 Success
 * {
 *   "success": true,
 *   "message": "Booking created successfully",
 *   "data": {
 *     "bookingNumber": "BK1731234567890",
 *     "status": "upcoming",
 *     "userId": "user-id",
 *     "hotelId": "hotel-id",
 *     "roomTypes": ["Deluxe Room", "Standard Room"],
 *     "checkIn": "2024-12-20T00:00:00.000Z",
 *     "checkOut": "2024-12-25T00:00:00.000Z",
 *     "guests": 2,
 *     "totalPrice": 1000,
 *     "createdAt": "2024-11-10T10:00:00.000Z"
 *   }
 * }
 *
 * @response 400 Room Not Available
 * {
 *   "success": false,
 *   "message": "Some room types are not available for the selected dates",
 *   "unavailableRooms": [
 *     {
 *       "roomType": "Deluxe Room",
 *       "conflictingBookings": [
 *         {
 *           "bookingNumber": "BK1731234567890",
 *           "checkIn": "2024-12-18T00:00:00.000Z",
 *           "checkOut": "2024-12-22T00:00:00.000Z"
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * @response 400 Invalid Room Type
 * {
 *   "success": false,
 *   "message": "Room type 'Deluxe Room' does not exist in this hotel"
 * }
 */

/**
 * @route   GET /api/bookings/my-bookings?status=upcoming
 * @desc    Get user's bookings filtered by status
 * @access  Private
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @query
 * - status: string (optional) - Filter by status: "upcoming", "completed", "cancelled"
 *
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
 *       "userId": "user-id",
 *       "hotelId": {
 *         "_id": "hotel-id",
 *         "name": "Hotel Name",
 *         "location": "Hanoi",
 *         "photos": ["url"]
 *       },
 *       "roomTypes": ["Deluxe Room"],
 *       "checkIn": "2024-12-20T00:00:00.000Z",
 *       "checkOut": "2024-12-25T00:00:00.000Z",
 *       "guests": 2,
 *       "totalPrice": 1000
 *     }
 *   ]
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
 * - Booking is not deleted, status is changed to "cancelled"
 * - Keeps booking history for records
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Booking cancelled successfully",
 *   "data": {
 *     "_id": "booking-id",
 *     "bookingNumber": "BK1731234567890",
 *     "status": "cancelled",
 *     ...
 *   }
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to cancel this booking"
 * }
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
 * - User must have a COMPLETED booking at this hotel
 * - Only one review per user per hotel
 * - Rating must be between 1 and 5
 * - Review is automatically embedded in hotel.reviews (max 5 latest)
 * - Hotel's average rating is recalculated
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
 * @response 400 No Completed Booking
 * {
 *   "success": false,
 *   "message": "You can only review hotels where you have a completed booking"
 * }
 *
 * @response 400 Duplicate Review
 * {
 *   "success": false,
 *   "message": "You have already reviewed this hotel"
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
 * - Review is removed from Review collection
 * - Review is removed from hotel.reviews (if present)
 * - Hotel's average rating is recalculated
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
 * @desc    Get user's favorite hotels (populated with full hotel details)
 * @access  Private (Owner only)
 *
 * @headers
 * {
 *   "Authorization": "Bearer firebase-id-token"
 * }
 *
 * @businessRules
 * - User can only access their own favorites
 * - Returns full hotel details (populated)
 *
 * @response 200
 * {
 *   "success": true,
 *   "count": 3,
 *   "data": [
 *     {
 *       "_id": "hotel-id-1",
 *       "name": "Hotel Name 1",
 *       "location": "Hanoi",
 *       "address": "123 Street",
 *       "price": 200,
 *       "rating": 4.5,
 *       "amenities": ["WiFi", "Pool"],
 *       "photos": ["url1", "url2"],
 *       "roomTypes": [...]
 *     },
 *     {
 *       "_id": "hotel-id-2",
 *       "name": "Hotel Name 2",
 *       ...
 *     }
 *   ]
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to access this resource"
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
 * - Hotel must exist
 * - Duplicate prevention - won't add if already in favorites
 *
 * @response 200 Success
 * {
 *   "success": true,
 *   "message": "Hotel added to favorites",
 *   "data": [
 *     "hotel-id-1",
 *     "hotel-id-2",
 *     "hotel-id-3"
 *   ]
 * }
 *
 * @response 400 Already in Favorites
 * {
 *   "success": false,
 *   "message": "Hotel is already in your favorites"
 * }
 *
 * @response 404
 * {
 *   "success": false,
 *   "message": "Hotel not found"
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to access this resource"
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
 * - Returns updated favorites list after removal
 *
 * @response 200
 * {
 *   "success": true,
 *   "message": "Hotel removed from favorites",
 *   "data": [
 *     "hotel-id-1",
 *     "hotel-id-2"
 *   ]
 * }
 *
 * @response 403
 * {
 *   "success": false,
 *   "message": "Not authorized to access this resource"
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
 * - Overlapping dates block same room type
 * - Can book multiple room types in one booking
 * - Cancellation keeps booking record
 *
 * REVIEWS:
 * - Requires completed booking at hotel
 * - One review per user per hotel
 * - Rating: 1-5 stars
 * - Auto-updates hotel average rating
 * - Max 5 latest reviews embedded in hotel
 *
 * FAVORITES:
 * - User can add/remove any hotel
 * - Duplicate prevention
 * - Returns populated hotel details
 * - Only owner can manage their favorites
 *
 * AUTHENTICATION:
 * - Firebase Auth required for all private routes
 * - Token passed in Authorization header
 * - Ownership validation for user-specific actions
 */
