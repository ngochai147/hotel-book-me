import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Search as SearchIcon, SlidersHorizontal, Star, Users, Heart, Sparkles, TrendingUp } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FilterModal from '../components/FilterModal';
import { searchHotelsByLocation, getFilteredHotels, getAllHotels, Hotel } from '../services/hotelService';
import { getImageUri } from '../utils/imageHelper';
import { getUserFavorites, toggleFavorite } from '../services/userService';
import { getMe } from '../services/authService';
import { auth } from '../config/firebase';
import { useToast } from '../contexts/ToastContext';
import { getAllUpcomingBookings, Booking } from '../services/bookingService';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showError, showWarning } = useToast();
  const [searchQuery, setSearchQuery] = useState(params.location as string || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Hotel[]>([]);
  const [searchResults, setSearchResults] = useState<Hotel[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Hotel[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [hotelsAvailability, setHotelsAvailability] = useState<Map<string, boolean>>(new Map());
  
  // Date picker states
  const [selectedCheckIn, setSelectedCheckIn] = useState<Date | null>(null);
  const [selectedCheckOut, setSelectedCheckOut] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  useEffect(() => {
    loadInitialData();
    // Nếu có location từ params thì tự động search
    if (params.location) {
      setSearchQuery(params.location as string);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadUserFavorites();
    }
  }, [userId]);

  // Auto search khi searchQuery thay đổi
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500); // Debounce 500ms để tránh search quá nhiều

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Helper function to check if two date ranges overlap
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

  // Check hotel availability based on bookings
  const checkHotelAvailability = (hotelId: string, checkIn: string, checkOut: string): boolean => {
    if (!checkIn || !checkOut) {
      return true; // Available if no dates selected
    }

    if (upcomingBookings.length === 0) {
      return true; // Available if no bookings exist
    }

    // Count rooms booked for this hotel during the selected dates
    const overlappingBookings = upcomingBookings.filter(booking => {
      const bookingHotelId = typeof booking.hotelId === 'string' 
        ? booking.hotelId 
        : booking.hotelId._id;
      
      const isMatch = bookingHotelId === hotelId && 
                      checkDateOverlap(checkIn, checkOut, booking.checkIn, booking.checkOut);
      
      return isMatch;
    });

    // Debug log
    if (overlappingBookings.length > 0) {
      console.log(`Hotel ${hotelId} has ${overlappingBookings.length} overlapping bookings`, overlappingBookings);
    }

    // Get unique room types that are booked
    const bookedRoomTypes = new Set<string>();
    overlappingBookings.forEach(booking => {
      if (booking.roomType && Array.isArray(booking.roomType)) {
        booking.roomType.forEach(rt => bookedRoomTypes.add(rt));
      }
    });

    console.log(`Hotel ${hotelId}: ${bookedRoomTypes.size} room types booked`, Array.from(bookedRoomTypes));

    // Hotel is unavailable if 3 or more room types are booked
    // Most hotels have 3-4 room types, so this means nearly fully booked
    const isAvailable = bookedRoomTypes.size < 3;
    
    console.log(`Hotel ${hotelId} availability:`, isAvailable ? 'AVAILABLE' : 'SOLD OUT');
    
    return isAvailable;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load upcoming bookings to check availability
      const bookingsResponse = await getAllUpcomingBookings();
      if (bookingsResponse.success && bookingsResponse.data) {
        setUpcomingBookings(bookingsResponse.data);
      }

      // Load tất cả hotels khi vào màn hình
      const allHotelsResponse = await getAllHotels({ limit: 100 });
      if (allHotelsResponse.success && allHotelsResponse.data) {
        setRecommendations(allHotelsResponse.data);
        setSearchResults(allHotelsResponse.data); // Hiển thị tất cả ban đầu
      }

      // Load search history from localStorage (if implemented)
      const history = ['Saigon', 'Da Nang', 'Hanoi'];
      setSearchHistory(history);

      // Load user data (optional - for favorites)
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const meResponse = await getMe(token);
          if (meResponse.success && meResponse.data) {
            setUserId(meResponse.data._id);
          }
        } catch (error) {
          console.log('Not logged in:', error);
        }
      }
      
    } catch (error) {
      console.error('Load initial data error:', error);
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

  const performSearch = async (query?: string) => {
    const searchText = query !== undefined ? query : searchQuery;
    
    try {
      setLoading(true);
      
      let hotels: Hotel[] = [];

      // Nếu search rỗng, hiển thị tất cả hotels
      if (!searchText.trim()) {
        const allHotelsResponse = await getAllHotels({ limit: 100 });
        if (allHotelsResponse.success && allHotelsResponse.data) {
          hotels = allHotelsResponse.data;
        }
      } else {
        // Search theo location
        const response = await searchHotelsByLocation(searchText);
        if (response.success) {
          hotels = response.data;
          // Update search history chỉ khi có text
          if (searchText.trim() && !searchHistory.includes(searchText)) {
            setSearchHistory([searchText, ...searchHistory.slice(0, 5)]);
          }
        } else {
          showError('Failed to search hotels');
        }
      }

      // Check availability if dates are selected (from picker or params)
      const checkIn = selectedCheckIn 
        ? selectedCheckIn.toISOString() 
        : bookingInfo.checkIn;
      const checkOut = selectedCheckOut 
        ? selectedCheckOut.toISOString() 
        : bookingInfo.checkOut;
      
      if (checkIn && checkOut && hotels.length > 0) {
        // Check availability for each hotel and create availability map
        const availMap = new Map<string, boolean>();
        hotels.forEach(hotel => {
          const isAvailable = checkHotelAvailability(hotel._id, checkIn, checkOut);
          availMap.set(hotel._id, isAvailable);
        });
        setHotelsAvailability(availMap);

        // Sort: available hotels first, sold out last
        hotels.sort((a, b) => {
          const aAvailable = availMap.get(a._id) ?? true;
          const bAvailable = availMap.get(b._id) ?? true;
          if (aAvailable === bAvailable) return 0;
          return aAvailable ? -1 : 1;
        });
      } else {
        // Clear availability if no dates
        setHotelsAvailability(new Map());
      }

      setSearchResults(hotels);
    } catch (error) {
      console.error('Search error:', error);
      showError('Failed to search hotels');
    } finally {
      setLoading(false);
    }
  };

  const bookingInfo = {
    location: params.location as string,
    checkIn: params.checkIn as string,
    checkOut: params.checkOut as string,
    rooms: params.rooms as string,
    adults: params.adults as string,
    children: params.children as string,
  };

  const handleFilterApply = async (filters: any) => {
    try {
      setLoading(true);
      setShowFilterModal(false);
      
      // Convert priceRange array [min, max] to separate params
      const minPrice = filters.priceRange ? filters.priceRange[0] : undefined;
      const maxPrice = filters.priceRange ? filters.priceRange[1] : undefined;
      
      const response = await getFilteredHotels({
        location: searchQuery || undefined,
        minPrice,
        maxPrice,
        rating: filters.rating || undefined,
      });
      
      if (response.success) {
        let hotels = response.data;
        
        // Check availability if dates are selected (from picker or params)
        const checkIn = selectedCheckIn 
          ? selectedCheckIn.toISOString() 
          : bookingInfo.checkIn;
        const checkOut = selectedCheckOut 
          ? selectedCheckOut.toISOString() 
          : bookingInfo.checkOut;
        
        if (checkIn && checkOut && hotels.length > 0) {
          // Check availability for each hotel and create availability map
          const availMap = new Map<string, boolean>();
          hotels.forEach(hotel => {
            const isAvailable = checkHotelAvailability(hotel._id, checkIn, checkOut);
            availMap.set(hotel._id, isAvailable);
          });
          setHotelsAvailability(availMap);

          // Sort: available hotels first, sold out last
          hotels.sort((a, b) => {
            const aAvailable = availMap.get(a._id) ?? true;
            const bAvailable = availMap.get(b._id) ?? true;
            if (aAvailable === bAvailable) return 0;
            return aAvailable ? -1 : 1;
          });
        } else {
          setHotelsAvailability(new Map());
        }
        
        setSearchResults(hotels);
      } else {
        showError('Failed to apply filters');
      }
    } catch (error) {
      console.error('Filter error:', error);
      showError('Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  // Luôn hiển thị searchResults (có thể là tất cả hotels hoặc filtered results)
  const displayedHotels = searchResults;

  return (
    <View style={styles.container}>
      {/* Modern Header */}
      <View style={styles.heroSection}>
        <View style={styles.heroContent}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#1A1A1A" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.heroTitle}>Search Hotels</Text>
            <TouchableOpacity 
              onPress={() => setShowFilterModal(true)} 
              style={styles.filterButton}
            >
              <SlidersHorizontal size={20} color="#07A3B2" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <View style={styles.searchIconContainer}>
              <SearchIcon size={20} color="#07A3B2" strokeWidth={2.5} />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search destinations, hotels..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Date Filter */}
          <View style={styles.dateFilterRow}>
            <TouchableOpacity 
              style={styles.dateFilterButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Calendar size={18} color="#07A3B2" />
              <Text style={styles.dateFilterText}>
                {selectedCheckIn && selectedCheckOut
                  ? `${selectedCheckIn.getDate()}/${selectedCheckIn.getMonth() + 1} - ${selectedCheckOut.getDate()}/${selectedCheckOut.getMonth() + 1}`
                  : 'Select dates to check availability'}
              </Text>
            </TouchableOpacity>
            {selectedCheckIn && selectedCheckOut && (
              <TouchableOpacity
                style={styles.clearDatesButton}
                onPress={() => {
                  setSelectedCheckIn(null);
                  setSelectedCheckOut(null);
                  setHotelsAvailability(new Map());
                  performSearch();
                }}
              >
                <Text style={styles.clearDatesText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results Count */}
          <View style={styles.resultsInfo}>
            <Sparkles size={16} color="#07A3B2" />
            <Text style={styles.resultsText}>
              {loading ? 'Searching...' : `${searchResults.length} hotels found`}
            </Text>
          </View>
        </View>
      </View>

      {/* Booking Info Bar */}
      {bookingInfo.location && (
        <View style={styles.bookingInfoBar}>
          <View style={styles.bookingInfoItem}>
            <MapPin size={14} color="#07A3B2" />
            <Text style={styles.bookingInfoText} numberOfLines={1}>
              {bookingInfo.location}
            </Text>
          </View>
          <View style={styles.bookingInfoDivider} />
          <View style={styles.bookingInfoItem}>
            <Calendar size={14} color="#07A3B2" />
            <Text style={styles.bookingInfoText} numberOfLines={1}>
              {bookingInfo.checkIn && bookingInfo.checkOut 
                ? `${bookingInfo.checkIn.split('/')[0]}/${bookingInfo.checkIn.split('/')[1]} - ${bookingInfo.checkOut.split('/')[0]}/${bookingInfo.checkOut.split('/')[1]}`
                : 'Select dates'}
            </Text>
          </View>
          <View style={styles.bookingInfoDivider} />
          <View style={styles.bookingInfoItem}>
            <Users size={14} color="#07A3B2" />
            <Text style={styles.bookingInfoText}>
              {bookingInfo.rooms}R • {(Number(bookingInfo.adults || 0) + Number(bookingInfo.children || 0))}G
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#07A3B2" />
          <Text style={styles.loadingText}>
            {searchQuery ? 'Searching hotels...' : 'Loading...'}
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Search History */}
          {!searchQuery && searchHistory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <TrendingUp size={22} color="#07A3B2" strokeWidth={2.5} />
                <Text style={styles.sectionTitle}>Recent Searches</Text>
              </View>
              <View style={styles.chipsContainer}>
                {searchHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => setSearchQuery(item)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Search Results */}
          <View style={styles.section}>
            {displayedHotels.length === 0 ? (
              <View style={styles.emptyState}>
                <SearchIcon size={64} color="#E5E7EB" strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No Hotels Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery 
                    ? `We couldn't find any hotels matching "${searchQuery}"`
                    : 'No hotels available at the moment'}
                </Text>
                {searchQuery && (
                  <TouchableOpacity 
                    style={styles.clearSearchButton}
                    onPress={() => setSearchQuery('')}
                  >
                    <Text style={styles.clearSearchText}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.hotelsGrid}>
                {displayedHotels.map((hotel) => {
                  const minPrice = hotel.roomTypes && hotel.roomTypes.length > 0
                    ? Math.min(...hotel.roomTypes.map(r => r.price))
                    : 0;

                  return (
                    <TouchableOpacity
                      key={hotel._id}
                      style={styles.hotelCard}
                      onPress={() => {
                        // Pass dates to hotel detail if selected
                        const queryParams = selectedCheckIn && selectedCheckOut
                          ? `?fromBooking=true&checkIn=${selectedCheckIn.toISOString()}&checkOut=${selectedCheckOut.toISOString()}&guests=${bookingInfo.adults || 2}`
                          : '';
                        router.push(`/hotel/${hotel._id}${queryParams}` as any);
                      }}
                      activeOpacity={0.95}
                    >
                      <Image 
                        source={{ uri: hotel.photos?.[0] ? getImageUri(hotel.photos[0]) : 'https://via.placeholder.com/300x200?text=No+Image' }} 
                        style={styles.hotelImage} 
                      />
                      
                      {/* Top Badges */}
                      <View style={styles.topBadges}>
                        <View style={styles.leftBadges}>
                          <View style={styles.ratingBadge}>
                            <Star size={11} color="#FFD700" fill="#FFD700" />
                            <Text style={styles.ratingText}>{hotel.rating?.toFixed(1) || '0.0'}</Text>
                          </View>
                          {hotelsAvailability.has(hotel._id) && !hotelsAvailability.get(hotel._id) && (
                            <View style={styles.soldOutBadge}>
                              <Text style={styles.soldOutText}>Hết phòng</Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          style={styles.favoriteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(hotel._id);
                          }}
                        >
                          <Heart
                            size={18}
                            color={favoriteHotelIds.includes(hotel._id) ? "#FF6B9D" : "#282424ff"}
                            fill={favoriteHotelIds.includes(hotel._id) ? "#FF6B9D" : "none"}
                            strokeWidth={2.5}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Bottom Info with Gradient */}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        style={styles.hotelOverlay}
                      >
                        <View style={styles.hotelInfo}>
                          <Text style={styles.hotelName} numberOfLines={2}>
                            {hotel.name}
                          </Text>
                          <View style={styles.hotelLocation}>
                            <MapPin size={13} color="rgba(255,255,255,0.85)" />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {hotel.location}
                            </Text>
                          </View>
                          {minPrice > 0 && (
                            <View style={styles.priceRow}>
                              <Text style={styles.priceLabel}>Starting from</Text>
                              <View style={styles.priceContainer}>
                                <Text style={styles.priceAmount}>{minPrice.toLocaleString('vi-VN')} VND</Text>
                                <Text style={styles.priceNight}>/night</Text>
                              </View>
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
      />

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Dates</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => {
                const newMonth = new Date(calendarMonth);
                newMonth.setMonth(newMonth.getMonth() - 1);
                setCalendarMonth(newMonth);
              }}>
                <Text style={styles.navButton}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.monthYear}>
                {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => {
                const newMonth = new Date(calendarMonth);
                newMonth.setMonth(newMonth.getMonth() + 1);
                setCalendarMonth(newMonth);
              }}>
                <Text style={styles.navButton}>›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendar}>
              <View style={styles.weekDays}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <Text key={i} style={styles.weekDay}>{day}</Text>
                ))}
              </View>
              {renderCalendarDays()}
            </View>

            <View style={styles.selectedDatesInfo}>
              <View style={styles.dateInfoBox}>
                <Text style={styles.dateInfoLabel}>Check-in</Text>
                <Text style={styles.dateInfoValue}>
                  {selectedCheckIn ? selectedCheckIn.toLocaleDateString() : '--'}
                </Text>
              </View>
              <View style={styles.dateInfoBox}>
                <Text style={styles.dateInfoLabel}>Check-out</Text>
                <Text style={styles.dateInfoValue}>
                  {selectedCheckOut ? selectedCheckOut.toLocaleDateString() : '--'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, (!selectedCheckIn || !selectedCheckOut) && styles.confirmButtonDisabled]}
              onPress={() => {
                if (selectedCheckIn && selectedCheckOut) {
                  setShowDatePicker(false);
                  performSearch();
                }
              }}
              disabled={!selectedCheckIn || !selectedCheckOut}
            >
              <Text style={styles.confirmButtonText}>Apply Dates</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  function renderCalendarDays() {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      const isPast = date < today;
      const isCheckIn = selectedCheckIn?.toDateString() === date.toDateString();
      const isCheckOut = selectedCheckOut?.toDateString() === date.toDateString();
      const isInRange = selectedCheckIn && selectedCheckOut && 
        date > selectedCheckIn && date < selectedCheckOut;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isPast && styles.calendarDayPast,
            isCheckIn && styles.calendarDaySelected,
            isCheckOut && styles.calendarDaySelected,
            isInRange && styles.calendarDayInRange,
          ]}
          onPress={() => {
            if (isPast) return;
            
            if (!selectedCheckIn || (selectedCheckIn && selectedCheckOut)) {
              // Start new selection
              setSelectedCheckIn(date);
              setSelectedCheckOut(null);
            } else if (date > selectedCheckIn) {
              // Set check-out
              setSelectedCheckOut(date);
            } else {
              // Reset if selecting earlier date
              setSelectedCheckIn(date);
              setSelectedCheckOut(null);
            }
          }}
          disabled={isPast}
        >
          <Text style={[
            styles.calendarDayText,
            isPast && styles.calendarDayTextPast,
            (isCheckIn || isCheckOut) && styles.calendarDayTextSelected,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.calendarDays}>{days}</View>;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },

  // Hero Section
  heroSection: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  heroContent: {
    gap: 16,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(7,163,178,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(7,163,178,0.2)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(7,163,178,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  clearButton: {
    color: '#999',
    fontSize: 20,
    fontWeight: '600',
  },
  resultsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Content
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },

  // Section
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F8FA',
    borderWidth: 1,
    borderColor: 'rgba(7,163,178,0.2)',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#07A3B2',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  clearSearchButton: {
    backgroundColor: '#07A3B2',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  clearSearchText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    letterSpacing: -0.2,
  },

  // Hotels Grid
  hotelsGrid: {
    gap: 16,
  },
  hotelCard: {
    height: 300,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  hotelImage: {
    width: '100%',
    height: '100%',
  },

  // Top Badges
  topBadges: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // Bottom Overlay
  hotelOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    padding: 16,
    justifyContent: 'flex-end',
  },
  hotelInfo: {
    gap: 6,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  hotelLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    flex: 1,
  },
  priceRow: {
    marginTop: 6,
    gap: 4,
  },
  priceLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.5,
  },
  priceNight: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },

  // Booking Info
  bookingInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  bookingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bookingInfoText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  bookingInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  // Date Filter Button
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7,163,178,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(7,163,178,0.2)',
  },
  dateFilterText: {
    fontSize: 14,
    color: '#07A3B2',
    fontWeight: '600',
    flex: 1,
  },
  clearDatesButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.2)',
  },
  clearDatesText: {
    fontSize: 18,
    color: '#FF3B30',
    fontWeight: '700',
  },

  // Date Picker Modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  navButton: {
    fontSize: 28,
    color: '#07A3B2',
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  calendar: {
    marginBottom: 20,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDaySelected: {
    backgroundColor: '#07A3B2',
    borderRadius: 20,
  },
  calendarDayInRange: {
    backgroundColor: 'rgba(7,163,178,0.15)',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  calendarDayTextPast: {
    color: '#999',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: '700',
  },
  selectedDatesInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateInfoBox: {
    flex: 1,
    backgroundColor: '#F5F8FA',
    padding: 12,
    borderRadius: 12,
  },
  dateInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateInfoValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  confirmButton: {
    backgroundColor: '#07A3B2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
});