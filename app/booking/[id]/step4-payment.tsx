import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, CreditCard } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Step4PaymentScreen() {
  const router = useRouter();
  const { id, checkIn, checkOut, rooms, adults, children, name, email, phone } = useLocalSearchParams();
  const [selectedPayment, setSelectedPayment] = useState('card');

  const handleNext = () => {
    router.push({
      pathname: `/booking/[id]/step5-additional`,
      params: { id: id as string, checkIn, checkOut, rooms, adults, children, name, email, phone, payment: selectedPayment }
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
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
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

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Method Payment</Text>

          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'card' && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment('card')}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <CreditCard size={24} color="#17A2B8" />
              </View>
              <Text style={styles.paymentLabel}>MasterCard</Text>
            </View>
            <View style={[styles.radio, selectedPayment === 'card' && styles.radioSelected]}>
              {selectedPayment === 'card' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'visa' && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment('visa')}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Text style={styles.visaText}>VISA</Text>
              </View>
              <View>
                <Text style={styles.paymentLabel}>VISA</Text>
                <Text style={styles.paymentSublabel}>**** **** **** 2334</Text>
              </View>
            </View>
            <View style={[styles.radio, selectedPayment === 'visa' && styles.radioSelected]}>
              {selectedPayment === 'visa' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentOption, selectedPayment === 'paypal' && styles.paymentOptionSelected]}
            onPress={() => setSelectedPayment('paypal')}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIcon}>
                <Text style={styles.paypalText}>P</Text>
              </View>
              <View>
                <Text style={styles.paymentLabel}>Paypal</Text>
                <Text style={styles.paymentSublabel}>harenamekara@gmail.com</Text>
              </View>
            </View>
            <View style={[styles.radio, selectedPayment === 'paypal' && styles.radioSelected]}>
              {selectedPayment === 'paypal' && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>

          {selectedPayment === 'card' && (
            <TouchableOpacity style={styles.addNewButton}>
              <Text style={styles.addNewText}>+ Add new</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Price Summary */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>$280 x 5 Nights</Text>
            <Text style={styles.priceValue}>$1400</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Service</Text>
            <Text style={styles.priceValue}>$2.36</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.priceRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>$258.56</Text>
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
    marginBottom: 24,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentOptionSelected: {
    borderColor: '#17A2B8',
    backgroundColor: '#E3F7FA',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1F71',
  },
  paypalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#003087',
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  paymentSublabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#17A2B8',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#17A2B8',
  },
  addNewButton: {
    padding: 12,
    alignItems: 'center',
  },
  addNewText: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '600',
  },
  priceSection: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  divider: {
    height: 1,
    backgroundColor: '#D0D0D0',
    marginVertical: 8,
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
