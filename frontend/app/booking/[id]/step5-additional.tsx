import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Percent } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Step5AdditionalScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [smokingRoom, setSmokingRoom] = useState(false);
  const [lateCheckOut, setLateCheckOut] = useState(false);
  const [highFloor, setHighFloor] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const handleConfirm = () => {
    router.push({
      pathname: `/booking/[id]/confirm`,
      params: { id: params.id as string }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Additional Request</Text>
        <TouchableOpacity onPress={handleConfirm}>
          <Text style={styles.skipText}>✕</Text>
        </TouchableOpacity>
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

        {/* Additional Requests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Request</Text>

          <View style={styles.requestItem}>
            <View style={styles.requestLeft}>
              <View style={styles.requestIcon}>
                <Text style={styles.iconText}>🚬</Text>
              </View>
              <View>
                <Text style={styles.requestLabel}>Smoking Room</Text>
                <Text style={styles.requestSubtext}>Allows smoking</Text>
              </View>
            </View>
            <Switch
              value={smokingRoom}
              onValueChange={setSmokingRoom}
              trackColor={{ false: '#D0D0D0', true: '#17A2B8' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.requestItem}>
            <View style={styles.requestLeft}>
              <View style={styles.requestIcon}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <View>
                <Text style={styles.requestLabel}>Late Check-Out</Text>
                <Text style={styles.requestSubtext}>Check-out after 12:00 PM</Text>
              </View>
            </View>
            <Switch
              value={lateCheckOut}
              onValueChange={setLateCheckOut}
              trackColor={{ false: '#D0D0D0', true: '#17A2B8' }}
              thumbColor="white"
            />
          </View>

          <View style={styles.requestItem}>
            <View style={styles.requestLeft}>
              <View style={styles.requestIcon}>
                <Text style={styles.iconText}>🏢</Text>
              </View>
              <View>
                <Text style={styles.requestLabel}>High Floor</Text>
                <Text style={styles.requestSubtext}>Prefer higher floor</Text>
              </View>
            </View>
            <Switch
              value={highFloor}
              onValueChange={setHighFloor}
              trackColor={{ false: '#D0D0D0', true: '#17A2B8' }}
              thumbColor="white"
            />
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code</Text>
          <View style={styles.promoContainer}>
            <View style={styles.promoInput}>
              <Percent size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Enter promo code"
                placeholderTextColor="#999"
                value={promoCode}
                onChangeText={setPromoCode}
              />
            </View>
            <TouchableOpacity style={styles.applyButton}>
              <Text style={styles.applyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Available Discounts */}
        <View style={styles.section}>
          <View style={styles.discountCard}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>90% Discount</Text>
            </View>
            <Text style={styles.discountTitle}>Get 90% Discount</Text>
            <Text style={styles.discountSubtext}>For your 3 first booking</Text>
          </View>

          <View style={styles.discountCard}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>20% Discount</Text>
            </View>
            <Text style={styles.discountTitle}>20% Cashback</Text>
            <Text style={styles.discountSubtext}>Available until December</Text>
          </View>

          <View style={styles.discountCard}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>$10 Discount</Text>
            </View>
            <Text style={styles.discountTitle}>$10 Discount</Text>
            <Text style={styles.discountSubtext}>For each 3 months booking</Text>
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
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginLeft: 12,
  },
  skipText: {
    fontSize: 24,
    color: '#666',
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
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  requestLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  requestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  requestLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  requestSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  promoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  applyButton: {
    backgroundColor: '#17A2B8',
    borderRadius: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  discountCard: {
    backgroundColor: '#E3F7FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: '#17A2B8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  discountSubtext: {
    fontSize: 12,
    color: '#666',
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
