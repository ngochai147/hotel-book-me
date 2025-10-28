import { useRouter } from 'expo-router';
import { Bell, Calendar, Heart, MapPin, Star, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const recentSearches = [
  {
    id: 1,
    name: 'New Caledonia Bali',
    location: 'Kuta, Denpasar, Bali',
    image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Saved by the Peaches',
    location: 'Kuta, Denpasar',
    image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    name: 'Kinisatani Resorts',
    location: 'Seminyak, Bali',
    image: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 4,
    name: 'Azimara Resorts',
    location: 'Ubud, Bali',
    image: 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const hotels = [
  {
    id: 1,
    name: 'New Caledonia Bali',
    location: 'Kuta, Denpasar, Bali',
    rating: 4.8,
    reviews: 49,
    price: 24,
    image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Kinisatani Resorts',
    location: 'Seminyak, Bali',
    rating: 4.9,
    reviews: 85,
    price: 45,
    image: 'https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    name: 'Kinisatani Resorts',
    location: 'Ubud, Bali',
    rating: 4.7,
    reviews: 62,
    price: 37,
    image: 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 4,
    name: 'Azimara Resorts',
    location: 'Nusa Dua, Bali',
    rating: 4.6,
    reviews: 38,
    price: 52,
    image: 'https://images.pexels.com/photos/53577/hotel-architectural-tourism-travel-53577.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [guest, setGuest] = useState('');
  const [hasNewNotifications] = useState(true);
  const [favoriteHotels, setFavoriteHotels] = useState<number[]>([1, 3]); 

  const handleToggleFavorite = (hotelId: number) => {
    setFavoriteHotels(prev => {
      if (prev.includes(hotelId)) {
        return prev.filter(id => id !== hotelId);
      } else {
        return [...prev, hotelId];
      }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey Hassan,</Text>
          <Text style={styles.title}>Let's start your journey!</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/notifications' as any)}
        >
          <Bell size={24} color="#1a1a1a" />
          {hasNewNotifications && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <TouchableOpacity
          style={styles.searchCompactInput}
          onPress={() => router.push('/location-search')}
        >
          <MapPin size={20} color="#17A2B8" />
          <Text style={styles.searchCompactText}>Bali, Indonesia</Text>
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <TouchableOpacity
            style={styles.searchCompactHalf}
            onPress={() => router.push('/date-picker')}
          >
            <Calendar size={16} color="#17A2B8" />
            <Text style={styles.searchCompactLabel}>29 May-4 Jun</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchCompactHalf}
            onPress={() => router.push('/guest-selector')}
          >
            <Users size={16} color="#17A2B8" />
            <Text style={styles.searchCompactLabel}>2 Rooms • 4 Adults</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/search')}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Search*/}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Search</Text>
        </View>

        <View style={styles.recentSearchGrid}>
          {recentSearches.map((search) => (
            <TouchableOpacity
              key={search.id}
              style={styles.recentSearchCard}
              onPress={() => router.push(`/hotel/${search.id}`)}
            >
              <Image source={{ uri: search.image }} style={styles.recentSearchImage} />
              <View style={styles.recentSearchInfo}>
                <Text style={styles.recentSearchName} numberOfLines={1}>
                  {search.name}
                </Text>
                <Text style={styles.recentSearchLocation} numberOfLines={1}>
                  {search.location}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
              key={hotel.id}
              style={styles.hotelCard}
              onPress={() => router.push(`/hotel/${hotel.id}`)}
            >
              <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
              <TouchableOpacity 
                style={styles.favoriteButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(hotel.id);
                }}
              >
                <Heart 
                  size={16} 
                  color={favoriteHotels.includes(hotel.id) ? "#FF6B6B" : "#fff"} 
                  fill={favoriteHotels.includes(hotel.id) ? "#FF6B6B" : "rgba(255,255,255,0.3)"} 
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
                    <Text style={styles.ratingText}>{hotel.rating}</Text>
                    <Text style={styles.reviewsText}>({hotel.reviews})</Text>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    borderWidth: 2,
    borderColor: 'white',
  },
  searchCard: {
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchCompactInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  searchCompactText: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  searchCompactHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  searchCompactLabel: {
    fontSize: 11,
    color: '#1a1a1a',
    fontWeight: '500',
    flex: 1,
  },
  searchButton: {
    height: 50,
    backgroundColor: '#17A2B8',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 12,
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
    gap: 12,
  },
  hotelCard: {
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
  hotelImage: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelInfo: {
    padding: 10,
  },
  hotelName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 3,
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
  reviewsText: {
    fontSize: 10,
    color: '#666',
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
});
