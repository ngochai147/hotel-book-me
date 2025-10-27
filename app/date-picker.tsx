import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function DatePickerScreen() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(8);
  const [currentYear, setCurrentYear] = useState(2024);
  const [checkIn, setCheckIn] = useState(16);
  const [checkOut, setCheckOut] = useState(20);

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isCheckIn = day === checkIn;
      const isCheckOut = day === checkOut;
      const isInRange = day > checkIn && day < checkOut;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            (isCheckIn || isCheckOut) && styles.selectedDay,
            isInRange && styles.inRangeDay,
          ]}
          onPress={() => {
            if (!checkIn || (checkIn && checkOut)) {
              setCheckIn(day);
              setCheckOut(0);
            } else if (day > checkIn) {
              setCheckOut(day);
            } else {
              setCheckIn(day);
            }
          }}
        >
          <Text
            style={[
              styles.dayText,
              (isCheckIn || isCheckOut) && styles.selectedDayText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Date</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={previousMonth} style={styles.monthButton}>
            <ChevronLeft size={24} color="#1a1a1a" />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={nextMonth} style={styles.monthButton}>
            <ChevronRight size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekDays}>
            {DAYS.map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>
          <View style={styles.daysGrid}>{renderCalendar()}</View>
        </View>

        <View style={styles.footer}>
          <View style={styles.dateInfo}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check in</Text>
              <Text style={styles.dateValue}>
                {checkIn} Sep 2024
              </Text>
            </View>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Check out</Text>
              <Text style={styles.dateValue}>
                {checkOut || '--'} Sep 2024
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => router.back()}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  calendar: {
    marginBottom: 24,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDay: {
    backgroundColor: '#17A2B8',
    borderRadius: 50,
  },
  inRangeDay: {
    backgroundColor: '#E0F4F6',
  },
  dayText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  selectedDayText: {
    color: 'white',
    fontWeight: '600',
  },
  footer: {
    gap: 16,
  },
  dateInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  dateBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
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
