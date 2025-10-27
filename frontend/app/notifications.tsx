import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Calendar, Check, ChevronRight, Clock, Tag, X } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type NotificationType = 'booking' | 'promotion' | 'reminder' | 'system';

type Notification = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  actionable?: boolean;
};

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: 'booking',
    title: 'Booking Confirmed',
    message: 'Your booking at Hyatt Regency Bali has been confirmed for Sep 16-18.',
    time: '2 hours ago',
    isRead: false,
    actionable: true,
  },
  {
    id: 2,
    type: 'promotion',
    title: 'Special Offer! 20% Off',
    message: 'Get 20% off on all beach resorts in Bali. Limited time offer!',
    time: '5 hours ago',
    isRead: false,
    actionable: true,
  },
  {
    id: 3,
    type: 'reminder',
    title: 'Upcoming Check-in',
    message: 'Your check-in at Grand Bull is tomorrow at 2:00 PM.',
    time: '1 day ago',
    isRead: false,
  },
  {
    id: 4,
    type: 'booking',
    title: 'Payment Successful',
    message: 'Payment of $1,458.86 for Hyatt Regency Bali has been processed.',
    time: '2 days ago',
    isRead: true,
  },
  {
    id: 5,
    type: 'system',
    title: 'Profile Updated',
    message: 'Your profile information has been successfully updated.',
    time: '3 days ago',
    isRead: true,
  },
  {
    id: 6,
    type: 'promotion',
    title: 'Loyalty Rewards',
    message: 'You have earned 500 points! Redeem them for your next booking.',
    time: '4 days ago',
    isRead: true,
  },
  {
    id: 7,
    type: 'reminder',
    title: 'Rate Your Stay',
    message: 'How was your stay at Ocean Hotel? Share your experience.',
    time: '5 days ago',
    isRead: true,
    actionable: true,
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'booking':
        return <Calendar size={20} color="#17A2B8" />;
      case 'promotion':
        return <Tag size={20} color="#4CD964" />;
      case 'reminder':
        return <Clock size={20} color="#FFB020" />;
      case 'system':
        return <Bell size={20} color="#666" />;
    }
  };

  const getIconBackground = (type: NotificationType) => {
    switch (type) {
      case 'booking':
        return '#E3F7FA';
      case 'promotion':
        return '#E8F8EA';
      case 'reminder':
        return '#FFF4E6';
      case 'system':
        return '#F0F0F0';
    }
  };

  const handleMarkAsRead = (id: number) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      'Delete Notification',
      `Delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotifications(notifications.filter(n => n.id !== id));
          },
        },
      ]
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setNotifications([]);
          },
        },
      ]
    );
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
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={64} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              {filter === 'unread'
                ? 'You have no unread notifications'
                : 'You have no notifications yet'}
            </Text>
          </View>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <View
                key={notification.id}
                style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
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
                    <Text style={styles.notificationTime}>{notification.time}</Text>

                    {notification.actionable && (
                      <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionButtonText}>View Details</Text>
                        <ChevronRight size={14} color="#17A2B8" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.notificationActions}>
                  {!notification.isRead && (
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => handleMarkAsRead(notification.id)}
                    >
                      <Check size={18} color="#4CD964" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => handleDelete(notification.id, notification.title)}
                  >
                    <X size={18} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {notifications.length > 0 && (
              <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear All Notifications</Text>
              </TouchableOpacity>
            )}
          </>
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
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
