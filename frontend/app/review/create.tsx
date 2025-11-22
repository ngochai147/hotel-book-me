import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import { getHotelById, Hotel } from '../../services/hotelService';
import { createReview } from '../../services/reviewService';
import { hasCompletedBookingAtHotel } from '../../services/bookingService';
import { auth } from '../../config/firebase';
import { getImageUri } from '../../utils/imageHelper';
import { useToast } from '../../contexts/ToastContext';

export default function CreateReviewScreen() {
  const router = useRouter();
  const { hotelId } = useLocalSearchParams();
  const { showError, showSuccess, showWarning } = useToast();
  
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadHotelAndCheckEligibility();
  }, [hotelId]);

  const loadHotelAndCheckEligibility = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showWarning('Please login to write a review');
        router.replace('/auth/login');
        return;
      }

      // Load hotel
      const hotelResponse = await getHotelById(hotelId as string);
      if (hotelResponse.success && hotelResponse.data) {
        setHotel(hotelResponse.data);
      }

      // Check if user has completed booking
      const token = await currentUser.getIdToken();
      const hasBooking = await hasCompletedBookingAtHotel(token, hotelId as string);
      setCanReview(hasBooking);

      if (!hasBooking) {
        showWarning('You can only review hotels where you have a completed booking');
        setTimeout(() => router.back(), 2000);
      }
    } catch (error) {
      console.error('Load error:', error);
      showError('Failed to load hotel details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Manual validation for better control
    if (rating === 0) {
      showError('Please select a rating (1-5 stars)');
      return;
    }

    if (rating < 1 || rating > 5) {
      showError('Rating must be between 1 and 5 stars');
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      showError('Please write a comment');
      return;
    }

    if (trimmedComment.length < 10) {
      showError('Comment must be at least 10 characters');
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        showError('Please login to submit review');
        return;
      }

      const token = await currentUser.getIdToken();
      console.log('Submitting review:', { hotelId, rating, commentLength: trimmedComment.length });
      
      const response = await createReview(
        token,
        hotelId as string,
        rating,
        trimmedComment
      );

      console.log('Review response:', response);

      if (response.success) {
        showSuccess('Review submitted! ⭐ Thank you for your feedback!');
        setTimeout(() => router.back(), 1500);
      } else {
        showError(response.message || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Submit review error:', error);
      showError(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading...</Text>
      </View>
    );
  }

  if (!hotel || !canReview) {
    return null;
  }

  const hotelImage = hotel.photos && hotel.photos.length > 0
    ? getImageUri(hotel.photos[0])
    : 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hotel Info */}
        <View style={styles.hotelCard}>
          <Image source={{ uri: hotelImage }} style={styles.hotelImage} />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{hotel.name}</Text>
            <Text style={styles.hotelLocation}>{hotel.location}</Text>
          </View>
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How was your stay?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={48}
                  color={star <= rating ? '#FFA500' : '#E5E7EB'}
                  fill={star <= rating ? '#FFA500' : 'none'}
                  strokeWidth={1.5}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingText}>
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </Text>
          )}
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Share your experience</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Tell us about your stay - what did you like? What could be improved?"
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{comment.length} characters</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 Tips for writing a great review:</Text>
          <Text style={styles.tipText}>• Be specific about what you liked or disliked</Text>
          <Text style={styles.tipText}>• Mention the service quality and cleanliness</Text>
          <Text style={styles.tipText}>• Share details about the room and amenities</Text>
          <Text style={styles.tipText}>• Be honest and constructive</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (rating === 0 || !comment.trim() || submitting) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || !comment.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  hotelInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  hotelLocation: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#17A2B8',
    textAlign: 'center',
    marginTop: 12,
  },
  commentInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 150,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  tipsCard: {
    backgroundColor: '#FFF8E1',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#17A2B8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
