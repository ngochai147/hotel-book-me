import { useRouter, useFocusEffect } from 'expo-router';
import {
  Bell,
  Calendar,
  Camera,
  ChevronRight,
  Heart,
  HelpCircle,
  LogOut,
  Shield,
  Star,
  User
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import type { User as UserType } from '../../services/userService';
import { auth } from '../../config/firebase';
import { getMyBookings } from '../../services/bookingService';
import { getReviewsByUserId } from '../../services/reviewService';
import { getMe } from '../../services/authService';

const menuSections = {
  account: [
    { id: 1, icon: User, label: 'Edit Profile', route: '/profile/edit' },
    { id: 2, icon: Star, label: 'My Reviews', route: '/profile/my-reviews' },
    { id: 3, icon: Bell, label: 'Notifications', route: '/notifications' },
  ],
  support: [
    { id: 4, icon: Shield, label: 'Privacy Policy', route: '/profile/privacy' },
    { id: 5, icon: HelpCircle, label: 'Help & Support', route: '/profile/help' },
  ],
};

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    bookings: 0,
    reviews: 0,
    favorites: 0,
  });

  // Reload user data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        router.replace('/auth/login');
        return;
      }

      const token = await currentUser.getIdToken();

      // Load user profile using /api/auth/me
      const response = await getMe(token);
      if (response.success && response.data) {
        setUser(response.data);
        
        // Load stats from API with user data
        await loadStats(response.data._id, token, response.data);
      } else {
        Alert.alert('Error', 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (userId: string, token: string, userData?: UserType) => {
    try {
      // Load bookings count
      const bookingsResponse = await getMyBookings(token);
      const bookingsCount = bookingsResponse.count || 0;

      // Load reviews count
      const reviewsResponse = await getReviewsByUserId(userId);
      const reviewsCount = reviewsResponse.count || reviewsResponse.data.length || 0;

      // Get favorites from user object
      const favoritesCount = userData?.favorites?.length || user?.favorites?.length || 0;

      setStats({
        bookings: bookingsCount,
        reviews: reviewsCount,
        favorites: favoritesCount,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Sign out from Firebase
              await auth.signOut();
              // Navigate to login
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleEditAvatar = () => {
    // Navigate to edit profile page to change avatar
    router.push('/profile/edit' as any);
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Header with Gradient */}
      <View style={styles.profileHeader}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.userName || user?.displayName ? getInitials(user.userName || user.displayName || '') : 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleEditAvatar}>
              <Camera size={16} color="white" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{user?.userName || user?.displayName}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          {user?.phone && <Text style={styles.phone}>{user.phone}</Text>}
          
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit' as any)}>
            <User size={16} color="#17A2B8" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/tabs/booking' as any)}
          activeOpacity={0.7}
        >
          <Calendar size={24} color="#17A2B8" />
          <Text style={styles.statValue}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/profile/my-reviews' as any)}
          activeOpacity={0.7}
        >
          <Star size={24} color="#FFA500" />
          <Text style={styles.statValue}>{stats.reviews}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.statCard}
          onPress={() => router.push('/tabs/favorties' as any)}
          activeOpacity={0.7}
        >
          <Heart size={24} color="#FF3B30" />
          <Text style={styles.statValue}>{stats.favorites}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </TouchableOpacity>
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
            <ChevronRight size={20} color="#999" />
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
  profileHeader: {
    backgroundColor: '#17A2B8',
    paddingBottom: 30,
    marginBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: '#f0f0f0',
  },
  avatarText: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  cameraButton: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  phone: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  editButton: {
    flexDirection: 'row',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17A2B8',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 14,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 10,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuLabel: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  versionText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
  },
  versionNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 18,
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 16,
    gap: 10,
    backgroundColor: 'white',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 17,
    color: '#FF3B30',
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
