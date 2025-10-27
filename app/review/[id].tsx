import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type ReviewCategory = {
  name: string;
  rating: number;
};

export default function AddReviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const hotelId = params.id as string;
  const hotelName = params.hotelName as string;
  const hotelLocation = params.hotelLocation as string;
  const hotelImage = params.hotelImage as string;

  const [overallRating, setOverallRating] = useState(0);
  const [categories, setCategories] = useState<ReviewCategory[]>([
    { name: 'Cleanliness', rating: 0 },
    { name: 'Service', rating: 0 },
    { name: 'Location', rating: 0 },
    { name: 'Facilities', rating: 0 },
    { name: 'Value for Money', rating: 0 },
  ]);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const handleCategoryRating = (index: number, rating: number) => {
    const updated = [...categories];
    updated[index].rating = rating;
    setCategories(updated);
  };

  const handleAddPhoto = () => {
    Alert.alert(
      'Add Photo',
      'Choose photo source',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            // Simulate adding a photo
            const demoPhoto = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400`;
            setPhotos([...photos, demoPhoto]);
          },
        },
        {
          text: 'Choose from Library',
          onPress: () => {
            // Simulate adding a photo
            const demoPhoto = `https://images.pexels.com/photos/${Math.floor(Math.random() * 1000000)}/pexels-photo.jpeg?auto=compress&cs=tinysrgb&w=400`;
            setPhotos([...photos, demoPhoto]);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRemovePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
  };

  const handleSubmit = () => {
    if (overallRating === 0) {
      Alert.alert('Rating Required', 'Please provide an overall rating.');
      return;
    }

    if (!reviewTitle.trim()) {
      Alert.alert('Title Required', 'Please add a review title.');
      return;
    }

    if (!reviewText.trim()) {
      Alert.alert('Review Required', 'Please write your review.');
      return;
    }

    // Calculate average category rating
    const avgCategoryRating = categories.reduce((sum, cat) => sum + cat.rating, 0) / categories.length;

    Alert.alert(
      'Review Submitted',
      `Thank you for your ${overallRating}-star review!\n\nAverage category rating: ${avgCategoryRating.toFixed(1)}/5`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const isValid = overallRating > 0 && reviewTitle.trim() && reviewText.trim();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write a Review</Text>
        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid}
        >
          <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
            Submit
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Hotel Info */}
        <View style={styles.hotelCard}>
          <Image source={{ uri: hotelImage }} style={styles.hotelImage} />
          <View style={styles.hotelInfo}>
            <Text style={styles.hotelName}>{hotelName}</Text>
            <Text style={styles.hotelLocation}>{hotelLocation}</Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setOverallRating(star)}
                style={styles.starButton}
              >
                <Star
                  size={40}
                  color="#FFD700"
                  fill={star <= overallRating ? '#FFD700' : 'transparent'}
                />
              </TouchableOpacity>
            ))}
          </View>
          {overallRating > 0 && (
            <Text style={styles.ratingText}>
              {overallRating === 5 ? 'Excellent!' : overallRating === 4 ? 'Very Good!' : overallRating === 3 ? 'Good' : overallRating === 2 ? 'Fair' : 'Poor'}
            </Text>
          )}
        </View>

        {/* Category Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Your Experience</Text>
          {categories.map((category, index) => (
            <View key={category.name} style={styles.categoryRow}>
              <Text style={styles.categoryName}>{category.name}</Text>
              <View style={styles.categoryStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleCategoryRating(index, star)}
                  >
                    <Star
                      size={20}
                      color="#FFD700"
                      fill={star <= category.rating ? '#FFD700' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Review Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Summarize your experience"
            value={reviewTitle}
            onChangeText={setReviewTitle}
            maxLength={100}
          />
          <Text style={styles.charCount}>{reviewTitle.length}/100</Text>
        </View>

        {/* Review Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Review</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Share your experience with other travelers..."
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.charCount}>{reviewText.length}/500</Text>
        </View>

        {/* Add Photos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            ))}
            {photos.length < 5 && (
              <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Upload size={24} color="#17A2B8" />
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.photoHint}>You can add up to 5 photos</Text>
        </View>

        {/* Guidelines */}
        <View style={styles.guidelinesCard}>
          <Text style={styles.guidelinesTitle}>Review Guidelines</Text>
          <Text style={styles.guidelinesText}>
            • Be honest and helpful{'\n'}
            • Focus on your stay experience{'\n'}
            • Avoid offensive language{'\n'}
            • Don't include personal information
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 16,
    color: '#17A2B8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  submitButton: {
    paddingVertical: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17A2B8',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  hotelCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  hotelImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  hotelInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hotelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  hotelLocation: {
    fontSize: 13,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#17A2B8',
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  categoryStars: {
    flexDirection: 'row',
    gap: 4,
  },
  titleInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#1a1a1a',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  reviewInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 120,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#17A2B8',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E3F7FA',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#17A2B8',
    marginTop: 4,
    fontWeight: '500',
  },
  photoHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  guidelinesCard: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFB020',
  },
  guidelinesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  guidelinesText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
});
