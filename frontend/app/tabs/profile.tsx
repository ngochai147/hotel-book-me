import { useRouter } from 'expo-router';
import {
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  CreditCard,
  Globe,
  Heart,
  HelpCircle,
  LogOut,
  MapPin,
  Moon,
  Settings,
  Shield,
  Star,
  User,
  Volume2
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

const menuSections = {
  account: [
    { id: 1, icon: User, label: 'Edit Profile', route: '/profile/edit' },
    { id: 2, icon: MapPin, label: 'My Addresses', route: '/profile/addresses' },
    { id: 3, icon: CreditCard, label: 'Payment Methods', route: '/profile/payment' },
  ],
  preferences: [
    { id: 4, icon: Bell, label: 'Notifications', hasSwitch: true },
    { id: 5, icon: Moon, label: 'Dark Mode', hasSwitch: true },
    { id: 6, icon: Volume2, label: 'Sound Effects', hasSwitch: true },
  ],
  support: [
    { id: 7, icon: Shield, label: 'Privacy Policy', route: '/profile/privacy' },
    { id: 8, icon: HelpCircle, label: 'Help & Support', route: '/profile/help' },
    { id: 9, icon: Globe, label: 'Language', route: '/profile/language', value: 'English' },
  ],
};

export default function ProfileScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => router.replace('/auth/login')
        }
      ]
    );
  };

  const handleEditAvatar = () => {
    Alert.alert(
      'Change Profile Photo',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => console.log('Take photo') },
        { text: 'Choose from Library', onPress: () => console.log('Choose photo') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const getSwitchValue = (id: number) => {
    switch(id) {
      case 4: return notifications;
      case 5: return darkMode;
      case 6: return soundEffects;
      default: return false;
    }
  };

  const handleSwitchChange = (id: number, value: boolean) => {
    switch(id) {
      case 4: setNotifications(value); break;
      case 5: setDarkMode(value); break;
      case 6: setSoundEffects(value); break;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>


      {/* Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>HA</Text>
          </View>
          <TouchableOpacity style={styles.cameraButton} onPress={handleEditAvatar}>
            <Camera size={16} color="white" />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>Hasan Abdul</Text>
        <Text style={styles.email}>hasanabdulgaffar@gmail.com</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit' as any)}>
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Calendar size={24} color="#17A2B8" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={24} color="#FFA500" />
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
        <View style={styles.statCard}>
          <Heart size={24} color="#FF3B30" />
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {menuSections.account.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <item.icon size={20} color="#17A2B8" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        ))}
      </View>


      {/* Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support & About</Text>
        {menuSections.support.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.menuItem}
            onPress={() => item.route && router.push(item.route as any)}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <item.icon size={20} color="#17A2B8" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.value && <Text style={styles.menuValue}>{item.value}</Text>}
              <ChevronRight size={20} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>App Version</Text>
        <Text style={styles.versionNumber}>1.0.0</Text>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#FF3B30" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  avatarContainer: {
    marginTop: 16,
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#17A2B8',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17A2B8',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
    color: '#666',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  versionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'white',
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
});
