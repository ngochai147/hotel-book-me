// Validation utilities for frontend forms

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  password?: boolean;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class Validator {
  private errors: ValidationError[] = [];

  // Validate a single field
  validateField(fieldName: string, value: any, rules: ValidationRule): boolean {
    this.errors = this.errors.filter(e => e.field !== fieldName);

    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      this.errors.push({
        field: fieldName,
        message: rules.message || `${fieldName} is required`,
      });
      return false;
    }

    // Skip other validations if value is empty and not required
    if (!value && !rules.required) {
      return true;
    }

    // String validations
    if (typeof value === 'string') {
      // Min length
      if (rules.minLength && value.length < rules.minLength) {
        this.errors.push({
          field: fieldName,
          message: rules.message || `${fieldName} must be at least ${rules.minLength} characters`,
        });
        return false;
      }

      // Max length
      if (rules.maxLength && value.length > rules.maxLength) {
        this.errors.push({
          field: fieldName,
          message: rules.message || `${fieldName} must be at most ${rules.maxLength} characters`,
        });
        return false;
      }

      // Email validation
      if (rules.email && !this.isValidEmail(value)) {
        this.errors.push({
          field: fieldName,
          message: rules.message || 'Please enter a valid email address',
        });
        return false;
      }

      // Phone validation
      if (rules.phone && !this.isValidPhone(value)) {
        this.errors.push({
          field: fieldName,
          message: rules.message || 'Please enter a valid phone number',
        });
        return false;
      }

      // URL validation
      if (rules.url && !this.isValidUrl(value)) {
        this.errors.push({
          field: fieldName,
          message: rules.message || 'Please enter a valid URL',
        });
        return false;
      }

      // Password validation
      if (rules.password && !this.isValidPassword(value)) {
        this.errors.push({
          field: fieldName,
          message: rules.message || 'Password must be at least 8 characters with uppercase, lowercase, and number',
        });
        return false;
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        this.errors.push({
          field: fieldName,
          message: rules.message || `${fieldName} format is invalid`,
        });
        return false;
      }
    }

    // Number validations
    if (typeof value === 'number') {
      // Min value
      if (rules.min !== undefined && value < rules.min) {
        this.errors.push({
          field: fieldName,
          message: rules.message || `${fieldName} must be at least ${rules.min}`,
        });
        return false;
      }

      // Max value
      if (rules.max !== undefined && value > rules.max) {
        this.errors.push({
          field: fieldName,
          message: rules.message || `${fieldName} must be at most ${rules.max}`,
        });
        return false;
      }
    }

    // Custom validation
    if (rules.custom && !rules.custom(value)) {
      this.errors.push({
        field: fieldName,
        message: rules.message || `${fieldName} validation failed`,
      });
      return false;
    }

    return true;
  }

  // Validate multiple fields
  validate(data: Record<string, any>, rules: Record<string, ValidationRule>): boolean {
    this.errors = [];
    let isValid = true;

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      if (!this.validateField(fieldName, data[fieldName], fieldRules)) {
        isValid = false;
      }
    }

    return isValid;
  }

  // Get all errors
  getErrors(): ValidationError[] {
    return this.errors;
  }

  // Get first error
  getFirstError(): string | null {
    return this.errors.length > 0 ? this.errors[0].message : null;
  }

  // Get error for specific field
  getFieldError(fieldName: string): string | null {
    const error = this.errors.find(e => e.field === fieldName);
    return error ? error.message : null;
  }

  // Clear all errors
  clearErrors(): void {
    this.errors = [];
  }

  // Helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    // Vietnamese phone number format
    const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  }
}

// Quick validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean =>{
  const phoneRegex = /^(\+84|0)[0-9]{9,10}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): boolean =>{
  return password.length >= 8 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
};

export const validateRequired = (value: any): boolean => {
  return value !== undefined && value !== null && value !== '';
};

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

export const validateRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

export const validateFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date > new Date();
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};
