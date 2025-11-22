import { useRouter, useFocusEffect } from 'expo-router';
import { MapPin, Star, Heart, Search, XCircle, ArrowRight, Sparkles } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Platform, StatusBar, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserFavorites, toggleFavorite } from '../../services/userService';
import { getMe } from '../../services/authService';
import { auth } from '../../config/firebase';
import { Hotel } from '../../services/hotelService';
import { getAllUpcomingBookings, Booking } from '../../services/bookingService';
import { useToast } from '../../contexts/ToastContext';
import FavoriteHotelCard from '../../components/FavoriteHotelCard';

type SortType = 'All' | 'Resort Location' | 'Price' | 'Rating';

export default function FavoritesScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [favorites, setFavorites] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<SortType>('All');
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

  // Reload favorites every time screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUserAndFavorites();
    }, [])
  );

  const loadUserAndFavorites = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      const token = await currentUser.getIdToken();
     
      const meResponse = await getMe(token);
      if (meResponse.success && meResponse.data) {
        const uid = meResponse.data._id;
        setUserId(uid);
        await loadFavorites(uid, token);
      }
    } catch (error) {
      console.error('Load user error:', error);
      showError('Failed to load user data');
      setLoading(false);
    }
  };

  const loadFavorites = async (uid: string, token: string) => {
    try {
      setLoading(true);

      // Load bookings for availability check
      const bookingsResponse = await getAllUpcomingBookings();
      if (bookingsResponse.success && bookingsResponse.data) {
        setUpcomingBookings(bookingsResponse.data);
      }

      const response = await getUserFavorites(uid, token);
     
      if (response.success) {
        setFavorites(response.data || []);

        // Check availability for all favorite hotels with default dates (today to tomorrow)
        const { checkIn, checkOut } = getDefaultDates();
        const availMap = new Map<string, boolean>();
        (response.data || []).forEach((hotel: Hotel) => {
          const isAvailable = checkHotelAvailability(hotel._id, checkIn, checkOut);
          availMap.set(hotel._id, isAvailable);
        });
        setHotelsAvailability(availMap);
      } else {
        showError('Failed to load favorites');
      }
    } catch (error) {
      console.error('Load favorites error:', error);
      showError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (hotelId: string, hotelName: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !userId) return;
      const token = await currentUser.getIdToken();
      const response = await toggleFavorite(userId, hotelId, token, true);
     
      if (response.success) {
        setFavorites(response.data || []);
        showSuccess(`Removed "${hotelName}" from favorites`);
      } else {
        showError('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Remove favorite error:', error);
      showError('Failed to remove from favorites');
    }
  };

  const getProcessedFavorites = () => {
    let processed = [...favorites];

    // 1. Filter by Search Text
    if (searchText) {
      const lowerSearch = searchText.toLowerCase();
      processed = processed.filter(h => 
        h.name.toLowerCase().includes(lowerSearch) || 
        h.location.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Sort based on selected filter
    switch (selectedFilter) {
      case 'All':
        return processed; // Keep original order
      case 'Price':
        return processed.sort((a, b) => {
          const priceA = a.roomTypes && a.roomTypes.length > 0 ? Math.min(...a.roomTypes.map(r => r.price)) : 0;
          const priceB = b.roomTypes && b.roomTypes.length > 0 ? Math.min(...b.roomTypes.map(r => r.price)) : 0;
          return priceA - priceB;
        });
      case 'Rating':
        return processed.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'Resort Location':
        return processed.sort((a, b) => a.location.localeCompare(b.location));
      default:
        return processed;
    }
  };

  const displayedFavorites = getProcessedFavorites();



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#07A3B2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>

        </View>
        
        {/* Integrated Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your saved places..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <XCircle size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter/Sort Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          {(['All','Resort Location', 'Price', 'Rating'] as SortType[]).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, selectedFilter === filter && styles.activeFilterChip]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                {filter === 'Resort Location' ? 'Location' : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!auth.currentUser && (
          <TouchableOpacity 
            style={styles.loginBanner}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.9}
          >
            <View style={styles.loginBannerContent}>
              <Heart size={20} color="#07A3B2" />
              <Text style={styles.loginBannerText}>
                Sign in to save your favorites
              </Text>
            </View>
            <ArrowRight size={20} color="#07A3B2" />
          </TouchableOpacity>
        )}
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color="#E5E7EB" fill="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>No favorites yet</Text>
            <Text style={styles.emptyStateText}>
              Save your dream stays to find them easily later.
            </Text>
          </View>
        ) : displayedFavorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={64} color="#E5E7EB" />
            <Text style={styles.emptyStateTitle}>No matches found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or filters.
            </Text>
          </View>
        ) : (
          displayedFavorites.map((hotel) => (
            <FavoriteHotelCard
              key={hotel._id}
              hotel={hotel}
              isAvailable={hotelsAvailability.get(hotel._id) ?? true}
              onToggleFavorite={(hotelId) => handleRemoveFavorite(hotelId, hotel.name)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  loginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 163, 178, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(7, 163, 178, 0.3)',
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
    color: '#07A3B2',
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 4,
    gap: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  countBadge: {
    backgroundColor: '#E6F6F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#07A3B2',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  
  // Filters
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: '#E6F6F7',
    borderColor: '#07A3B2',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeFilterText: {
    color: '#07A3B2',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    maxWidth: '70%',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  soldOutBadge: {
    position: 'absolute',
    bottom: 16,
    left: 90,
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Card Content
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },

  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#07A3B2',
  },
  viewButton: {
    backgroundColor: '#07A3B2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
