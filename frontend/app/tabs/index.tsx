import { useRouter, useFocusEffect } from 'expo-router';
import { Bell, Heart, MapPin, Star, Users, TrendingUp, Tag } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { getFeaturedHotels, getAllHotels, Hotel } from '../../services/hotelService';
import { getUserFavorites, toggleFavorite } from '../../services/userService';
import { getMe } from '../../services/authService';
import { auth } from '../../config/firebase';
import { getImageUri } from '../../utils/imageHelper';

const { width } = Dimensions.get('window');

// Popular destinations data
const destinations = [
  { id: 1, name: 'Saigon', hotels: 120, image: 'images/the_reverie_saigon/the_reverie_saigon_3_RxHdPtDT.jpg' },
  { id: 2, name: 'Da Nang', hotels: 85, image: 'images/khach_san_park_hyatt_sai_gon/khach_san_park_hyatt_sai_gon_4_x3B7MvWv.jpg' },
  { id: 3, name: 'Hanoi', hotels: 95, image: 'images/ngo_house/ngo_house_1_GRaM1Nq1.jpg' },
  { id: 4, name: 'Nha Trang', hotels: 67, image: 'images/khach_san_windsor_plaza/khach_san_windsor_plaza_4_ZxTmwLms.jpg' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [hasNewNotifications] = useState(true);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [topRatedHotels, setTopRatedHotels] = useState<Hotel[]>([]);
  const [specialOffers, setSpecialOffers] = useState<Hotel[]>([]);
  const [favoriteHotelIds, setFavoriteHotelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Guest');

  // Load hotels data once on mount
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  // Reload favorites every time screen is focused
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
      
      // Load featured hotels (rating >= 4)
      const hotelsResponse = await getFeaturedHotels();
      if (hotelsResponse.success && hotelsResponse.data) {
        setHotels(hotelsResponse.data.slice(0, 6)); // Popular hotels
      }

      // Load all hotels for other sections
      const allHotelsResponse = await getAllHotels({ limit: 20 });
      if (allHotelsResponse.success && allHotelsResponse.data) {
        // Top rated: rating >= 4.5
        const topRated = allHotelsResponse.data
          .filter((h: Hotel) => h.rating >= 4.5)
          .slice(0, 4);
        setTopRatedHotels(topRated);

        // Special offers: price < 100
        const offers = allHotelsResponse.data
          .filter((h: Hotel) => h.price < 100)
          .slice(0, 4);
        setSpecialOffers(offers);
      }

      // Load user info and favorites
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          const meResponse = await getMe(token);
          if (meResponse.success && meResponse.data) {
            setUserId(meResponse.data._id);
            setUserName(meResponse.data.userName || 'Guest');
            // Load favorites will be triggered by useFocusEffect
          }
        } catch (error) {
          console.log('Not logged in:', error);
        }
      }
    } catch (error) {
      console.error('Load initial data error:', error);
      Alert.alert('Error', 'Failed to load hotels');
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
      Alert.alert('Login Required', 'Please login to add favorites');
      router.push('/auth/login' as any);
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User data not available');
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
        Alert.alert('Error', response.message || 'Failed to update favorite');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update favorite');
    }
  };

  return (
    <View style={styles.container}>
      {/* Gradient Header Background */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>👋 Hey {userName},</Text>
              <Text style={styles.title}>Where would you like to go?</Text>
            </View>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications' as any)}
            >
              <Bell size={22} color="white" />
              {hasNewNotifications && <View style={styles.notificationBadge} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Card - Inside gradient */}
        <View style={styles.searchCardWrapper}>
          <TouchableOpacity
            style={styles.searchCard}
            onPress={() => router.push('/search')}
            activeOpacity={0.9}
          >
            <View style={styles.searchRow}>
              <View style={styles.searchIconContainer}>
                <MapPin size={22} color="#17A2B8" />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchTitle}>Search Hotels</Text>
                <Text style={styles.searchSubtitle}>Find your perfect stay</Text>
              </View>
              <View style={styles.searchArrow}>
                <Text style={styles.searchArrowText}>→</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >

      {/* Popular Destinations */}
      <View style={[styles.section, { marginTop: 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Destinations</Text>
          <TouchableOpacity onPress={() => router.push('/search' as any)}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destinationsScroll}
        >
          {destinations.map((dest) => (
            <TouchableOpacity
              key={dest.id}
              style={styles.destinationCard}
              onPress={() => router.push(`/search?location=${dest.name}` as any)}
            >
              <Image 
                source={{ uri: getImageUri(dest.image) }} 
                style={styles.destinationImage} 
              />
              <View style={styles.destinationOverlay}>
                <Text style={styles.destinationName}>{dest.name}</Text>
                <Text style={styles.destinationHotels}>{dest.hotels} Hotels</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Special Offers */}
      {specialOffers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <Tag size={20} color="#17A2B8" /> Special Offers
            </Text>
            <TouchableOpacity onPress={() => router.push('/search' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersScroll}
          >
            {specialOffers.map((hotel) => (
              <TouchableOpacity
                key={hotel._id}
                style={styles.offerCard}
                onPress={() => router.push(`/hotel/${hotel._id}`)}
              >
                <Image 
                  source={{ uri: getImageUri(hotel.photos[0]) }} 
                  style={styles.offerImage} 
                />
                <View style={styles.offerBadge}>
                  <Text style={styles.offerBadgeText}>SAVE 20%</Text>
                </View>
                <View style={styles.offerInfo}>
                  <Text style={styles.offerHotelName} numberOfLines={1}>{hotel.name}</Text>
                  <View style={styles.offerMeta}>
                    <MapPin size={12} color="#666" />
                    <Text style={styles.offerLocation} numberOfLines={1}>{hotel.location}</Text>
                  </View>
                  <View style={styles.offerFooter}>
                    <View style={styles.offerRating}>
                      <Star size={12} color="#FFA500" fill="#FFA500" />
                      <Text style={styles.offerRatingText}>{hotel.rating}</Text>
                    </View>
                    <View style={styles.offerPrice}>
                      <Text style={styles.offerOldPrice}>${hotel.price + 20}</Text>
                      <Text style={styles.offerNewPrice}>${hotel.price}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Top Rated */}
      {topRatedHotels.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <TrendingUp size={20} color="#17A2B8" /> Top Rated
            </Text>
            <TouchableOpacity onPress={() => router.push('/search' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topRatedGrid}>
            {topRatedHotels.map((hotel) => (
              <TouchableOpacity
                key={hotel._id}
                style={styles.topRatedCard}
                onPress={() => router.push(`/hotel/${hotel._id}`)}
              >
                <Image 
                  source={{ uri: getImageUri(hotel.photos[0]) }} 
                  style={styles.topRatedImage} 
                />
                <View style={styles.topRatedBadge}>
                  <Star size={10} color="#fff" fill="#fff" />
                  <Text style={styles.topRatedBadgeText}>{hotel.rating}</Text>
                </View>
                <View style={styles.topRatedInfo}>
                  <Text style={styles.topRatedName} numberOfLines={1}>{hotel.name}</Text>
                  <Text style={styles.topRatedLocation} numberOfLines={1}>
                    <MapPin size={10} color="#666" /> {hotel.location}
                  </Text>
                  <Text style={styles.topRatedPrice}>${hotel.price}/night</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Popular Hotel */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Hotel</Text>
          <TouchableOpacity onPress={() => router.push('/search' as any)}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hotelsGrid}>
          {hotels.map((hotel) => (
            <TouchableOpacity
              key={hotel._id}
              style={styles.hotelCard}
              onPress={() => router.push(`/hotel/${hotel._id}`)}
            >
              <Image 
                source={{ uri: getImageUri(hotel.photos && hotel.photos.length > 0 ? hotel.photos[0] : '') }} 
                style={styles.hotelImage} 
              />
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(hotel._id);
                }}
              >
                <Heart 
                  size={16} 
                  color={favoriteHotelIds.includes(hotel._id) ? "#FF6B6B" : "#fff"} 
                  fill={favoriteHotelIds.includes(hotel._id) ? "#FF6B6B" : "rgba(255,255,255,0.3)"} 
                />
              </TouchableOpacity>
              <View style={styles.hotelInfo}>
                <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
                <View style={styles.hotelMeta}>
                  <MapPin size={10} color="#666" />
                  <Text style={styles.hotelLocation} numberOfLines={1}>{hotel.location}</Text>
                </View>
                <View style={styles.hotelFooter}>
                  <View style={styles.rating}>
                    <Star size={12} color="#FFA500" fill="#FFA500" />
                    <Text style={styles.ratingText}>{hotel.rating?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.reviewsText}>({hotel.reviews?.length || 0})</Text>
                  </View>
                  <Text style={styles.price}>${hotel.price}<Text style={styles.priceUnit}>/night</Text></Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    backgroundColor: '#17A2B8',
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'white',
  },
  searchCardWrapper: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  searchIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  searchSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  searchArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17A2B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  searchArrowText: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  section: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  seeAll: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '600',
  },
  recentSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  recentSearchCard: {
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
  recentSearchImage: {
    width: '100%',
    height: 100,
  },
  recentSearchInfo: {
    padding: 10,
  },
  recentSearchName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  recentSearchLocation: {
    fontSize: 11,
    color: '#666',
  },
  hotelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 14,
  },
  hotelCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  hotelImage: {
    width: '100%',
    height: 130,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  hotelMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 3,
  },
  hotelLocation: {
    fontSize: 10,
    color: '#666',
    flex: 1,
  },
  hotelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  reviewsText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#17A2B8',
    letterSpacing: -0.3,
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  // Destinations styles
  destinationsScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  destinationCard: {
    width: 180,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  destinationImage: {
    width: '100%',
    height: '100%',
  },
  destinationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  destinationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: -0.3,
  },
  destinationHotels: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.95,
    fontWeight: '500',
  },
  // Special Offers styles
  offersScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  offerCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  offerImage: {
    width: '100%',
    height: 140,
  },
  offerBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  offerInfo: {
    padding: 14,
  },
  offerHotelName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 5,
    letterSpacing: -0.3,
  },
  offerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  offerLocation: {
    fontSize: 11,
    color: '#666',
    flex: 1,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offerRatingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  offerPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offerOldPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  offerNewPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  // Top Rated styles
  topRatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  topRatedCard: {
    width: (width - 52) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRatedImage: {
    width: '100%',
    height: 100,
  },
  topRatedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#17A2B8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topRatedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  topRatedInfo: {
    padding: 10,
  },
  topRatedName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  topRatedLocation: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  topRatedPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
});
