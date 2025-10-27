import { useRouter } from 'expo-router';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

type Booking = {
  id: number;
  hotelName: string;
  location: string;
  image: string;
  checkIn: string;
  checkOut: string;
  guests: string;
  totalPrice: number;
  status: BookingStatus;
  nights: number;
  rating?: number;
};

export default function BookingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');

  const bookings: Booking[] = [
    {
      id: 1,
      hotelName: 'Hyatt Regency Bali',
      location: 'Seminyak, Bali',
      image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
      checkIn: 'Mon, 16 Sep',
      checkOut: 'Thu, 18 Sep',
      guests: '2 Guests',
      totalPrice: 1458.86,
      status: 'upcoming',
      nights: 2,
    },
    {
      id: 2,
      hotelName: 'Tanish by The Fountain',
      location: 'Seminyak, Bali',
      image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
      checkIn: 'Sun, 21 Sep',
      checkOut: 'Thu, 24 Sep',
      guests: '2 Guests',
      totalPrice: 1244.71,
      status: 'upcoming',
      nights: 3,
    },
    {
      id: 3,
      hotelName: 'SIMBO by Agung Bali',
      location: 'Braga, Ubud Bali',
      image: 'https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=400',
      checkIn: 'Fri, 12 Aug',
      checkOut: 'Sun, 14 Aug',
      guests: '2 Guests',
      totalPrice: 1194.75,
      status: 'completed',
      nights: 2,
      rating: 4.7,
    },
  ];

  const filteredBookings = bookings.filter(b => b.status === activeTab);

  const handleCancelBooking = (id: number, hotelName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${hotelName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            // Handle cancellation
            Alert.alert('Booking Cancelled', 'Your booking has been cancelled successfully.');
          }
        }
      ]
    );
  };

  const handleRebook = (booking: Booking) => {
    router.push(`/hotel/${booking.id}`);
  };

  const handleAddReview = (booking: Booking) => {
    const url = `/review/${booking.id}?hotelName=${encodeURIComponent(booking.hotelName)}&hotelLocation=${encodeURIComponent(booking.location)}&hotelImage=${encodeURIComponent(booking.image)}`;
    router.push(url as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Booking History</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'cancelled' && styles.tabActive]}
          onPress={() => setActiveTab('cancelled')}
        >
          <Text style={[styles.tabText, activeTab === 'cancelled' && styles.tabTextActive]}>
            Cancelled
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyStateText}>
              Start planning your next adventure. Browse the hotels now.
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.cardHeader}>
                <Image source={{ uri: booking.image }} style={styles.hotelImage} />
                <View style={styles.hotelInfo}>
                  <Text style={styles.hotelName}>{booking.hotelName}</Text>
                  <View style={styles.locationRow}>
                    <MapPin size={12} color="#666" />
                    <Text style={styles.location}>{booking.location}</Text>
                  </View>
                  {booking.rating && (
                    <View style={styles.ratingBadge}>
                      <Text style={styles.ratingText}>⭐ {booking.rating}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Calendar size={16} color="#17A2B8" />
                    <View>
                      <Text style={styles.detailLabel}>Check-in</Text>
                      <Text style={styles.detailValue}>{booking.checkIn}</Text>
                    </View>
                  </View>
                  <View style={styles.detailItem}>
                    <Calendar size={16} color="#17A2B8" />
                    <View>
                      <Text style={styles.detailLabel}>Check-out</Text>
                      <Text style={styles.detailValue}>{booking.checkOut}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Users size={16} color="#17A2B8" />
                    <View>
                      <Text style={styles.detailLabel}>Guests</Text>
                      <Text style={styles.detailValue}>{booking.guests}</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalPrice}>${booking.totalPrice}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                {activeTab === 'upcoming' && (
                  <>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelBooking(booking.id, booking.hotelName)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rebookButton}>
                      <Text style={styles.rebookButtonText}>Re-Book</Text>
                    </TouchableOpacity>
                  </>
                )}
                {activeTab === 'completed' && (
                  <>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleRebook(booking)}
                    >
                      <Text style={styles.cancelButtonText}>Re-Book</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rebookButton}
                      onPress={() => handleAddReview(booking)}
                    >
                      <Text style={styles.rebookButtonText}>Add Review</Text>
                    </TouchableOpacity>
                  </>
                )}
                {activeTab === 'cancelled' && (
                  <TouchableOpacity
                    style={styles.rebookButton}
                    onPress={() => handleRebook(booking)}
                  >
                    <Text style={styles.rebookButtonText}>Re-Book</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  tabActive: {
    backgroundColor: '#17A2B8',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: 'white',
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
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  hotelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  location: {
    fontSize: 12,
    color: '#666',
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  bookingDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  priceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  rebookButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#17A2B8',
    alignItems: 'center',
  },
  rebookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
