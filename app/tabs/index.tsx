import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { MapPin, Star, Bell, Heart } from 'lucide-react-native';

const hotels = [
  {
    id: 1,
    name: 'The Dreamland by Young Villas',
    location: 'Kuta, Denpasar, Bali',
    rating: 4.8,
    price: 24,
    image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Paradise Hotel',
    location: 'Kuta, Denpasar',
    rating: 4.7,
    price: 37,
    image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [guest, setGuest] = useState('');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey Hassan,</Text>
          <Text style={styles.title}>Let's start your journey!</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={24} color="#1a1a1a" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Location</Text>
        <TouchableOpacity
          style={styles.searchInput}
          onPress={() => router.push('./location-search')}
        >
          <MapPin size={20} color="#999" />
          <Text style={[styles.searchInputText, !location && styles.placeholder]}>
            {location || 'Enter your destination'}
          </Text>
        </TouchableOpacity>

        <View style={styles.searchRow}>
          <View style={styles.searchHalf}>
            <Text style={styles.searchLabel}>Date</Text>
            <TouchableOpacity
              style={styles.searchInputSmall}
              onPress={() => router.push('./date-picker')}
            >
              <Text style={[styles.searchInputText, !date && styles.placeholder]}>
                {date || 'Select Date'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchHalf}>
            <Text style={styles.searchLabel}>Guest</Text>
            <TouchableOpacity
              style={styles.searchInputSmall}
              onPress={() => router.push('./guest-selector')}
            >
              <Text style={[styles.searchInputText, !guest && styles.placeholder]}>
                {guest || 'Add guest'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('./search')}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Hotel</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hotelsContainer}
        >
          {hotels.map((hotel) => (
            <TouchableOpacity
              key={hotel.id}
              style={styles.hotelCard}
              onPress={() => router.push(`/hotel/${hotel.id}`)}
            >
              <Image source={{ uri: hotel.image }} style={styles.hotelImage} />
              <TouchableOpacity style={styles.favoriteButton}>
                <View style={styles.favoriteBg}>
                  <Heart size={18} color="#666" />
                </View>
              </TouchableOpacity>
              <View style={styles.hotelInfo}>
                <Text style={styles.hotelName} numberOfLines={1}>{hotel.name}</Text>
                <View style={styles.hotelMeta}>
                  <MapPin size={12} color="#666" />
                  <Text style={styles.hotelLocation} numberOfLines={1}>{hotel.location}</Text>
                </View>
                <View style={styles.hotelFooter}>
                  <View style={styles.rating}>
                    <Star size={14} color="#FFA500" fill="#FFA500" />
                    <Text style={styles.ratingText}>{hotel.rating}</Text>
                  </View>
                  <Text style={styles.price}>${hotel.price}<Text style={styles.priceUnit}>/night</Text></Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
  },
  searchCard: {
    marginHorizontal: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  searchInputSmall: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  searchInputText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  placeholder: {
    color: '#999',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  searchHalf: {
    flex: 1,
  },
  searchButton: {
    height: 56,
    backgroundColor: '#17A2B8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  seeAll: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '600',
  },
  hotelsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  hotelCard: {
    width: 240,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  hotelImage: {
    width: '100%',
    height: 160,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  favoriteBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotelInfo: {
    padding: 12,
  },
  hotelName: {
    fontSize: 16,
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
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#666',
  },
});
