import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Check, ChevronRight, Clock, X } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications, Notification } from '../services/notificationService';
import { useToast } from '../contexts/ToastContext';
import { auth } from '../config/firebase';

type NotificationType = 'booking_created' | 'booking_cancelled' | 'check_in_reminder';

export default function NotificationsScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Auto-reload notifications when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await getNotifications();
      if (response.success) {
        // Notifications already sorted by createdAt (newest first) in service
        setNotifications(response.data);
      } 
    } catch (error) {
      console.error('Load notifications error:', error);
      showError('Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking_created':
        return <Calendar size={20} color="#17A2B8" />;
      case 'booking_cancelled':
        return <X size={20} color="#FF3B30" />;
      case 'check_in_reminder':
        return <Clock size={20} color="#FFB020" />;
    }
  };

  const getIconBackground = (type: NotificationType) => {
    switch (type) {
      case 'booking_created':
        return '#E3F7FA';
      case 'booking_cancelled':
        return '#FFE6E6';
      case 'check_in_reminder':
        return '#FFF4E6';
    }
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await markAsRead(id);
      if (response.success) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        setNotifications(notifications.filter(n => n.id !== id));
        showSuccess('Notification deleted');
      } else {
        showError('Failed to delete notification');
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      showError('Failed to delete notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead();
      if (response.success) {
        await loadNotifications(); // Reload to get updated status
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const response = await clearAllNotifications();
      if (response.success) {
        // Reload to show empty state
        await loadNotifications();
        showSuccess('All notifications cleared');
      } else {
        showError('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Clear all error:', error);
      showError('Failed to clear notifications');
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read first
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate to booking detail
    router.push({
      pathname: '/booking/id' as any,
      params: { id: notification.bookingId }
    });
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllAsRead}>
          <Text style={styles.headerAction}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
            Unread ({unreadCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {!auth.currentUser && (
          <TouchableOpacity 
            style={styles.loginBanner}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.9}
          >
            <View style={styles.loginBannerContent}>
              <Bell size={20} color="#17A2B8" />
              <Text style={styles.loginBannerText}>
                Sign in to receive notifications
              </Text>
            </View>
            <ChevronRight size={20} color="#17A2B8" />
          </TouchableOpacity>
        )}
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#17A2B8" />
            <Text style={styles.emptyText}>Loading notifications...</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread'
                ? 'You have no unread notifications'
                : 'Your notifications will appear here when you create bookings'}
            </Text>
          </View>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationMain}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: getIconBackground(notification.type) },
                    ]}
                  >
                    {getIcon(notification.type)}
                  </View>

                  <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                      <Text style={styles.notificationTitle}>{notification.title}</Text>
                      {!notification.isRead && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    <Text style={styles.notificationTime}>{getTimeAgo(notification.createdAt)}</Text>

                  </View>
                </View>

                <View style={styles.notificationActions}>
                  {!notification.isRead && (
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                    >
                      <Check size={18} color="#4CD964" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id, notification.title);
                    }}
                  >
                    <X size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}


          </>
        )}

        {/* Clear All Button at Bottom */}
        {!loading && notifications.length > 0 && (
          <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
            <X size={18} color="#FF3B30" />
            <Text style={styles.clearAllText}>Clear All Notifications</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loginBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(23, 162, 184, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(23, 162, 184, 0.3)',
  },
  loginBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  loginBannerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17A2B8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'white',
  },
  headerAction: {
    fontSize: 13,
    color: '#17A2B8',
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  filterTabActive: {
    backgroundColor: '#17A2B8',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationUnread: {
    borderLeftWidth: 3,
    borderLeftColor: '#17A2B8',
  },
  notificationMain: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#17A2B8',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#17A2B8',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    justifyContent: 'flex-end',
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllButton: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    gap: 8,
  },
  clearAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
