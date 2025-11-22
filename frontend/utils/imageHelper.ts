/**
 * Helper để xử lý image URLs
 * - Images từ AWS S3 (Production)
 * - Images từ external URLs (CDN, Unsplash, etc.)
 * - Images từ local server (Development/Test)
 */

import { API_BASE_URL } from '../config/api';

// AWS S3 bucket base URL
const AWS_S3_BASE = 'https://hotel-booking-image.s3.ap-southeast-1.amazonaws.com';

// Local image server (nếu cần test)
const LOCAL_IMAGE_BASE = 'http://192.168.1.147:3001';

// Default placeholder nếu không có ảnh
const DEFAULT_PLACEHOLDER = 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400';

/**
 * Convert image path từ database thành URL có thể dùng được
 * @param imagePath - Path từ database
 * @returns Full URL để load ảnh
 * 
 * Hỗ trợ các formats:
 * 1. Full URL: "https://hotel-booking-image.s3.amazonaws.com/..." → return as-is
 * 2. S3 path: "images/hotel/photo.jpg" → prepend S3 base URL
 * 3. External URL: "https://unsplash.com/..." → return as-is
 * 4. Empty/null → return placeholder
 */
export const getImageUri = (imagePath: string | undefined): string => {
  // Case 1: Không có ảnh → Placeholder
  if (!imagePath || imagePath.trim() === '') {
    return DEFAULT_PLACEHOLDER;
  }

  const trimmedPath = imagePath.trim();

  // Case 2: Đã là URL đầy đủ (AWS S3, CDN, Unsplash, etc.)
  if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
    return trimmedPath;
  }

  // Case 3: Relative path → Prepend AWS S3 base URL
  // VD: "images/khach_san_liberty/photo.jpg" → "https://s3.../images/khach_san_liberty/photo.jpg"
  if (trimmedPath.startsWith('images/')) {
    return `${AWS_S3_BASE}/${trimmedPath}`;
  }

  // Case 4: Path không có "images/" prefix → Thêm vào
  // VD: "khach_san/photo.jpg" → "https://s3.../images/khach_san/photo.jpg"
  return `${AWS_S3_BASE}/images/${trimmedPath}`;
};

/**
 * Get image source object cho React Native Image component
 */
export const getImageSource = (imagePath: string | undefined): { uri: string } => {
  return { uri: getImageUri(imagePath) };
};

/**
 * Format array of image paths
 */
export const getImageUris = (imagePaths: string[] | undefined): string[] => {
  if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
    return ['https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400'];
  }
  
  return imagePaths.map(path => getImageUri(path));
};
