import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Search as SearchIcon, SlidersHorizontal, Star, Users } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import FilterModal from '../components/FilterModal';
import { searchHotelsByLocation, getFilteredHotels, getAllHotels, Hotel } from '../services/hotelService';
import { getImageUri } from '../utils/imageHelper';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState(params.location as string || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Hotel[]>([]);
  const [searchResults, setSearchResults] = useState<Hotel[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Hotel[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
    // Nếu có location từ params thì tự động search
    if (params.location) {
      setSearchQuery(params.location as string);
    }
  }, []);

  // Auto search khi searchQuery thay đổi
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 500); // Debounce 500ms để tránh search quá nhiều

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load tất cả hotels khi vào màn hình
      const allHotelsResponse = await getAllHotels({ limit: 100 });
      if (allHotelsResponse.success && allHotelsResponse.data) {
        setRecommendations(allHotelsResponse.data);
        setSearchResults(allHotelsResponse.data); // Hiển thị tất cả ban đầu
      }

      // Load search history from localStorage (if implemented)
      const history = ['Hotel Bali', 'Istanbul', 'Villa Ubuwatu'];
      setSearchHistory(history);
      
    } catch (error) {
      console.error('Load initial data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query?: string) => {
    const searchText = query !== undefined ? query : searchQuery;
    
    try {
      setLoading(true);
      
      // Nếu search rỗng, hiển thị tất cả hotels
      if (!searchText.trim()) {
        const allHotelsResponse = await getAllHotels({ limit: 100 });
        if (allHotelsResponse.success && allHotelsResponse.data) {
          setSearchResults(allHotelsResponse.data);
        }
        setLoading(false);
        return;
      }

      // Search theo location
      const response = await searchHotelsByLocation(searchText);
      
      if (response.success) {
        setSearchResults(response.data);
        // Update search history chỉ khi có text
        if (searchText.trim() && !searchHistory.includes(searchText)) {
          setSearchHistory([searchText, ...searchHistory.slice(0, 5)]);
        }
      } else {
        Alert.alert('Error', 'Failed to search hotels');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search hotels');
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
        setSearchResults(response.data);
      } else {
        Alert.alert('Error', 'Failed to apply filters');
      }
    } catch (error) {
      console.error('Filter error:', error);
      Alert.alert('Error', 'Failed to apply filters');
    } finally {
      setLoading(false);
    }
  };

  // Luôn hiển thị searchResults (có thể là tất cả hotels hoặc filtered results)
  const displayedHotels = searchResults;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hotel or location"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={{ color: '#999', fontSize: 18, fontWeight: '500' }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          onPress={() => setShowFilterModal(true)} 
          style={styles.filterButton}
        >
          <SlidersHorizontal size={20} color="#17A2B8" />
        </TouchableOpacity>
      </View>

      {/* Booking Info Bar */}
      {bookingInfo.location && (
        <View style={styles.bookingInfoBar}>
          <View style={styles.bookingInfoItem}>
            <MapPin size={14} color="#17A2B8" />
            <Text style={styles.bookingInfoText} numberOfLines={1}>
              {bookingInfo.location}
            </Text>
          </View>
          <View style={styles.bookingInfoDivider} />
          <View style={styles.bookingInfoItem}>
            <Calendar size={14} color="#17A2B8" />
            <Text style={styles.bookingInfoText} numberOfLines={1}>
              {bookingInfo.checkIn && bookingInfo.checkOut 
                ? `${bookingInfo.checkIn.split('/')[0]}/${bookingInfo.checkIn.split('/')[1]} - ${bookingInfo.checkOut.split('/')[0]}/${bookingInfo.checkOut.split('/')[1]}`
                : 'Select dates'}
            </Text>
          </View>
          <View style={styles.bookingInfoDivider} />
          <View style={styles.bookingInfoItem}>
            <Users size={14} color="#17A2B8" />
            <Text style={styles.bookingInfoText}>
              {bookingInfo.rooms}R • {(Number(bookingInfo.adults || 0) + Number(bookingInfo.children || 0))}G
            </Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#17A2B8" />
          <Text style={{ marginTop: 10, color: '#666' }}>
            {searchQuery ? 'Searching...' : 'Loading...'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Search History */}
          {!searchQuery && searchHistory.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest Search</Text>
              <View style={styles.tagsContainer}>
                {searchHistory.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.tag}
                    onPress={() => setSearchQuery(item)}
                  >
                    <Text style={styles.tagText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Search Results */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {searchQuery && searchResults.length > 0 
                  ? `${searchResults.length} Results for "${searchQuery}"` 
                  : searchQuery 
                  ? 'Search Results'
                  : `All Hotels (${searchResults.length})`}
              </Text>
            </View>

            {displayedHotels.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={styles.noResults}>
                  {searchQuery ? 'No hotels found for your search' : 'No hotels available'}
                </Text>
                {searchQuery && (
                  <Text style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
                    Try searching with different keywords
                  </Text>
                )}
              </View>
            ) : (
              <View>
                {displayedHotels.map((hotel) => {
                  const minPrice = hotel.roomTypes && hotel.roomTypes.length > 0
                    ? Math.min(...hotel.roomTypes.map(r => r.price))
                    : 0;

                  return (
                    <TouchableOpacity
                      key={hotel._id}
                      style={styles.hotelCard}
                      onPress={() => router.push(`/hotel/${hotel._id}`)}
                    >
                      <Image 
                        source={{ uri: getImageUri(hotel.photos?.[0] || '') }} 
                        style={styles.hotelCardImage} 
                      />
                      <View style={styles.hotelCardInfo}>
                        <Text style={styles.hotelCardName} numberOfLines={1}>
                          {hotel.name}
                        </Text>
                        <View style={styles.hotelMeta}>
                          <MapPin size={12} color="#666" />
                          <Text style={styles.hotelLocation} numberOfLines={1}>
                            {hotel.location}
                          </Text>
                        </View>
                        <View style={styles.hotelFooter}>
                          <View style={styles.rating}>
                            <Star size={12} color="#FFA500" fill="#FFA500" />
                            <Text style={styles.ratingText}>{hotel.rating?.toFixed(1) || '0.0'}</Text>
                          </View>
                          {minPrice > 0 && (
                            <Text style={styles.price}>
                              ${minPrice}
                              <Text style={styles.priceUnit}>/night</Text>
                            </Text>
                          )}
                        </View>
                      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  bookingInfoText: {
    fontSize: 11,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  bookingInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagActive: {
    backgroundColor: '#17A2B8',
    borderColor: '#17A2B8',
  },
  tagText: {
    fontSize: 13,
    color: '#666',
  },
  tagTextActive: {
    color: 'white',
  },
  recommendationsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendationCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recommendationImage: {
    width: '100%',
    height: 120,
  },
  recommendationInfo: {
    padding: 10,
  },
  recommendationName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  hotelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  hotelLocation: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  price: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: 'normal',
    color: '#666',
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentImage: {
    width: 100,
    height: 100,
  },
  recentInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  recentName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  hotelCardImage: {
    width: 120,
    height: 120,
  },
  hotelCardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  hotelCardName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
});
