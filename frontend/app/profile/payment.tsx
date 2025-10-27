import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type PaymentMethod = {
  id: number;
  type: 'visa' | 'mastercard' | 'paypal';
  cardNumber: string;
  cardHolder: string;
  expiryDate: string;
  isDefault: boolean;
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      type: 'visa',
      cardNumber: '**** **** **** 2334',
      cardHolder: 'Hasan Abdul',
      expiryDate: '12/25',
      isDefault: true,
    },
    {
      id: 2,
      type: 'mastercard',
      cardNumber: '**** **** **** 8765',
      cardHolder: 'Hasan Abdul',
      expiryDate: '08/26',
      isDefault: false,
    },
  ]);

  const handleDelete = (id: number) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setPaymentMethods(paymentMethods.filter(pm => pm.id !== id));
          }
        }
      ]
    );
  };

  const handleSetDefault = (id: number) => {
    setPaymentMethods(paymentMethods.map(pm => ({
      ...pm,
      isDefault: pm.id === id
    })));
  };

  const getCardIcon = (type: string) => {
    switch(type) {
      case 'visa':
        return '💳 VISA';
      case 'mastercard':
        return '💳 MasterCard';
      case 'paypal':
        return '🅿️ PayPal';
      default:
        return '💳';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Saved Cards</Text>

        {paymentMethods.map((method) => (
          <View key={method.id} style={styles.paymentCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{getCardIcon(method.type)}</Text>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNumber}>{method.cardNumber}</Text>
                  <Text style={styles.cardHolder}>{method.cardHolder}</Text>
                  <Text style={styles.cardExpiry}>Expires {method.expiryDate}</Text>
                </View>
              </View>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Check size={12} color="white" />
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>

            <View style={styles.cardActions}>
              {!method.isDefault && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleSetDefault(method.id)}
                >
                  <Text style={styles.actionButtonText}>Set as Default</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => handleDelete(method.id)}
              >
                <Trash2 size={16} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton}>
          <Plus size={20} color="#17A2B8" />
          <Text style={styles.addButtonText}>Add New Card</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Secure Payment</Text>
          <Text style={styles.infoText}>
            Your payment information is encrypted and securely stored. We never share your card details with hotels.
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  paymentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardInfo: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  cardHolder: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: '#999',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#17A2B8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#17A2B8',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#17A2B8',
    textAlign: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#17A2B8',
    borderStyle: 'dashed',
    backgroundColor: 'white',
    marginBottom: 20,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17A2B8',
  },
  infoBox: {
    backgroundColor: '#E3F7FA',
    borderRadius: 12,
    padding: 16,
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
});
