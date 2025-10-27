import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ArrowLeft, MapPin, X, Building2 } from 'lucide-react-native';

const locationResults = [
  { id: 1, name: 'Bali', subtext: 'Indonesia', type: 'location' },
  { id: 2, name: 'Bali', subtext: 'Denpasar', type: 'location' },
  { id: 3, name: 'Bali', subtext: 'Canggu, Badung Regency', type: 'location' },
  { id: 4, name: 'Balatonlured', subtext: 'Hungary', type: 'location' },
  { id: 5, name: 'Balikpapan', subtext: 'Indonesia', type: 'location' },
];

const hotelResults = [
  { id: 1, name: 'Bloo Bali Hotel', subtext: 'Kuta, Bali' },
  { id: 2, name: 'Golden Tulip Resort Bali', subtext: 'Badung, Bali' },
];

export default function LocationSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('Bali');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search location"
            placeholderTextColor="#999"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {locationResults.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={styles.resultItem}
              onPress={() => router.back()}
            >
              <View style={styles.iconContainer}>
                <MapPin size={20} color="#17A2B8" />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{location.name}</Text>
                <Text style={styles.resultSubtext}>{location.subtext}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel and Villas</Text>
          {hotelResults.map((hotel) => (
            <TouchableOpacity
              key={hotel.id}
              style={styles.resultItem}
              onPress={() => router.back()}
            >
              <View style={styles.iconContainer}>
                <Building2 size={20} color="#17A2B8" />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{hotel.name}</Text>
                <Text style={styles.resultSubtext}>{hotel.subtext}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    fontSize: 14,
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  resultSubtext: {
    fontSize: 13,
    color: '#666',
  },
});
