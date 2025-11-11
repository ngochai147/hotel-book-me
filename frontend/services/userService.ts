import { API_BASE_URL } from '../config/api';

export interface User {
  _id: string;
  uid: string;
  email: string;
  userName: string;
  displayName?: string;
  phone: string;
  avatar: string;
  favorites: any[];
}

export interface UserResponse {
  success: boolean;
  message?: string;
  data?: User;
}

/**
 * Get user by ID
 */
export const getUserById = async (userId: string, token?: string): Promise<UserResponse> => {
  try {
    const headers: any = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'GET',
      headers,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUser = async (
  userId: string,
  data: { userName?: string; phone?: string; avatar?: string },
  token: string
): Promise<UserResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};

/**
 * Get user favorites
 * GET /api/users/:id/favorites
 */
export const getUserFavorites = async (userId: string, token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get favorites error:', error);
    throw error;
  }
};

/**
 * Toggle hotel favorite status (add or remove)
 * If hotel is in favorites, it will be removed; if not, it will be added
 */
export const toggleFavorite = async (userId: string, hotelId: string, token: string, isCurrentlyFavorite: boolean) => {
  try {
    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
    const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites/${hotelId}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Toggle favorite error:', error);
    throw error;
  }
};

/**
 * Add hotel to favorites
 */
export const addToFavorites = async (userId: string, hotelId: string, token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites/${hotelId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Add to favorites error:', error);
    throw error;
  }
};

/**
 * Remove hotel from favorites
 */
export const removeFromFavorites = async (userId: string, hotelId: string, token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites/${hotelId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Remove from favorites error:', error);
    throw error;
  }
};
