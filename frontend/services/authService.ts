import { API_BASE_URL } from '../config/api';
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

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

export const sendPasswordResetEmail = async (email: string): Promise<{ success: boolean; message: string; error?: string }> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    return { 
      success: true, 
      message: 'Password reset email sent successfully. Please check your inbox.' 
    };
  } catch (error: any) {
    console.error('Password reset error:', error);
    
    let errorMessage = 'Failed to send password reset email. Please try again.';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address format.';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many reset attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection.';
        break;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      error: error.code 
    };
  }
};

export const verifyPasswordResetCode = async (code: string): Promise<{ success: boolean; email?: string; message?: string }> => {
  try {
    const { verifyPasswordResetCode } = await import('firebase/auth');
    const email = await verifyPasswordResetCode(auth, code);
    return { 
      success: true, 
      email 
    };
  } catch (error: any) {
    console.error('Verify reset code error:', error);
    
    let errorMessage = 'Invalid or expired reset code.';
    
    switch (error.code) {
      case 'auth/expired-action-code':
        errorMessage = 'Reset code has expired. Please request a new one.';
        break;
      case 'auth/invalid-action-code':
        errorMessage = 'Invalid reset code. Please request a new one.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Account not found.';
        break;
    }
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};

export const confirmPasswordReset = async (code: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
  try {
    const { confirmPasswordReset } = await import('firebase/auth');
    await confirmPasswordReset(auth, code, newPassword);
    return { 
      success: true, 
      message: 'Password has been reset successfully!' 
    };
  } catch (error: any) {
    console.error('Confirm password reset error:', error);
    
    let errorMessage = 'Failed to reset password. Please try again.';
    
    switch (error.code) {
      case 'auth/expired-action-code':
        errorMessage = 'Reset code has expired. Please request a new one.';
        break;
      case 'auth/invalid-action-code':
        errorMessage = 'Invalid reset code. Please request a new one.';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password is too weak. Please use a stronger password.';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'Account not found.';
        break;
    }
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};
