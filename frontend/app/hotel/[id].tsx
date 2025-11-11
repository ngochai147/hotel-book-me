import { useLocalSearchParams, useRouter } from "expo-router"
import { ChevronLeft, Heart, MapPin, Share2, Star } from "lucide-react-native"
import { useState, useEffect } from "react"
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native"
import { getHotelById, Hotel } from "../../services/hotelService"
import { getReviewsByHotelId, Review } from "../../services/reviewService"
import { toggleFavorite, getUserFavorites } from "../../services/userService"
import { getMe } from "../../services/authService"
import { auth } from "../../config/firebase"
import { getImageUri } from "../../utils/imageHelper"
import MapView, { Marker } from 'react-native-maps';

export default function HotelDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]) // Array of room type names

  useEffect(() => {
    if (id) {
      loadHotelData();
      checkFavoriteStatus();
    }
  }, [id]);

  const loadHotelData = async () => {
    try {
      setLoading(true);
      
      // Load hotel details
      const hotelResponse = await getHotelById(String(id));
      if (hotelResponse.success && hotelResponse.data) {
        setHotel(hotelResponse.data);
      } else {
        Alert.alert('Error', 'Failed to load hotel details');
        return;
      }

      // Load reviews
      const reviewsResponse = await getReviewsByHotelId(String(id));
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data);
      }
      
    } catch (error) {
      console.error('Load hotel data error:', error);
      Alert.alert('Error', 'Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      
      // Get user ID first
      const userResponse = await getMe(token);
      if (!userResponse.success || !userResponse.data) return;
      
      setUserId(userResponse.data._id);
      
      // Get favorites
      const favoritesResponse = await getUserFavorites(userResponse.data._id, token);
      
      if (favoritesResponse.success && favoritesResponse.data) {
        const isFav = favoritesResponse.data.some((fav: any) => {
          const hotelId = typeof fav === 'string' ? fav : fav._id;
          return hotelId === id;
        });
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error('Check favorite error:', error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to add favorites');
        router.replace('/auth/login');
        return;
      }

      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please refresh the page.');
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await toggleFavorite(userId, String(id), token, isFavorite);
      
      if (response.success) {
        setIsFavorite(!isFavorite);
      } else {
        Alert.alert('Error', response.message || 'Failed to update favorite');
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading hotel details...</Text>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666' }}>Hotel not found</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: '#17A2B8', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const calculateRatingBreakdown = (reviews: Review[]) => {
    const breakdown = [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => Math.floor(r.rating) === stars).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { stars, count, percentage: Math.round(percentage) };
    });
    return breakdown;
  };

  const ratingBreakdown = calculateRatingBreakdown(reviews);
  const minPrice = hotel.roomTypes && hotel.roomTypes.length > 0
    ? Math.min(...hotel.roomTypes.map(r => r.price))
    : 0;

  const galleryImages = hotel.photos && hotel.photos.length > 0 
    ? hotel.photos.map(photo => getImageUri(photo))
    : ['https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600'];

  const renderRatingBreakdown = () => (
    <View style={styles.ratingBreakdownContainer}>
      {ratingBreakdown.map((item, index) => (
        <View key={index} style={styles.ratingRow}>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < item.stars ? "#FFA500" : "#E5E7EB"}
                fill={i < item.stars ? "#FFA500" : "none"}
              />
            ))}
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingBarFill, { width: `${item.percentage}%` }]} />
          </View>
          <Text style={styles.ratingCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  )
  const hotelCoordinates = {
    latitude: hotel.coordinates?.latitude || 10.8231, // Default: TP.HCM
    longitude: hotel.coordinates?.longitude || 106.6297,
  };
  const renderLocationMap = () =>  (
    <View style={styles.locationMapContainer}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: hotelCoordinates.latitude,
          longitude: hotelCoordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker
          coordinate={hotelCoordinates}
          title={hotel.name}
          description={hotel.location}
        >
          <View style={styles.customMarker}>
            <MapPin size={30} color="#17A2B8" fill="#17A2B8" />
          </View>
        </Marker>
      </MapView>
      
      <View style={styles.locationInfo}>
        <MapPin size={16} color="#17A2B8" />
        <Text style={styles.locationAddress}>{hotel.address}</Text>
      </View>
    </View>
  );

  const formatReviewDate = (date: Date | string) => {
    const reviewDate = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - reviewDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return reviewDate.toLocaleDateString();
  };

  const renderReviewItem = (review: Review) => {
    const user = typeof review.userId === 'object' ? review.userId : null;
    const userName = user?.userName || 'Anonymous';
    const userAvatar = user?.avatar || 'https://i.pravatar.cc/150?img=1';

    return (
      <View style={styles.reviewItem} key={review._id}>
        <Image source={{ uri: userAvatar }} style={styles.reviewAvatar} />
        <View style={styles.reviewContent}>
          <View style={styles.reviewHeader}>
            <Text style={styles.reviewAuthor}>{userName}</Text>
            <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
          </View>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < review.rating ? "#FFA500" : "#E5E7EB"}
                fill={i < review.rating ? "#FFA500" : "none"}
              />
            ))}
          </View>
          <Text style={styles.reviewText}>{review.comment}</Text>
        </View>
      </View>
    );
  }

  const handleToggleRoomSelection = (roomName: string) => {
    setSelectedRooms(prev => {
      if (prev.includes(roomName)) {
        return prev.filter(name => name !== roomName);
      } else {
        return [...prev, roomName];
      }
    });
  };

  const handleProceedToBooking = () => {
    if (selectedRooms.length === 0) {
      Alert.alert('Select Rooms', 'Please select at least one room type to continue');
      return;
    }
    if (id) {
      router.push({ 
        pathname: "/booking/create", 
        params: { hotelId: String(id), selectedRooms: selectedRooms.join(',') } 
      });
    }
  };

  const renderRoomType = (room: any, index: number) => {
    // Nếu room có ảnh riêng thì dùng, không thì dùng ảnh khác nhau từ hotel photos
    const roomImage = room.photos && room.photos.length > 0 
      ? getImageUri(room.photos[0])
      : (galleryImages[index % galleryImages.length] || galleryImages[0]);
    const roomAmenities = room.amenities && room.amenities.length > 0
      ? room.amenities.slice(0, 3).join(', ')
      : 'Standard amenities';
    
    const isSelected = selectedRooms.includes(room.name);

    return (
      <TouchableOpacity 
        style={[styles.roomTypeCard, isSelected && styles.roomTypeCardSelected]} 
        key={room._id || room.name}
        onPress={() => handleToggleRoomSelection(room.name)}
        activeOpacity={0.7}
      >
        <Image source={{ uri: roomImage }} style={styles.roomImage} />
        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <Text style={styles.roomName}>{room.name}</Text>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
          <View style={styles.roomMeta}>
            <Text style={styles.roomGuests}>👥 {room.maxOccupancy} Guests</Text>
            <Text style={styles.roomArea}>� {room.size} m²</Text>
          </View>
          <Text style={styles.roomAmenities}>{roomAmenities}</Text>
          <View style={styles.roomFooter}>
            <Text style={styles.roomPrice}>
              ${room.price}
              <Text style={styles.priceUnit}>/night</Text>
            </Text>
            {isSelected && <Text style={styles.selectedBadge}>Selected ✓</Text>}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Image Gallery */}
      <View style={styles.imageContainer}>
        <View style={styles.mainImageWrapper}>
          <Image source={{ uri: galleryImages[0] }} style={styles.headerImage} />
        </View>
        <View style={styles.thumbnailRow}>
          {galleryImages.slice(1, 4).map((img, index) => (
            <Image key={index} source={{ uri: img }} style={styles.thumbnailImage} />
          ))}
        </View>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButtonHeader} onPress={handleToggleFavorite}>
          <Heart size={20} color={isFavorite ? "#FF6B6B" : "white"} fill={isFavorite ? "#FF6B6B" : "none"} />
        </TouchableOpacity>
      </View>

      {/* Hotel Info */}
      <View style={styles.hotelInfoSection}>
        <View style={styles.hotelTitleRow}>
          <View style={styles.hotelTitleLeft}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#666" />
              <Text style={styles.locationText}>{hotel.location}</Text>
            </View>
          </View>
          <View style={styles.ratingBadge}>
            <Star size={16} color="#FFA500" fill="#FFA500" />
            <Text style={styles.ratingBadgeText}>{hotel.rating}</Text>
          </View>
        </View>

        {/* Property Facilities */}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <View style={styles.facilitiesSection}>
            <View style={styles.facilitiesHeader}>
              <Text style={styles.facilitiesTitle}>Property Facilities</Text>
            </View>
            <View style={styles.facilitiesGrid}>
              {hotel.amenities.slice(0, 5).map((amenity, index) => {
                const getEmoji = (name: string) => {
                  const lower = name.toLowerCase();
                  if (lower.includes('wifi') || lower.includes('internet')) return '📶';
                  if (lower.includes('pool') || lower.includes('swimming')) return '🏊';
                  if (lower.includes('beach')) return '🏖️';
                  if (lower.includes('ac') || lower.includes('air')) return '❄️';
                  if (lower.includes('gym') || lower.includes('fitness')) return '�';
                  if (lower.includes('parking')) return '🚗';
                  if (lower.includes('restaurant')) return '�️';
                  return '✓';
                };

                return (
                  <View key={index} style={styles.facilityItem}>
                    <View style={styles.facilityIcon}>
                      <Text style={styles.facilityIconText}>{getEmoji(amenity)}</Text>
                    </View>
                    <Text style={styles.facilityName}>{amenity}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{hotel.description || 'No description available'}</Text>
        </View>

        {/* Price */}
        {minPrice > 0 && (
          <View style={styles.priceSection}>
            <Text style={styles.priceLabel}>Starting Price</Text>
            <Text style={styles.priceValue}>
              ${minPrice}
              <Text style={styles.priceUnitLarge}>/night</Text>
            </Text>
          </View>
        )}
      </View>

      {/* Reviews Section with Rating Breakdown */}
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <TouchableOpacity
            style={styles.writeReviewButton}
            onPress={() => router.push(`/review/create?hotelId=${id}` as any)}
          >
            <Star size={14} color="#17A2B8" />
            <Text style={styles.writeReviewText}>Write Review</Text>
          </TouchableOpacity>
        </View>
        {reviews.length > 0 ? (
          <>
            <Text style={styles.reviewCount}>{reviews.length} review{reviews.length > 1 ? 's' : ''}</Text>
            {renderRatingBreakdown()}
            {reviews.slice(0, 3).map(renderReviewItem)}
            {reviews.length > 3 && (
              <TouchableOpacity
                style={styles.viewAllReviewsButton}
                onPress={() => router.push(`/hotel/${id}/reviews` as any)}
              >
                <Text style={styles.viewAllReviewsText}>View all {reviews.length} reviews</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.noReviewsContainer}>
            <Star size={48} color="#E5E7EB" />
            <Text style={styles.noReviewsTitle}>No reviews yet</Text>
            <Text style={styles.noReviewsText}>Be the first to review this hotel!</Text>
          </View>
        )}
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {renderLocationMap()}
      </View>

      {/* Room Types Section */}
      {hotel.roomTypes && hotel.roomTypes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Type</Text>
          {hotel.roomTypes.map((room, index) => renderRoomType(room, index))}
        </View>
      )}

      {/* All Amenities Section */}
      {hotel.amenities && hotel.amenities.length > 5 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Property Facilities</Text>
          <View style={styles.facilitiesListContainer}>
            {hotel.amenities.map((amenity, index) => (
              <Text key={index} style={styles.amenityListItem}>• {amenity}</Text>
            ))}
          </View>
        </View>
      )}

      {/* Book Button */}
      <TouchableOpacity
        onPress={handleProceedToBooking}
        style={[styles.bookButton, selectedRooms.length === 0 && { opacity: 0.6 }]}
      >
        <Text style={styles.bookButtonText}>
          {selectedRooms.length > 0 
            ? `Book ${selectedRooms.length} Room${selectedRooms.length > 1 ? 's' : ''} Now` 
            : 'Select Rooms to Book'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    backgroundColor: '#000',
    paddingBottom: 8,
  },
  mainImageWrapper: {
    width: '100%',
    height: 220,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 8,
    marginTop: 8,
  },
  thumbnailImage: {
    flex: 1,
    height: 80,
    borderRadius: 8,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButtonHeader: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  hotelInfoSection: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  hotelTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hotelTitleLeft: {
    flex: 1,
    marginRight: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    color: "#666",
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  ratingBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  facilitiesSection: {
    marginBottom: 16,
  },
  facilitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  facilitiesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  seeAllLink: {
    fontSize: 12,
    color: "#17A2B8",
    fontWeight: "600",
  },
  facilitiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  facilityItem: {
    alignItems: "center",
    flex: 1,
  },
  facilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  facilityIconText: {
    fontSize: 20,
  },
  facilityName: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  priceSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#17A2B8",
  },
  priceUnitLarge: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666",
  },
  section: {
    backgroundColor: "white",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  ratingBreakdownContainer: {
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
    width: 60,
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#FFA500",
  },
  ratingCount: {
    fontSize: 12,
    color: "#666",
    width: 40,
    textAlign: "right",
  },
  locationMapContainer: {
    marginBottom: 16,
  },
  mapPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mapText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  locationAddress: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  roomTypeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  roomImage: {
    width: "100%",
    height: 120,
  },
  roomInfo: {
    padding: 12,
  },
  roomName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  roomMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  roomGuests: {
    fontSize: 11,
    color: "#666",
  },
  roomArea: {
    fontSize: 11,
    color: "#666",
  },
  roomAmenities: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#17A2B8",
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "normal",
    color: "#666",
  },
  selectButton: {
    backgroundColor: "#17A2B8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  facilityCategory: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  facilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  facilityTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  expandIcon: {
    fontSize: 12,
    color: "#666",
  },
  facilityItems: {
    paddingLeft: 12,
    paddingBottom: 8,
  },
  facilitiesListContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityListItem: {
    width: '50%',
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  writeReviewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#17A2B8",
    backgroundColor: "#E3F7FA",
  },
  writeReviewText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#17A2B8",
  },
  reviewCount: {
    fontSize: 13,
    color: "#666",
    marginBottom: 12,
    fontWeight: "500",
  },
  viewAllReviewsButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#17A2B8",
    backgroundColor: "#E3F7FA",
    alignItems: "center",
  },
  viewAllReviewsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#17A2B8",
  },
  noReviewsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noReviewsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginTop: 12,
    marginBottom: 4,
  },
  noReviewsText: {
    fontSize: 13,
    color: "#666",
  },
  reviewItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  reviewDate: {
    fontSize: 11,
    color: "#999",
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  bookButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 56,
    backgroundColor: "#17A2B8",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  roomTypeCardSelected: {
    borderWidth: 2,
    borderColor: "#17A2B8",
    backgroundColor: "#F0F9FA",
  },
  roomHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#CCC",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#17A2B8",
    borderColor: "#17A2B8",
  },
  checkmark: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  selectedBadge: {
    fontSize: 12,
    color: "#17A2B8",
    fontWeight: "600",
  },
    map: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  customMarker: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#17A2B8',
  },
})