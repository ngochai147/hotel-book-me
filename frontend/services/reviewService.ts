import { API_BASE_URL } from '../config/api';

export interface Review {
  _id: string;
  userId: string | {
    _id: string;
    userName: string;
    email: string;
    avatar?: string;
  };
  hotelId: string | {
    _id: string;
    name: string;
    location: string;
    photos: string[];
  };
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data?: Review;
}

export interface ReviewListResponse {
  success: boolean;
  message?: string;
  data: Review[];
  count?: number;
}

/**
 * Get all reviews
 * @route GET /api/reviews
 * @access Public
 */
export const getAllReviews = async (): Promise<ReviewListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reviews');
    }

    return data;
  } catch (error: any) {
    console.error('Get all reviews error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch reviews',
      data: [],
    };
  }
};

/**
 * Get reviews by hotel ID
 * @route GET /api/reviews/hotel/:hotelId
 * @access Public
 */
export const getReviewsByHotelId = async (hotelId: string): Promise<ReviewListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/hotel/${hotelId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reviews');
    }

    return data;
  } catch (error: any) {
    console.error('Get reviews by hotel error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch hotel reviews',
      data: [],
    };
  }
};

/**
 * Get reviews by user ID
 * @route GET /api/reviews/user/:userId
 * @access Public
 */
export const getReviewsByUserId = async (userId: string): Promise<ReviewListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/user/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch reviews');
    }

    return data;
  } catch (error: any) {
    console.error('Get reviews by user error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch user reviews',
      data: [],
    };
  }
};

/**
 * Create new review (requires completed booking)
 * @route POST /api/reviews
 * @access Private
 */
export const createReview = async (
  token: string,
  hotelId: string,
  rating: number,
  comment: string
): Promise<ReviewResponse> => {
  try {
    console.log('CreateReview API call:', { url: `${API_BASE_URL}/reviews`, hotelId, rating });
    
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hotelId,
        rating,
        comment,
      }),
    });

    const data = await response.json();
    console.log('CreateReview API response:', { status: response.status, data });

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Server error: ${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    console.error('Create review error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
    };
  }
};

/**
 * Delete review (owner only)
 * @route DELETE /api/reviews/:id
 * @access Private
 */
export const deleteReview = async (
  token: string,
  reviewId: string
): Promise<ReviewResponse> => {
  try {
    // Validate inputs
    if (!token || token.trim() === '') {
      console.error('DeleteReview: No token provided');
      return {
        success: false,
        message: 'Authentication required. Please login again.',
      };
    }

    if (!reviewId || reviewId.trim() === '') {
      console.error('DeleteReview: No reviewId provided');
      return {
        success: false,
        message: 'Review ID is required',
      };
    }

    const url = `${API_BASE_URL}/reviews/${reviewId}`;
    console.log('DeleteReview API call:', { url, reviewId, tokenLength: token.length });
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('DeleteReview response status:', response.status);

    let data;
    try {
    
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      return {
        success: false,
        message: 'Invalid server response',
      };
    }

    console.log('DeleteReview API response:', { status: response.status, data });

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Server error: ${response.status}`,
      };
    }

    return data;
  } catch (error: any) {
    console.error('Delete review error:', error);
    return {
      success: false,
      message: error.message || 'Network error. Please check your connection.',
    };
  }
};

/**
 * Calculate average rating from reviews
 */
export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

/**
 * Get rating breakdown (5 stars, 4 stars, etc.)
 */
export const getRatingBreakdown = (reviews: Review[]): { stars: number; count: number; percentage: number }[] => {
  const breakdown = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter(r => Math.floor(r.rating) === stars).length;
    const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, percentage };
  });
  
  return breakdown;
};

/**
 * Format review date for display
 */
export const formatReviewDate = (date: Date | string): string => {
  const reviewDate = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  
  return reviewDate.toLocaleDateString();
};
