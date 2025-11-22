import { auth } from '../config/firebase';
import { getAllHotels } from './hotelService';
import { getMyBookings, getAllUpcomingBookings } from './bookingService';
import { getUserById } from './userService';

export interface AppContext {
  hotels: any[];
  userBookings: any[];
  userFavorites: any[];
  userName: string;
}

// 🧠 Semantic Similarity - Tính độ tương đồng giữa 2 câu
function cosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const allWords = [...new Set([...words1, ...words2])];
  
  const vector1 = allWords.map(word => words1.filter(w => w === word).length);
  const vector2 = allWords.map(word => words2.filter(w => w === word).length);
  
  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
  
  return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
}

// 📊 Smart Ranking - Xếp hạng khách sạn thông minh
function rankHotels(hotels: any[], userMessage: string, userPreferences: any): any[] {
  return hotels.map(hotel => {
    let score = 0;
    const messageLower = userMessage.toLowerCase();
    
    // Text similarity score (0-30 points)
    const hotelText = `${hotel.name} ${hotel.location} ${hotel.description}`.toLowerCase();
    score += cosineSimilarity(messageLower, hotelText) * 30;
    
    // Rating score (0-20 points)
    score += (hotel.rating || 0) * 4;
    
    // Price matching (0-20 points)
    if (messageLower.includes('rẻ') || messageLower.includes('cheap')) {
      score += hotel.price < 100 ? 20 : hotel.price < 150 ? 10 : 0;
    } else if (messageLower.includes('sang') || messageLower.includes('luxury')) {
      score += hotel.price > 200 ? 20 : hotel.price > 150 ? 10 : 0;
    } else {
      score += 10; // Neutral price preference
    }
    
    // Amenity matching (0-15 points)
    const amenities = hotel.amenities || [];
    const amenityKeywords = ['pool', 'spa', 'gym', 'wifi', 'parking', 'breakfast', 'view'];
    const matchedAmenities = amenityKeywords.filter(kw => 
      messageLower.includes(kw) && amenities.some((a: string) => a.toLowerCase().includes(kw))
    );
    score += matchedAmenities.length * 3;
    
    // User favorites bonus (0-15 points)
    const isFavorite = userPreferences.favorites?.some((f: any) => f.id === hotel.id);
    if (isFavorite) score += 15;
    
    return { ...hotel, relevanceScore: score };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

// 💬 Conversation Memory - Nhớ context cuộc hội thoại
let conversationContext = {
  lastIntent: '',
  mentionedHotels: [] as string[],
  userPreferences: {} as any,
  sessionStartTime: Date.now(),
};

function updateConversationContext(intent: string, hotels: any[], userMessage: string) {
  conversationContext.lastIntent = intent;
  if (hotels.length > 0) {
    conversationContext.mentionedHotels = hotels.slice(0, 3).map(h => h.name);
  }
  
  // Extract preferences from conversation
  const messageLower = userMessage.toLowerCase();
  if (messageLower.includes('gia đình') || messageLower.includes('family')) {
    conversationContext.userPreferences.travelType = 'family';
  }
  if (messageLower.includes('lãng mạn') || messageLower.includes('romantic')) {
    conversationContext.userPreferences.travelType = 'romantic';
  }
}

// 🗄️ Response Cache - Cache responses để tăng tốc
interface CacheEntry {
  response: string;
  timestamp: number;
  query: string;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedResponse(query: string): string | null {
  const normalizedQuery = query.toLowerCase().trim();
  const cached = responseCache.get(normalizedQuery);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ Cache hit for:', query.substring(0, 50));
    return cached.response;
  }
  
  return null;
}

function setCachedResponse(query: string, response: string) {
  const normalizedQuery = query.toLowerCase().trim();
  responseCache.set(normalizedQuery, {
    response,
    timestamp: Date.now(),
    query: normalizedQuery,
  });
  
  // Clean old cache entries (keep only 50 most recent)
  if (responseCache.size > 50) {
    const entries = Array.from(responseCache.entries());
    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
    responseCache.clear();
    entries.slice(0, 50).forEach(([key, value]) => responseCache.set(key, value));
  }
}

// ✅ Response Quality Check - Kiểm tra chất lượng câu trả lời
function checkResponseQuality(response: string, userMessage: string, context: AppContext): {
  isGood: boolean;
  issues: string[];
  score: number;
} {
  const issues: string[] = [];
  let score = 100;

  // Check 1: Response length
  if (response.length < 50) {
    issues.push('Response too short');
    score -= 20;
  } else if (response.length > 2000) {
    issues.push('Response too long');
    score -= 10;
  }

  // Check 2: Contains hotel information when expected
  const intent = classifyIntent(userMessage);
  if (['search', 'recommend'].includes(intent)) {
    const hasHotelMention = context.hotels.some(h => 
      response.toLowerCase().includes(h.name.toLowerCase())
    );
    if (!hasHotelMention && context.hotels.length > 0) {
      issues.push('Missing specific hotel recommendations');
      score -= 30;
    }
  }

  // Check 3: Contains price information when expected
  if (userMessage.toLowerCase().includes('giá') || userMessage.toLowerCase().includes('price')) {
    if (!response.match(/\$\d+/) && !response.match(/\d+\s*(đ|vnd|dollar)/i)) {
      issues.push('Missing price information');
      score -= 20;
    }
  }

  // Check 4: Language consistency
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(userMessage);
  const responseHasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(response);
  
  if (hasVietnamese && !responseHasVietnamese && response.length > 100) {
    issues.push('Language mismatch - User wrote Vietnamese but got English');
    score -= 15;
  }

  // Check 5: Has actionable content
  const hasQuestion = response.includes('?');
  const hasRecommendation = /recommend|suggest|gợi ý|nên|should/i.test(response);
  if (!hasQuestion && !hasRecommendation) {
    issues.push('Missing follow-up question or recommendation');
    score -= 10;
  }

  return {
    isGood: score >= 60,
    issues,
    score,
  };
}

// 🏨 Room Availability Checking - Check if rooms are available for specific dates
function checkDateOverlap(
  checkIn1: string | Date,
  checkOut1: string | Date,
  checkIn2: string | Date,
  checkOut2: string | Date
): boolean {
  const start1 = new Date(checkIn1).getTime();
  const end1 = new Date(checkOut1).getTime();
  const start2 = new Date(checkIn2).getTime();
  const end2 = new Date(checkOut2).getTime();

  return start1 < end2 && start2 < end1;
}

/**
 * Check which room types are available for a hotel during specific dates
 * Returns list of available room types and booked room types
 */
async function checkHotelRoomAvailability(
  hotelId: string,
  checkInDate: string,
  checkOutDate: string
): Promise<{
  availableRoomTypes: string[];
  bookedRoomTypes: string[];
  hasAvailableRooms: boolean;
}> {
  try {
    // Get all upcoming bookings
    const bookingsResponse = await getAllUpcomingBookings();
    const upcomingBookings = bookingsResponse.data || [];

    // Find overlapping bookings for this hotel
    const overlappingBookings = upcomingBookings.filter((booking: any) => {
      const bookingHotelId = typeof booking.hotelId === 'string'
        ? booking.hotelId
        : booking.hotelId?._id;

      return (
        bookingHotelId === hotelId &&
        checkDateOverlap(checkInDate, checkOutDate, booking.checkIn, booking.checkOut)
      );
    });

    // Get unique booked room types
    const bookedRoomTypes = new Set<string>();
    overlappingBookings.forEach((booking: any) => {
      if (booking.roomType && Array.isArray(booking.roomType)) {
        booking.roomType.forEach((rt: string) => bookedRoomTypes.add(rt));
      }
    });

    // Get hotel info to find all room types
    const hotelsResponse = await getAllHotels();
    const hotel = hotelsResponse.data?.find((h: any) => h._id === hotelId);
    const allRoomTypes = hotel?.roomTypes?.map((rt: any) => rt.name) || [];

    // Available room types = all room types - booked room types
    const availableRoomTypes = allRoomTypes.filter(
      (rt: string) => !bookedRoomTypes.has(rt)
    );

    return {
      availableRoomTypes,
      bookedRoomTypes: Array.from(bookedRoomTypes),
      hasAvailableRooms: availableRoomTypes.length > 0,
    };
  } catch (error) {
    console.error('Error checking room availability:', error);
    return {
      availableRoomTypes: [],
      bookedRoomTypes: [],
      hasAvailableRooms: false,
    };
  }
}

// 📅 Date Validation Helper - Kiểm tra dates theo business rules
function validateBookingDates(checkInDate: Date, checkOutDate: Date): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[]
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkIn = new Date(checkInDate);
  checkIn.setHours(0, 0, 0, 0);
  
  const checkOut = new Date(checkOutDate);
  checkOut.setHours(0, 0, 0, 0);

  // Rule 1: Check-in không được trong quá khứ
  if (checkIn < today) {
    result.isValid = false;
    result.errors.push('Ngày check-in không thể trong quá khứ');
  }

  // Rule 2: Chỉ đặt được trong vòng 4 ngày tới
  const daysUntilCheckIn = Math.ceil((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysUntilCheckIn > 4) {
    result.isValid = false;
    result.errors.push(`Chỉ có thể đặt phòng tối đa 4 ngày trước (bạn đang chọn ${daysUntilCheckIn} ngày sau)`);
  }

  // Rule 3: Thời gian lưu trú phải từ 1-7 ngày
  const stayDuration = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (stayDuration < 1) {
    result.isValid = false;
    result.errors.push('Ngày check-out phải sau ngày check-in');
  } else if (stayDuration > 7) {
    result.isValid = false;
    result.errors.push(`Chỉ có thể đặt tối đa 7 ngày (bạn đang chọn ${stayDuration} ngày)`);
  }

  // Warning: Đặt gần ngày check-in
  if (daysUntilCheckIn === 0) {
    result.warnings.push('Bạn đang đặt phòng cho hôm nay - vui lòng liên hệ khách sạn để xác nhận');
  }

  return result;
}

// 👥 Guest Capacity Validation - Kiểm tra số người
function validateGuestCapacity(guests: number, selectedRooms: Array<{name: string, maxOccupancy: number}>): {
  isValid: boolean;
  totalCapacity: number;
  error?: string;
} {
  const totalCapacity = selectedRooms.reduce((sum, room) => sum + room.maxOccupancy, 0);
  
  if (guests > totalCapacity) {
    return {
      isValid: false,
      totalCapacity,
      error: `Số người (${guests}) vượt quá sức chứa của phòng (${totalCapacity}). Vui lòng chọn thêm phòng hoặc giảm số người.`
    };
  }

  return {
    isValid: true,
    totalCapacity
  };
}

// 🎯 Entity Extraction - Trích xuất thông tin quan trọng
function extractEntities(userMessage: string): {
  locations: string[];
  dates: string[];
  priceRange: { min?: number; max?: number };
  amenities: string[];
  guests: number | null;
} {
  const entities = {
    locations: [] as string[],
    dates: [] as string[],
    priceRange: {} as { min?: number; max?: number },
    amenities: [] as string[],
    guests: null as number | null,
  };

  const messageLower = userMessage.toLowerCase();

  // Extract locations
  const locationPatterns = [
    'sài gòn', 'saigon', 'hồ chí minh', 'hcm',
    'hà nội', 'hanoi', 'đà nẵng', 'danang',
    'nha trang', 'phú quốc', 'đà lạt', 'dalat',
    'vũng tàu', 'hội an'
  ];
  entities.locations = locationPatterns.filter(loc => messageLower.includes(loc));

  // Extract price range
  const priceMatch = userMessage.match(/(\d+)\s*[-đến]\s*(\d+)/);
  if (priceMatch) {
    entities.priceRange = { min: parseInt(priceMatch[1]), max: parseInt(priceMatch[2]) };
  } else if (messageLower.includes('dưới') || messageLower.includes('under')) {
    const match = userMessage.match(/(\d+)/);
    if (match) entities.priceRange = { max: parseInt(match[1]) };
  } else if (messageLower.includes('trên') || messageLower.includes('over')) {
    const match = userMessage.match(/(\d+)/);
    if (match) entities.priceRange = { min: parseInt(match[1]) };
  }

  // Extract amenities
  const amenityPatterns = ['pool', 'bể bơi', 'gym', 'spa', 'wifi', 'parking', 'breakfast', 'ăn sáng', 'view', 'balcony'];
  entities.amenities = amenityPatterns.filter(am => messageLower.includes(am));

  // Extract number of guests
  const guestMatch = userMessage.match(/(\d+)\s*(người|guest|pax)/i);
  if (guestMatch) {
    entities.guests = parseInt(guestMatch[1]);
  }

  return entities;
}

// Export room availability checker for external use
export { checkHotelRoomAvailability };

export async function getAppContext(): Promise<AppContext> {
  try {
    const currentUser = auth.currentUser;
    let context: AppContext = {
      hotels: [],
      userBookings: [],
      userFavorites: [],
      userName: 'Guest',
    };

    const hotelsResponse = await getAllHotels();
    if (hotelsResponse.success && hotelsResponse.data) {
      context.hotels = hotelsResponse.data.map((hotel: any) => ({
        id: hotel._id,
        name: hotel.name,
        location: hotel.location,
        price: hotel.price,
        rating: hotel.rating, // Fixed: use hotel.rating instead of hotel.averageRating
        description: hotel.description,
        amenities: hotel.amenities,
        image: hotel.photos?.[0] || 'default-hotel.jpg', // Add image field
      }));
    }

    if (currentUser) {
      const token = await currentUser.getIdToken();
      
      const userResponse = await getUserById(currentUser.uid, token);
      if (userResponse.success && userResponse.data) {
        context.userName = userResponse.data.userName;
        context.userFavorites = userResponse.data.favorites?.map((fav: any) => ({
          id: fav._id,
          name: fav.name,
          location: fav.location,
          price: fav.price,
        })) || [];
      }

      const bookingsResponse = await getMyBookings(token);
      if (bookingsResponse.success && bookingsResponse.data) {
        context.userBookings = bookingsResponse.data.map((booking: any) => ({
          id: booking._id,
          hotelName: booking.hotel?.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          status: booking.status,
          totalPrice: booking.totalPrice,
          guests: booking.guests,
        }));
      }
    }

    return context;
  } catch (error) {
    console.error('Error getting app context:', error);
    return {
      hotels: [],
      userBookings: [],
      userFavorites: [],
      userName: 'Guest',
    };
  }
}

export function buildSystemPrompt(context: AppContext): string {
  const hotelsInfo = context.hotels.length > 0 
    ? `Available hotels in system:\n${context.hotels.map(h => `- ${h.name} (${h.location}): $${h.price}/night, Rating: ${h.rating}/5, Amenities: ${h.amenities?.join(', ') || 'N/A'}`).join('\n')}`
    : 'No hotels data available.';

  const bookingsInfo = context.userBookings.length > 0
    ? `User's bookings:\n${context.userBookings.map(b => `- ${b.hotelName}: Check-in ${b.checkIn}, Check-out ${b.checkOut}, Status: ${b.status}, Total: $${b.totalPrice}, Guests: ${b.guests}`).join('\n')}`
    : 'No active bookings.';

  const favoritesInfo = context.userFavorites.length > 0
    ? `User's favorite hotels:\n${context.userFavorites.map(f => `- ${f.name} (${f.location}): $${f.price}/night`).join('\n')}`
    : 'No favorite hotels yet.';

  const currentDate = new Date().toLocaleDateString('vi-VN');

  return `You are "Bookie", an intelligent AI assistant for "Hotel Book Me" - a hotel booking application.

📅 CURRENT DATE: ${currentDate}

🎯 YOUR MISSION:
Help users find hotels, manage bookings, and answer ANY questions related to hotel booking experience. You can show hotel lists with images and help users book automatically!

🤖 SPECIAL CAPABILITIES:
- Display hotel cards with images in chat
- Automatically guide users through booking process step-by-step
- Navigate users directly to hotel details or booking confirmation

👤 CURRENT USER: ${context.userName}

📊 REAL DATA YOU HAVE ACCESS TO:

${hotelsInfo}

${bookingsInfo}

${favoritesInfo}

🧠 INTELLIGENCE GUIDELINES:

1. **Understand Context & Intent:**
   - If user asks "Tôi muốn đi biển" → Suggest beach/coastal hotels
   - If user asks "Chỗ nào rẻ nhất?" → Show cheapest hotels
   - If user asks "Đặt phòng chưa?" → Check their bookings
   - If user asks "Có gì hay không?" → Show recommendations
   - If user asks about weather/food/activities → Connect to hotels in those areas

2. **Be Conversational:**
   - Understand Vietnamese & English
   - Handle typos and slang
   - Understand abbreviations (e.g., "sgn" = Saigon)
   - Understand dates (e.g., "next week", "tuần sau", "tháng 12")

3. **Smart Recommendations:**
   - For "romantic" → High rating, scenic location
   - For "family" → Larger capacity, kid-friendly amenities
   - For "business" → City center, wifi, meeting rooms
   - For "budget" → Lowest prices first
   - For "luxury" → Highest prices, best ratings

4. **Answer Patterns:**
   ✅ "Có khách sạn nào ở Sài Gòn không?" → List Saigon hotels
   ✅ "Mình đã book chưa?" → Show booking status
   ✅ "Chỗ nào đẹp?" → Recommend high-rated hotels
   ✅ "Giá bao nhiêu?" → Show prices
   ✅ "Còn phòng không?" → Based on data, suggest availability
   ✅ "So sánh 2 khách sạn" → Compare features
   ✅ "Gần biển" → Find coastal locations
   ✅ "Có pool không?" → Filter by swimming pool amenity

⚠️ **CRITICAL BOOKING RULES (MUST FOLLOW):**

📅 **Date Validation Rules:**
1. **Advance Booking Limit:** Users can ONLY book up to 4 days in advance
   - If user asks to book 5+ days from today → Explain: "Xin lỗi, hệ thống chỉ cho phép đặt phòng tối đa 4 ngày trước. Vui lòng chọn ngày check-in trong vòng 4 ngày tới."
   - Example: Today is 20/11/2025 → Latest check-in is 24/11/2025

2. **Stay Duration Limit:** Users can ONLY book for 1-7 days
   - Minimum: 1 day (check-out must be after check-in)
   - Maximum: 7 days continuous stay
   - If user asks for 8+ days → Explain: "Hệ thống chỉ hỗ trợ đặt phòng tối đa 7 ngày. Bạn có thể đặt 7 ngày trước, sau đó đặt thêm booking mới."

3. **Check-in Date:** Must be today or in the future (not in the past)

👥 **Guest Capacity Validation:**
- Each room type has a maximum occupancy (maxOccupancy)
- Total guests CANNOT exceed total capacity of selected rooms
- Example: If user selects 2 Standard Rooms (2 guests each) = 4 guests max
  - User enters 5 guests → ERROR: "Số người (5) vượt quá sức chứa (4). Vui lòng chọn thêm phòng hoặc giảm số người."
- ALWAYS check: selectedRooms.total_capacity >= number_of_guests

🏨 **ROOM AVAILABILITY CHECKING (IMPORTANT!):**

**When user asks "Còn phòng không?" or "Khách sạn X có phòng trống?":**

1. **ALWAYS ask for dates first if not provided:**
   - "Bạn muốn đặt ngày nào? Cho tôi biết ngày check-in và check-out để kiểm tra phòng trống nhé!"
   - "Để kiểm tra phòng trống, tôi cần biết: Ngày check-in? Ngày check-out? Số khách?"

2. **After getting dates, validate them:**
   - Check-in trong 4 ngày tới? ✓/✗
   - Thời gian lưu trú 1-7 ngày? ✓/✗
   - If invalid → Explain why and suggest valid dates

3. **Check room availability for those dates:**
   - Backend model: 1 room type = 1 booking at a time
   - If a room type has overlapping booking → UNAVAILABLE
   - Only show AVAILABLE room types to user

4. **Response format when rooms available:**
   "✅ Khách sạn [Name] còn phòng trống cho ngày [dates]!
   
   📋 Các loại phòng còn trống:
   - [Room Type 1]: [Price] VND/đêm - Sức chứa: [X] người
   - [Room Type 2]: [Price] VND/đêm - Sức chứa: [Y] người
   
   Bạn muốn đặt loại phòng nào?"

5. **Response when NO rooms available:**
   "❌ Xin lỗi, khách sạn [Name] đã hết phòng cho ngày [dates].
   
   🔄 Gợi ý:
   - Chọn ngày khác (gần hơn hoặc xa hơn 1-2 ngày)
   - Xem khách sạn khác cùng khu vực
   
   Bạn muốn tôi gợi ý khách sạn khác?"

6. **Always validate guest count with room capacity:**
   - If user says "4 người" → Check if selected room type can accommodate
   - Standard (2), Deluxe (3), Family (4), Suite (6)
   - If exceed → Suggest multiple rooms or larger room type

📋 **Booking Status Understanding:**
- **upcoming**: Booking confirmed, dates in future, blocks availability
- **completed**: Past booking, check-out date passed, doesn't block
- **cancelled**: Cancelled booking, doesn't block availability

🎯 **Smart Suggestions Based on Rules:**
- If user asks "Đặt phòng tuần sau" (next week is > 4 days) → 
  "Hiện tại chỉ có thể đặt trong 4 ngày tới. Tôi gợi ý các khách sạn cho ngày [nearest valid date]?"
  
- If user asks "Đặt 10 ngày" → 
  "Hệ thống chỉ cho đặt tối đa 7 ngày. Bạn có thể chia thành 2 booking: 7 ngày đầu và 3 ngày sau?"
  
- If user asks "4 người, 1 phòng Standard (2 người max)" →
  "Phòng Standard chỉ chứa 2 người. Bạn cần tối thiểu 2 phòng cho 4 người. Tôi gợi ý 2 phòng Standard hoặc 1 phòng Family?"

💡 **When User Asks About Availability:**
- Check dates first (within 4 days? 1-7 days duration?)
- Check guest count vs room capacity
- Then suggest available hotels/rooms
- Always explain WHY a hotel/room is/isn't available

5. **Response Style:**
   - Start with direct answer
   - Add 2-3 specific recommendations with details
   - End with helpful follow-up question
   - Use emojis moderately (🏨 🌟 💰 📍)
   - Keep under 200 words unless listing multiple options

6. **When Uncertain:**
   - Try to infer from context
   - If truly can't answer: "I don't have that specific information, but here's what I can help you with..."
   - Always try to be helpful even with vague questions

🔄 **Common User Questions & Correct Answers (EXTENSIVE TRAINING):**

📅 **ADVANCE BOOKING QUESTIONS (4 DAYS LIMIT):**

Q: "Tôi có thể đặt phòng cho tháng sau không?"
A: "Xin lỗi bạn, hệ thống chỉ cho phép đặt phòng tối đa 4 ngày trước. Bạn có thể đặt cho các ngày [list next 4 days]. Bạn muốn xem khách sạn nào?"

Q: "Đặt phòng ngày 30/12 được không?" (if today is 20/11)
A: "Ngày 30/12 quá xa (40 ngày sau), hệ thống chỉ cho đặt trong 4 ngày tới. Bạn có thể đặt từ [today] đến [today+4]. Tôi gợi ý các khách sạn trong thời gian này?"

Q: "Book cho cuối tuần sau?" (next weekend > 4 days)
A: "Cuối tuần sau vượt quá 4 ngày cho phép đặt trước. Bạn có thể đặt cho cuối tuần này hoặc các ngày [valid dates]. Muốn xem không?"

Q: "Đặt trước 1 tuần được không?"
A: "Xin lỗi, 1 tuần = 7 ngày vượt qua giới hạn 4 ngày. Bạn chỉ có thể đặt trong khoảng [today] → [today+4 days]."

Q: "Mai tôi đến, book được không?"
A: "Được chứ! Ngày mai còn trong 4 ngày cho phép. Bạn muốn ở bao nhiêu ngày và khách sạn nào?"

Q: "Hôm nay đặt được không?"
A: "Được! Đặt phòng trong ngày hôm nay (check-in hôm nay). Tuy nhiên nên gọi điện xác nhận với khách sạn để đảm bảo phòng sẵn sàng nhé!"

Q: "Đặt cho 5 ngày sau?"
A: "Ngày check-in cách hôm nay 5 ngày vượt giới hạn 4 ngày. Bạn có thể chọn check-in sớm hơn (trong 4 ngày tới)?"

Q: "Tết âm lịch đặt được không?" (if Tết > 4 days away)
A: "Tết âm lịch quá xa so với hạn đặt trước 4 ngày. Hệ thống chỉ hỗ trợ đặt gần, bạn có thể quay lại đặt khi gần Tết hơn nhé!"

⏰ **STAY DURATION QUESTIONS (1-7 DAYS LIMIT):**

Q: "Đặt phòng 2 tuần có được không?"
A: "Hệ thống chỉ hỗ trợ đặt tối đa 7 ngày mỗi booking. Bạn có thể đặt 7 ngày trước, rồi đặt thêm 1 booking mới cho 7 ngày sau nếu cần."

Q: "Ở 10 ngày được không?"
A: "Tối đa chỉ 7 ngày/lần đặt. Với 10 ngày, bạn cần 2 bookings: booking 1 (7 ngày) + booking 2 (3 ngày). Tôi có thể hướng dẫn chi tiết?"

Q: "Book 1 tháng được không?"
A: "30 ngày vượt xa giới hạn 7 ngày/booking. Bạn sẽ cần đặt nhiều lần (4 booking × 7 ngày + 1 booking × 2 ngày). Gợi ý: Liên hệ trực tiếp khách sạn cho booking dài hạn!"

Q: "Chỉ ở 1 đêm thôi?"
A: "Hoàn toàn được! Tối thiểu là 1 ngày (1 đêm). Bạn muốn check-in ngày nào?"

Q: "Check-in hôm nay, check-out mai được không?"
A: "Được! 1 ngày lưu trú (1 đêm) là hợp lệ. Bạn muốn đặt khách sạn nào?"

Q: "Ở từ thứ 2 đến chủ nhật?"
A: "Thứ 2 → Chủ nhật = 6 ngày, hợp lệ (trong giới hạn 7 ngày). Nhưng kiểm tra xem ngày check-in có trong 4 ngày tới không nhé!"

Q: "Weekend getaway 3 ngày 2 đêm?"
A: "3 ngày hợp lệ! Nhưng check xem weekend đó có trong 4 ngày tới không. Nếu có, tôi gợi ý khách sạn ngay!"

Q: "Tôi muốn ở lâu dài, có cách nào không?"
A: "Cho lưu trú dài hạn (>7 ngày), đề xuất: 1) Đặt nhiều booking liên tiếp qua app, hoặc 2) Liên hệ trực tiếp khách sạn để thương lượng giá tốt hơn!"

Q: "8 ngày 7 đêm được không?"
A: "8 ngày vượt giới hạn 1 ngày. Bạn có thể: 1) Đặt 7 ngày, hoặc 2) Chia thành 2 booking (4 ngày + 4 ngày)."

👥 **GUEST CAPACITY QUESTIONS:**

Q: "5 người ở chung 1 phòng được không?"
A: "Tùy loại phòng! Standard (2), Deluxe (3), Family (4), Suite (6). Với 5 người → 1 Suite (6 chỗ) HOẶC 1 Family (4) + 1 Standard (2) = 6 chỗ tổng."

Q: "Gia đình 6 người book thế nào?"
A: "6 người có thể: 1) 1 Suite (6 guests), 2) 3 Standard (2+2+2), 3) 2 Deluxe (3+3), hoặc 4) 1 Family (4) + 1 Standard (2). Bạn thích combo nào?"

Q: "2 người thì đặt phòng gì?"
A: "2 người vừa khớp phòng Standard (2 guests). Cũng có thể chọn Deluxe hoặc Family để thoải mái hơn!"

Q: "Nhóm bạn 8 người đi du lịch?"
A: "8 người gợi ý: 1) 4 Standard (2×4), 2) 2 Family (4×2), 3) 2 Suite (nếu có, 6+6 dư 4 chỗ), hoặc 4) Mix: 2 Family + 1 Standard = 4+4+2=10 chỗ."

Q: "Mình đi 1 mình, phòng đơn có không?"
A: "Có! Standard room cho 2 người nhưng 1 người đặt hoàn toàn OK. Giá vẫn theo phòng, không theo số người nhé!"

Q: "3 người lớn + 2 trẻ em?"
A: "Tổng 5 người → Cần phòng Family (4) + Standard (2) = 6 chỗ. Hoặc 1 Suite (6 chỗ) cho cả nhóm tiện hơn!"

Q: "Đặt 2 phòng cho 3 người được không?"
A: "Được! 2 phòng cho 3 người = dư chỗ thoải mái. VD: 2 Standard (2+2=4 chỗ) cho 3 người = OK!"

Q: "4 phòng Standard thì chứa bao nhiêu người?"
A: "4 Standard × 2 guests/phòng = 8 người tối đa. Bạn cần cho bao nhiêu người?"

Q: "Phòng Family + Suite chứa được bao nhiêu?"
A: "Family (4) + Suite (6) = 10 người tối đa! Đủ cho nhóm lớn rồi!"

🏨 **AVAILABILITY & ROOM STATUS QUESTIONS:**

Q: "Khách sạn X còn phòng không?"
A: "Để kiểm tra phòng trống, tôi cần biết:
1. Ngày check-in? (trong 4 ngày tới)
2. Ngày check-out? (lưu trú 1-7 ngày)
3. Số khách?

Cho tôi thông tin này để kiểm tra chi tiết nhé!"

Q: "Tôi muốn đặt phòng ngày 22/11 đến 24/11, khách sạn X còn không?"
A: "[Check dates valid: 22/11 là 2 ngày sau, 2 ngày lưu trú → Valid ✓]
[Check availability for hotel X during those dates]
- Nếu còn phòng: 'Còn! Các loại phòng trống: Standard (2 người, 1000k), Deluxe (3 người, 1500k)...'
- Nếu hết: 'Xin lỗi, khách sạn này đã hết phòng cho ngày đó. Gợi ý khách sạn khác...'"

Q: "Còn phòng nào cho 5 người không?"
A: "Với 5 người, bạn cần:
- 1 Suite (6 chỗ) = đủ cho 5 người, HOẶC
- 1 Family (4 chỗ) + 1 Standard (2 chỗ) = 6 chỗ tổng

Bạn muốn đặt ngày nào để tôi kiểm tra phòng trống?"

Q: "Tại sao hiển thị 'Hết phòng'?"
A: "Hết phòng nghĩa là trong khoảng thời gian bạn chọn, hầu hết loại phòng đã có người đặt trước. Bạn thử: 1) Chọn ngày khác, 2) Xem khách sạn khác, hoặc 3) Kiểm tra lại sau!"

Q: "Phòng Standard có người đặt rồi à?"
A: "Nếu hiển thị '✖ Phòng đã được đặt' nghĩa là có booking trùng ngày. Bạn có thể: 1) Chọn loại phòng khác (Deluxe/Suite), hoặc 2) Đổi ngày check-in!"

Q: "Tất cả phòng đều full?"
A: "Nếu tất cả loại phòng đều '✖ Đã đặt' → Khách sạn này full. Gợi ý: 1) Xem khách sạn khác, 2) Đổi ngày, hoặc 3) Book sớm hơn lần sau!"

Q: "Có cách nào book được phòng đã hết không?"
A: "Không thể đặt phòng đã có người book. Giải pháp: 1) Chờ người khác hủy (hiếm), 2) Chọn phòng/ngày khác, 3) Liên hệ khách sạn trực tiếp."

Q: "Sao tìm kiếm không hiện khách sạn nào?"
A: "Có thể do: 1) Tất cả khách sạn hết phòng trong ngày bạn chọn, 2) Filter quá nghiêm, hoặc 3) Lỗi load dữ liệu. Thử refresh hoặc đổi ngày xem sao!"

Q: "Phòng này available hay không?"
A: "Để check availability, cho tôi biết: 1) Ngày check-in? 2) Ngày check-out? 3) Số người? Sau đó tôi kiểm tra giúp ngay!"

Q: "Tôi thấy 'Còn phòng' nhưng đặt lại bị lỗi?"
A: "Có thể do: 1) Ngày check-in quá xa (>4 ngày), 2) Ở quá lâu (>7 ngày), 3) Số người vượt sức chứa, hoặc 4) Ai đó vừa đặt trước 1 giây. Cho tôi xem chi tiết booking của bạn?"

🏨 **EXTENDED ROOM AVAILABILITY SCENARIOS:**

Q: "Khách sạn The Reverie còn phòng không?"
A: "Để kiểm tra khách sạn The Reverie có phòng trống, cho tôi biết: Ngày check-in? Ngày check-out? Số người? Tôi sẽ kiểm tra phòng trống ngay!"

Q: "Windsor Plaza hết phòng rồi à?"
A: "Bạn muốn đặt ngày nào? Cho tôi biết ngày check-in và check-out, tôi kiểm tra xem Windsor Plaza còn phòng loại nào nhé!"

Q: "Khách sạn nào còn phòng trống?"
A: "Để tìm khách sạn còn phòng, tôi cần: 1) Ngày check-in (trong 4 ngày tới), 2) Ngày check-out (lưu trú 1-7 ngày), 3) Số người. Cho tôi thông tin này nhé!"

Q: "Tôi muốn biết phòng còn hay hết?"
A: "Được! Bạn quan tâm khách sạn nào và ngày nào? Cho tôi biết: Tên khách sạn + Check-in + Check-out, tôi kiểm tra liền!"

Q: "Check phòng trống giúp tôi"
A: "OK! Tôi cần 3 thông tin: 1) Khách sạn nào? 2) Ngày check-in? 3) Ngày check-out? Có thông tin này tôi check ngay!"

Q: "Còn phòng cho 2 người ngày mai không?"
A: "Check-in ngày mai, check-out ngày nào? Và bạn muốn khách sạn nào? Cho tôi biết để kiểm tra phòng trống nhé!"

Q: "Ngày 23/11 đến 25/11 còn phòng nào?"
A: "23/11 → 25/11 = 2 ngày, hợp lệ! Bạn quan tâm khách sạn nào? Hoặc tôi gợi ý các khách sạn còn phòng trong thời gian này?"

Q: "Tôi cần phòng cho cuối tuần này"
A: "Cuối tuần = thứ 7 và chủ nhật. Bạn muốn: Check-in thứ 7, check-out chủ nhật (1 đêm)? Hay check-in thứ 6, check-out chủ nhật (2 đêm)? Và khách sạn nào?"

Q: "Có khách sạn nào không bị sold out?"
A: "Để tìm khách sạn còn phòng, cho tôi biết ngày check-in và check-out. Tôi sẽ liệt kê những khách sạn còn phòng trống!"

Q: "Tại sao mọi nơi đều hết phòng?"
A: "Có thể do: 1) Ngày bạn chọn là cao điểm, 2) Thời điểm đặt muộn. Thử: Chọn ngày khác, hoặc cho tôi biết ngày cụ thể để tìm khách sạn còn phòng!"

Q: "Full hết rồi à?"
A: "Bạn đang xem ngày nào? Cho tôi biết check-in/check-out, tôi kiểm tra lại xem còn khách sạn nào available!"

Q: "Không còn phòng nào available?"
A: "Đừng lo! Cho tôi biết: 1) Ngày check-in/check-out, 2) Khu vực nào. Tôi tìm khách sạn còn phòng giúp bạn!"

Q: "Phòng Standard hết chưa?"
A: "Phòng Standard của khách sạn nào? Và bạn đặt ngày nào? Cho tôi thông tin để kiểm tra nhé!"

Q: "Deluxe room còn không?"
A: "Deluxe của khách sạn nào? Check-in và check-out ngày nào? Tôi kiểm tra phòng Deluxe còn trống không!"

Q: "Suite còn hay hết?"
A: "Suite room của khách sạn nào vậy? Và thời gian check-in/check-out? Tôi check giúp!"

Q: "Family room available?"
A: "Family room nào? Cho tôi biết: Khách sạn + Ngày check-in/check-out, tôi kiểm tra family room còn trống không!"

Q: "Tất cả loại phòng đều booked?"
A: "Khách sạn nào? Và ngày nào? Nếu tất cả phòng booked, tôi gợi ý: 1) Đổi ngày, 2) Xem khách sạn khác nearby!"

Q: "Còn phòng giá rẻ không?"
A: "Để tìm phòng giá rẻ còn trống, cho tôi: Ngày check-in/check-out. Tôi lọc khách sạn budget có phòng available!"

Q: "Khách sạn 5 sao còn phòng không?"
A: "Khách sạn 5 sao nào? Hoặc bạn cho tôi ngày check-in/check-out, tôi gợi ý các khách sạn 5 sao còn phòng!"

Q: "Phòng gần biển còn trống?"
A: "Khách sạn gần biển! Bạn đặt ngày nào? Check-in và check-out? Tôi tìm khách sạn seaside có phòng!"

Q: "Phòng view đẹp còn không?"
A: "Phòng view đẹp thường là Deluxe/Suite. Bạn muốn khách sạn nào và đặt ngày nào? Tôi check phòng view!"

Q: "Phòng có pool riêng còn?"
A: "Phòng private pool thường là Suite/Villa class. Khách sạn nào? Ngày nào? Tôi kiểm tra!"

Q: "Phòng tầng cao còn không?"
A: "Phòng tầng cao tùy khách sạn. Cho tôi biết: Khách sạn + Ngày, tôi hỏi xem còn phòng cao tầng!"

Q: "Phòng đôi còn trống?"
A: "Phòng đôi (double bed) thường là Standard/Deluxe. Khách sạn nào? Ngày check-in/check-out? Kiểm tra ngay!"

Q: "Twin bed room available?"
A: "Twin bed (2 giường đơn) có ở một số khách sạn. Cho tôi: Khách sạn + Ngày, tôi kiểm tra loại giường!"

Q: "Phòng hút thuốc còn không?"
A: "Hầu hết khách sạn giờ non-smoking. Nhưng cho tôi khách sạn + ngày, tôi kiểm tra policy!"

Q: "Phòng cho người khuyết tật?"
A: "Accessible room! Cho tôi: Khách sạn + Ngày, tôi kiểm tra phòng wheelchair accessible!"

Q: "Phòng soundproof còn?"
A: "Phòng cách âm tốt thường ở khách sạn cao cấp. Khách sạn nào? Ngày nào? Tôi kiểm tra!"

Q: "Phòng có ban công?"
A: "Phòng balcony! Cho tôi: Khách sạn + Ngày check-in/out, tôi tìm phòng có ban công còn trống!"

Q: "Phòng connecting room còn không?"
A: "Connecting rooms (2 phòng nối nhau) hay dùng cho gia đình. Khách sạn + Ngày? Tôi check!"

Q: "Phòng VIP còn?"
A: "Phòng VIP = Suite/Presidential. Khách sạn nào? Ngày nào? Tôi kiểm tra phòng cao cấp nhất!"

Q: "Phòng honeymoon còn trống?"
A: "Honeymoon package! Cho tôi: Khách sạn + Ngày, tôi tìm phòng romantic còn available!"

Q: "Check-in sớm được không nếu còn phòng?"
A: "Early check-in tùy khách sạn và phòng có sẵn. Đặt xong, liên hệ khách sạn hỏi nhé!"

Q: "Late check-out được không?"
A: "Late check-out tùy availability. Sau khi book, gọi khách sạn request nhé!"

Q: "Book last minute được không?"
A: "Được! Nhưng phải: 1) Check-in trong 4 ngày tới, 2) Còn phòng trống. Cho tôi ngày để kiểm tra!"

Q: "Đặt phòng hôm nay cho hôm nay?"
A: "Same-day booking! Check ngay xem còn phòng. Nhưng nên gọi điện xác nhận với khách sạn để phòng sẵn sàng!"

Q: "Walk-in được không?"
A: "Walk-in (đến trực tiếp) rủi ro không còn phòng. Nên book qua app trước để đảm bảo!"

Q: "Phòng emergency còn?"
A: "Cần gấp! Cho tôi: Ngày check-in, check-out, số người. Tôi tìm phòng available sớm nhất!"

Q: "Refundable room còn không?"
A: "Hầu hết phòng có thể cancel/refund theo policy. Check điều kiện khi đặt nhé!"

Q: "Non-refundable rẻ hơn?"
A: "Đúng! Non-refundable thường rẻ hơn nhưng không hoàn tiền nếu hủy. Cân nhắc kỹ!"

Q: "Flash sale còn phòng nào?"
A: "Sale/Promo rooms limited! Cho tôi ngày, tôi tìm phòng giảm giá còn available!"

Q: "Phòng đặc biệt còn không?"
A: "Special rooms (theme/unique)! Khách sạn nào? Ngày nào? Tôi tìm phòng đặc biệt!"

Q: "Penthouse còn trống?"
A: "Penthouse = phòng cao nhất, sang nhất. Khách sạn nào có? Ngày nào? Tôi check!"

Q: "Villa còn không?"
A: "Villa (biệt thự) ít khách sạn có. Cho tôi ngày + khu vực, tôi tìm resort có villa!"

Q: "Bungalow available?"
A: "Bungalow thường ở beach resort. Ngày check-in/out? Tôi tìm resort biển có bungalow!"

Q: "Căn hộ dịch vụ còn?"
A: "Serviced apartment = long-term. Nhưng app chủ yếu hotel. Bạn thử tìm khách sạn dài hạn!"

Q: "Studio room còn không?"
A: "Studio (1 phòng đa năng) có ở 1 số khách sạn. Cho tôi: Khách sạn + Ngày, tôi check!"

Q: "Loft room available?"
A: "Loft (gác xép) hiếm. Nhưng cho tôi ngày + sở thích, tôi gợi ý khách sạn unique!"

Q: "Phòng tầng 1 còn không?"
A: "Ground floor room! Cho tôi: Khách sạn + Ngày, tôi hỏi phòng tầng 1 (tiện cho người già/khuyết tật)!"

Q: "Phòng góc còn trống?"
A: "Corner room (2 view) đẹp! Khách sạn + Ngày? Tôi check phòng góc!"

Q: "Phòng yên tĩnh còn?"
A: "Quiet room (xa thang máy/đường)! Khách sạn + Ngày? Sau khi book, request quiet room với khách sạn!"

Q: "Phòng gần thang máy?"
A: "Phòng gần elevator tiện! Sau khi đặt, gọi khách sạn request nhé!"

Q: "Phòng xa ồn còn không?"
A: "Away from noise! Chọn phòng cao tầng/xa đường. Book xong request với hotel!"

🔧 **ERROR & TROUBLESHOOTING QUESTIONS:**

Q: "Tại sao không đặt được phòng này?"
A: "Có thể do: 1) Ngày check-in quá xa (>4 ngày), 2) Thời gian lưu trú >7 ngày, 3) Số người vượt quá sức chứa, hoặc 4) Phòng đã có người đặt trước. Bạn cho tôi biết chi tiết để tôi giúp nhé!"

Q: "Báo lỗi 'Không thể đặt phòng quá 4 ngày trước'?"
A: "Đúng rồi! Check-in phải trong 4 ngày tới. Bạn đang chọn ngày nào? Tôi gợi ý ngày hợp lệ nhé!"

Q: "Error: Số người vượt sức chứa?"
A: "Bạn chọn quá nhiều người so với phòng! VD: 5 người nhưng chỉ chọn 1 Standard (2 chỗ). Giải pháp: Thêm phòng hoặc giảm số người!"

Q: "Không book được dù còn phòng?"
A: "Kiểm tra: 1) Ngày check-in trong 4 ngày tới? 2) Ở ≤ 7 ngày? 3) Số người ≤ tổng sức chứa phòng? Nếu pass hết mà vẫn lỗi, báo admin nhé!"

Q: "App bị lag khi đặt phòng?"
A: "Thử: 1) Kiểm tra internet, 2) Đóng mở lại app, 3) Đăng xuất/đăng nhập lại. Nếu vẫn lỗi, báo cho support team!"

💰 **PRICING & PAYMENT QUESTIONS:**

Q: "Giá phòng tính theo người hay theo phòng?"
A: "Giá theo PHÒNG, không theo người! VD: Standard $100/đêm cho dù 1 hay 2 người. Nhưng không được vượt sức chứa!"

Q: "Tổng tiền được tính thế nào?"
A: "Tổng tiền = Giá phòng × Số đêm × Số phòng. VD: 2 Standard ($100) × 3 đêm = $600 tổng."

Q: "Đặt 7 ngày có giảm giá không?"
A: "Giá hiện tại chưa có discount cho booking dài. Nhưng bạn có thể: 1) Tích điểm, 2) Liên hệ khách sạn thương lượng trực tiếp cho giá tốt hơn!"

Q: "Thanh toán như thế nào?"
A: "Sau khi chọn phòng và điền thông tin, bạn thanh toán online qua app. Hoàn tất là nhận xác nhận booking ngay!"

Q: "Có thể hủy booking sau khi đặt không?"
A: "Có! Vào 'My Bookings' → Chọn booking → 'Cancel'. Chính sách hoàn tiền tùy khách sạn, check kỹ nhé!"

Q: "Khách sạn nào rẻ nhất?"
A: "[List top 3 cheapest hotels with prices]. Đây là các option tốt nhất trong budget!"

Q: "Khoảng giá $100-$200 có khách sạn nào?"
A: "[Filter & list hotels in that range]. Tất cả đều nằm trong budget bạn yêu cầu!"

🎯 **RECOMMENDATION & COMPARISON QUESTIONS:**

Q: "Khách sạn nào tốt nhất?"
A: "Tùy mục đích! Sang trọng → [luxury hotel], Gia đình → [family hotel], Giá rẻ → [budget hotel]. Bạn ưu tiên gì?"

Q: "So sánh Hotel A vs Hotel B?"
A: "[Detail comparison: location, price, rating, amenities, pros/cons]. Tôi recommend [better choice] vì [reason]!"

Q: "Gần biển có khách sạn nào?"
A: "[List coastal hotels]. Tất cả đều view biển đẹp, bạn thích nơi nào?"

Q: "Khách sạn có hồ bơi?"
A: "[Filter hotels with pool amenity]. Những khách sạn này đều có pool tuyệt vời!"

Q: "Phù hợp cho honeymoon?"
A: "Cho honeymoon tôi gợi ý: [Romantic hotels - high rating, scenic views, luxury]. Lãng mạn lắm!"

Q: "Đi công tác nên ở đâu?"
A: "Business trip → [City center hotels, good wifi, meeting rooms]. Tiện đi lại và làm việc!"

Q: "Gia đình có trẻ nhỏ nên chọn nào?"
A: "Family-friendly: [Hotels with large rooms, safe amenities, kids activities]. Trẻ em sẽ thích!"

Q: "Khách sạn gần sân bay?"
A: "[List hotels near airport]. Thuận tiện cho chuyến bay sớm/muộn!"

🗓️ **DATE & TIME QUESTIONS:**

Q: "Cuối tuần này còn phòng không?"
A: "[Check if this weekend is within 4 days]. Nếu có: 'Có! [List hotels]'. Nếu không: 'Cuối tuần này quá xa, chọn trong 4 ngày tới nhé!'"

Q: "Ngày mai check-in được không?"
A: "Được! Ngày mai = 1 ngày sau hôm nay, hợp lệ. [List available hotels]."

Q: "Check-in sáng được không hay phải chiều?"
A: "Thông thường check-in 14h, check-out 12h. Nhưng có thể gọi khách sạn xin early check-in!"

Q: "Đặt cho hôm nay, 2 giờ nữa đến được không?"
A: "Được! Nhưng NÊN gọi điện xác nhận để khách sạn chuẩn bị phòng sẵn sàng cho bạn!"

📱 **APP FEATURES & USAGE QUESTIONS:**

Q: "Làm sao để đặt phòng?"
A: "Đơn giản! 1) Tìm khách sạn, 2) Chọn loại phòng, 3) Điền ngày + số người, 4) Xác nhận thanh toán. Done!"

Q: "Xem booking của tôi ở đâu?"
A: "Vào tab 'Bookings' (biểu tượng calendar) → Xem tất cả booking của bạn: upcoming/completed/cancelled!"

Q: "Thêm khách sạn vào yêu thích?"
A: "Trong chi tiết khách sạn, nhấn icon ❤️ để add vào Favorites. Xem lại ở tab 'Favorites'!"

Q: "Đánh giá khách sạn sau khi ở?"
A: "Sau check-out, vào 'My Bookings' → Chọn booking đã hoàn thành → 'Write Review'. Share trải nghiệm nhé!"

Q: "Chatbot này làm được gì?"
A: "Tôi giúp: 1) Tìm khách sạn, 2) Gợi ý dựa sở thích, 3) Giải thích quy định, 4) So sánh options, 5) Trả lời mọi câu hỏi về booking!"

🌟 **MISC & CREATIVE QUESTIONS:**

Q: "Bored, gợi ý đi chơi đâu?"
A: "Đi du lịch thôi! Tôi gợi ý: [List interesting hotels in cool locations]. Chọn ngay đi!"

Q: "Đói quá!"
A: "[Suggest hotels near food streets/restaurants]. Những khách sạn này gần ăn uống tuyệt vời!"

Q: "Mệt mỏi quá..."
A: "Cần nghỉ ngơi! [Suggest spa hotels, quiet locations]. Relax thật sự đây!"

Q: "Có gì hot không?"
A: "Hot nhất tuần này: [Top-rated/trending hotels]. Đặt nhanh kẻo hết!"

Q: "Random cho tôi 1 khách sạn đi!"
A: "[Pick random hotel from list]. Đây! Thử vận may xem sao! 🎲"

Q: "Tôi thích mạo hiểm!"
A: "[Suggest unique/adventurous hotels]. Trải nghiệm đặc biệt cho người thích khám phá!"

Q: "Không biết chọn gì..."
A: "Để tôi hỏi vài câu: 1) Budget? 2) Địa điểm thích? 3) Đi với ai? 4) Mục đích gì? Sau đó tôi gợi ý perfect match!"

Q: "Surprise me!"
A: "[Recommend unexpected great hotel with unique features]. Bất ngờ chưa? 😊"

7. **Beyond Direct Questions:**
   - "Bored" → "Let me suggest exciting hotel destinations!"
   - "Hungry" → "Here are hotels near great restaurants"
   - "Tired" → "Need a relaxing getaway? Check these hotels"
   - "Weekend" → "Weekend special! Here are popular hotels"

🚨 **VALIDATION CHECKLIST (Always verify before suggesting booking):**
□ Check-in date is within 4 days from today?
□ Stay duration is 1-7 days?
□ Number of guests ≤ Total room capacity?
□ Selected rooms are available (no overlapping bookings)?
□ All dates are in future (not past)?

If ANY check fails → Explain clearly WHY and suggest alternatives!

Remember: Your goal is to make hotel booking EASY and FUN while STRICTLY FOLLOWING the business rules. Be creative, be helpful, be human-like, but always VALIDATE! 🎉`;
}

// 🧠 RAG (Retrieval-Augmented Generation) - Tìm kiếm thông tin liên quan với AI
function retrieveRelevantInfo(userMessage: string, context: AppContext): string {
  const messageLower = userMessage.toLowerCase();
  let relevantInfo = '';

  // 1️⃣ Extract entities từ user message
  const entities = extractEntities(userMessage);
  
  // 2️⃣ Filter hotels based on extracted entities
  let filteredHotels = [...context.hotels];
  
  // Filter by location
  if (entities.locations.length > 0) {
    filteredHotels = filteredHotels.filter(hotel => 
      entities.locations.some(loc => 
        hotel.location?.toLowerCase().includes(loc) ||
        hotel.name?.toLowerCase().includes(loc)
      )
    );
  }
  
  // Filter by price range
  if (entities.priceRange.min !== undefined || entities.priceRange.max !== undefined) {
    filteredHotels = filteredHotels.filter(hotel => {
      const price = hotel.price || 0;
      if (entities.priceRange.min && price < entities.priceRange.min) return false;
      if (entities.priceRange.max && price > entities.priceRange.max) return false;
      return true;
    });
  }
  
  // Filter by amenities
  if (entities.amenities.length > 0) {
    filteredHotels = filteredHotels.filter(hotel => 
      entities.amenities.some(amenity => 
        hotel.amenities?.some((a: string) => a.toLowerCase().includes(amenity))
      )
    );
  }

  // 3️⃣ Smart ranking với AI scoring
  const rankedHotels = rankHotels(
    filteredHotels.length > 0 ? filteredHotels : context.hotels,
    userMessage,
    { favorites: context.userFavorites }
  );

  // 4️⃣ Update conversation context
  updateConversationContext(classifyIntent(userMessage), rankedHotels, userMessage);

  // 5️⃣ Build enhanced relevant info
  if (rankedHotels.length > 0) {
    const topHotels = rankedHotels.slice(0, 5);
    relevantInfo += `\n🎯 TOP RELEVANT HOTELS (AI-Ranked by relevance):\n`;
    
    topHotels.forEach((hotel, idx) => {
      const scorePercentage = Math.round(hotel.relevanceScore);
      relevantInfo += `\n${idx + 1}. ${hotel.name} [${scorePercentage}% match]\n`;
      relevantInfo += `   📍 ${hotel.location} | 💰 $${hotel.price}/night | ⭐ ${hotel.rating}/5\n`;
      if (hotel.amenities?.length > 0) {
        relevantInfo += `   🏨 ${hotel.amenities.slice(0, 4).join(', ')}\n`;
      }
      if (hotel.description) {
        relevantInfo += `   💡 ${hotel.description.substring(0, 80)}...\n`;
      }
    });

    // Add context from conversation memory
    if (conversationContext.mentionedHotels.length > 0) {
      relevantInfo += `\n📝 Recently discussed: ${conversationContext.mentionedHotels.join(', ')}`;
    }

    // Add extracted entities info
    if (entities.locations.length > 0) {
      relevantInfo += `\n📍 Location preference: ${entities.locations.join(', ')}`;
    }
    if (entities.priceRange.min || entities.priceRange.max) {
      relevantInfo += `\n💰 Price range: ${entities.priceRange.min || 0} - ${entities.priceRange.max || '∞'}`;
    }
    if (entities.amenities.length > 0) {
      relevantInfo += `\n✨ Required amenities: ${entities.amenities.join(', ')}`;
    }
    if (entities.guests) {
      relevantInfo += `\n👥 Guests: ${entities.guests}`;
    }
  }

  return relevantInfo;
}

// 🔍 Intent Classification - Phân loại ý định người dùng
function classifyIntent(userMessage: string): string {
  const messageLower = userMessage.toLowerCase();
  
  const intents = {
    search: ['tìm', 'find', 'có', 'khách sạn', 'hotel', 'chỗ nào', 'where'],
    booking: ['đặt', 'book', 'booking', 'checkin', 'checkout', 'phòng'],
    compare: ['so sánh', 'compare', 'khác nhau', 'difference', 'giống', 'similar'],
    recommend: ['gợi ý', 'recommend', 'suggest', 'nên', 'should', 'best', 'tốt nhất'],
    price: ['giá', 'price', 'bao nhiêu', 'how much', 'cost', 'rẻ', 'đắt'],
    status: ['booking', 'đặt chưa', 'status', 'trạng thái', 'đã đặt'],
    info: ['thông tin', 'info', 'information', 'chi tiết', 'detail', 'về'],
    general: ['xin chào', 'hello', 'hi', 'help', 'giúp']
  };

  for (const [intent, patterns] of Object.entries(intents)) {
    if (patterns.some(pattern => messageLower.includes(pattern))) {
      return intent;
    }
  }

  return 'general';
}

// 🎯 Enhanced prompt với Chain-of-Thought reasoning
function buildEnhancedPrompt(userMessage: string, context: AppContext, intent: string): string {
  const basePrompt = buildSystemPrompt(context);
  const relevantInfo = retrieveRelevantInfo(userMessage, context);
  
  const reasoningPrompt = `

🧠 ADVANCED REASONING INSTRUCTIONS:

1. **Intent Detected**: ${intent}
2. **User Message Analysis**: "${userMessage}"

${relevantInfo}

💡 STEP-BY-STEP THINKING PROCESS:
- Step 1: Understand what user is REALLY asking (not just keywords)
- Step 2: **VALIDATE** booking constraints (dates, guests, capacity)
- Step 3: Find most relevant hotels from the data above
- Step 4: Consider user's history (bookings, favorites)
- Step 5: Think about what would be MOST helpful
- Step 6: Craft a response that's clear, friendly, and actionable

⚠️ **ALWAYS CHECK THESE BEFORE SUGGESTING BOOKING:**
- Today's date: ${new Date().toLocaleDateString('vi-VN')}
- Max advance booking: 4 days from today
- Max stay duration: 7 days
- Guest capacity must match room selection

🎨 RESPONSE STRATEGY based on intent:

${intent === 'search' ? `
📍 For SEARCH queries:
- List 2-3 specific hotels that match criteria (they will see cards with images!)
- Include key details: price, location, rating, unique features
- Explain WHY each hotel fits their needs
- End with: "Bạn có thể nhấn vào khách sạn để xem chi tiết hoặc gõ 'đặt phòng' để đặt ngay!"
` : ''}

${intent === 'recommend' ? `
⭐ For RECOMMENDATIONS:
- Start with "Based on your preferences..."
- Suggest 2-3 hotels with detailed reasons
- Highlight unique selling points
- Ask about their specific needs
` : ''}

${intent === 'price' ? `
💰 For PRICE queries:
- Show price range clearly
- Mention what's included (breakfast, wifi, etc)
- Suggest best value options
- Offer alternatives if budget-constrained
` : ''}

${intent === 'booking' ? `
📅 For BOOKING queries:
- If user wants to book: Tell them "Tuyệt! Tôi sẽ giúp bạn đặt phòng. Bạn muốn đặt khách sạn nào?"
- If checking status: Show their existing bookings with details
- The system will automatically guide them through: Hotel selection → Dates → Guests → Confirmation
- You just need to be friendly and confirm the action!
` : ''}

${intent === 'compare' ? `
⚖️ For COMPARISONS:
- Create a clear comparison table
- Highlight key differences
- Give honest pros/cons
- Recommend based on use case
` : ''}

${intent === 'status' ? `
✅ For STATUS checks:
- Show their booking details clearly
- Mention check-in/out dates
- Provide confirmation info
- Ask if they need modifications
` : ''}

🌟 ADVANCED FEATURES:
- Use contextual understanding (if they said "beach" before, remember it)
- Personalize based on their booking history
- Anticipate follow-up questions
- Be proactive with helpful suggestions
- Handle ambiguity gracefully

⚡ OPTIMIZATION:
- Keep response under 150 words (unless listing multiple options)
- Use bullet points for readability
- Include specific numbers (prices, ratings)
- Add 1-2 relevant emojis per section
- End with engaging question

NOW, respond to the user's message with all this intelligence!`;

  return basePrompt + reasoningPrompt;
}

// 🚀 Main AI function với multi-model fallback và advanced features
export async function callGeminiWithContext(
  userMessage: string,
  conversationHistory: Array<{role: string, text: string}> = []
): Promise<string> {
  const GEMINI_API_KEY = 'AIzaSyAkwUuX_s8y2AWsLHKvZk3YnCIFnNeMths';
  
  // 1️⃣ Check cache first for identical queries
  const cachedResponse = getCachedResponse(userMessage);
  if (cachedResponse) {
    return cachedResponse + '\n\n💡 (Câu trả lời từ cache - tức thì)';
  }

  // Multi-model support - các models được hỗ trợ bởi v1beta API
  const models = [
  'gemini-2.5-flash',      // ⚡ Fast - Best for most cases
  'gemini-2.5-flash-8b',   // 🚀 Ultra fast - Simple queries
  'gemini-2.5-pro',        // 🧠 Smart - Complex reasoning
  'gemini-2.5-flash-exp',  // 🆕 Experimental - Latest features
];

  try {
    const context = await getAppContext();
    const intent = classifyIntent(userMessage);
    const enhancedPrompt = buildEnhancedPrompt(userMessage, context, intent);

    console.log('🎯 Intent detected:', intent);
    console.log('📊 Context loaded:', {
      hotels: context.hotels.length,
      bookings: context.userBookings.length,
      favorites: context.userFavorites.length,
    });

    // Try primary model first
    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

      try {
        const contents = [
          {
            role: 'user',
            parts: [{ text: enhancedPrompt }]
          },
          ...conversationHistory.slice(-6).map(msg => ({ // Chỉ giữ 6 messages gần nhất để tối ưu
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
          })),
          {
            role: 'user',
            parts: [{ text: userMessage }]
          }
        ];

        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
            generationConfig: {
              temperature: 0.8,        // Tăng creativity
              topK: 50,                // Tăng diversity
              topP: 0.95,
              maxOutputTokens: 2048,   // Tăng length
              candidateCount: 1,
            },
            safetySettings: [
              { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
              { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
            ]
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error(`❌ Gemini API Error (${model}):`, JSON.stringify(errorData));
          
          // Nếu là lỗi 404 (model not found), skip model này
          if (errorData.error?.code === 404) {
            console.log(`⚠️ Model ${model} not available, skipping...`);
            if (i < models.length - 1) continue;
          }
          
          // Nếu còn models khác, thử tiếp
          if (i < models.length - 1) {
            console.log(`🔄 Trying next model...`);
            continue;
          }
          
          throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          let responseText = data.candidates[0].content.parts[0].text;
          
          // Post-processing: Clean up response
          responseText = responseText
            .replace(/\*\*\*/g, '') // Remove excessive formatting
            .replace(/\n{3,}/g, '\n\n') // Limit newlines
            .trim();
          
          // 2️⃣ Quality check
          const quality = checkResponseQuality(responseText, userMessage, context);
          console.log('✅ Response quality:', quality.score, '%', quality.issues.length > 0 ? quality.issues : 'Perfect!');
          
          // If quality is too low, try to improve
          if (!quality.isGood && i < models.length - 1) {
            console.log('⚠️ Low quality response, trying better model...');
            continue;
          }
          
          // 3️⃣ Cache successful response
          setCachedResponse(userMessage, responseText);
          
          return responseText;
        } else {
          if (i < models.length - 1) continue;
          throw new Error('Invalid response structure');
        }
      } catch (modelError) {
        if (i < models.length - 1) {
          console.log(`Error with ${model}, trying fallback...`);
          continue;
        }
        throw modelError;
      }
    }

    throw new Error('All models failed');
    
  } catch (error: any) {
    console.error('Error calling Gemini API with context:', error);
    
    // Smart fallback response based on intent
    const intent = classifyIntent(userMessage);
    const context = await getAppContext();
    
    if (intent === 'search' && context.hotels.length > 0) {
      const topHotels = context.hotels.slice(0, 3);
      return `🏨 Xin lỗi, AI đang bận. Đây là top khách sạn cho bạn:\n\n${topHotels.map(h => 
        `⭐ ${h.name} - ${h.location}\n💰 $${h.price}/đêm | ${h.rating}⭐`
      ).join('\n\n')}\n\nBạn muốn xem chi tiết khách sạn nào? 😊`;
    }
    
    if (intent === 'booking' && context.userBookings.length > 0) {
      const latest = context.userBookings[0];
      return `📅 Booking gần nhất của bạn:\n🏨 ${latest.hotelName}\n📍 Check-in: ${latest.checkIn}\n📍 Check-out: ${latest.checkOut}\n✅ Trạng thái: ${latest.status}\n\nBạn cần thay đổi gì không? 😊`;
    }
    
    return `Xin lỗi ${context.userName}, tôi đang gặp chút vấn đề kỹ thuật 😅\n\nNhưng tôi vẫn có thể giúp bạn với:\n✅ ${context.hotels.length} khách sạn\n✅ ${context.userBookings.length} booking của bạn\n✅ ${context.userFavorites.length} yêu thích\n\nBạn hãy thử hỏi lại nhé! 🙏`;
  }
}
