import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, MapPin, Users, Check, Clock, CreditCard, AlertCircle, Share2, Download } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { getBookingById, cancelBooking, Booking as BookingType } from '../../services/bookingService';
import { getHotelById, Hotel } from '../../services/hotelService';
import { auth } from '../../config/firebase';
import { getImageUri } from '../../utils/imageHelper';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<BookingType | null>(null);
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) {
      loadBookingDetail();
    }
  }, [id]);

  const loadBookingDetail = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to view booking details');
        router.replace('/auth/login');
        return;
      }

      const token = await currentUser.getIdToken();
      const response = await getBookingById(token, id as string);
      
      if (response.success && response.data) {
        setBooking(response.data);
        
        // Get hotel ID and fetch hotel details
        const hotelId = typeof response.data.hotelId === 'string' 
          ? response.data.hotelId 
          : response.data.hotelId?._id;
          
        if (hotelId) {
          const hotelResponse = await getHotelById(hotelId);
          if (hotelResponse.success && hotelResponse.data) {
            setHotel(hotelResponse.data);
          }
        }
      } else {
        Alert.alert('Error', 'Failed to load booking details');
        router.back();
      }
    } catch (error) {
      console.error('Load booking error:', error);
      Alert.alert('Error', 'Failed to load booking details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
    if (!booking) return;

    const hotelNameForAlert = hotel?.name || 'this hotel';

    Alert.alert(
      'Cancel Booking',
      `Are you sure you want to cancel your booking at ${hotelNameForAlert}?\n\nBooking Number: ${booking.bookingNumber}`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setCancelling(true);
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              const token = await currentUser.getIdToken();
              const response = await cancelBooking(token, booking._id);
              
              if (response.success) {
                Alert.alert(
                  'Booking Cancelled',
                  'Your booking has been cancelled successfully.',
                  [
                    {
                      text: 'OK',
                      onPress: () => router.push('/tabs/booking')
                    }
                  ]
                );
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking');
              }
            } catch (error) {
              console.error('Cancel booking error:', error);
              Alert.alert('Error', 'Failed to cancel booking');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const handleShare = () => {
    Alert.alert('Share', 'Share booking feature coming soon!');
  };

  const handleDownload = () => {
    Alert.alert('Download', 'Download booking receipt feature coming soon!');
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const calculateNights = (checkIn: Date | string, checkOut: Date | string) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return '#17A2B8';
      case 'completed':
        return '#4CD964';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading booking details...</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666' }}>Booking not found</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 12, backgroundColor: '#17A2B8', borderRadius: 8 }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hotelName = hotel?.name || 'Unknown Hotel';
  const hotelLocation = hotel?.location || '';
  const hotelImagePath = hotel?.photos?.[0];
  const hotelRating = hotel?.rating;
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const statusColor = getStatusColor(booking.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
            <Share2 size={20} color="#1a1a1a" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDownload} style={styles.iconButton}>
            <Download size={20} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Check size={16} color="white" />
          <Text style={styles.statusText}>{getStatusText(booking.status)}</Text>
        </View>

        {/* Booking Number */}
        <View style={styles.bookingNumberCard}>
          <Text style={styles.bookingNumberLabel}>Booking Number</Text>
          <Text style={styles.bookingNumber}>{booking.bookingNumber}</Text>
        </View>

        {/* Hotel Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Information</Text>
          <View style={styles.hotelCard}>
            {hotelImagePath && (
              <Image source={{ uri: getImageUri(hotelImagePath) }} style={styles.hotelImage} />
            )}
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>{hotelName}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#666" />
                <Text style={styles.hotelLocation}>{hotelLocation}</Text>
              </View>
              {hotelRating && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {hotelRating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stay Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stay Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color="#17A2B8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Check-in</Text>
                <Text style={styles.detailValue}>{formatDate(booking.checkIn)}</Text>
                <Text style={styles.detailTime}>After 2:00 PM</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Calendar size={20} color="#17A2B8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Check-out</Text>
                <Text style={styles.detailValue}>{formatDate(booking.checkOut)}</Text>
                <Text style={styles.detailTime}>Before 12:00 PM</Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Clock size={20} color="#17A2B8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>
                  {nights} {nights === 1 ? 'Night' : 'Nights'}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Users size={20} color="#17A2B8" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Guests</Text>
                <Text style={styles.detailValue}>{booking.guests} Guests</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Room Details */}
        {booking.roomType && booking.roomType.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            <View style={styles.detailsCard}>
              {booking.roomType.map((room, index) => (
                <View key={index}>
                  {index > 0 && <View style={styles.detailDivider} />}
                  <View style={styles.roomRow}>
                    <View style={styles.roomDot} />
                    <Text style={styles.roomType}>{room}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Price Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Details</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {booking.roomType?.length || 1} room{(booking.roomType?.length || 1) > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}
              </Text>
              <Text style={styles.priceValue}>${booking.totalPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>${booking.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Important Information */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <AlertCircle size={20} color="#17A2B8" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Important Information</Text>
              <Text style={styles.infoText}>
                • Check-in: 2:00 PM{'\n'}
                • Check-out: 12:00 PM{'\n'}
                • Valid ID required{'\n'}
                • Credit card for incidentals{'\n'}
                • Cancellation policy applies
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      {booking.status === 'upcoming' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.viewHotelButton}
            onPress={() => {
              if (hotel?._id) {
                router.push(`/hotel/${hotel._id}`);
              } else {
                Alert.alert('Error', 'Hotel information not available');
              }
            }}
          >
            <Text style={styles.viewHotelButtonText}>View Hotel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelButton, cancelling && { opacity: 0.6 }]}
            onPress={handleCancelBooking}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {booking.status === 'completed' && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.rebookButton}
            onPress={() => {
              if (hotel?._id) {
                router.push(`/hotel/${hotel._id}`);
              } else {
                Alert.alert('Error', 'Hotel information not available');
              }
            }}
          >
            <Text style={styles.rebookButtonText}>Book Again</Text>
          </TouchableOpacity>
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingNumberCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  bookingNumberLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bookingNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#17A2B8',
    letterSpacing: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  hotelLocation: {
    fontSize: 12,
    color: '#666',
  },
  ratingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  detailTime: {
    fontSize: 11,
    color: '#999',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  roomDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#17A2B8',
  },
  roomType: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  priceCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F7F9',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  bottomBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 12,
  },
  viewHotelButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewHotelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17A2B8',
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  rebookButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rebookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
