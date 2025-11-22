import { API_BASE_URL } from '../config/api';

export interface Booking {
  _id: string;
  bookingNumber: string;
  userId: string | {
    _id: string;
    userName: string;
    email: string;
    phone: string;
  };
  hotelId: string | {
    _id: string;
    name: string;
    location: string;
    photos: string[];
    rating: number;
  };
  status: 'upcoming' | 'completed' | 'cancelled';
  checkIn: Date | string;
  checkOut: Date | string;
  guests: number;
  roomType: string[];
  totalPrice: number;
  hotelName?: string;
  location?: string;
  image?: string;
  createdAt?: Date | string;
}

export interface CreateBookingData {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType: string[];
  totalPrice: number;
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  data?: Booking;
  count?: number;
  unavailableRooms?: any[];
}

export interface BookingListResponse {
  success: boolean;
  count: number;
  data: Booking[];
}

/**
 * Get all user's bookings with optional status filter
 * @route GET /api/bookings/my-bookings?status=upcoming
 * @access Private
 */
export const getMyBookings = async (token: string, status?: 'upcoming' | 'completed' | 'cancelled'): Promise<BookingListResponse> => {
  try {
    const url = status 
      ? `${API_BASE_URL}/bookings/my-bookings?status=${status}`
      : `${API_BASE_URL}/bookings/my-bookings`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bookings');
    }

    return data;
  } catch (error: any) {
    console.error('Get my bookings error:', error);
    return {
      success: false,
      count: 0,
      data: [],
    };
  }
};

/**
 * Get booking by ID
 * @route GET /api/bookings/:id
 * @access Private
 */
export const getBookingById = async (token: string, bookingId: string): Promise<BookingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch booking');
    }

    return data;
  } catch (error: any) {
    console.error('Get booking by ID error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch booking details',
    };
  }
};

/**
 * Create new booking
 * @route POST /api/bookings
 * @access Private
 */
export const createBooking = async (token: string, bookingData: CreateBookingData): Promise<BookingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create booking');
    }

    return data;
  } catch (error: any) {
    console.error('Create booking error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create booking',
    };
  }
};

/**
 * Update booking status
 * @route PUT /api/bookings/:id
 * @access Private (Owner only)
 */
export const updateBookingStatus = async (
  token: string, 
  bookingId: string, 
  status: 'upcoming' | 'completed' | 'cancelled'
): Promise<BookingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update booking');
    }

    return data;
  } catch (error: any) {
    console.error('Update booking error:', error);
    return {
      success: false,
      message: error.message || 'Failed to update booking',
    };
  }
};

/**
 * Cancel booking (soft delete - sets status to cancelled)
 * @route DELETE /api/bookings/:id
 * @access Private (Owner only)
 */
export const cancelBooking = async (token: string, bookingId: string): Promise<BookingResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel booking');
    }

    return data;
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    return {
      success: false,
      message: error.message || 'Failed to cancel booking',
    };
  }
};

/**
 * Get upcoming bookings count
 */
export const getUpcomingBookingsCount = async (token: string): Promise<number> => {
  try {
    const response = await getMyBookings(token, 'upcoming');
    return response.count || 0;
  } catch (error) {
    console.error('Get upcoming bookings count error:', error);
    return 0;
  }
};

/**
 * Check if user has completed booking at hotel (for review eligibility)
 */
export const hasCompletedBookingAtHotel = async (token: string, hotelId: string): Promise<boolean> => {
  try {
    const response = await getMyBookings(token, 'completed');
    if (response.success && response.data) {
      return response.data.some(booking => {
        const hotel = booking.hotelId;
        if (typeof hotel === 'string') {
          return hotel === hotelId;
        }
        return hotel._id === hotelId;
      });
    }
    return false;
  } catch (error) {
    console.error('Check completed booking error:', error);
    return false;
  }
};

// Special guest token for anonymous users to read bookings
const GUEST_TOKEN = 'guest_read_only_token_12345';

/**
 * Get all upcoming bookings for availability check
 * Fetches ALL bookings from all users to show accurate availability for everyone
 * Uses guest token if user not logged in (read-only access)
 */
export const getAllUpcomingBookings = async (): Promise<BookingListResponse> => {
  try {
    // Try to get current user token
    const { auth } = await import('../config/firebase');
    const currentUser = auth.currentUser;
    
    let token = GUEST_TOKEN; // Default to guest token
    
    if (currentUser) {
      try {
        token = await currentUser.getIdToken(); // Use real token if logged in
      } catch (e) {
        console.log('Could not get user token, using guest token:', e);
      }
    }

    // Get ALL bookings with either real token or guest token
    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.log('Could not fetch all bookings, using fallback');
      // If can't get all bookings, return empty (optimistic availability)
      return {
        success: true,
        count: 0,
        data: [],
      };
    }

    // Filter to only upcoming bookings
    const upcomingBookings = data.data?.filter((booking: any) => 
      booking.status === 'upcoming'
    ) || [];

    return {
      success: true,
      count: upcomingBookings.length,
      data: upcomingBookings,
    };
  } catch (error: any) {
    console.log('Get all upcoming bookings error:', error.message);
    // Return empty on error (optimistic availability)
    return {
      success: true,
      count: 0,
      data: [],
    };
  }
};
