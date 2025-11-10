/**
 * Test image helper
 * Run: node testImageHelper.js
 */

const testPaths = [
  'images/khach_san_liberty_central_saigon_citypoint/khach_san_liberty_central_saigon_citypoint_p3UWyaujtQo.jpg',
  'https://images.unsplash.com/photo-123.jpg',
  'http://localhost:8080/images/test.jpg',
  '',
  undefined
];

const LOCAL_IMAGE_BASE = 'http://192.168.1.147:3001';

function getImageUri(imagePath) {
  if (!imagePath) {
    console.log('⚠️ No image path provided, using placeholder');
    return 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400';
  }

  console.log('🖼️ Original image path:', imagePath);

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('✅ Already full URL, returning as is');
    return imagePath;
  }

  if (imagePath.startsWith('images/')) {
    const fullUrl = `${LOCAL_IMAGE_BASE}/${imagePath}`;
    console.log('🏠 Local image URL:', fullUrl);
    return fullUrl;
  }

  console.log('⚠️ Unknown path format, returning as is');
  return imagePath;
}

console.log('\n=== Testing Image Helper ===\n');

testPaths.forEach((path, index) => {
  console.log(`\n--- Test ${index + 1} ---`);
  const result = getImageUri(path);
  console.log('Result:', result);
  console.log('---\n');
});
