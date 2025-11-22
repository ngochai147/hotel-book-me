import { ArrowLeft, MessageCircle, Paperclip, Send, X, MapPin, Star, ChevronRight, Calendar, Users, Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { callGeminiWithContext, getAppContext } from '../services/aiChatService';
import { getImageUri } from '../utils/imageHelper';
import { getHotelById } from '../services/hotelService';
import { chatStorage } from '../services/chatStorageService';
import ConfirmModal from './ConfirmModal';
import { auth } from '../config/firebase';

const { width, height } = Dimensions.get('window');

type Message = {
  id: number;
  text: string;
  isUser: boolean;
  time: string;
  type?: 'text' | 'hotels_list' | 'rooms_list' | 'booking_summary';
  hotels?: Array<{
    id: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    image: string;
  }>;
  rooms?: Array<{
    id: string;
    name: string;
    price: number;
    size: number;
    capacity: number;
    amenities: string[];
    image: string;
    bedType?: string;
  }>;
  hotelName?: string;
  bookingData?: {
    step: 'ask_hotel' | 'ask_dates' | 'ask_guests' | 'confirm';
    hotelId?: string;
    hotelName?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  };
};

const quickTopics = [
  'Tìm khách sạn ở Sài Gòn',
  'Đặt phòng khách sạn',
  'Chỗ nào rẻ và đẹp?',
  'Gợi ý khách sạn rating cao',
  'The Reverie Saigon có những phòng nào?',
  'Khách sạn The Reverie Saigon có phòng gì?',
];

export default function ChatBox() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dbInitialized, setDbInitialized] = useState(false);
  const [clearModalVisible, setClearModalVisible] = useState(false);
  
  // Message ID counter to ensure uniqueness
  const messageIdCounter = useRef(0);

  // Load messages from SQLite on mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await chatStorage.init();
        const savedMessages = await chatStorage.loadMessages();
        
        if (savedMessages.length > 0) {
          // Ensure all loaded messages have unique IDs
          const messagesWithUniqueIds = savedMessages.map((msg, idx) => ({
            ...msg,
            id: Date.now() * 1000 + idx
          }));
          setMessages(messagesWithUniqueIds);
          setShowWelcome(false);
          console.log(`Loaded ${savedMessages.length} messages from SQLite`);
          // Update counter to continue from loaded messages
          messageIdCounter.current = savedMessages.length;
        }
        
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize chat storage:', error);
        setDbInitialized(true);
      }
    };
    
    initializeChat();
  }, []);

  // Save messages to SQLite whenever they change
  useEffect(() => {
    if (dbInitialized && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only save if it's a new message (check if it's the most recent one)
      chatStorage.saveMessage(lastMessage).catch(error => {
        console.error('Failed to save message to SQLite:', error);
      });
    }
  }, [messages, dbInitialized]);

  const [bookingFlow, setBookingFlow] = useState<{
    active: boolean;
    step: 'ask_hotel' | 'ask_dates' | 'ask_guests' | 'confirm';
    hotelId?: string;
    hotelName?: string;
    selectedRoom?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
  }>({ active: false, step: 'ask_hotel' });
  const [currentHotel, setCurrentHotel] = useState<{
    id: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    image: string;
  } | null>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen]);

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Generate unique message ID to prevent duplicates
  const generateMessageId = () => {
    messageIdCounter.current += 1;
    return Date.now() * 1000 + messageIdCounter.current;
  };

  // Clean markdown formatting from AI responses
  const cleanMarkdown = (text: string): string => {
    return text
      .replace(/\*\*\*/g, '') // Remove ***
      .replace(/\*\*/g, '')   // Remove **
      .replace(/\*/g, '')     // Remove single *
      .replace(/^#{1,6}\s/gm, '') // Remove # headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
      .replace(/`([^`]+)`/g, '$1') // Remove code backticks
      .trim();
  };

  // Check if message contains any hotel name from context
  const containsHotelName = async (message: string, context: any): Promise<boolean> => {
    const hotels = context.hotels || [];
    const messageLower = message.toLowerCase();
    
    for (const hotel of hotels) {
      const hotelNameLower = hotel.name.toLowerCase();
      const hotelWords = hotelNameLower.split(' ').filter((word: string) => word.length > 3);
      
      const hasMatch = hotelWords.some((word: string) => {
        return messageLower.includes(word) && 
               !['khách', 'sạn', 'hotel', 'resort', 'the'].includes(word.toLowerCase());
      });
      
      if (hasMatch) {
        console.log('Hotel name detected in message:', hotel.name);
        return true;
      }
    }
    
    return false;
  };

  // Find hotel from user message using text matching
  const findHotelFromMessage = async (message: string, context: any): Promise<any> => {
    const hotels = context.hotels || [];
    const messageLower = message.toLowerCase();
    
    console.log('Finding hotel from message:', message);

    // Try exact match first
    let matchedHotel = hotels.find((hotel: any) => {
      const hotelNameLower = hotel.name.toLowerCase();
      return messageLower.includes(hotelNameLower);
    });

    // If no exact match, try partial match with hotel names
    if (!matchedHotel) {
      matchedHotel = hotels.find((hotel: any) => {
        const hotelNameLower = hotel.name.toLowerCase();
        const hotelWords = hotelNameLower.split(' ').filter((word: string) => word.length > 2);
        
        const hasMatch = hotelWords.some((word: string) => {
          return word.length > 3 && 
                 messageLower.includes(word) && 
                 !['khách', 'sạn', 'hotel', 'resort', 'the'].includes(word.toLowerCase());
        });
        
        if (hasMatch) {
          console.log('Partial match found:', hotel.name, 'with words:', hotelWords);
        }
        return hasMatch;
      });
    }

    // Try common patterns
    if (!matchedHotel) {
      const patterns = [
        /(?:khách sạn|hotel)?\s*([^,\.!?\n]+?)(?:\s+có|\s+phòng|\s+room|$)/i,
        /(?:ở|tại)\s+([^,\.!?\n]+)/i,
      ];
      
      for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          const potentialName = match[1].trim();
          console.log('Pattern match potential name:', potentialName);
          
          matchedHotel = hotels.find((hotel: any) => {
            const hotelNameLower = hotel.name.toLowerCase();
            return hotelNameLower.includes(potentialName.toLowerCase()) || 
                   potentialName.toLowerCase().includes(hotelNameLower);
          });
          
          if (matchedHotel) break;
        }
      }
    }

    console.log('Matched hotel:', matchedHotel ? matchedHotel.name : 'None');
    return matchedHotel;
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isLoading) return;

    setShowWelcome(false);

    const userMessage: Message = {
      id: generateMessageId(),
      text: messageText,
      isUser: true,
      time: getCurrentTime(),
      type: 'text',
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Smart detection: if user provides dates when hotel context exists
      const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
      const hasDatePattern = dateRegex.test(messageText);
      
      // If user provides dates and we have current hotel but not in booking flow, start it
      if (!bookingFlow.active && hasDatePattern && currentHotel) {
        const dates = messageText.match(dateRegex);
        if (dates && dates.length >= 2) {
          setBookingFlow({ 
            active: true, 
            step: 'ask_guests',
            hotelId: currentHotel.id,
            hotelName: currentHotel.name,
            checkIn: dates[0],
            checkOut: dates[1],
          });
          
          const botMessage: Message = {
            id: generateMessageId(),
            text: `✅ Tuyệt! Đặt phòng tại ${currentHotel.name}\n📅 Check-in: ${dates[0]}, Check-out: ${dates[1]}\n\n👥 Bạn muốn đặt cho bao nhiêu người? (Ví dụ: 2 người)`,
            isUser: false,
            time: getCurrentTime(),
            type: 'text',
          };
          setMessages(prev => [...prev, botMessage]);
          setIsLoading(false);
          
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
          return;
        }
      }
      
      // Check if in booking flow
      if (bookingFlow.active) {
        await handleBookingFlow(messageText);
        return;
      }

      // Check if user wants to book from room selection
      const lowerMessage = messageText.toLowerCase();
      const isBookingRequest = lowerMessage.includes('đặt phòng') || lowerMessage.includes('book') || lowerMessage.includes('booking');
      const isRoomBooking = isBookingRequest && (lowerMessage.includes('phòng') || lowerMessage.includes('room'));

      // FIXED: Check if user is booking from room list (current hotel context exists)
      if (isRoomBooking && currentHotel) {
        // Try to extract room name from message
        let selectedRoom = '';
        if (lowerMessage.includes('deluxe')) selectedRoom = 'Deluxe';
        else if (lowerMessage.includes('suite')) selectedRoom = 'Suite';
        else if (lowerMessage.includes('standard')) selectedRoom = 'Standard';
        
        // QUAN TRỌNG: Set hotelId từ currentHotel
        setBookingFlow({ 
          active: true, 
          step: 'ask_dates',
          hotelId: currentHotel.id, // ← THÊM DÒNG NÀY
          hotelName: currentHotel.name,
          selectedRoom: selectedRoom,
        });
        
        const roomText = selectedRoom ? ` - Phòng ${selectedRoom}` : '';
        const botMessage: Message = {
          id: generateMessageId(),
          text: `🎉 Tuyệt vời! Bạn muốn đặt phòng tại ${currentHotel.name}${roomText}.\n\n📅 Bạn muốn đặt từ ngày nào đến ngày nào?\n\nVui lòng nhập theo định dạng: DD/MM/YYYY và DD/MM/YYYY\nVí dụ: 20/12/2025 và 25/12/2025`,
          isUser: false,
          time: getCurrentTime(),
          type: 'text',
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return;
      }
      
      // Existing booking logic for other cases
      if (isBookingRequest) {
        setBookingFlow({ active: true, step: 'ask_dates' });
        
        const botMessage: Message = {
          id: generateMessageId(),
          text: '🎉 Tuyệt vời! Tôi sẽ giúp bạn đặt phòng.\n\n📅 Bạn muốn đặt phòng từ ngày nào đến ngày nào?\n\nVui lòng nhập theo định dạng: DD/MM/YYYY và DD/MM/YYYY\nVí dụ: 20/12/2025 và 25/12/2025',
          isUser: false,
          time: getCurrentTime(),
          type: 'text',
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
        
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
        return;
      }

      const conversationHistory = messages.map(msg => ({
        role: msg.isUser ? 'user' : 'bot',
        text: msg.text
      }));

      let botResponse = await callGeminiWithContext(messageText, conversationHistory);
      botResponse = cleanMarkdown(botResponse);
      
      const context = await getAppContext();
      
      // Check if user asking about rooms - IMPROVED LOGIC
      const isAskingAboutRooms = (
        lowerMessage.includes('phòng') || 
        lowerMessage.includes('room') ||
        lowerMessage.includes('loại phòng') ||
        lowerMessage.includes('room type') ||
        lowerMessage.includes('có những phòng nào') ||
        lowerMessage.includes('các phòng') ||
        lowerMessage.includes('danh sách phòng') ||
        lowerMessage.includes('phòng nào') ||
        lowerMessage.includes('types of room') ||
        /phòng.*nào/.test(lowerMessage)
      );

      // Check if contains hotel name or specific hotel reference
      const hasHotelName = await containsHotelName(messageText, context);
      const isAskingAboutSpecificHotel = (
        lowerMessage.includes('khách sạn') ||
        lowerMessage.includes('hotel') ||
        /khách sạn\s+.+\s+có/.test(lowerMessage) ||
        /hotel\s+.+\s+has/.test(lowerMessage) ||
        currentHotel !== null ||
        hasHotelName
      );

      const shouldShowRooms = isAskingAboutRooms && isAskingAboutSpecificHotel;
      
      console.log('Room detection:', {
        isAskingAboutRooms,
        isAskingAboutSpecificHotel,
        shouldShowRooms,
        message: messageText,
        hasHotelName
      });

      if (shouldShowRooms) {
        // Try to extract hotel name from message
        let targetHotel = await findHotelFromMessage(messageText, context);
        
        // If no hotel found from message, use current hotel context
        if (!targetHotel && currentHotel) {
          targetHotel = currentHotel;
        }
        
        // If still no hotel, use first hotel from context as fallback
        if (!targetHotel && context.hotels?.length > 0) {
          targetHotel = context.hotels[0];
          console.log('Using fallback hotel:', targetHotel.name);
        }

        if (targetHotel) {
          setCurrentHotel({
            id: targetHotel._id || targetHotel.id,
            name: targetHotel.name,
            location: targetHotel.location,
            price: targetHotel.price,
            rating: Number(targetHotel.rating),
            image: targetHotel.photos?.[0] || targetHotel.image,
          });
          const rooms = await getRoomsFromHotel(targetHotel);
          
          console.log('Rooms found:', rooms);
          
          if (rooms && rooms.length > 0) {
            const botMessage: Message = {
              id: generateMessageId(),
              text: `🏨 ${targetHotel.name} có ${rooms.length} loại phòng:`,
              isUser: false,
              time: getCurrentTime(),
              type: 'rooms_list',
              rooms: rooms,
              hotelName: targetHotel.name,
            };
            setMessages(prev => [...prev, botMessage]);
          } else {
            const botMessage: Message = {
              id: generateMessageId(),
              text: botResponse || `Hiện tại tôi chưa có thông tin về các phòng của ${targetHotel.name}. Vui lòng thử lại sau hoặc liên hệ trực tiếp với khách sạn.`,
              isUser: false,
              time: getCurrentTime(),
              type: 'text',
            };
            setMessages(prev => [...prev, botMessage]);
          }
        } else {
          const botMessage: Message = {
            id: generateMessageId(),
            text: botResponse || "Tôi không tìm thấy thông tin về khách sạn này. Bạn có thể nói rõ tên khách sạn hoặc chọn từ danh sách khách sạn bên dưới?",
            isUser: false,
            time: getCurrentTime(),
            type: 'text',
          };
          setMessages(prev => [...prev, botMessage]);
          
          // FIXED: Only show hotel list if we have relevant hotels
          const relevantHotels = await findRelevantHotels(messageText, context);
          if (relevantHotels.length > 0) {
            const hotelListMessage: Message = {
              id: generateMessageId(),
              text: "Đây là một số khách sạn có sẵn:",
              isUser: false,
              time: getCurrentTime(),
              type: 'hotels_list',
              hotels: relevantHotels.slice(0, 3),
            };
            setMessages(prev => [...prev, hotelListMessage]);
          }
        }
      } else {
        // Check if we should display hotels - FIXED LOGIC
        const hasHotelKeyword = lowerMessage.includes('khách sạn') || lowerMessage.includes('hotel');
        const hasLocationKeyword = lowerMessage.includes('sài gòn') || lowerMessage.includes('saigon') ||
                                 lowerMessage.includes('hà nội') || lowerMessage.includes('hanoi') ||
                                 lowerMessage.includes('đà nẵng') || lowerMessage.includes('danang') ||
                                 lowerMessage.includes('lạng sơn') || lowerMessage.includes('lang son');
        
        const isSearchingHotels = (
          lowerMessage.includes('tìm khách sạn') || 
          lowerMessage.includes('find hotel') ||
          lowerMessage.includes('danh sách khách sạn') ||
          lowerMessage.includes('gợi ý khách sạn') ||
          lowerMessage.includes('list hotel') ||
          (hasHotelKeyword && (lowerMessage.includes('ở') || lowerMessage.includes('tại') || lowerMessage.includes('in'))) ||
          (hasLocationKeyword && hasHotelKeyword)
        );
        
        const shouldShowHotels = isSearchingHotels;
        
        if (shouldShowHotels) {
          const relevantHotels = await findRelevantHotels(messageText, context);
          
          // FIXED: Only show hotel list if we have relevant results
          if (relevantHotels.length > 0) {
            const botMessage: Message = {
              id: generateMessageId(),
              text: botResponse,
              isUser: false,
              time: getCurrentTime(),
              type: 'hotels_list',
              hotels: relevantHotels.slice(0, 5),
            };
            setMessages(prev => [...prev, botMessage]);
          } else {
            // Show no results message instead of default hotels
            const botMessage: Message = {
              id: generateMessageId(),
              text: botResponse || `❌ Không tìm thấy khách sạn phù hợp với yêu cầu "${messageText}".\n\nBạn có thể thử:\n• Tìm kiếm ở thành phố khác\n• Thay đổi tiêu chí tìm kiếm\n• Liên hệ hỗ trợ để được tư vấn thêm`,
              isUser: false,
              time: getCurrentTime(),
              type: 'text',
            };
            setMessages(prev => [...prev, botMessage]);
          }
        } else {
          const botMessage: Message = {
            id: generateMessageId(),
            text: botResponse,
            isUser: false,
            time: getCurrentTime(),
            type: 'text',
          };
          setMessages(prev => [...prev, botMessage]);
        }
      }
    } catch (error: any) {
      console.error('Error calling AI:', error);
      
      const botResponse = getBotResponse(messageText);
      const botMessage: Message = {
        id: generateMessageId(),
        text: botResponse,
        isUser: false,
        time: getCurrentTime(),
        type: 'text',
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Get rooms from hotel data - fetch from API
  const getRoomsFromHotel = async (hotel: any) => {
    try {
      console.log('Fetching rooms for hotel:', hotel.id || hotel._id, hotel.name);
      
      // Fetch full hotel details with roomTypes from API
      const response = await getHotelById(hotel.id || hotel._id);
      
      if (response.success && response.data && response.data.roomTypes && response.data.roomTypes.length > 0) {
        // Use real room data from API
        const hotelImage = response.data.photos?.[0] || hotel.image || 'default-hotel.jpg';
        
        return response.data.roomTypes.map((room: any, index: number) => ({
          id: room._id || `room-${index}`,
          name: room.name,
          price: room.price,
          size: room.size ? parseInt(room.size.replace('m²', '').trim()) : 25,
          capacity: room.maxOccupancy || room.capacity || 2,
          amenities: room.amenities || [],
          image: room.images?.[0] || room.photos?.[0] || hotelImage,
          bedType: room.beds || room.bedType,
        }));
      }
      
      // Fallback if no roomTypes in API
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      return [];
    }
  };

  // Find relevant hotels based on user query - UPDATED
  const findRelevantHotels = async (query: string, context: any) => {
    const lowerQuery = query.toLowerCase();
    let filtered = context.hotels || [];

    // Filter by specific location keywords
    if (lowerQuery.includes('sài gòn') || lowerQuery.includes('saigon') || lowerQuery.includes('hồ chí minh')) {
      filtered = filtered.filter((h: any) => 
        h.location?.toLowerCase().includes('sài gòn') || 
        h.location?.toLowerCase().includes('saigon') ||
        h.location?.toLowerCase().includes('hồ chí minh')
      );
    }
    if (lowerQuery.includes('hà nội') || lowerQuery.includes('hanoi')) {
      filtered = filtered.filter((h: any) => 
        h.location?.toLowerCase().includes('hà nội') || 
        h.location?.toLowerCase().includes('hanoi')
      );
    }
    if (lowerQuery.includes('đà nẵng') || lowerQuery.includes('danang')) {
      filtered = filtered.filter((h: any) => 
        h.location?.toLowerCase().includes('đà nẵng') || 
        h.location?.toLowerCase().includes('danang')
      );
    }
    
    // NEW: Filter for other locations - return empty if no match
    if (lowerQuery.includes('lạng sơn') || lowerQuery.includes('lang son') ||
        lowerQuery.includes('hải phòng') || lowerQuery.includes('haiphong') ||
        lowerQuery.includes('cần thơ') || lowerQuery.includes('cantho')) {
      filtered = filtered.filter((h: any) => 
        h.location?.toLowerCase().includes(lowerQuery)
      );
    }

    // If query has location but no results, return empty array
    const hasLocationQuery = (
      lowerQuery.includes('ở') || 
      lowerQuery.includes('tại') ||
      lowerQuery.includes('in ') ||
      lowerQuery.includes('tìm khách sạn') ||
      lowerQuery.match(/(?:ở|tại|in)\s+[^,.!?]+/)
    );
    
    if (hasLocationQuery && filtered.length === 0) {
      return [];
    }

    // Filter by price
    if (lowerQuery.includes('rẻ') || lowerQuery.includes('cheap') || lowerQuery.includes('giá tốt')) {
      filtered = filtered.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
    }

    // Filter by rating
    if (lowerQuery.includes('rating') || lowerQuery.includes('đánh giá') || lowerQuery.includes('tốt') || lowerQuery.includes('cao')) {
      filtered = filtered.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
    }

    // Get hotel images from context
    const hotelsWithImages = filtered.map((hotel: any) => ({
      id: hotel._id || hotel.id,
      name: hotel.name,
      location: hotel.location,
      price: hotel.price || 100,
      rating: Number(hotel.rating) || 4.5,
      image: hotel.photos?.[0] || hotel.image || 'default-hotel.jpg',
    }));

    return hotelsWithImages;
  };

  // Handle booking flow steps - UPDATED
  const handleBookingFlow = async (userInput: string) => {
    const { step, hotelId, hotelName, checkIn, checkOut, selectedRoom } = bookingFlow;

    if (step === 'ask_dates') {
      // Parse dates from user input
      const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g;
      const dates = userInput.match(dateRegex);

      if (dates && dates.length >= 2) {
        // FIXED: If we already have hotel info, skip to ask_guests
        if (hotelId && hotelName) {
          setBookingFlow(prev => ({ 
            ...prev, 
            step: 'ask_guests', 
            checkIn: dates[0],
            checkOut: dates[1],
          }));

          const roomText = selectedRoom ? `\n🚪 Phòng: ${selectedRoom}` : '';
          const botMessage: Message = {
            id: generateMessageId(),
            text: `✅ Tuyệt! Đặt phòng tại ${hotelName}${roomText}\n📅 Check-in: ${dates[0]}, Check-out: ${dates[1]}\n\n👥 Bạn muốn đặt cho bao nhiêu người? (Ví dụ: 2 người)`,
            isUser: false,
            time: getCurrentTime(),
            type: 'text',
          };
          setMessages(prev => [...prev, botMessage]);
          
          // DEBUG: Log để kiểm tra
          console.log('Booking flow - Hotel already selected:', { hotelId, hotelName, selectedRoom });
        } else {
          // No hotel selected yet, proceed to ask_guests (sẽ hỏi chọn khách sạn sau)
          setBookingFlow(prev => ({ 
            ...prev, 
            step: 'ask_guests', 
            checkIn: dates[0],
            checkOut: dates[1],
          }));

          const botMessage: Message = {
            id: generateMessageId(),
            text: `✅ Tuyệt! Check-in: ${dates[0]}, Check-out: ${dates[1]}\n\n👥 Bạn muốn đặt cho bao nhiêu người? (Ví dụ: 2 người)`,
            isUser: false,
            time: getCurrentTime(),
            type: 'text',
          };
          setMessages(prev => [...prev, botMessage]);
          
          console.log('Booking flow - No hotel selected yet');
        }
      } else {
        const botMessage: Message = {
          id: generateMessageId(),
          text: '⚠️ Vui lòng nhập ngày check-in và check-out theo định dạng: DD/MM/YYYY và DD/MM/YYYY\n\nVí dụ: 15/12/2025 và 18/12/2025',
          isUser: false,
          time: getCurrentTime(),
          type: 'text',
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } else if (step === 'ask_guests') {
      const guestsMatch = userInput.match(/\d+/);
      const guests = guestsMatch ? parseInt(guestsMatch[0]) : 2;

      // DEBUG: Log trạng thái hiện tại
      console.log('Booking flow state:', {
        hotelId: bookingFlow.hotelId,
        hotelName: bookingFlow.hotelName,
        selectedRoom: bookingFlow.selectedRoom,
        currentHotel: currentHotel
      });

      // FIXED: Check if hotel already selected from context or previous steps
      if (bookingFlow.hotelId && bookingFlow.hotelName) {
        console.log('✅ Proceeding to confirmation - Hotel already selected');
        
        // Hotel already selected, proceed directly to confirmation
        setBookingFlow(prev => ({ ...prev, step: 'confirm', guests }));
        
        // Show booking summary
        const roomText = selectedRoom ? `\n🚪 Phòng: ${selectedRoom}` : '';
        const summaryMessage: Message = {
          id: generateMessageId(),
          text: `✅ Hoàn tất thông tin đặt phòng!${roomText}`,
          isUser: false,
          time: getCurrentTime(),
          type: 'booking_summary',
          hotels: currentHotel ? [currentHotel] : [],
          bookingData: {
            step: 'confirm',
            hotelId: bookingFlow.hotelId,
            hotelName: bookingFlow.hotelName,
            checkIn: bookingFlow.checkIn,
            checkOut: bookingFlow.checkOut,
            guests: guests,
          },
        };
        setMessages(prev => [...prev, summaryMessage]);
        
        // Navigate to booking page
        setTimeout(() => {
          try {
            const checkInParam = bookingFlow.checkIn?.replace(/\//g, '-');
            const checkOutParam = bookingFlow.checkOut?.replace(/\//g, '-');
            
            let url = `/booking/create?hotelId=${bookingFlow.hotelId}&checkIn=${checkInParam}&checkOut=${checkOutParam}&guests=${guests}`;
            if (selectedRoom) {
              url += `&selectedRooms=${encodeURIComponent(selectedRoom)}`;
            }

             console.log('Navigating to:', url);

              router.push(url as any);
            
            
            setBookingFlow({ active: false, step: 'ask_hotel' });
          } catch (error) {
            console.error('Navigation error:', error);
            const errorMessage: Message = {
              id: generateMessageId(),
              text: '❌ Có lỗi xảy ra. Vui lòng thử lại!',
              isUser: false,
              time: getCurrentTime(),
              type: 'text',
            };
            setMessages(prev => [...prev, errorMessage]);
          }
        }, 3000);
        
        setIsLoading(false);
        return;
      }
      
      console.log('❌ No hotel selected, showing hotel list');
      
      // If no hotel selected yet, show hotels to choose
      const context = await getAppContext();
      const relevantHotels = await findRelevantHotels("", context);
      
      if (relevantHotels.length === 0) {
        const botMessage: Message = {
          id: generateMessageId(),
          text: '❌ Xin lỗi, không tìm thấy khách sạn phù hợp. Vui lòng thử lại sau! 🏨',
          isUser: false,
          time: getCurrentTime(),
          type: 'text',
        };
        setMessages(prev => [...prev, botMessage]);
        setBookingFlow({ active: false, step: 'ask_hotel' });
        setIsLoading(false);
        return;
      }

      setBookingFlow(prev => ({ ...prev, step: 'ask_hotel', guests }));

      const botMessage: Message = {
        id: generateMessageId(),
        text: `✅ Tuyệt! Đặt cho ${guests} người.\n\n🏨 Bây giờ hãy chọn khách sạn bạn muốn đặt:`,
        isUser: false,
        time: getCurrentTime(),
        type: 'hotels_list',
        hotels: relevantHotels.slice(0, 5),
      };
      setMessages(prev => [...prev, botMessage]);
    }

    setIsLoading(false);
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handle hotel selection from list
  const handleHotelSelect = (hotel: any) => {
    // If in booking flow, show summary card and navigate
    if (bookingFlow.active && bookingFlow.step === 'ask_hotel') {
      const { checkIn, checkOut, guests } = bookingFlow;
      
      setBookingFlow(prev => ({ 
        ...prev,
        hotelId: hotel.id,
        hotelName: hotel.name,
        step: 'confirm',
      }));

      // Show booking summary as card with hotel info
      const summaryMessage: Message = {
        id: generateMessageId(),
        text: '✅ Hoàn tất! Đây là tóm tắt đặt phòng:',
        isUser: false,
        time: getCurrentTime(),
        type: 'booking_summary',
        hotels: [hotel],
        bookingData: {
          step: 'confirm',
          hotelId: hotel.id,
          hotelName: hotel.name,
          checkIn: checkIn,
          checkOut: checkOut,
          guests: guests,
        },
      };
      setMessages(prev => [...prev, summaryMessage]);

      // Show navigation message
      const navMessage: Message = {
        id: generateMessageId(),
        text: '💳 Đang chuyển đến trang xác nhận đặt phòng...',
        isUser: false,
        time: getCurrentTime(),
        type: 'text',
      };
      setMessages(prev => [...prev, navMessage]);

      // Navigate to hotel detail page WITH booking params
      setTimeout(() => {
        try {
          // Convert dates to URL format
          const checkInParam = checkIn?.replace(/\//g, '-');
          const checkOutParam = checkOut?.replace(/\//g, '-');
          
          // Build URL with booking params so hotel detail page can use them
          let url = `/hotel/${hotel.id}?fromBooking=true&checkIn=${checkInParam}&checkOut=${checkOutParam}&guests=${guests}`;
          
          console.log('Navigating to hotel detail with booking params:', url);
          
          router.push(url as any);
          // Don't reset booking flow or close chat - preserve history
          setBookingFlow({ active: false, step: 'ask_hotel' });
        } catch (error) {
          console.error('Navigation error:', error);
          const errorMessage: Message = {
            id: generateMessageId(),
            text: '❌ Có lỗi xảy ra. Vui lòng thử lại!',
            isUser: false,
            time: getCurrentTime(),
            type: 'text',
          };
          setMessages(prev => [...prev, errorMessage]);
          setBookingFlow({ active: false, step: 'ask_hotel' });
        }
      }, 1500);
    } else {
      // Normal view mode - navigate to hotel detail
      router.push(`/hotel/${hotel.id}` as any);
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Handle room selection for booking - UPDATED
  const handleRoomSelect = (room: any, hotelName: string) => {
    // Tìm hotel từ context để lấy đầy đủ thông tin
    const findHotelFromContext = async () => {
      try {
        const context = await getAppContext();
        const hotels = context.hotels || [];
        const targetHotel = hotels.find((h: any) => 
          h.name.toLowerCase().includes(hotelName.toLowerCase()) || 
          hotelName.toLowerCase().includes(h.name.toLowerCase())
        );
        
        if (targetHotel) {
          setCurrentHotel({
            id: targetHotel._id || targetHotel.id,
            name: targetHotel.name,
            location: targetHotel.location,
            price: targetHotel.price,
            rating: Number(targetHotel.rating),
            image: targetHotel.photos?.[0] || targetHotel.image,
          });
          
          // QUAN TRỌNG: Set booking flow với hotelId
          setBookingFlow({ 
            active: true, 
            step: 'ask_dates',
            hotelId: targetHotel._id || targetHotel.id,
            hotelName: targetHotel.name,
            selectedRoom: room.name,
          });
        } else {
          // Fallback nếu không tìm thấy hotel
          setCurrentHotel({
            id: 'default-hotel-id',
            name: hotelName,
            location: '',
            price: room.price,
            rating: 4.5,
            image: room.image,
          });
          
          setBookingFlow({ 
            active: true, 
            step: 'ask_dates',
            hotelName: hotelName,
            selectedRoom: room.name,
          });
        }
      } catch (error) {
        console.error('Error finding hotel from context:', error);
        // Fallback
        setCurrentHotel({
          id: 'default-hotel-id',
          name: hotelName,
          location: '',
          price: room.price,
          rating: 4.5,
          image: room.image,
        });
        
        setBookingFlow({ 
          active: true, 
          step: 'ask_dates',
          hotelName: hotelName,
          selectedRoom: room.name,
        });
      }
    };

    findHotelFromContext();
    
    const botMessage: Message = {
      id: generateMessageId(),
      text: `🎉 Tuyệt vời! Bạn muốn đặt phòng ${room.name} tại ${hotelName}.\n\n📅 Bạn muốn đặt từ ngày nào đến ngày nào?\n\nVui lòng nhập theo định dạng: DD/MM/YYYY và DD/MM/YYYY\nVí dụ: 20/12/2025 và 25/12/2025`,
      isUser: false,
      time: getCurrentTime(),
      type: 'text',
    };
    setMessages(prev => [...prev, botMessage]);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getBotResponse = (userMessage: string) => {
    const lowerMessage = userMessage.toLowerCase();
    const vietnameseMessage = userMessage;
    
    if (lowerMessage.includes('hotel') || lowerMessage.includes('khách sạn') || 
        lowerMessage.includes('available') || lowerMessage.includes('có gì') ||
        lowerMessage.includes('show') || lowerMessage.includes('hiển thị')) {
      return "Tôi có thể giúp bạn tìm khách sạn! 🏨\n\nTôi có thông tin về:\n• Tất cả khách sạn (vị trí, giá, rating)\n• Tiện nghi và dịch vụ\n• So sánh giá và đánh giá\n\nHãy hỏi tôi:\n- 'Khách sạn ở Sài Gòn'\n- 'Chỗ nào rẻ?'\n- 'Gợi ý khách sạn đẹp'";
    } 
    
    if (lowerMessage.includes('booking') || lowerMessage.includes('đặt phòng') ||
        lowerMessage.includes('book') || lowerMessage.includes('đặt chưa')) {
      return "Tôi có thể kiểm tra booking của bạn! 📅\n\nThông tin tôi có:\n• Booking hiện tại\n• Lịch sử đặt phòng\n• Trạng thái và chi tiết\n\nHỏi tôi:\n- 'Mình đã đặt phòng chưa?'\n- 'Booking của tôi'\n- 'Check-in khi nào?'";
    }
    
    if (lowerMessage.includes('favorite') || lowerMessage.includes('yêu thích') ||
        lowerMessage.includes('saved') || lowerMessage.includes('lưu')) {
      return "Tôi biết khách sạn yêu thích của bạn! ⭐\n\nBạn có thể hỏi:\n• 'Khách sạn yêu thích'\n• 'Cái nào rẻ nhất?'\n• 'So sánh favorites'";
    }
    
    if (lowerMessage.includes('cheap') || lowerMessage.includes('rẻ') ||
        lowerMessage.includes('budget') || lowerMessage.includes('giá tốt')) {
      return "Đang tìm khách sạn giá tốt? 💰\n\nTôi sẽ tìm:\n• Khách sạn giá rẻ nhất\n• Deals và khuyến mãi\n• So sánh giá theo khu vực\n\nThử hỏi: 'Khách sạn dưới $50'";
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('gợi ý') ||
        lowerMessage.includes('suggest') || lowerMessage.includes('tư vấn') ||
        lowerMessage.includes('nên') || lowerMessage.includes('đẹp')) {
      return "Để tôi gợi ý khách sạn! 🌟\n\nTôi có thể tìm:\n• Khách sạn rating cao\n• Phù hợp với nhu cầu\n• Gần điểm du lịch\n\nHỏi tôi:\n- 'Khách sạn romantic'\n- 'Cho gia đình'\n- 'Gần biển'";
    }
    
    if (lowerMessage.includes('where') || lowerMessage.includes('ở đâu') ||
        lowerMessage.includes('location') || lowerMessage.includes('vị trí') ||
        lowerMessage.includes('near') || lowerMessage.includes('gần')) {
      return "Tìm khách sạn theo vị trí! 📍\n\nTôi biết tất cả:\n• Khách sạn ở Sài Gòn, Đà Nẵng, Hà Nội\n• Gần biển, gần trung tâm\n• Theo quận, theo khu vực\n\nVí dụ: 'Khách sạn ở District 1'";
    }
    
    if (lowerMessage.includes('price') || lowerMessage.includes('giá') ||
        lowerMessage.includes('cost') || lowerMessage.includes('bao nhiêu') ||
        lowerMessage.includes('$')) {
      return "Hỏi về giá khách sạn? 💵\n\nTôi có thể:\n• So sánh giá các khách sạn\n• Tìm theo budget\n• Giá theo đêm/tuần\n\nThử: 'Giá khách sạn nào rẻ nhất?'";
    }
    
    if (lowerMessage.includes('hi') || lowerMessage.includes('hello') ||
        lowerMessage.includes('xin chào') || lowerMessage.includes('chào')) {
      return `Xin chào! Tôi là Bookie �\n\nTôi có thể giúp bạn:\n✨ Tìm khách sạn phù hợp\n✨ Kiểm tra booking\n✨ Gợi ý địa điểm\n✨ So sánh giá và rating\n\nHãy hỏi tôi bất cứ điều gì về khách sạn!`;
    }
    
    return "Tôi là Bookie - trợ lý AI của bạn! 🤖\n\nBạn có thể hỏi tôi:\n💡 'Khách sạn nào đẹp?'\n💡 'Booking của mình?'\n💡 'Gợi ý chỗ ở'\n💡 'So sánh giá'\n💡 'Gần biển/trung tâm'\n\nHãy hỏi tôi bất cứ điều gì nhé! 😊";
  };

  const handleQuickTopic = (topic: string) => {
    handleSendMessage(topic);
  };

  const handleClearHistory = async () => {
    try {
      await chatStorage.clearAllMessages();
      setMessages([]);
      setShowWelcome(true);
      console.log('Chat history cleared');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  };

  const handleChatWithCS = () => {
    setShowWelcome(false);
    const message: Message = {
      id: generateMessageId(),
      text: "Connecting you to our customer service team...",
      isUser: false,
      time: getCurrentTime(),
    };
    setMessages([message]);
    
    setTimeout(() => {
      const csMessage: Message = {
        id: generateMessageId(),
        text: "A customer service representative will be with you shortly. Average wait time: 2-3 minutes.",
        isUser: false,
        time: getCurrentTime(),
      };
      setMessages(prev => [...prev, csMessage]);
    }, 1500);
  };

  if (!isOpen) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: 'https://hotel-booking-image.s3.ap-southeast-1.amazonaws.com/chatbox/img_0724-Photoroom.png' }}
          style={styles.floatingButtonImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View
      style={[
        styles.chatContainer,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {!showWelcome && messages.length > 0 && (
              <TouchableOpacity onPress={() => setClearModalVisible(true)} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.headerTitle}>Live Chat</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeButton}>
              <X size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {!auth.currentUser && (
            <TouchableOpacity 
              style={styles.loginBanner}
              onPress={() => {
                setIsOpen(false);
                router.push('/auth/login');
              }}
              activeOpacity={0.9}
            >
              <View style={styles.loginBannerContent}>
                <MessageCircle size={20} color="#17A2B8" />
                <Text style={styles.loginBannerText}>
                  Đăng nhập để lưu lịch sử chat và đặt phòng dễ dàng hơn
                </Text>
              </View>
              <ChevronRight size={20} color="#17A2B8" />
            </TouchableOpacity>
          )}
          {showWelcome ? (
            <View style={styles.welcomeContainer}>
              {/* Bot Avatar */}
              <View style={styles.botAvatarContainer}>
                <View style={styles.botAvatar}>
                  <MessageCircle size={32} color="#17A2B8" />
                </View>
              </View>

              {/* Welcome Message */}
              <Text style={styles.botName}>Xin chào! Tôi là Bookie 👋</Text>
              <Text style={styles.welcomeText}>
                Tôi hiểu tiếng Việt & English!{'\n'}Hỏi tôi bất cứ điều gì về khách sạn nhé 😊
              </Text>

              {/* Quick Topics */}
              <View style={styles.topicsContainer}>
                <Text style={styles.topicsTitle}>Câu hỏi gợi ý 💡</Text>
                <Text style={styles.topicsSubtitle}>
                  Chọn câu hỏi mẫu hoặc tự do hỏi bất cứ điều gì. Tôi hiểu cả tiếng Việt lẫn English!
                </Text>

                <View style={styles.topicsList}>
                  {quickTopics.map((topic, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.topicItem}
                      onPress={() => handleQuickTopic(topic)}
                    >
                      <Text style={styles.topicText}>{topic}</Text>
                      <Text style={styles.topicArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.csButton} onPress={handleChatWithCS}>
                  <MessageCircle size={18} color="white" />
                  <Text style={styles.csButtonText}>Chat with CS</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timestamp}>{getCurrentTime()}</Text>
            </View>
          ) : (
            <>
              {messages.map((message, index) => (
                <View key={`${message.id}-${index}`}>
                  {/* Regular message bubble */}
                  <View
                    style={[
                      styles.messageBubble,
                      message.isUser ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        message.isUser ? styles.userText : styles.botText,
                      ]}
                    >
                      {message.text}
                    </Text>
                    <Text
                      style={[
                        styles.messageTime,
                        message.isUser ? styles.userTime : styles.botTime,
                      ]}
                    >
                      {message.time}
                    </Text>
                  </View>

                  {/* Hotel cards list */}
                  {message.type === 'hotels_list' && message.hotels && message.hotels.length > 0 && (
                    <View style={styles.hotelsContainer}>
                      {message.hotels.map((hotel, index) => (
                        <TouchableOpacity
                          key={`${hotel.id}-${index}`}
                          style={styles.hotelCard}
                          activeOpacity={0.9}
                          onPress={() => {
                            // Set current hotel context when clicking any hotel
                            setCurrentHotel(hotel);
                            
                            if (bookingFlow.active && bookingFlow.step === 'ask_hotel') {
                              handleHotelSelect(hotel);
                            } else {
                              router.push(`/hotel/${hotel.id}` as any);
                            }
                          }}
                        >
                          <Image 
                            source={{ 
                              uri: getImageUri(hotel.image),
                              cache: 'force-cache'
                            }} 
                            style={styles.hotelCardImage}
                            onError={(e) => console.log('Hotel image error:', hotel.image)}
                          />
                          <View style={styles.hotelCardContent}>
                            <Text style={styles.hotelCardName} numberOfLines={1}>{hotel.name}</Text>
                            <View style={styles.hotelCardLocation}>
                              <MapPin size={12} color="#999" />
                              <Text style={styles.hotelCardLocationText} numberOfLines={1}>{hotel.location}</Text>
                            </View>
                            <View style={styles.hotelCardFooter}>
                              <View style={styles.hotelCardRating}>
                                <Star size={12} color="#FFD700" fill="#FFD700" />
                                <Text style={styles.hotelCardRatingText}>{hotel.rating != null ? Number(hotel.rating).toFixed(1).replace('.', ',') : '–'}</Text>
                              </View>
                              <Text style={styles.hotelCardPrice}>{hotel.price.toLocaleString('vi-VN')} VND/đêm</Text>
                            </View>
                          </View>
                          <View style={styles.hotelCardArrow}>
                            <ChevronRight size={20} color="#17A2B8" />
                          </View>
                        </TouchableOpacity>
                      ))}
                      {bookingFlow.active && bookingFlow.step === 'ask_hotel' && (
                        <Text style={styles.hotelCardHint}>👆 Nhấn vào khách sạn để chọn</Text>
                      )}
                    </View>
                  )}

                  {/* Booking summary card */}
                  {message.type === 'booking_summary' && message.hotels && message.hotels.length > 0 && message.bookingData && (
                    <View style={styles.bookingSummaryContainer}>
                      <View style={styles.summaryCard}>
                        {/* Hotel info */}
                        <View style={styles.summaryHotelSection}>
                          <Image 
                            source={{ 
                              uri: getImageUri(message.hotels[0].image),
                              cache: 'force-cache'
                            }} 
                            style={styles.summaryHotelImage}
                            
                          />
                          <View style={styles.summaryHotelInfo}>
                            <Text style={styles.summaryHotelName}>{message.hotels[0].name}</Text>
                            <View style={styles.summaryLocation}>
                              <MapPin size={10} color="#999" />
                              <Text style={styles.summaryLocationText}>{message.hotels[0].location}</Text>
                            </View>
                            <View style={styles.summaryRating}>
                              <Star size={10} color="#FFD700" fill="#FFD700" />
                              <Text style={styles.summaryRatingText}>{message.hotels[0].rating != null ? Number(message.hotels[0].rating).toFixed(1).replace('.', ',') : '–'}</Text>
                            </View>
                          </View>
                        </View>
                        
                        {/* Booking details */}
                        <View style={styles.summaryDetails}>
                          <View style={styles.summaryRow}>
                            <Calendar size={14} color="#17A2B8" />
                            <Text style={styles.summaryLabel}>Check-in:</Text>
                            <Text style={styles.summaryValue}>{message.bookingData.checkIn}</Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Calendar size={14} color="#17A2B8" />
                            <Text style={styles.summaryLabel}>Check-out:</Text>
                            <Text style={styles.summaryValue}>{message.bookingData.checkOut}</Text>
                          </View>
                          <View style={styles.summaryRow}>
                            <Users size={14} color="#17A2B8" />
                            <Text style={styles.summaryLabel}>Guests:</Text>
                            <Text style={styles.summaryValue}>{message.bookingData.guests} người</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Rooms list */}
                  {message.type === 'rooms_list' && message.rooms && message.rooms.length > 0 && (
                    <View style={styles.roomsContainer}>
                      <Text style={styles.roomsTitle}>🏨 {message.hotelName} - {message.rooms.length} loại phòng</Text>
                      {message.rooms.map((room, index) => (
                        <TouchableOpacity 
                          key={room.id || index} 
                          style={styles.roomCard}
                          onPress={() => handleRoomSelect(room, message.hotelName || '')}
                          activeOpacity={0.8}
                        >
                          <Image 
                            source={{ 
                              uri: getImageUri(room.image),
                              cache: 'force-cache'
                            }} 
                            style={styles.roomImage}
                            onError={(e) => console.log('Room image error:', room.image)}
                          />
                          <View style={styles.roomContent}>
                            <View style={styles.roomHeader}>
                              <Text style={styles.roomName}>{room.name}</Text>
                              <Text style={styles.roomPrice}>{room.price.toLocaleString('vi-VN')} VND/đêm</Text>
                            </View>
                            
                            <View style={styles.roomDetails}>
                              <View style={styles.roomDetail}>
                                <Text style={styles.roomDetailIcon}>📐</Text>
                                <Text style={styles.roomDetailText}>{room.size}m²</Text>
                              </View>
                              <View style={styles.roomDetail}>
                                <Text style={styles.roomDetailIcon}>👥</Text>
                                <Text style={styles.roomDetailText}>{room.capacity} người</Text>
                              </View>
                              {room.bedType && (
                                <View style={styles.roomDetail}>
                                  <Text style={styles.roomDetailIcon}>🛏️</Text>
                                  <Text style={styles.roomDetailText}>{room.bedType}</Text>
                                </View>
                              )}
                            </View>

                            {room.amenities && room.amenities.length > 0 && (
                              <View style={styles.roomAmenities}>
                                <Text style={styles.amenitiesTitle}>Tiện nghi:</Text>
                                <View style={styles.amenitiesList}>
                                  {room.amenities.slice(0, 4).map((amenity, idx) => (
                                    <View key={idx} style={styles.amenityTag}>
                                      <Text style={styles.amenityText}>{amenity}</Text>
                                    </View>
                                  ))}
                                  {room.amenities.length > 4 && (
                                    <View style={styles.amenityTag}>
                                      <Text style={styles.amenityText}>+{room.amenities.length - 4}</Text>
                                    </View>
                                  )}
                                </View>
                              </View>
                            )}
                            
                            <View style={styles.roomAction}>
                              <Text style={styles.roomActionText}>👉 Nhấn để đặt phòng này</Text>
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </>
          )}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingBubble}>
                <View style={styles.typingIndicator}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Paperclip size={20} color="#999" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Write a message..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && !isLoading && styles.sendButtonActive]}
            onPress={() => handleSendMessage()}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={inputText.trim() && !isLoading ? '#17A2B8' : '#999'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Clear History Confirmation Modal */}
      <ConfirmModal
        visible={clearModalVisible}
        title="Xóa lịch sử chat"
        message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat không?\n\nTất cả tin nhắn sẽ bị xóa vĩnh viễn."
        confirmText="Xóa tất cả"
        cancelText="Quay lại"
        confirmColor="#FF6B6B"
        icon={<Trash2 size={48} color="#FF6B6B" />}
        onConfirm={handleClearHistory}
        onCancel={() => setClearModalVisible(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  loginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 162, 184, 0.3)',
  },
  loginBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  loginBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17A2B8',
    flex: 1,
  },
  floatingButtonImage: {
    width: 70,
    height: 70,
    borderRadius: 30,
    shadowColor: '#000',
  },
  chatContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1001,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    minWidth: 80,
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 4,
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 10,
  },
  welcomeContainer: {
    alignItems: 'center',
  },
  botAvatarContainer: {
    marginBottom: 20,
  },
  botAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  topicsContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  topicsSubtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 16,
  },
  topicsList: {
    marginBottom: 16,
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  topicText: {
    fontSize: 13,
    color: '#1a1a1a',
    flex: 1,
  },
  topicArrow: {
    fontSize: 20,
    color: '#999',
    marginLeft: 8,
  },
  csButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#17A2B8',
    paddingVertical: 12,
    borderRadius: 24,
  },
  csButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#17A2B8',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#1a1a1a',
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  userTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  botTime: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: '#1a1a1a',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    // Active state can be used for animation
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  loadingBubble: {
    backgroundColor: 'white',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
  
  // Hotel Cards
  hotelsContainer: {
    marginTop: 12,
    gap: 12,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  hotelCardImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  hotelCardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  hotelCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  hotelCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hotelCardLocationText: {
    fontSize: 12,
    color: '#999',
    flex: 1,
  },
  hotelCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  hotelCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hotelCardRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  hotelCardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#17A2B8',
    letterSpacing: -0.3,
  },
  hotelCardArrow: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  hotelCardHint: {
    fontSize: 12,
    color: '#17A2B8',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
  },
  
  // Booking Summary Card
  bookingSummaryContainer: {
    marginTop: 12,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#17A2B8',
  },
  summaryHotelSection: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryHotelImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  summaryHotelInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  summaryHotelName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  summaryLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryLocationText: {
    fontSize: 11,
    color: '#999',
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  summaryRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  summaryDetails: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  
  // Rooms List
  roomsContainer: {
    marginTop: 12,
    gap: 12,
  },
  roomsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  roomImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  roomContent: {
    padding: 14,
  },
  roomHeader: {
    marginBottom: 10,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  roomPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#17A2B8',
    letterSpacing: -0.3,
  },
  roomDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(23,162,184,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roomDetailIcon: {
    fontSize: 12,
  },
  roomDetailText: {
    fontSize: 12,
    color: '#17A2B8',
    fontWeight: '600',
  },
  roomAmenities: {
    marginBottom: 12,
  },
  amenitiesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  amenitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  amenityTag: {
    backgroundColor: 'rgba(23,162,184,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(23,162,184,0.15)',
  },
  amenityText: {
    fontSize: 11,
    color: '#17A2B8',
    fontWeight: '500',
  },
  roomAction: {
    backgroundColor: '#17A2B8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  roomActionText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '700',
  },
});