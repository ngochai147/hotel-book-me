import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, FileText, Lock, Shield } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const sections = [
    {
      id: 1,
      icon: Shield,
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us, such as when you create an account, make a booking, or contact customer support. This includes your name, email address, phone number, payment information, and booking preferences.',
    },
    {
      id: 2,
      icon: Lock,
      title: 'How We Use Your Information',
      content: 'We use the information we collect to provide, maintain, and improve our services, process your bookings, send you confirmations and updates, respond to your comments and questions, and send you marketing communications (with your consent).',
    },
    {
      id: 3,
      icon: Eye,
      title: 'Information Sharing',
      content: 'We share your information with hotels and accommodation providers to complete your bookings. We may also share information with service providers who perform services on our behalf, and as required by law or to protect our rights.',
    },
    {
      id: 4,
      icon: FileText,
      title: 'Your Rights',
      content: 'You have the right to access, update, or delete your personal information. You can also opt-out of marketing communications and request a copy of your data. Contact us at privacy@bookme.com to exercise these rights.',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.introSection}>
          <Text style={styles.introTitle}>Your Privacy Matters</Text>
          <Text style={styles.introText}>
            Last updated: October 27, 2025
          </Text>
          <Text style={styles.introDescription}>
            At BookMe, we are committed to protecting your privacy and ensuring the security of your personal information. This policy explains how we collect, use, and safeguard your data.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <section.icon size={20} color="#17A2B8" />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            If you have any questions about our Privacy Policy, please contact us at:
          </Text>
          <Text style={styles.contactEmail}>privacy@bookme.com</Text>
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
  introSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  introText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  introDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  contactSection: {
    backgroundColor: '#E3F7FA',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17A2B8',
  },
});
