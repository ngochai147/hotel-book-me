import { useRouter, useFocusEffect } from 'expo-router';
import { Calendar, MapPin, Users, Star, Clock, CheckCircle2, XCircle, RotateCcw, Eye, ChevronRight, MoreHorizontal, Search, Filter, AlertCircle } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Dimensions, Platform, StatusBar, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyBookings, cancelBooking, Booking as BookingType } from '../../services/bookingService';
import { auth } from '../../config/firebase';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import BookingCard from '../../components/BookingCard';

const { width } = Dimensions.get('window');

type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export default function BookingScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [activeTab, setActiveTab] = useState<BookingStatus>('upcoming');
  const [allBookings, setAllBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<{ id: string; name: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAllBookings();
    }, [])
  );

  const loadAllBookings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setAllBookings([]);
        setLoading(false);
        return;
      }

      const token = await currentUser.getIdToken();
      
      const [upcomingRes, completedRes, cancelledRes] = await Promise.all([
        getMyBookings(token, 'upcoming'),
        getMyBookings(token, 'completed'),
        getMyBookings(token, 'cancelled'),
      ]);

      const allBookingsData = [
        ...(upcomingRes.success ? upcomingRes.data : []),
        ...(completedRes.success ? completedRes.data : []),
        ...(cancelledRes.success ? cancelledRes.data : []),
      ];

      const uniqueBookings = allBookingsData.filter((booking, index, self) =>
        index === self.findIndex((b) => b._id === booking._id)
      );

      setAllBookings(uniqueBookings);
      
    } catch (error) {
      console.error('Load bookings error:', error);
      showError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = allBookings
    .filter(b => b.status === activeTab)
    .filter(booking => {
      if (!searchText) return true;
      
      const hotel = typeof booking.hotelId === 'object' ? booking.hotelId : null;
      const hotelName = hotel?.name || booking.hotelName || '';
      const location = hotel?.location || booking.location || '';
      
      const search = searchText.toLowerCase();
      return (
        hotelName.toLowerCase().includes(search) ||
        location.toLowerCase().includes(search)
      );
    });

  const showCancelConfirmation = (bookingId: string, hotelName: string) => {
    setBookingToCancel({ id: bookingId, name: hotelName });
    setCancelModalVisible(true);
  };

  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await cancelBooking(token, bookingToCancel.id);
      
      if (response.success) {
        showSuccess(`Đã hủy đặt phòng tại ${bookingToCancel.name}`);
        loadAllBookings();
      } else {
        showError(response.message || 'Không thể hủy đặt phòng');
      }
    } catch (error) {
      showError('Không thể hủy đặt phòng');
    } finally {
      setBookingToCancel(null);
    }
  };

  const handleRebook = (booking: BookingType) => {
    const hotelId = typeof booking.hotelId === 'string' ? booking.hotelId : booking.hotelId?._id;
    if (hotelId) router.push(`/hotel/${hotelId}`);
  };

  const handleAddReview = (booking: BookingType) => {
    const hotel = typeof booking.hotelId === 'object' ? booking.hotelId : null;
    if (hotel) router.push(`/review/create?hotelId=${hotel._id}` as any);
  };

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

  const getTabCount = (status: BookingStatus) => {
    return allBookings.filter(b => b.status === status).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#07A3B2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Modern Header */}
      <View style={styles.header}>
        
        {/* Integrated Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search hotels, locations..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <XCircle size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Clean Tabs */}
        <View style={styles.tabsContainer}>
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <Text style={styles.tabCount}> ({getTabCount(tab)})</Text>
              </Text>
              {activeTab === tab && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {!auth.currentUser && (
          <TouchableOpacity 
            style={styles.loginBanner}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.9}
          >
            <View style={styles.loginBannerContent}>
              <AlertCircle size={20} color="#07A3B2" />
              <Text style={styles.loginBannerText}>
                Login to view your reservations
              </Text>
            </View>
            <ChevronRight size={20} color="#07A3B2" />
          </TouchableOpacity>
        )}
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Image 
              source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }} 
              style={{ width: 120, height: 120, opacity: 0.5, marginBottom: 20 }}
            />
            <Text style={styles.emptyStateTitle}>
              {searchText ? 'No results found' : `No ${activeTab} trips`}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchText ? 'Try adjusting your search terms' : 'Your next adventure starts with a single click.'}
            </Text>
          </View>
        ) : (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              activeTab={activeTab}
              onCancel={(bookingId, hotelName) => showCancelConfirmation(bookingId, hotelName)}
              onAddReview={handleAddReview}
              onRebook={handleRebook}
            />
          ))
        )}
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        visible={cancelModalVisible}
        title="Hủy đặt phòng"
        message={`Bạn có chắc chắn muốn hủy đặt phòng tại ${bookingToCancel?.name || 'khách sạn này'}?\n\nHành động này không thể hoàn tác.`}
        confirmText="Hủy đặt phòng"
        cancelText="Quay lại"
        confirmColor="#FF6B6B"
        icon={<AlertCircle size={48} color="#FF6B6B" />}
        onConfirm={handleCancelBooking}
        onCancel={() => {
          setCancelModalVisible(false);
          setBookingToCancel(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Slightly off-white for better contrast
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(7, 163, 178, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(7, 163, 178, 0.3)',
  },
  loginBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  loginBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#07A3B2',
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#1A1A1A',
    padding: 0,
  },
  
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    gap: 24,
  },
  tab: {
    paddingBottom: 16,
    position: 'relative',
  },
  activeTab: {
    // Active state handled by indicator
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#07A3B2',
    fontWeight: '700',
  },
  tabCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#07A3B2',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
    maxWidth: '70%',
    lineHeight: 22,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  imageContainer: {
    height: 200,
    width: '100%',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },

  // Card Content
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '700',
    color: '#07A3B2',
  },
  
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginBottom: 16,
  },

  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#444',
    fontWeight: '500',
  },

  // Actions
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#07A3B2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
  },
  secondaryButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '700',
  },
  outlineButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#07A3B2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#07A3B2',
    fontSize: 14,
    fontWeight: '700',
  },
});
