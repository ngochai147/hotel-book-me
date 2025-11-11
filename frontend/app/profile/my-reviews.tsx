import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Star, Trash2, MapPin, Calendar } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
} from 'react-native';
import { auth } from '../../config/firebase';
import { getReviewsByUserId, deleteReview, Review, formatReviewDate } from '../../services/reviewService';
import { getMe } from '../../services/authService';
import { getImageUri } from '../../utils/imageHelper';

export default function MyReviewsScreen() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Reload reviews when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadReviews();
    }, [])
  );

  const loadReviews = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Login Required', 'Please login to view your reviews');
        router.replace('/auth/login');
        return;
      }

      const token = await currentUser.getIdToken();
      const userResponse = await getMe(token);

      if (userResponse.success && userResponse.data) {
        const userId = userResponse.data._id;
        const response = await getReviewsByUserId(userId);
        
        if (response.success) {
          setReviews(response.data);
        } else {
          Alert.alert('Error', response.message || 'Failed to load reviews');
        }
      }
    } catch (error) {
      console.error('Load reviews error:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = (reviewId: string, hotelName: string) => {
    Alert.alert(
      'Delete Review',
      `Are you sure you want to delete your review for ${hotelName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(reviewId);
              const currentUser = auth.currentUser;
              if (!currentUser) return;

              const token = await currentUser.getIdToken();
              const response = await deleteReview(token, reviewId);

              if (response.success) {
                setReviews(reviews.filter(r => r._id !== reviewId));
                Alert.alert('Success', 'Review deleted successfully');
              } else {
                Alert.alert('Error', response.message || 'Failed to delete review');
              }
            } catch (error: any) {
              console.error('Delete review error:', error);
              Alert.alert('Error', error.message || 'Failed to delete review');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleViewHotel = (hotelId: string) => {
    router.push(`/hotel/${hotelId}` as any);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            color="#FFA500"
            fill={star <= rating ? '#FFA500' : 'none'}
            strokeWidth={2}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={styles.loadingText}>Loading your reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Star size={64} color="#E5E7EB" strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No Reviews Yet</Text>
          <Text style={styles.emptyText}>
            Reviews you write for hotels you've stayed at will appear here
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => router.push('/tabs/' as any)}
          >
            <Text style={styles.browseButtonText}>Browse Hotels</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.reviewCount}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''}
          </Text>

          {reviews.map((review) => {
            const hotel = typeof review.hotelId === 'object' ? review.hotelId : null;
            const hotelName = hotel?.name || 'Unknown Hotel';
            const hotelLocation = hotel?.location || '';
            const hotelPhoto = hotel?.photos?.[0] ? getImageUri(hotel.photos[0]) : 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600';

            return (
              <View key={review._id} style={styles.reviewCard}>
                {/* Hotel Info */}
                <TouchableOpacity
                  style={styles.hotelSection}
                  onPress={() => hotel && handleViewHotel(hotel._id)}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: hotelPhoto }} style={styles.hotelImage} />
                  <View style={styles.hotelInfo}>
                    <Text style={styles.hotelName} numberOfLines={1}>
                      {hotelName}
                    </Text>
                    {hotelLocation && (
                      <View style={styles.locationRow}>
                        <MapPin size={12} color="#666" />
                        <Text style={styles.hotelLocation} numberOfLines={1}>
                          {hotelLocation}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Rating & Date */}
                <View style={styles.ratingRow}>
                  {renderStars(review.rating)}
                  <View style={styles.dateRow}>
                    <Calendar size={12} color="#999" />
                    <Text style={styles.dateText}>{formatReviewDate(review.createdAt)}</Text>
                  </View>
                </View>

                {/* Comment */}
                <Text style={styles.comment}>{review.comment}</Text>

                {/* Actions */}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteReview(review._id, hotelName)}
                    disabled={deleting === review._id}
                  >
                    {deleting === review._id ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <>
                        <Trash2 size={16} color="#FF3B30" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  reviewCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  hotelSection: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  hotelImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  hotelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hotelLocation: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  comment: {
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFE6E6',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
    lineHeight: 20,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#17A2B8',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
