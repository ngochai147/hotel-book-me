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
  User,
  Sparkles,
  MapPin,
  Phone
} from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Image, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User as UserType } from '../../services/userService';
import { auth } from '../../config/firebase';
import { getMyBookings } from '../../services/bookingService';
import { getReviewsByUserId } from '../../services/reviewService';
import { getMe } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';

const { width } = Dimensions.get('window');

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
  const { showError, showSuccess, showWarning } = useToast();
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
        // Guest user - show login button only
        setUser(null);
        setLoading(false);
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
        showError('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showError('Failed to load profile data');
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
    // For logout confirmation, we can show a warning and then proceed
    // Or implement a custom modal later
    showWarning('Logging out...');
    try {
      // Sign out from Firebase
      await auth.signOut();
      // Navigate to login
      showSuccess('Logged out successfully');
      setTimeout(() => router.replace('/auth/login'), 1000);
    } catch (error) {
      console.error('Logout error:', error);
      showError('Failed to logout. Please try again.');
    }
  };

  const handleEditAvatar = () => {
    // Navigate to edit profile page to change avatar
    router.push('/profile/edit' as any);
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#07A3B2" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Guest user view - only login button
  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.guestContainer}>
          <View style={styles.guestContent}>
            <View style={styles.guestIcon}>
              <User size={48} color="#07A3B2" strokeWidth={2} />
            </View>
            <Text style={styles.guestTitle}>Welcome to Hotel Booking</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to access your profile, bookings, and favorites
            </Text>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/auth/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.registerButton}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.registerButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Header */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            {/* Profile Info */}
            <View style={styles.profileInfo}>
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
                  <Camera size={14} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user?.userName || user?.displayName}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
                {user?.phone && (
                  <View style={styles.phoneContainer}>
                    <Phone size={12} color="#666" />
                    <Text style={styles.userPhone}>{user.phone}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Cards Row */}
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/tabs/booking' as any)}
                activeOpacity={0.9}
              >
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(7, 163, 178, 0.15)' }]}>
                  <Calendar size={20} color="#07A3B2" />
                </View>
                <Text style={styles.statNumber}>{stats.bookings}</Text>
                <Text style={styles.statLabel}>Bookings</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/profile/my-reviews' as any)}
                activeOpacity={0.9}
              >
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                  <Star size={20} color="#FFB800" fill="#FFB800" />
                </View>
                <Text style={styles.statNumber}>{stats.reviews}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statCard}
                onPress={() => router.push('/tabs/favorties' as any)}
                activeOpacity={0.9}
              >
                <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 157, 0.15)' }]}>
                  <Heart size={20} color="#FF6B9D" fill="#FF6B9D" />
                </View>
                <Text style={styles.statNumber}>{stats.favorites}</Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account</Text>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/profile/edit' as any)}
              activeOpacity={0.9}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(7, 163, 178, 0.15)' }]}>
                  <User size={20} color="#07A3B2" strokeWidth={2.5} />
                </View>
                <Text style={styles.menuLabel}>Edit Profile</Text>
              </View>
              <ChevronRight size={20} color="#999" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/profile/my-reviews' as any)}
              activeOpacity={0.9}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
                  <Star size={20} color="#FFB800" strokeWidth={2.5} />
                </View>
                <Text style={styles.menuLabel}>My Reviews</Text>
              </View>
              <ChevronRight size={20} color="#999" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/notifications' as any)}
              activeOpacity={0.9}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(255, 107, 157, 0.15)' }]}>
                  <Bell size={20} color="#FF6B9D" strokeWidth={2.5} />
                </View>
                <Text style={styles.menuLabel}>Notifications</Text>
              </View>
              <ChevronRight size={20} color="#999" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings & Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings & Support</Text>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/profile/privacy' as any)}
              activeOpacity={0.9}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
                  <Shield size={20} color="#6366F1" strokeWidth={2.5} />
                </View>
                <Text style={styles.menuLabel}>Privacy Policy</Text>
              </View>
              <ChevronRight size={20} color="#999" strokeWidth={2} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/profile/help' as any)}
              activeOpacity={0.9}
            >
              <View style={styles.menuItemContent}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
                  <HelpCircle size={20} color="#22C55E" strokeWidth={2.5} />
                </View>
                <Text style={styles.menuLabel}>Help & Support</Text>
              </View>
              <ChevronRight size={20} color="#999" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionLabel}>App Version</Text>
          <Text style={styles.versionNumber}>1.0.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.9}>
          <LogOut size={20} color="white" strokeWidth={2.5} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F8FA',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F8FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Hero Section
  heroSection: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroContent: {
    gap: 20,
  },

  // Profile Info
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(7, 163, 178, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(7, 163, 178, 0.2)',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(7, 163, 178, 0.2)',
    backgroundColor: '#f0f0f0',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#07A3B2',
  },
  cameraButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#07A3B2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  userPhone: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },

  // Section
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  versionLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  versionNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 0.5,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 10,
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  logoutText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Guest View Styles
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F8FA',
  },
  guestContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  guestIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(7, 163, 178, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  guestTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  loginButton: {
    width: '100%',
    height: 56,
    paddingHorizontal: 50,
    backgroundColor: '#07A3B2',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'white',
    paddingHorizontal: 50,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#07A3B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#07A3B2',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
