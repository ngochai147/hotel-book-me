/**
 * Helper để xử lý image URLs
 * - API từ production (Render)
 * - Images từ local (để test nhanh)
 */

import { API_BASE_URL } from '../config/api';

// Local image server (nếu cần)
const LOCAL_IMAGE_BASE = 'http://192.168.1.147:3001'; // Đổi thành IP máy bạn

/**
 * Convert image path từ database thành URL có thể dùng được
 * @param imagePath - Path từ database (vd: "images/hotel/photo.jpg" hoặc "https://...")
 * @returns Full URL để load ảnh
 */
export const getImageUri = (imagePath: string | undefined): string => {
  // Default placeholder nếu không có ảnh
  if (!imagePath) {
    console.log('⚠️ No image path provided, using placeholder');
    return 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400';
  }

  console.log('🖼️ Original image path:', imagePath);

  // Nếu đã là URL đầy đủ (từ CDN, Unsplash, etc.), return luôn
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('✅ Already full URL, returning as is');
    return imagePath;
  }

  // ========================================
  // QUAN TRỌNG: Images từ LOCAL
  // ========================================
  // Nếu path bắt đầu với "images/", load từ local
  if (imagePath.startsWith('images/')) {
    const fullUrl = `${LOCAL_IMAGE_BASE}/${imagePath}`;
    console.log('🏠 Local image URL:', fullUrl);
    return fullUrl;
  }

  // Fallback
  console.log('⚠️ Unknown path format, returning as is');
  return imagePath;
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
