import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { getReviewsByHotelId, Review, formatReviewDate } from '../../../services/reviewService';
import { getHotelById } from '../../../services/hotelService';

export default function AllReviewsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, [id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Load hotel name
      const hotelResponse = await getHotelById(id as string);
      if (hotelResponse.success && hotelResponse.data) {
        setHotelName(hotelResponse.data.name);
      }

      // Load reviews
      const response = await getReviewsByHotelId(id as string);
      if (response.success) {
        setReviews(response.data);
      } else {
        Alert.alert('Error', response.message || 'Failed to load reviews');
      }
    } catch (error) {
      console.error('Load reviews error:', error);
      Alert.alert('Error', 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
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

  const calculateAverageRating = (): number => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return parseFloat((sum / reviews.length).toFixed(1));
  };

  const getRatingBreakdown = () => {
    const breakdown = [5, 4, 3, 2, 1].map(stars => {
      const count = reviews.filter(r => Math.floor(r.rating) === stars).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { stars, count, percentage };
    });
    return breakdown;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#17A2B8" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reviews</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hotel Name */}
        <Text style={styles.hotelName}>{hotelName}</Text>

        {/* Overall Rating Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.ratingColumn}>
            <Text style={styles.averageRating}>{calculateAverageRating()}</Text>
            {renderStars(Math.round(calculateAverageRating()))}
            <Text style={styles.totalReviews}>{reviews.length} reviews</Text>
          </View>

          <View style={styles.breakdownColumn}>
            {getRatingBreakdown().map(({ stars, count, percentage }) => (
              <View key={stars} style={styles.breakdownRow}>
                <View style={styles.breakdownStars}>
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} size={10} color="#FFA500" fill="#FFA500" />
                  ))}
                </View>
                <View style={styles.breakdownBar}>
                  <View style={[styles.breakdownBarFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.breakdownCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* All Reviews */}
        <View style={styles.reviewsList}>
          {reviews.map((review) => {
            const user = typeof review.userId === 'object' ? review.userId : null;
            const userName = user?.userName || 'Anonymous';
            const userAvatar = user?.avatar || 'https://i.pravatar.cc/150?img=1';

            return (
              <View key={review._id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: userAvatar }} style={styles.avatar} />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.userName}>{userName}</Text>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Write Review Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => router.push(`/review/create?hotelId=${id}` as any)}
        >
          <Star size={18} color="white" />
          <Text style={styles.writeButtonText}>Write a Review</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  ratingColumn: {
    alignItems: 'center',
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#17A2B8',
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 8,
  },
  totalReviews: {
    fontSize: 12,
    color: '#666',
  },
  breakdownColumn: {
    flex: 1,
    paddingLeft: 20,
    justifyContent: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  breakdownStars: {
    flexDirection: 'row',
    gap: 1,
    width: 60,
  },
  breakdownBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    backgroundColor: '#FFA500',
  },
  breakdownCount: {
    fontSize: 12,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
  reviewsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  reviewCard: {
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
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  reviewComment: {
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  writeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#17A2B8',
    paddingVertical: 16,
    borderRadius: 12,
  },
  writeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
