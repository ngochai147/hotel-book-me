import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, HelpCircle, Mail, MessageCircle, Phone, Search } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HelpSupportScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      id: 1,
      question: 'How do I make a booking?',
      answer: 'Browse hotels, select your dates and guests, then click "Book Now" to complete your reservation.',
    },
    {
      id: 2,
      question: 'Can I cancel my booking?',
      answer: 'Yes, you can cancel most bookings. Check the cancellation policy for your specific reservation in the booking details.',
    },
    {
      id: 3,
      question: 'How do I change my booking dates?',
      answer: 'Go to your bookings, select the reservation, and tap "Modify Booking" to change dates (subject to availability).',
    },
    {
      id: 4,
      question: 'When will I be charged?',
      answer: 'Payment timing depends on the hotel. Some charge immediately, others charge at check-in. Check your booking confirmation.',
    },
    {
      id: 5,
      question: 'How do I contact the hotel?',
      answer: 'Hotel contact information is available in your booking confirmation email and in the app under booking details.',
    },
  ];

  const contactOptions = [
    {
      id: 1,
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team',
      action: () => console.log('Open chat'),
    },
    {
      id: 2,
      icon: Phone,
      title: 'Call Us',
      description: '+1 (800) 123-4567',
      action: () => Linking.openURL('tel:+18001234567'),
    },
    {
      id: 3,
      icon: Mail,
      title: 'Email Support',
      description: 'support@bookme.com',
      action: () => Linking.openURL('mailto:support@bookme.com'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          {contactOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.contactCard}
              onPress={option.action}
            >
              <View style={styles.contactLeft}>
                <View style={styles.iconContainer}>
                  <option.icon size={20} color="#17A2B8" />
                </View>
                <View>
                  <Text style={styles.contactTitle}>{option.title}</Text>
                  <Text style={styles.contactDescription}>{option.description}</Text>
                </View>
              </View>
              <ChevronRight size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqCard}>
              <View style={styles.faqHeader}>
                <HelpCircle size={18} color="#17A2B8" />
                <Text style={styles.faqQuestion}>{faq.question}</Text>
              </View>
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Terms of Service</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Privacy Policy</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkItem}>
            <Text style={styles.linkText}>Refund Policy</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  contactDescription: {
    fontSize: 13,
    color: '#666',
  },
  faqCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 26,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  linkText: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '500',
  },
});
