import { useRouter } from 'expo-router';
import { MapPin, Star, Heart, ArrowRight } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUri } from '../utils/imageHelper';

interface FavoriteHotelCardProps {
  hotel: {
    _id: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    photos: string[];
  };
  isAvailable: boolean;
  onToggleFavorite: (hotelId: string) => void;
}

export default function FavoriteHotelCard({ 
  hotel, 
  isAvailable, 
  onToggleFavorite 
}: FavoriteHotelCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity 
      style={styles.favoriteCard}
      activeOpacity={0.9}
      onPress={() => router.push(`/hotel/${hotel._id}`)}
    >
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: getImageUri(hotel.photos[0]) }} 
          style={styles.favoriteImage}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.imageOverlay}
        />
        
        {/* Top badges */}
        <View style={styles.topBadges}>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
          </View>
          {!isAvailable && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Hết phòng</Text>
            </View>
          )}
        </View>

        {/* Favorite button */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(hotel._id);
          }}
          activeOpacity={0.7}
        >
          <Heart size={20} color="#FF6B9D" fill="#FF6B9D" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          <Text style={styles.hotelName} numberOfLines={2}>{hotel.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color="rgba(255,255,255,0.85)" />
            <Text style={styles.locationText} numberOfLines={1}>{hotel.location}</Text>
          </View>
        </View>
      </View>

      {/* Card footer */}
      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.priceLabel}>Starting from</Text>
          <Text style={styles.priceValue}>
            {hotel.price.toLocaleString('vi-VN')} VND
            <Text style={styles.priceUnit}>/night</Text>
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={() => router.push(`/hotel/${hotel._id}`)}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
          <ArrowRight size={16} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  favoriteCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageWrapper: {
    width: '100%',
    height: 240,
    position: 'relative',
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  topBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  soldOutText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  priceLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#07A3B2',
    letterSpacing: -0.5,
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07A3B2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
