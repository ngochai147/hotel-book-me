import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Step2GuestsScreen() {
  const router = useRouter();
  const { id, checkIn, checkOut } = useLocalSearchParams();
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(1);

  const handleNext = () => {
    router.push({
      pathname: `/booking/[id]/step3-info`,
      params: { id: id as string, checkIn, checkOut, rooms, adults, children }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking and Payment</Text>
      </View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressDot} />
        <View style={styles.progressDot} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hotel Info */}
        <View style={styles.hotelCard}>
          <Image 
            source={{ uri: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
            style={styles.hotelImage} 
          />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>Grand Mecure Bali</Text>
            <Text style={styles.hotelLocation}>📍 Seminyak, Bali</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.rating}>⭐ 4.8</Text>
            </View>
          </View>
        </View>

        {/* Booking Info Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Check-in</Text>
          <Text style={styles.summaryValue}>📅 {checkIn}</Text>
          <Text style={[styles.summaryLabel, { marginTop: 8 }]}>Check-out</Text>
          <Text style={styles.summaryValue}>📅 {checkOut}</Text>
        </View>

        {/* Rooms and Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms and Guests</Text>

          <View style={styles.counterItem}>
            <View>
              <Text style={styles.counterLabel}>Rooms</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity 
                style={styles.counterButton} 
                onPress={() => setRooms(Math.max(1, rooms - 1))}
              >
                <Minus size={16} color="#17A2B8" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{rooms}</Text>
              <TouchableOpacity 
                style={styles.counterButton} 
                onPress={() => setRooms(rooms + 1)}
              >
                <Plus size={16} color="#17A2B8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.counterItem}>
            <View>
              <Text style={styles.counterLabel}>Adults</Text>
              <Text style={styles.counterSublabel}>Ages 13+</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity 
                style={styles.counterButton} 
                onPress={() => setAdults(Math.max(1, adults - 1))}
              >
                <Minus size={16} color="#17A2B8" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{adults}</Text>
              <TouchableOpacity 
                style={styles.counterButton} 
                onPress={() => setAdults(adults + 1)}
              >
                <Plus size={16} color="#17A2B8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.counterItem}>
            <View>
              <Text style={styles.counterLabel}>Children</Text>
              <Text style={styles.counterSublabel}>Ages 2-12</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity 
                style={styles.counterButton} 
                onPress={() => setChildren(Math.max(0, children - 1))}
              >
                <Minus size={16} color="#17A2B8" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{children}</Text>
              <TouchableOpacity 
                style={styles.counterButton} 
                onPress={() => setChildren(children + 1)}
              >
                <Plus size={16} color="#17A2B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#17A2B8',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  hotelInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
  },
  summaryCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  counterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  counterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  counterSublabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 24,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  nextButton: {
    height: 56,
    backgroundColor: '#17A2B8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
