import { API_BASE_URL } from '../config/api';

export interface Hotel {
  _id: string;
  name: string;
  location: string;
  address?: string;
  price: number;
  rating: number;
  amenities: string[];
  photos: string[];
  description?: string;
  roomTypes?: RoomType[];
  reviews?: any[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomType {
  _id?: string;
  name: string;
  price: number;
  maxOccupancy: number;
  size: number;
  amenities: string[];
  photos?: string[];
}

export interface HotelResponse {
  success: boolean;
  message?: string;
  data?: Hotel;
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
}

export interface HotelListResponse {
  success: boolean;
  message?: string;
  data: Hotel[];
  count?: number;
  total?: number;
  page?: number;
  pages?: number;
}

/**
 * Get all hotels with filtering and pagination
 * @route GET /api/hotels
 * @access Public
 */
export const getAllHotels = async (params?: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string;
  page?: number;
  limit?: number;
}): Promise<HotelListResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.location) queryParams.append('location', params.location);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.rating) queryParams.append('rating', params.rating.toString());
    if (params?.amenities) queryParams.append('amenities', params.amenities);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const url = queryParams.toString() 
      ? `${API_BASE_URL}/hotels?${queryParams.toString()}`
      : `${API_BASE_URL}/hotels`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hotels');
    }

    return data;
  } catch (error: any) {
    console.error('Get all hotels error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch hotels',
      data: [],
    };
  }
};

/**
 * Get hotel by ID
 * @route GET /api/hotels/:id
 * @access Public
 */
export const getHotelById = async (hotelId: string): Promise<HotelResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hotels/${hotelId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch hotel');
    }

    return data;
  } catch (error: any) {
    console.error('Get hotel by ID error:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch hotel details',
    };
  }
};

/**
 * Search hotels by location
 * @route GET /api/hotels/search/:location
 * @access Public
 */
export const searchHotelsByLocation = async (location: string): Promise<HotelListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/hotels/search/${encodeURIComponent(location)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to search hotels');
    }

    return data;
  } catch (error: any) {
    console.error('Search hotels error:', error);
    return {
      success: false,
      message: error.message || 'Failed to search hotels',
      data: [],
    };
  }
};

/**
 * Get featured hotels (high rating, popular)
 */
export const getFeaturedHotels = async (): Promise<HotelListResponse> => {
  return getAllHotels({ rating: 4, limit: 10 });
};

/**
 * Get recommended hotels by location
 */
export const getRecommendedHotels = async (location: string): Promise<HotelListResponse> => {
  return getAllHotels({ location, rating: 4, limit: 5 });
};

/**
 * Get filtered hotels with multiple criteria
 */
export const getFilteredHotels = async (filters: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
}): Promise<HotelListResponse> => {
  const amenitiesString = filters.amenities?.join(',');
  
  return getAllHotels({
    location: filters.location,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    rating: filters.rating,
    amenities: amenitiesString,
  });
};

/**
 * Get hotels by price range
 */
export const getHotelsByPriceRange = async (
  minPrice: number,
  maxPrice: number
): Promise<HotelListResponse> => {
  return getAllHotels({ minPrice, maxPrice });
};

/**
 * Get hotels by rating
 */
export const getHotelsByRating = async (minRating: number): Promise<HotelListResponse> => {
  return getAllHotels({ rating: minRating });
};

/**
 * Get hotels with specific amenities
 */
export const getHotelsByAmenities = async (amenities: string[]): Promise<HotelListResponse> => {
  const amenitiesString = amenities.join(',');
  return getAllHotels({ amenities: amenitiesString });
};
