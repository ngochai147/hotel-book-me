import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Star, Trash2, MapPin, Calendar } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
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
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';

export default function MyReviewsScreen() {
  const router = useRouter();
  const { showError, showSuccess, showWarning } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<{ id: string; name: string } | null>(null);

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
        showWarning('Please login to view your reviews');
        setTimeout(() => router.replace('/auth/login'), 1500);
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
          showError(response.message || 'Failed to load reviews');
        }
      }
    } catch (error) {
      console.error('Load reviews error:', error);
      showError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = (reviewId: string, hotelName: string) => {
    setReviewToDelete({ id: reviewId, name: hotelName });
    setDeleteModalVisible(true);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;
    
    try {
      setDeleting(reviewToDelete.id);
      
      // Validate reviewId
      if (!reviewToDelete.id || reviewToDelete.id === 'undefined') {
        showError('Đánh giá không hợp lệ');
        setDeleting(null);
        return;
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        showError('Vui lòng đăng nhập để xóa đánh giá');
        setTimeout(() => router.replace('/auth/login'), 1500);
        return;
      }

      // Force refresh token to ensure it's valid
      const token = await currentUser.getIdToken(true);
      console.log('Deleting review:', { reviewId: reviewToDelete.id, hasToken: !!token, tokenPreview: token?.substring(0, 20) + '...' });
      
      const response = await deleteReview(token, reviewToDelete.id);
      console.log('Delete response:', response);

      if (response.success) {
        // Update state
        setReviews(prevReviews => prevReviews.filter(r => r._id !== reviewToDelete.id));
        showSuccess('Đã xóa đánh giá thành công');
      } else {
        showError(response.message || 'Không thể xóa đánh giá');
      }
    } catch (error: any) {
      console.error('Delete review error:', error);
      showError(error.message || 'Không thể xóa đánh giá. Vui lòng thử lại.');
    } finally {
      setDeleting(null);
      setReviewToDelete(null);
    }
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
                    onPress={() => showDeleteConfirmation(review._id, hotelName)}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={deleteModalVisible}
        title="Xóa đánh giá"
        message={`Bạn có chắc chắn muốn xóa đánh giá của bạn về ${reviewToDelete?.name || 'khách sạn này'}?\n\nHành động này không thể hoàn tác.`}
        confirmText="Xóa đánh giá"
        cancelText="Quay lại"
        confirmColor="#FF6B6B"
        icon={<Trash2 size={48} color="#FF6B6B" />}
        onConfirm={handleDeleteReview}
        onCancel={() => {
          setDeleteModalVisible(false);
          setReviewToDelete(null);
        }}
      />
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
