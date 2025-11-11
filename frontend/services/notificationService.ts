import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMyBookings } from './bookingService';
import { auth } from '../config/firebase';

export interface Notification {
  id: string;
  type: 'booking_created' | 'booking_cancelled' | 'check_in_reminder';
  title: string;
  message: string;
  bookingId: string;
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
  isRead: boolean;
  createdAt: string;
}

const STORAGE_KEY = '@notifications_read';
const HIDDEN_KEY = '@notifications_hidden';

/**
 * Get all notifications generated from user's bookings
 */
export const getNotifications = async (): Promise<{
  success: boolean;
  data: Notification[];
  error?: string;
}> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, data: [], error: 'User not authenticated' };
    }

    const token = await currentUser.getIdToken();
    
    // Get all bookings (upcoming, completed, cancelled)
    const [upcomingRes, completedRes, cancelledRes] = await Promise.all([
      getMyBookings(token, 'upcoming'),
      getMyBookings(token, 'completed'),
      getMyBookings(token, 'cancelled'),
    ]);

    const allBookings = [
      ...(upcomingRes.data || []),
      ...(completedRes.data || []),
      ...(cancelledRes.data || []),
    ];

    // Get read status and hidden status from AsyncStorage
    const readStatusJson = await AsyncStorage.getItem(STORAGE_KEY);
    const readStatus: Record<string, boolean> = readStatusJson ? JSON.parse(readStatusJson) : {};
    
    const hiddenStatusJson = await AsyncStorage.getItem(HIDDEN_KEY);
    const hiddenStatus: Record<string, boolean> = hiddenStatusJson ? JSON.parse(hiddenStatusJson) : {};

    const notifications: Notification[] = [];

    allBookings.forEach((booking) => {
      const checkInDate = new Date(booking.checkIn);
      const now = new Date();
      const daysUntilCheckIn = Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Get hotel name
      const hotelName = typeof booking.hotelId === 'object' ? booking.hotelId.name : 'Unknown Hotel';

      // 1. Booking Created Notification
      const createdNotifId = `created_${booking._id}`;
      notifications.push({
        id: createdNotifId,
        type: 'booking_created',
        title: '🎉 Booking Confirmed!',
        message: `Your booking at ${hotelName} has been confirmed.`,
        bookingId: booking._id,
        hotelName: hotelName,
        checkInDate: typeof booking.checkIn === 'string' ? booking.checkIn : booking.checkIn.toISOString(),
        checkOutDate: typeof booking.checkOut === 'string' ? booking.checkOut : booking.checkOut.toISOString(),
        isRead: readStatus[createdNotifId] || false,
        createdAt: typeof booking.createdAt === 'string' ? booking.createdAt : booking.createdAt?.toISOString() || new Date().toISOString(),
      });

      // 2. Check-in Reminder (1-3 days before check-in, only for upcoming)
      if (booking.status === 'upcoming' && daysUntilCheckIn >= 0 && daysUntilCheckIn <= 3) {
        const reminderId = `reminder_${booking._id}`;
        let reminderMessage = '';
        
        if (daysUntilCheckIn === 0) {
          reminderMessage = `Today is your check-in day at ${hotelName}! 🏨`;
        } else if (daysUntilCheckIn === 1) {
          reminderMessage = `Your check-in at ${hotelName} is tomorrow! 📅`;
        } else {
          reminderMessage = `Your check-in at ${hotelName} is in ${daysUntilCheckIn} days! 🗓️`;
        }

        notifications.push({
          id: reminderId,
          type: 'check_in_reminder',
          title: '📍 Upcoming Check-in',
          message: reminderMessage,
          bookingId: booking._id,
          hotelName: hotelName,
          checkInDate: typeof booking.checkIn === 'string' ? booking.checkIn : booking.checkIn.toISOString(),
          checkOutDate: typeof booking.checkOut === 'string' ? booking.checkOut : booking.checkOut.toISOString(),
          isRead: readStatus[reminderId] || false,
          createdAt: new Date(checkInDate.getTime() - daysUntilCheckIn * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      // 3. Booking Cancelled Notification
      if (booking.status === 'cancelled') {
        const cancelledNotifId = `cancelled_${booking._id}`;
        notifications.push({
          id: cancelledNotifId,
          type: 'booking_cancelled',
          title: '❌ Booking Cancelled',
          message: `Your booking at ${hotelName} has been cancelled.`,
          bookingId: booking._id,
          hotelName: hotelName,
          checkInDate: typeof booking.checkIn === 'string' ? booking.checkIn : booking.checkIn.toISOString(),
          checkOutDate: typeof booking.checkOut === 'string' ? booking.checkOut : booking.checkOut.toISOString(),
          isRead: readStatus[cancelledNotifId] || false,
          createdAt: typeof booking.createdAt === 'string' ? booking.createdAt : booking.createdAt?.toISOString() || new Date().toISOString(),
        });
      }
    });

    // Filter out hidden notifications
    const visibleNotifications = notifications.filter(n => !hiddenStatus[n.id]);

    // Sort by createdAt (newest first)
    visibleNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: visibleNotifications };
  } catch (error) {
    console.error('Get notifications error:', error);
    return { success: false, data: [], error: 'Failed to load notifications' };
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const readStatusJson = await AsyncStorage.getItem(STORAGE_KEY);
    const readStatus: Record<string, boolean> = readStatusJson ? JSON.parse(readStatusJson) : {};
    
    readStatus[notificationId] = true;
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(readStatus));
    
    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false, error: 'Failed to mark as read' };
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const notificationsRes = await getNotifications();
    if (!notificationsRes.success) {
      return { success: false, error: 'Failed to get notifications' };
    }

    const readStatus: Record<string, boolean> = {};
    notificationsRes.data.forEach(notif => {
      readStatus[notif.id] = true;
    });

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(readStatus));
    
    return { success: true };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false, error: 'Failed to mark all as read' };
  }
};

/**
 * Delete notification (mark as hidden)
 */
export const deleteNotification = async (notificationId: string): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const hiddenStatusJson = await AsyncStorage.getItem(HIDDEN_KEY);
    const hiddenStatus: Record<string, boolean> = hiddenStatusJson ? JSON.parse(hiddenStatusJson) : {};
    
    hiddenStatus[notificationId] = true;
    
    await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenStatus));
    
    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const notificationsRes = await getNotifications();
    if (!notificationsRes.success) return 0;
    
    return notificationsRes.data.filter(n => !n.isRead).length;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};

/**
 * Clear all notifications (mark all as hidden)
 */
export const clearAllNotifications = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    const notificationsRes = await getNotifications();
    if (!notificationsRes.success) {
      return { success: false, error: 'Failed to get notifications' };
    }

    const hiddenStatus: Record<string, boolean> = {};
    notificationsRes.data.forEach(notif => {
      hiddenStatus[notif.id] = true;
    });

    await AsyncStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenStatus));
    
    return { success: true };
  } catch (error) {
    console.error('Clear all notifications error:', error);
    return { success: false, error: 'Failed to clear all notifications' };
  }
};

/**
 * Clear all read status (reset)
 */
export const clearAllReadStatus = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return { success: true };
  } catch (error) {
    console.error('Clear all read status error:', error);
    return { success: false, error: 'Failed to clear read status' };
  }
};
