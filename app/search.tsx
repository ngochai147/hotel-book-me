import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Search as SearchIcon, SlidersHorizontal, Star, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import FilterModal from '../components/FilterModal';

const searchHistory = [
  { id: 1, text: 'Hotel Bali', tag: true },
  { id: 2, text: 'Istanbul', tag: true },
  { id: 3, text: 'Villa Ubuwatu', tag: true },
  { id: 4, text: 'The Dreamland Bali', tag: false },
  { id: 5, text: 'Jakarta', tag: false },
  { id: 6, text: 'New York', tag: false },
];

const recommendations = [
  {
    id: 1,
    name: 'Terra Cottages Bali',
    location: 'Bingin, Uluwatu, Bali',
    rating: 4.7,
    price: 38,
    image: 'https://images.pexels.com/photos/1268871/pexels-photo-1268871.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Santai by The Koro...',
    location: 'Bingin, Uluwatu, Bali',
    rating: 4.8,
    price: 29,
    image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

const recentlyViewed = [
  {
    id: 1,
    name: 'Sivana Hotel Boutique',
    location: 'Uluwatu, Bali',
    rating: 4.8,
    price: 50,
    image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Bingin High Tides',
    location: 'Bingin, Uluwatu, Bali',
    rating: 4.9,
    price: 48,
    image: 'https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState(params.location as string || '');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const bookingInfo = {
    location: params.location as string,
    checkIn: params.checkIn as string,
    checkOut: params.checkOut as string,
    rooms: params.rooms as string,
    adults: params.adults as string,
    children: params.children as string,
  };

  const handleFilterApply = (filters: any) => {
    console.log('Applied filters:', filters);
  };

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
            placeholderTextColor="#999"
          />
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Search</Text>
          <View style={styles.tagsContainer}>
            {searchHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.tag, item.tag && styles.tagActive]}
              >
                <Text style={[styles.tagText, item.tag && styles.tagTextActive]}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recommendationsGrid}>
            {recommendations.map((hotel) => (
              <TouchableOpacity
                key={hotel.id}
                style={styles.recommendationCard}
                onPress={() => router.push(`/hotel/${hotel.id}`)}
              >
                <Image source={{ uri: hotel.image }} style={styles.recommendationImage} />
                <View style={styles.recommendationInfo}>
                  <Text style={styles.recommendationName} numberOfLines={1}>
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
                      <Text style={styles.ratingText}>{hotel.rating}</Text>
                    </View>
                    <Text style={styles.price}>
                      ${hotel.price}
                      <Text style={styles.priceUnit}>/night</Text>
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Viewed</Text>
          {recentlyViewed.map((hotel) => (
            <TouchableOpacity
              key={hotel.id}
              style={styles.recentCard}
              onPress={() => router.push(`/hotel/${hotel.id}`)}
            >
              <Image source={{ uri: hotel.image }} style={styles.recentImage} />
              <View style={styles.recentInfo}>
                <Text style={styles.recentName} numberOfLines={1}>
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
                    <Text style={styles.ratingText}>{hotel.rating}</Text>
                  </View>
                  <Text style={styles.price}>
                    ${hotel.price}
                    <Text style={styles.priceUnit}>/night</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

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
});
