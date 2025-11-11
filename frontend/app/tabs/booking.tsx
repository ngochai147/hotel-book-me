import { useRouter, useFocusEffect } from 'expo-router';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { getMyBookings, cancelBooking, Booking as BookingType } from '../../services/bookingService';
import { auth } from '../../config/firebase';
import { getImageUri } from '../../utils/imageHelper';

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export default function BookingScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload bookings when screen is focused or tab changes
  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [activeTab])
  );

  const loadBookings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to view bookings');
        router.replace('/auth/login');
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await getMyBookings(token, activeTab);
      
      if (response.success) {
        // Remove duplicates based on booking ID
        const uniqueBookings = response.data.filter((booking, index, self) =>
          index === self.findIndex((b) => b._id === booking._id)
        );
        setBookings(uniqueBookings);
      } else {
        Alert.alert('Error', 'Failed to load bookings');
      }
    } catch (error) {
      console.error('Load bookings error:', error);
      Alert.alert('Error', 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredBookings = bookings;

  const handleCancelBooking = async (bookingId: string, hotelName: string) => {
    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${hotelName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              const token = await currentUser.getIdToken();
              const response = await cancelBooking(token, bookingId);
              
              if (response.success) {
                Alert.alert('Success', 'Your booking has been cancelled successfully.');
                loadBookings(); // Reload bookings
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking');
              }
            } catch (error) {
              console.error('Cancel booking error:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const handleRebook = (booking: BookingType) => {
    try {
      const hotelId = typeof booking.hotelId === 'string' ? booking.hotelId : booking.hotelId?._id;
      if (!hotelId) {
        Alert.alert('Error', 'Hotel information not available');
        return;
      }
      router.push(`/hotel/${hotelId}`);
    } catch (error) {
      console.error('Rebook error:', error);
      Alert.alert('Error', 'Unable to view hotel details');
    }
  };

  const handleAddReview = (booking: BookingType) => {
    try {
      const hotel = typeof booking.hotelId === 'object' ? booking.hotelId : null;
      if (!hotel) {
        Alert.alert('Error', 'Hotel information not available');
        return;
      }
      const url = `/review/create?hotelId=${hotel._id}`;
      router.push(url as any);
    } catch (error) {
      console.error('Add review error:', error);
      Alert.alert('Error', 'Unable to add review');
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const calculateNights = (checkIn: Date | string, checkOut: Date | string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading bookings...</Text>
      </View>
    );
  }

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
          filteredBookings.map((booking) => {
            const hotel = typeof booking.hotelId === 'object' ? booking.hotelId : null;
            const hotelName = hotel?.name || booking.hotelName || 'Unknown Hotel';
            const hotelLocation = hotel?.location || booking.location || '';
            const hotelImagePath = hotel?.photos?.[0] || booking.image;
            const hotelRating = hotel?.rating;
            const nights = calculateNights(booking.checkIn, booking.checkOut);

            return (
              <View key={booking._id} style={styles.bookingCard}>
                <View style={styles.cardHeader}>
                  <Image source={{ uri: getImageUri(hotelImagePath) }} style={styles.hotelImage} />
                  <View style={styles.hotelInfo}>
                    <Text style={styles.hotelName}>{hotelName}</Text>
                    <View style={styles.locationRow}>
                      <MapPin size={12} color="#666" />
                      <Text style={styles.location}>{hotelLocation}</Text>
                    </View>
                    {hotelRating && (
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>⭐ {hotelRating.toFixed(1)}</Text>
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
                        <Text style={styles.detailValue}>{formatDate(booking.checkIn)}</Text>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color="#17A2B8" />
                      <View>
                        <Text style={styles.detailLabel}>Check-out</Text>
                        <Text style={styles.detailValue}>{formatDate(booking.checkOut)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                      <Users size={16} color="#17A2B8" />
                      <View>
                        <Text style={styles.detailLabel}>Guests</Text>
                        <Text style={styles.detailValue}>{booking.guests} Guests</Text>
                      </View>
                    </View>
                    <View style={styles.priceContainer}>
                      <Text style={styles.totalLabel}>Total ({nights} {nights === 1 ? 'night' : 'nights'})</Text>
                      <Text style={styles.totalPrice}>${booking.totalPrice.toFixed(2)}</Text>
                    </View>
                  </View>

                  {booking.roomType && booking.roomType.length > 0 && (
                    <View style={styles.roomTypeContainer}>
                      <Text style={styles.roomTypeLabel}>Room Type:</Text>
                      <Text style={styles.roomTypeText}>{booking.roomType.join(', ')}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  {activeTab === 'upcoming' && (
                    <>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking._id, hotelName)}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.rebookButton}
                        onPress={() => router.push(`/booking/${booking._id}` as any)}
                      >
                        <Text style={styles.rebookButtonText}>View Details</Text>
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
            );
          })
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
  roomTypeContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  roomTypeLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  roomTypeText: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
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
