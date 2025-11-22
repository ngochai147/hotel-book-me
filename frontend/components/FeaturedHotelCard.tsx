import { useRouter } from 'expo-router';
import { MapPin, Star, Heart } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUri } from '../utils/imageHelper';

interface FeaturedHotelCardProps {
  hotel: {
    _id: string;
    name: string;
    location: string;
    price: number;
    rating: number;
    photos: string[];
  };
  isAvailable: boolean;
  isFavorite: boolean;
  onToggleFavorite: (hotelId: string) => void;
}

export default function FeaturedHotelCard({ 
  hotel, 
  isAvailable, 
  isFavorite, 
  onToggleFavorite 
}: FeaturedHotelCardProps) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => router.push(`/hotel/${hotel._id}`)}
      activeOpacity={0.95}
    >
      <Image
        source={{ uri: getImageUri(hotel.photos?.[0] || '') }}
        style={styles.featuredImage}
      />
      
      {/* Top Badges Row */}
      <View style={styles.featuredTopRow}>
        <View style={styles.leftBadges}>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#FFD700" fill="#FFD700" />
            <Text style={styles.ratingBadgeText}>{hotel.rating.toFixed(1)}</Text>
          </View>
          {!isAvailable && (
            <View style={styles.soldOutBadge}>
              <Text style={styles.soldOutText}>Hết phòng</Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.featuredFavorite}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(hotel._id);
          }}
        >
          <Heart
            size={20}
            color={isFavorite ? "#FF6B9D" : "black"}
            fill={isFavorite ? "#FF6B9D" : "none"}
            strokeWidth={2.5}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Info with Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.featuredOverlay}
      >
        <View style={styles.featuredInfo}>
          <Text style={styles.featuredName} numberOfLines={2}>{hotel.name}</Text>
          <View style={styles.featuredLocation}>
            <MapPin size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.featuredLocationText} numberOfLines={1}>
              {hotel.location}
            </Text>
          </View>
          <View style={styles.featuredPriceRow}>
            <Text style={styles.featuredPrice}>{hotel.price.toLocaleString('vi-VN')} VND</Text>
            <Text style={styles.featuredPriceLabel}>/đêm</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  featuredCard: {
    width: 320,
    height: 420,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#07A3B2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
    marginRight: 20,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  
  // Top badges row
  featuredTopRow: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  leftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  soldOutBadge: {
    backgroundColor: 'rgba(255, 59, 48, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  soldOutText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  ratingBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  featuredFavorite: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  
  // Bottom gradient overlay
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%',
    padding: 20,
    justifyContent: 'flex-end',
  },
  featuredInfo: {
    gap: 10,
  },
  featuredName: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.8,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuredLocationText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    flex: 1,
  },
  featuredPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  featuredPrice: {
    fontSize: 24,
    fontWeight: '900',
    color: '#07A3B2',
    letterSpacing: -0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredPriceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
});
