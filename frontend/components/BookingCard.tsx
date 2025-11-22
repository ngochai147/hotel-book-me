import { useRouter } from 'expo-router';
import { Calendar, MapPin, Users } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getImageUri } from '../utils/imageHelper';

interface BookingCardProps {
  booking: {
    _id: string;
    hotelId: any;
    hotelName?: string;
    location?: string;
    image?: string;
    checkIn: Date | string;
    checkOut: Date | string;
    guests: number;
    totalPrice: number;
    status: string;
  };
  activeTab: 'upcoming' | 'completed' | 'cancelled';
  onCancel: (bookingId: string, hotelName: string) => void;
  onAddReview: (booking: any) => void;
  onRebook: (booking: any) => void;
}

export default function BookingCard({ 
  booking, 
  activeTab, 
  onCancel, 
  onAddReview, 
  onRebook 
}: BookingCardProps) {
  const router = useRouter();

  const hotel = typeof booking.hotelId === 'object' ? booking.hotelId : null;
  const hotelName = hotel?.name || booking.hotelName || 'Unknown Hotel';
  const hotelLocation = hotel?.location || booking.location || '';
  const hotelImagePath = hotel?.photos?.[0] || booking.image;

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'upcoming': return '#07A3B2';
      case 'completed': return '#4ADE80';
      case 'cancelled': return '#FF6B6B';
      default: return '#999';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.card}
      activeOpacity={0.95}
      onPress={() => router.push(`/booking/${booking._id}` as any)}
    >
      {/* Large Image Header */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: getImageUri(hotelImagePath) }} style={styles.cardImage} />
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(activeTab) }]} />
          <Text style={styles.statusText}>{activeTab}</Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hotelName} numberOfLines={1}>{hotelName}</Text>
            <View style={styles.locationRow}>
              <MapPin size={14} color="#666" />
              <Text style={styles.locationText} numberOfLines={1}>{hotelLocation}</Text>
            </View>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Total</Text>
            <Text style={styles.priceValue}>{booking.totalPrice.toLocaleString('vi-VN')} VND</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Calendar size={16} color="#07A3B2" />
            <Text style={styles.detailText}>
              {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Users size={16} color="#07A3B2" />
            <Text style={styles.detailText}>{booking.guests} Guests</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          {activeTab === 'upcoming' ? (
            <>
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={(e) => {
                  e.stopPropagation();
                  onCancel(booking._id, hotelName);
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => router.push(`/booking/${booking._id}` as any)}
              >
                <Text style={styles.primaryButtonText}>View Ticket</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.outlineButton}
              onPress={(e) => {
                e.stopPropagation();
                activeTab === 'completed' ? onAddReview(booking) : onRebook(booking);
              }}
            >
              <Text style={styles.outlineButtonText}>
                {activeTab === 'completed' ? 'Write a Review' : 'Book Again'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#07A3B2',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 12,
  },
  detailsRow: {
    gap: 10,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE0E0',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#07A3B2',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  outlineButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  outlineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#07A3B2',
  },
});
