import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, Users, Check, AlertCircle, MapPin, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { getHotelById, Hotel } from '../../services/hotelService';
import { createBooking } from '../../services/bookingService';
import { auth } from '../../config/firebase';
import { getImageUri } from '../../utils/imageHelper';
import { useToast } from '../../contexts/ToastContext';
import { Validator } from '../../utils/validation';

export default function CreateBookingScreen() {
  const router = useRouter();
  const { hotelId, selectedRooms, checkIn, checkOut, guests: guestsParam } = useLocalSearchParams();
  const { showError, showSuccess, showWarning } = useToast();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Parse date from DD-MM-YYYY format
  const parseDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      return new Date(year, month - 1, day);
    }
    return null;
  };

  // Booking data - use params from chatbot if available
  const [checkInDate, setCheckInDate] = useState(() => {
    const parsed = parseDate(checkIn as string);
    return parsed || new Date(Date.now() + 86400000);
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const parsed = parseDate(checkOut as string);
    return parsed || new Date(Date.now() + 2 * 86400000);
  });
  const [guests, setGuests] = useState(() => {
    return guestsParam ? parseInt(guestsParam as string) : 2;
  });
  const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Selected rooms from params (comma-separated string)
  const selectedRoomTypes = selectedRooms ? (selectedRooms as string).split(',') : [];

  useEffect(() => {
    loadHotelData();
    
    // Log booking params for debugging
    console.log('Booking Create - Received params:', {
      hotelId,
      checkIn,
      checkOut,
      guests: guestsParam,
      selectedRooms,
      parsedCheckIn: checkInDate.toLocaleDateString(),
      parsedCheckOut: checkOutDate.toLocaleDateString(),
      parsedGuests: guests,
    });
  }, [hotelId]);

  const loadHotelData = async () => {
    try {
      setLoading(true);
      const response = await getHotelById(hotelId as string);
      if (response.success && response.data) {
        setHotel(response.data);
      } else {
        showError('Failed to load hotel details');
      }
    } catch (error) {
      console.error('Load hotel error:', error);
      showError('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrice = () => {
    if (!hotel || !hotel.roomTypes) return 0;

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    let total = 0;

    selectedRoomTypes.forEach(roomName => {
      const room = hotel.roomTypes?.find((r: any) => r.name === roomName);
      if (room) {
        total += room.price * nights;
      }
    });

    return total;
  };

  const handleDateSelect = (date: Date) => {
    if (showDatePicker === 'checkIn') {
      setCheckInDate(date);
      // Auto adjust checkout if needed
      if (date >= checkOutDate) {
        setCheckOutDate(new Date(date.getTime() + 86400000));
      }
    } else if (showDatePicker === 'checkOut') {
      if (date > checkInDate) {
        setCheckOutDate(date);
      }
    }
    setShowDatePicker(null);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startDayOfWeek, year, month };
  };

  const renderCalendar = () => {
    const { daysInMonth, startDayOfWeek, year, month } = getDaysInMonth(selectedMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = date < today;
      const isCheckIn = checkInDate.toDateString() === date.toDateString();
      const isCheckOut = checkOutDate.toDateString() === date.toDateString();
      const isInRange = date > checkInDate && date < checkOutDate;
      const isDisabled = showDatePicker === 'checkOut' && date <= checkInDate;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            isCheckIn && styles.calendarDayCheckIn,
            isCheckOut && styles.calendarDayCheckOut,
            isInRange && styles.calendarDayInRange,
            (isPast || isDisabled) && styles.calendarDayDisabled,
          ]}
          onPress={() => !isPast && !isDisabled && handleDateSelect(date)}
          disabled={isPast || isDisabled}
        >
          <Text
            style={[
              styles.calendarDayText,
              (isCheckIn || isCheckOut) && styles.calendarDayTextSelected,
              (isPast || isDisabled) && styles.calendarDayTextDisabled,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
  };

  const handleBooking = async () => {
    // Validation
    const currentUser = auth.currentUser;
    if (!currentUser) {
      showWarning('Please login to make a booking');
      router.push('/auth/login' as any);
      return;
    }

    // Validation 1: Check-in date must not be more than 4 days from now
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInTime = new Date(checkInDate);
    checkInTime.setHours(0, 0, 0, 0);
    const daysUntilCheckIn = Math.ceil((checkInTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilCheckIn > 4) {
      showError('Không thể đặt phòng quá 4 ngày trước. Vui lòng chọn ngày check-in gần hơn.');
      return;
    }

    // Validation 2: Booking duration must be between 1-7 days
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) {
      showError('Thời gian đặt phòng phải ít nhất 1 ngày.');
      return;
    }
    if (nights > 7) {
      showError('Chỉ có thể đặt phòng tối đa 7 ngày. Vui lòng chọn thời gian ngắn hơn.');
      return;
    }

    // Validation 3: Check guest count against room capacity
    if (!hotel || !hotel.roomTypes) {
      showError('Không tải được thông tin khách sạn');
      return;
    }
    
    let totalCapacity = 0;
    selectedRoomTypes.forEach(roomName => {
      const room = hotel.roomTypes?.find((r: any) => r.name === roomName);
      if (room) {
        totalCapacity += room.maxOccupancy || 2; // Default 2 if not specified
      }
    });

    if (guests > totalCapacity) {
      showError(`Số người (${guests}) vượt quá sức chứa của phòng (${totalCapacity}). Vui lòng chọn thêm phòng hoặc giảm số người.`);
      return;
    }

    const validator = new Validator();
    
    const isValid = validator.validate({
      roomTypes: selectedRoomTypes,
      checkInDate,
      checkOutDate,
      guests
    }, {
      roomTypes: {
        required: true,
        custom: (value) => Array.isArray(value) && value.length > 0,
        message: 'Please select at least one room type'
      },
      checkInDate: {
        required: true,
        custom: (value) => value < checkOutDate,
        message: 'Check-out date must be after check-in date'
      },
      guests: {
        required: true,
        min: 1,
        message: 'Number of guests must be at least 1'
      }
    });

    if (!isValid) {
      const firstError = validator.getFirstError();
      if (firstError) {
        showError(firstError);
      }
      return;
    }

    try {
      setSubmitting(true);

      const token = await currentUser.getIdToken();

      // Create booking
      const bookingData = {
        hotelId: hotelId as string,
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        guests,
        roomType: selectedRoomTypes,
        totalPrice: calculateTotalPrice(),
      };

      const result = await createBooking(token, bookingData);

      if (result.success && result.data) {
        showSuccess(`Booking successful! 🎉 Booking #${result.data.bookingNumber}`);
        setTimeout(() => router.push('/tabs/booking' as any), 1500);
      } else {
        // Show detailed error if rooms unavailable
        if (result.unavailableRooms && result.unavailableRooms.length > 0) {
          const roomList = result.unavailableRooms
            .map((r: any) => r.roomType)
            .join(', ');
          showError(`Rooms not available: ${roomList}. Please select different dates.`);
        } else {
          showError(result.message || 'Booking failed. Something went wrong.');
        }
      }
    } catch (error: any) {
      console.error('Booking error:', error);
      showError(error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#666' }}>Hotel not found</Text>
      </View>
    );
  }

  const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
  const totalPrice = calculateTotalPrice();
  const hotelImage = hotel.photos && hotel.photos.length > 0 
    ? getImageUri(hotel.photos[0])
    : 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hotel Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hotel Information</Text>
          <View style={styles.hotelCard}>
            <Image source={{ uri: hotelImage }} style={styles.hotelImage} />
            <View style={styles.hotelInfo}>
              <Text style={styles.hotelName}>{hotel.name}</Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color="#666" />
                <Text style={styles.hotelLocation}>{hotel.location}</Text>
              </View>
              <View style={styles.ratingRow}>
                <Text style={styles.ratingText}>⭐ {hotel.rating}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selected Rooms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selected Rooms ({selectedRoomTypes.length})</Text>
          {selectedRoomTypes.map((roomName, index) => {
            const room = hotel.roomTypes?.find((r: any) => r.name === roomName);
            return (
              <View key={index} style={styles.roomCard}>
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{roomName}</Text>
                  {room && (
                    <Text style={styles.roomPrice}>
                      {room.price.toLocaleString('vi-VN')} VND/đêm
                    </Text>
                  )}
                </View>
                <Check size={20} color="#17A2B8" />
              </View>
            );
          })}
        </View>

        {/* Check-in Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-in Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker('checkIn')}
          >
            <Calendar size={20} color="#17A2B8" />
            <Text style={styles.dateText}>
              {checkInDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Check-out Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-out Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker('checkOut')}
          >
            <Calendar size={20} color="#17A2B8" />
            <Text style={styles.dateText}>
              {checkOutDate.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Date Picker Modal */}
        <Modal
          visible={showDatePicker !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.calendarContainer}>
              {/* Header */}
              <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => changeMonth('prev')}>
                  <ChevronLeft size={24} color="#17A2B8" />
                </TouchableOpacity>
                <Text style={styles.calendarHeaderText}>
                  {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </Text>
                <TouchableOpacity onPress={() => changeMonth('next')}>
                  <ChevronRight size={24} color="#17A2B8" />
                </TouchableOpacity>
              </View>

              {/* Week days */}
              <View style={styles.weekDaysRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <Text key={day} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.calendarGrid}>
                {renderCalendar()}
              </View>

              {/* Footer */}
              <View style={styles.calendarFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowDatePicker(null)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Number of Guests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Number of Guests</Text>
          <View style={styles.guestSelector}>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => guests > 1 && setGuests(guests - 1)}
              disabled={guests <= 1}
            >
              <Text style={[styles.guestButtonText, guests <= 1 && { color: '#ccc' }]}>−</Text>
            </TouchableOpacity>
            <View style={styles.guestDisplay}>
              <Users size={20} color="#17A2B8" />
              <Text style={styles.guestText}>{guests} Guests</Text>
            </View>
            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => setGuests(guests + 1)}
            >
              <Text style={styles.guestButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Price Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Summary</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                {selectedRoomTypes.length} phòng × {nights} đêm
              </Text>
              <Text style={styles.priceValue}>{totalPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{totalPrice.toLocaleString('vi-VN')} VND</Text>
            </View>
          </View>
        </View>

        {/* Important Info */}
        <View style={styles.infoCard}>
          <AlertCircle size={20} color="#17A2B8" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Important Information</Text>
            <Text style={styles.infoText}>
              • Check-in time: 14:00{'\n'}
              • Check-out time: 12:00{'\n'}
              • Free cancellation available{'\n'}
              • Please bring valid ID
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceInfo}>
          <Text style={styles.bottomPriceLabel}>Tổng tiền</Text>
          <Text style={styles.bottomPriceValue}>{totalPrice.toLocaleString('vi-VN')} VND</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, submitting && { opacity: 0.6 }]}
          onPress={handleBooking}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 12,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  roomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  roomPrice: {
    fontSize: 13,
    color: '#17A2B8',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  dateText: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '700',
    flex: 1,
  },
  guestSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  guestButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#17A2B8',
  },
  guestDisplay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  guestText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  priceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  priceDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F7FA',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  bottomBar: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  bottomPriceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomPriceLabel: {
    fontSize: 14,
    color: '#666',
  },
  bottomPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  bookButton: {
    backgroundColor: '#17A2B8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Calendar Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  calendarDayCheckIn: {
    backgroundColor: '#17A2B8',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  calendarDayCheckOut: {
    backgroundColor: '#17A2B8',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  calendarDayInRange: {
    backgroundColor: '#E3F7FA',
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  calendarDayTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  calendarDayTextDisabled: {
    color: '#ccc',
  },
  calendarFooter: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: '#17A2B8',
    fontSize: 16,
    fontWeight: '600',
  },
});
