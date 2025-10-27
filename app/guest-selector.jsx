import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { X, Minus, Plus } from 'lucide-react-native';

export default function GuestSelectorScreen() {
  const router = useRouter();
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(2);
  const [infants, setInfants] = useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Guest</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.guestList}>
          <View style={styles.guestRow}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestLabel}>Adults</Text>
              <Text style={styles.guestDescription}>Ages 13 or above</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity
                style={[styles.counterButton, adults <= 1 && styles.counterButtonDisabled]}
                onPress={() => adults > 1 && setAdults(adults - 1)}
              >
                <Minus size={20} color={adults <= 1 ? '#ccc' : '#17A2B8'} />
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

          <View style={styles.divider} />

          <View style={styles.guestRow}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestLabel}>Children</Text>
              <Text style={styles.guestDescription}>Ages 2 - 12</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity
                style={[styles.counterButton, children <= 0 && styles.counterButtonDisabled]}
                onPress={() => children > 0 && setChildren(children - 1)}
              >
                <Minus size={20} color={children <= 0 ? '#ccc' : '#17A2B8'} />
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

          <View style={styles.divider} />

          <View style={styles.guestRow}>
            <View style={styles.guestInfo}>
              <Text style={styles.guestLabel}>Infants</Text>
              <Text style={styles.guestDescription}>Ages under 2</Text>
            </View>
            <View style={styles.counter}>
              <TouchableOpacity
                style={[styles.counterButton, infants <= 0 && styles.counterButtonDisabled]}
                onPress={() => infants > 0 && setInfants(infants - 1)}
              >
                <Minus size={20} color={infants <= 0 ? '#ccc' : '#17A2B8'} />
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

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => router.back()}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
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
  guestList: {
    marginBottom: 24,
  },
  guestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  guestInfo: {
    flex: 1,
  },
  guestLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  guestDescription: {
    fontSize: 13,
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
    backgroundColor: '#E0F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  counterValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 24,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
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
