import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MapPin, Star, Heart } from 'lucide-react-native';

const favorites = [
  {
    id: 1,
    name: 'The Gramary by Young Villas',
    location: 'Bali, Indonesia',
    rating: 4.9,
    price: 280,
    image: 'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    name: 'Paradise View',
    location: 'Paris, France',
    rating: 4.8,
    price: 320,
    image: 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export default function FavoritesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Favorites</Text>
        <Text style={styles.subtitle}>{favorites.length} hotels saved</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {favorites.map((hotel) => (
          <TouchableOpacity key={hotel.id} style={styles.card}>
            <Image source={{ uri: hotel.image }} style={styles.image} />
            <TouchableOpacity style={styles.favoriteButton}>
              <Heart size={20} color="#17A2B8" fill="#17A2B8" />
            </TouchableOpacity>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{hotel.name}</Text>
              <View style={styles.meta}>
                <MapPin size={14} color="#666" />
                <Text style={styles.location}>{hotel.location}</Text>
              </View>
              <View style={styles.footer}>
                <View style={styles.rating}>
                  <Star size={14} color="#FFA500" fill="#FFA500" />
                  <Text style={styles.ratingText}>{hotel.rating}</Text>
                </View>
                <Text style={styles.price}>${hotel.price}<Text style={styles.priceUnit}>/night</Text></Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17A2B8',
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
});
