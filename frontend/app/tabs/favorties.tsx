import { useRouter } from 'expo-router';
import { Filter, Heart, MapPin, Star, X } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { getUserFavorites, toggleFavorite } from '../../services/userService';
import { getMe } from '../../services/authService';
import { auth } from '../../config/firebase';
import { Hotel } from '../../services/hotelService';
import { getImageUri } from '../../utils/imageHelper';

type SortType = 'Resort Location' | 'Price' | 'Rating';

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<SortType>('Resort Location');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    priceRange: [0, 100],
    minRating: 0,
    locations: [] as string[],
  });

  useEffect(() => {
    loadUserAndFavorites();
  }, []);

  const loadUserAndFavorites = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to view favorites');
        router.replace('/auth/login');
        return;
      }

      const token = await currentUser.getIdToken();
      
      // Get user ID from /api/auth/me
      const meResponse = await getMe(token);
      if (meResponse.success && meResponse.data) {
        const uid = meResponse.data._id;
        setUserId(uid);
        
        // Load favorites
        await loadFavorites(uid, token);
      }
    } catch (error) {
      console.error('Load user error:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const loadFavorites = async (uid: string, token: string) => {
    try {
      setLoading(true);
      const response = await getUserFavorites(uid, token);
      
      if (response.success) {
        setFavorites(response.data || []);
      } else {
        Alert.alert('Error', 'Failed to load favorites');
      }
    } catch (error) {
      console.error('Load favorites error:', error);
      Alert.alert('Error', 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const getSortedFavorites = () => {
    const sorted = [...favorites];
    
    switch (selectedFilter) {
      case 'Price':
        return sorted.sort((a, b) => {
          const priceA = a.roomTypes && a.roomTypes.length > 0 ? Math.min(...a.roomTypes.map(r => r.price)) : 0;
          const priceB = b.roomTypes && b.roomTypes.length > 0 ? Math.min(...b.roomTypes.map(r => r.price)) : 0;
          return priceA - priceB;
        });
      case 'Rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'Resort Location':
      default:
        return sorted.sort((a, b) => a.location.localeCompare(b.location));
    }
  };

  const handleRemoveFavorite = async (hotelId: string, hotelName: string) => {
    Alert.alert(
      'Remove from Favourites',
      `Remove "${hotelName}" from your favourites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser || !userId) return;

              const token = await currentUser.getIdToken();
              const response = await toggleFavorite(userId, hotelId, token, true);
              
              if (response.success) {
                // Update local state
                setFavorites(response.data || []);
              } else {
                Alert.alert('Error', 'Failed to remove from favorites');
              }
            } catch (error) {
              console.error('Remove favorite error:', error);
              Alert.alert('Error', 'Failed to remove from favorites');
            }
          },
        },
      ]
    );
  };

  const handleApplyFilters = () => {
    setShowFilterModal(false);
    Alert.alert('Filters Applied', 'Your filter preferences have been saved.');
  };

  const handleResetFilters = () => {
    setTempFilters({
      priceRange: [0, 100],
      minRating: 0,
      locations: [],
    });
  };

  const sortedFavorites = getSortedFavorites();

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading favorites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favourites</Text>
        <Text style={styles.subtitle}>{favorites.length} hotels saved</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'Resort Location' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('Resort Location')}
          >
            <Text style={[styles.filterText, selectedFilter === 'Resort Location' && styles.filterTextActive]}>
              Resort Location
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'Price' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('Price')}
          >
            <Text style={[styles.filterText, selectedFilter === 'Price' && styles.filterTextActive]}>
              Price
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterChip, selectedFilter === 'Rating' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('Rating')}
          >
            <Text style={[styles.filterText, selectedFilter === 'Rating' && styles.filterTextActive]}>
              Rating
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity 
          style={styles.filterIconButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter size={20} color="#17A2B8" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Favourites Yet</Text>
            <Text style={styles.emptyText}>
              Start adding hotels to your favourites to see them here
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {sortedFavorites.map((hotel) => {
              const minPrice = hotel.roomTypes && hotel.roomTypes.length > 0
                ? Math.min(...hotel.roomTypes.map(r => r.price))
                : 0;

              return (
                <TouchableOpacity 
                  key={hotel._id} 
                  style={styles.card}
                  onPress={() => router.push(`/hotel/${hotel._id}` as any)}
                >
                  <Image source={{ uri: getImageUri(hotel.photos?.[0]) }} style={styles.image} />
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={() => handleRemoveFavorite(hotel._id, hotel.name)}
                  >
                    <Heart size={18} color="#FF6B6B" fill="#FF6B6B" />
                  </TouchableOpacity>
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
                    <View style={styles.meta}>
                      <MapPin size={12} color="#666" />
                      <Text style={styles.location} numberOfLines={1}>{hotel.location}</Text>
                    </View>
                    <View style={styles.footer}>
                      <View style={styles.rating}>
                        <Star size={12} color="#FFA500" fill="#FFA500" />
                        <Text style={styles.ratingText}>{hotel.rating?.toFixed(1) || '0.0'}</Text>
                      </View>
                      {minPrice > 0 && (
                        <Text style={styles.price}>${minPrice}<Text style={styles.priceUnit}>/night</Text></Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Options</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range (per night)</Text>
                <View style={styles.priceRangeContainer}>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <Text style={styles.priceValue}>${tempFilters.priceRange[0]}</Text>
                    <View style={styles.priceControls}>
                      <TouchableOpacity
                        style={styles.priceButton}
                        onPress={() => {
                          const newMin = Math.max(0, tempFilters.priceRange[0] - 10);
                          setTempFilters({
                            ...tempFilters,
                            priceRange: [newMin, tempFilters.priceRange[1]],
                          });
                        }}
                      >
                        <Text style={styles.priceButtonText}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.priceButton}
                        onPress={() => {
                          const newMin = Math.min(tempFilters.priceRange[1] - 10, tempFilters.priceRange[0] + 10);
                          setTempFilters({
                            ...tempFilters,
                            priceRange: [newMin, tempFilters.priceRange[1]],
                          });
                        }}
                      >
                        <Text style={styles.priceButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.priceSeparator} />
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Max</Text>
                    <Text style={styles.priceValue}>${tempFilters.priceRange[1]}</Text>
                    <View style={styles.priceControls}>
                      <TouchableOpacity
                        style={styles.priceButton}
                        onPress={() => {
                          const newMax = Math.max(tempFilters.priceRange[0] + 10, tempFilters.priceRange[1] - 10);
                          setTempFilters({
                            ...tempFilters,
                            priceRange: [tempFilters.priceRange[0], newMax],
                          });
                        }}
                      >
                        <Text style={styles.priceButtonText}>-</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.priceButton}
                        onPress={() => {
                          const newMax = Math.min(500, tempFilters.priceRange[1] + 10);
                          setTempFilters({
                            ...tempFilters,
                            priceRange: [tempFilters.priceRange[0], newMax],
                          });
                        }}
                      >
                        <Text style={styles.priceButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <Text style={styles.filterHint}>Use +/- buttons to adjust price range</Text>
              </View>

              {/* Rating Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
                <View style={styles.ratingOptions}>
                  {[0, 3, 4, 4.5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.ratingOption,
                        tempFilters.minRating === rating && styles.ratingOptionActive,
                      ]}
                      onPress={() => setTempFilters({ ...tempFilters, minRating: rating })}
                    >
                      <Star
                        size={16}
                        color="#FFA500"
                        fill={rating > 0 ? '#FFA500' : 'transparent'}
                      />
                      <Text
                        style={[
                          styles.ratingOptionText,
                          tempFilters.minRating === rating && styles.ratingOptionTextActive,
                        ]}
                      >
                        {rating === 0 ? 'Any' : `${rating}+`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Location Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Locations</Text>
                <View style={styles.locationOptions}>
                  {['Bali', 'Dubai', 'Auckland', 'Maldives', 'Paris'].map((location) => (
                    <TouchableOpacity
                      key={location}
                      style={[
                        styles.locationChip,
                        tempFilters.locations.includes(location) && styles.locationChipActive,
                      ]}
                      onPress={() => {
                        const locations = tempFilters.locations.includes(location)
                          ? tempFilters.locations.filter(l => l !== location)
                          : [...tempFilters.locations, location];
                        setTempFilters({ ...tempFilters, locations });
                      }}
                    >
                      <Text
                        style={[
                          styles.locationChipText,
                          tempFilters.locations.includes(location) && styles.locationChipTextActive,
                        ]}
                      >
                        {location}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 20,
    paddingRight: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 10,
  },
  filterScroll: {
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#17A2B8',
    borderColor: '#17A2B8',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  filterIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 110,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  location: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
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
    fontSize: 10,
    fontWeight: 'normal',
    color: '#666',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17A2B8',
    marginBottom: 8,
  },
  priceControls: {
    flexDirection: 'row',
    gap: 8,
  },
  priceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  priceSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
  },
  filterHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  ratingOptionActive: {
    borderColor: '#17A2B8',
    backgroundColor: '#E3F7FA',
  },
  ratingOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  ratingOptionTextActive: {
    color: '#17A2B8',
  },
  locationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  locationChipActive: {
    borderColor: '#17A2B8',
    backgroundColor: '#E3F7FA',
  },
  locationChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  locationChipTextActive: {
    color: '#17A2B8',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#17A2B8',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
