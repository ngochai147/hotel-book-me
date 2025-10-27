import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Calendar, Users, Minus, Plus } from 'lucide-react-native';

export default function BookingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickingField, setPickingField] = useState<'checkIn' | 'checkOut' | null>(null);
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const handleConfirm = () => {
    router.push(`/booking/${id}/confirm`);
  };

  const openDatePicker = (field: 'checkIn' | 'checkOut') => {
    setPickingField(field);
    setTempDate(new Date());
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // For Android, selectedDate may be undefined when dismissed
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString();
      if (pickingField === 'checkIn') setCheckIn(formatted);
      if (pickingField === 'checkOut') setCheckOut(formatted);
    }
    // keep pickingField until closed on iOS
    if (Platform.OS === 'android') setPickingField(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>

          <View style={styles.dateInputs}>
            <View style={styles.dateField}>
              <Text style={styles.label}>Check-in</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('checkIn')}>
                <Calendar size={20} color="#999" />
                <Text style={styles.dateText}>{checkIn || 'Select date'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateField}>
              <Text style={styles.label}>Check-out</Text>
              <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('checkOut')}>
                <Calendar size={20} color="#999" />
                <Text style={styles.dateText}>{checkOut || 'Select date'}</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Guest</Text>

          <View style={styles.guestItem}>
            <View>
              <Text style={styles.guestLabel}>Adults</Text>
              <Text style={styles.guestSubLabel}>Ages 13 or above</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setAdults(Math.max(1, adults - 1))}
              >
                <Minus size={20} color="#17A2B8" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{adults}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setAdults(adults + 1)}
              >
                <Plus size={20} color="#17A2B8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.guestItem}>
            <View>
              <Text style={styles.guestLabel}>Children</Text>
              <Text style={styles.guestSubLabel}>Ages 2-12</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setChildren(Math.max(0, children - 1))}
              >
                <Minus size={20} color="#17A2B8" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{children}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setChildren(children + 1)}
              >
                <Plus size={20} color="#17A2B8" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.guestItem}>
            <View>
              <Text style={styles.guestLabel}>Infants</Text>
              <Text style={styles.guestSubLabel}>Under 2</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setInfants(Math.max(0, infants - 1))}
              >
                <Minus size={20} color="#17A2B8" />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{infants}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setInfants(infants + 1)}
              >
                <Plus size={20} color="#17A2B8" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Continue</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  dateInputs: {
    gap: 16,
  },
  dateField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
  guestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  guestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  guestSubLabel: {
    fontSize: 12,
    color: '#666',
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    minWidth: 30,
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
  confirmButton: {
    height: 56,
    backgroundColor: '#17A2B8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
