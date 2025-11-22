import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, Heart, MapPin, Star, Search, Sparkles, TrendingUp, Calendar, Users } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getFeaturedHotels, getAllHotels, Hotel } from '../../services/hotelService';
import { getUserFavorites, toggleFavorite } from '../../services/userService';
import { getMe } from '../../services/authService';
import { auth } from '../../config/firebase';
import { getAllUpcomingBookings, Booking } from '../../services/bookingService';
import { getImageUri } from '../../utils/imageHelper';
import ChatBox from '../../components/ChatBox';
import { useToast } from '../../contexts/ToastContext';
import FeaturedHotelCard from '../../components/FeaturedHotelCard';

const { width, height } = Dimensions.get('window');
const FEATURED_CARD_WIDTH = width * 0.85;

const destinations = [
  { id: 1, name: 'Saigon', hotels: 120, image: 'https://hotel-booking-image.s3.ap-southeast-1.amazonaws.com/destinations/sai-gon.jpg' },
  { id: 2, name: 'Da Nang', hotels: 85, image: 'https://hotel-booking-image.s3.ap-southeast-1.amazonaws.com/destinations/da-nang.jpg' },
  { id: 3, name: 'Hanoi', hotels: 95, image: 'https://hotel-booking-image.s3.ap-southeast-1.amazonaws.com/destinations/ha-noi.jpg' },
  { id: 4, name: 'Nha Trang', hotels: 67, image: 'https://hotel-booking-image.s3.ap-southeast-1.amazonaws.com/destinations/nha-trang.jpg' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { showError, showWarning } = useToast();
  const [hasNewNotifications] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [topRatedHotels, setTopRatedHotels] = useState<Hotel[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Hotel[]>([]);
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Guest');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [hotelsAvailability, setHotelsAvailability] = useState<Map<string, boolean>>(new Map());

  // Default dates: today to tomorrow
  const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      checkIn: today.toISOString(),
      checkOut: tomorrow.toISOString()
    };
  };

  // Helper function to check date overlap
  const checkDateOverlap = (
    checkIn1: string | Date,
    checkOut1: string | Date,
    checkIn2: string | Date,
    checkOut2: string | Date
  ): boolean => {
    const start1 = new Date(checkIn1).getTime();
    const end1 = new Date(checkOut1).getTime();
    const start2 = new Date(checkIn2).getTime();
    const end2 = new Date(checkOut2).getTime();
    return start1 < end2 && start2 < end1;
  };

  // Check hotel availability
  const checkHotelAvailability = (hotelId: string, checkIn: string, checkOut: string): boolean => {
    if (upcomingBookings.length === 0) {
      return true;
    }

    const overlappingBookings = upcomingBookings.filter(booking => {
      const bookingHotelId = typeof booking.hotelId === 'string' 
        ? booking.hotelId 
        : booking.hotelId._id;
      
      return bookingHotelId === hotelId && 
             checkDateOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut);
    });

    const bookedRoomTypes = new Set<string>();
    overlappingBookings.forEach(booking => {
      if (booking.roomType && Array.isArray(booking.roomType)) {
        booking.roomType.forEach(rt => bookedRoomTypes.add(rt));
      }
    });

    return bookedRoomTypes.size < 3;
  };

  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        loadUserFavorites();
      }
    }, [userId])
  );

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load bookings for availability check
      const bookingsResponse = await getAllUpcomingBookings();
      if (bookingsResponse.success && bookingsResponse.data) {
        setUpcomingBookings(bookingsResponse.data);
      }

      const hotelsResponse = await getFeaturedHotels();
      if (hotelsResponse.success && hotelsResponse.data) {
        setHotels(hotelsResponse.data.slice(0, 6));
      }

      const allHotelsResponse = await getAllHotels({ limit: 20 });
      if (allHotelsResponse.success && allHotelsResponse.data) {
        const topRated = allHotelsResponse.data
          .filter((h: Hotel) => h.rating >= 4.5)
          .slice(0, 4);
        setTopRatedHotels(topRated);

        const offers = allHotelsResponse.data
          .filter((h: Hotel) => h.price < 100)
          .slice(0, 4);
        setSpecialOffers(offers);

        // Check availability for all hotels with default dates (today to tomorrow)
        const { checkIn, checkOut } = getDefaultDates();
        const availMap = new Map<string, boolean>();
        const allLoadedHotels = [...hotelsResponse.data, ...allHotelsResponse.data];
        allLoadedHotels.forEach(hotel => {
          const isAvailable = checkHotelAvailability(hotel._id, checkIn, checkOut);
          availMap.set(hotel._id, isAvailable);
        });
        setHotelsAvailability(availMap);
      }

      // Load user data if logged in (optional)
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const meResponse = await getMe(token);
          if (meResponse.success && meResponse.data) {
            setUserId(meResponse.data._id);
            setUserName(meResponse.data.userName || 'Guest');
            setUserAvatar(meResponse.data.avatar || null);
          }
        } catch (error) {
          console.log('Not logged in:', error);
          setUserName('Guest');
          setUserAvatar(null);
        }
      } else {
        setUserName('Guest');
        setUserAvatar(null);
      }
    } catch (error) {
      console.error('Load initial data error:', error);
      showError('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const loadUserFavorites = async () => {
    if (!userId) return;

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const favResponse = await getUserFavorites(userId, token);
      if (favResponse.success && favResponse.data) {
        const ids = favResponse.data.map((hotel: any) =>
          typeof hotel === 'string' ? hotel : hotel._id
        );
        setFavoriteHotelIds(ids);
      }
    } catch (error) {
      console.log('Error loading favorites:', error);
    }
  };

  const handleToggleFavorite = async (hotelId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showWarning('Please login to save favorites');
      setTimeout(() => router.push('/auth/login' as any), 1500);
      return;
    }

    if (!userId) {
      showWarning('Please login to save favorites');
      setTimeout(() => router.push('/auth/login' as any), 1500);
      return;
    }

    try {
      const token = await currentUser.getIdToken();
      const isFavorite = favoriteHotelIds.includes(hotelId);

      const response = await toggleFavorite(userId, hotelId, token, isFavorite);
      if (response.success) {
        if (isFavorite) {
          setFavoriteHotelIds(prev => prev.filter(id => id !== hotelId));
        } else {
          setFavoriteHotelIds(prev => [...prev, hotelId]);
        }
      } else {
        showError(response.message || 'Failed to update favorite');
      }
    } catch (error: any) {
      showError(error.message || 'Failed to update favorite');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F8FA" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header - Modern Minimal Design */}
        <View style={styles.heroSection}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.userInfo}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{userName === 'Guest' ? 'G' : userName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View>
                <Text style={styles.heroGreeting}>Hello, {userName} 👋</Text>
                <Text style={styles.heroSubtitle}>Let's find your perfect stay</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => router.push('/notifications' as any)}
            >
              <Bell size={22} color="#1A1A1A" strokeWidth={2} />
              {hasNewNotifications && <View style={styles.notificationDot} />}
            </TouchableOpacity>
          </View>

          {/* Large Search Bar with Categories */}
          <View style={styles.searchSection}>
            <TouchableOpacity
              style={styles.mainSearchBar}
              onPress={() => router.push('/search' as any)}
              activeOpacity={0.7}
            >
              <View style={styles.searchIconContainer}>
                <Search size={24} color="#07A3B2" strokeWidth={2.5} />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchTitle}>Where to?</Text>
                <Text style={styles.searchSubtitle}>Search destinations, hotels...</Text>
              </View>
            </TouchableOpacity>

            {/* Quick Filter Chips */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChips}
            >
              <TouchableOpacity style={styles.filterChip}>
                <Sparkles size={16} color="#07A3B2" strokeWidth={2.5} />
                <Text style={styles.filterChipText}>Featured</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip}>
                <Star size={16} color="#FFD700" strokeWidth={2.5} fill="#FFD700" />
                <Text style={styles.filterChipText}>Top Rated</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip}>
                <TrendingUp size={16} color="#FF3B30" strokeWidth={2.5} />
                <Text style={styles.filterChipText}>Offers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterChip}>
                <Heart size={16} color="#FF6B9D" strokeWidth={2.5} />
                <Text style={styles.filterChipText}>Favorites</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Compact Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardNumber}>{hotels.length}+</Text>
                <Sparkles size={20} color="#07A3B2" strokeWidth={2} />
              </View>
              <Text style={styles.statCardLabel}>Hotels Available</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardNumber}>{topRatedHotels.length}+</Text>
                <Star size={20} color="#FFD700" strokeWidth={2} fill="#FFD700" />
              </View>
              <Text style={styles.statCardLabel}>Top Rated</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <Text style={styles.statCardNumber}>{favoriteHotelIds.length}</Text>
                <Heart size={20} color="#FF6B9D" strokeWidth={2} fill="#FF6B9D" />
              </View>
              <Text style={styles.statCardLabel}>Your Favorites</Text>
            </View>
          </View>
        </View>

        {/* Featured Hotels Carousel */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.iconCircle}>
                <Sparkles size={20} color="white" strokeWidth={2.5} />
              </View>
              <Text style={styles.sectionTitle}>Featured Hotels</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/search' as any)}>
              <Text style={styles.seeAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
            snapToInterval={FEATURED_CARD_WIDTH + 20}
            decelerationRate="fast"
          >
            {hotels.map((hotel, index) => (
              <View key={hotel._id} style={{ marginLeft: index === 0 ? 20 : 0 }}>
                <FeaturedHotelCard
                  hotel={hotel}
                  isAvailable={hotelsAvailability.get(hotel._id) ?? true}
                  isFavorite={favoriteHotelIds.includes(hotel._id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Popular Destinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.iconCircle}>
                <MapPin size={20} color="white" strokeWidth={2.5} />
              </View>
              <Text style={styles.sectionTitle}>Popular Destinations</Text>
            </View>
          </View>

          <View style={styles.destinationsGrid}>
            {destinations.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.destCard}
                onPress={() => router.push(`/search?location=${dest.name}` as any)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: dest.image }}
                  style={styles.destImage}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(7,163,178,0.95)']}
                  style={styles.destOverlay}
                >
                  <Text style={styles.destName}>{dest.name}</Text>
                  <Text style={styles.destHotels}>{dest.hotels} hotels</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Special Offers */}
        {specialOffers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.iconCircle}>
                  <TrendingUp size={20} color="white" strokeWidth={2.5} />
                </View>
                <Text style={styles.sectionTitle}>Special Offers</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/search' as any)}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.offersGrid}>
              {specialOffers.map((hotel) => (
                <TouchableOpacity
                  key={hotel._id}
                  style={styles.offerCard}
                  onPress={() => router.push(`/hotel/${hotel._id}`)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: getImageUri(hotel.photos[0]) }}
                    style={styles.offerImage}
                  />
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>-20%</Text>
                  </View>

                  <View style={styles.offerContent}>
                    <Text style={styles.offerName} numberOfLines={1}>{hotel.name}</Text>
                    <View style={styles.offerLocation}>
                      <MapPin size={12} color="#666" />
                      <Text style={styles.offerLocationText} numberOfLines={1}>
                        {hotel.location}
                      </Text>
                    </View>
                    <View style={styles.offerFooter}>
                      <View style={styles.offerRating}>
                        <Star size={12} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.offerRatingText}>{hotel.rating.toFixed(1)}</Text>
                      </View>
                      <View style={styles.offerPriceContainer}>
                        <Text style={styles.offerOldPrice}>{(hotel.price + 20).toLocaleString('vi-VN')} VND</Text>
                        <Text style={styles.offerPrice}>{hotel.price.toLocaleString('vi-VN')} VND</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Top Rated */}
        {topRatedHotels.length > 0 && (
          <View style={[styles.section, { marginBottom: 100 }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.iconCircle}>
                  <Star size={20} color="white" strokeWidth={2.5} />
                </View>
                <Text style={styles.sectionTitle}>Top Rated Hotels</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/search' as any)}>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topRatedScroll}
            >
              {topRatedHotels.map((hotel, index) => (
                <TouchableOpacity
                  key={hotel._id}
                  style={[styles.topRatedCard, { marginLeft: index === 0 ? 20 : 0 }]}
                  onPress={() => router.push(`/hotel/${hotel._id}`)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: getImageUri(hotel.photos[0]) }}
                    style={styles.topRatedImage}
                  />
                  <View style={styles.topRatedBadge}>
                    <Star size={14} color="#1A1A1A" fill="#1A1A1A" strokeWidth={2} />
                    <Text style={styles.topRatedBadgeText}>{hotel.rating.toFixed(1)}</Text>
                  </View>
                  <View style={styles.topRatedContent}>
                    <Text style={styles.topRatedName} numberOfLines={2}>{hotel.name}</Text>
                    <View style={styles.topRatedLocation}>
                      <MapPin size={10} color="#999" />
                      <Text style={styles.topRatedLocationText} numberOfLines={1}>
                        {hotel.location}
                      </Text>
                    </View>
                    <Text style={styles.topRatedPrice}>{hotel.price.toLocaleString('vi-VN')} VND<Text style={styles.topRatedNight}>/đêm</Text></Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
      <ChatBox />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },

  // Hero Section - Modern Minimal Design
  heroSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    gap: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#07A3B2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'white',
  },

  // Search Section - Modern Card Design
  searchSection: {
    gap: 14,
  },
  mainSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  searchIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E8F6F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  searchSubtitle: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },

  // Filter Chips
  filterChips: {
    flexDirection: 'row',
    gap: 10,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },

  // Stats Row - Card Based
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statCardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
  },
  statCardLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },

  // Sections - Enhanced with better spacing
  section: {
    marginTop: 36,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#07A3B2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.8,
  },
  seeAll: {
    fontSize: 14,
    color: '#07A3B2',
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Featured Hotels - Premium card design
  featuredScroll: {
    paddingRight: 20,
    gap: 20,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
    height: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  
  // Top badges row
  featuredTopRow: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  soldOutBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  featuredFavorite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backdropFilter: 'blur(10px)',
  },
  
  // Bottom gradient overlay
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    padding: 20,
    justifyContent: 'flex-end',
  },
  featuredInfo: {
    gap: 10,
  },
  featuredName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.8,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    flex: 1,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  featuredPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#07A3B2',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredPriceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },

  // Destinations - Modern card design
  destinationsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  destCard: {
    width: (width - 56) / 2,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  destImage: {
    width: '100%',
    height: '100%',
  },
  destOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    height: '60%',
    justifyContent: 'flex-end',
  },
  destName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  destHotels: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '700',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Special Offers - Eye-catching design
  offersGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  offerCard: {
    width: (width - 56) / 2,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  offerImage: {
    width: '100%',
    height: 120,
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  offerBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  offerContent: {
    padding: 14,
  },
  offerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.5,
    height: 36,
  },
  offerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  offerLocationText: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    fontWeight: '600',
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  offerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  offerPriceContainer: {
    alignItems: 'flex-end',
  },
  offerOldPrice: {
    fontSize: 10,
    color: '#999',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  offerPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF3B30',
    letterSpacing: -0.5,
  },

  // Top Rated - Premium compact cards
  topRatedScroll: {
    paddingRight: 20,
    gap: 16,
  },
  topRatedCard: {
    width: 170,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  topRatedImage: {
    width: '100%',
    height: 130,
  },
  topRatedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 214, 10, 0.98)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  topRatedBadgeText: {
    color: '#1A1A1A',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  topRatedContent: {
    padding: 14,
  },
  topRatedName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
    height: 36,
    letterSpacing: -0.5,
  },
  topRatedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  topRatedLocationText: {
    fontSize: 11,
    color: '#999',
    flex: 1,
    fontWeight: '600',
  },
  topRatedPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#07A3B2',
    letterSpacing: -0.5,
  },
  topRatedNight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
  },
});