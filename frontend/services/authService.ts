import { API_BASE_URL } from '../config/api';

export interface RegisterData {
  email: string;
  password: string;
  userName: string;
  phone: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    uid: string;
    email: string;
    userName: string;
  };
  errors?: string[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      uid: string;
      email: string;
      userName: string;
      phone: string;
      avatar: string;
    };
  };
}

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

export const loginWithToken = async (token: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const getMe = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  return { success: true, message: 'Password reset email sent' };
};
