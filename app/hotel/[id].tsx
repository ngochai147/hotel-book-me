import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native"
import { useState } from "react"
import { useRouter, useLocalSearchParams } from "expo-router"
import { MapPin, Star, ChevronLeft, Share2, Heart } from "lucide-react-native"

type Hotel = {
  name: string
  location: string
  rating: number
  reviews: number
  price: number
  image: string
  description: string
  facilities: string[]
  ratingBreakdown: { stars: number; count: number; percentage: number }[]
  reviews_list: { id: number; author: string; rating: number; date: string; text: string; avatar: string }[]
  roomTypes: { id: number; name: string; guests: number; area: string; amenities: string[]; price: number; image: string }[]
  facilities_list: { category: string; items: string[] }[]
}

const hotelDetails: Record<string, Hotel> = {
  "1": {
    name: "Hyatt Regency Bali",
    location: "Jl. Danau Tamblingan No. 89, Sanur, Denpasar",
    rating: 4.8,
    reviews: 374,
    price: 56,
    image: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=600",
    description:
      "Set on the old site of Bali Hyatt on the main street of Sanur, the hotel is located on a delightful beachfront and nine hectares of lush.",
    facilities: ["Wifi", "Pool", "Beach", "AC", "Gym"],
    ratingBreakdown: [
      { stars: 5, count: 250, percentage: 67 },
      { stars: 4, count: 80, percentage: 21 },
      { stars: 3, count: 30, percentage: 8 },
      { stars: 2, count: 10, percentage: 3 },
      { stars: 1, count: 4, percentage: 1 },
    ],
    reviews_list: [
      {
        id: 1,
        author: "Abraham Adam",
        rating: 5,
        date: "2 days ago",
        text: "First of all, the location of this hotel is between the beach and fun street where full of shops, restaurants/bars, spas, and more.",
        avatar: "https://i.pravatar.cc/150?img=1",
      },
      {
        id: 2,
        author: "Jessica Wong",
        rating: 5,
        date: "5 days ago",
        text: "Beautiful hotel which had everything you could need. Rooms were spotless and well appointed.",
        avatar: "https://i.pravatar.cc/150?img=2",
      },
      {
        id: 3,
        author: "Joe Alexander",
        rating: 5,
        date: "1 week ago",
        text: "The rooms were spacious, clean, and offered breathtaking views of the ocean. I loved waking up to the sound of the waves and enjoying my coffee.",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
    ],
    roomTypes: [
      {
        id: 1,
        name: "Twin View Room",
        guests: 2,
        area: "Seating Area",
        amenities: ["Shower", "Air Conditioning"],
        price: 56,
        image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=400",
      },
      {
        id: 2,
        name: "Suite King Bed",
        guests: 2,
        area: "Dining Area",
        amenities: ["Bathtub", "Air Conditioning"],
        price: 64,
        image: "https://images.pexels.com/photos/271897/pexels-photo-271897.jpeg?auto=compress&cs=tinysrgb&w=400",
      },
    ],
    facilities_list: [
      {
        category: "Hotel Service",
        items: [
          "Laundry",
          "Medical Services",
          "Money Changer",
          "Luggage Storage",
          "Tours",
          "Concierge",
          "24 hour Security",
          "Bellhop",
        ],
      },
      {
        category: "Things to Do",
        items: ["Beach", "Water Sports", "Hiking", "Cycling"],
      },
      {
        category: "Foods and Drinks",
        items: ["Restaurant", "Bar", "Cafe", "Room Service"],
      },
      {
        category: "General",
        items: ["WiFi", "Parking", "Elevator", "Front Desk"],
      },
      {
        category: "Nearby Facilities",
        items: ["Shopping Mall", "Hospital", "Airport", "Train Station"],
      },
      {
        category: "Public Facilities",
        items: ["Swimming Pool", "Gym", "Spa", "Conference Room"],
      },
      {
        category: "Sports and Recreations",
        items: ["Tennis Court", "Basketball Court", "Yoga", "Meditation"],
      },
      {
        category: "Transportation",
        items: ["Airport Shuttle", "Car Rental", "Taxi Service", "Bike Rental"],
      },
    ],
  },
}

export default function HotelDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams()
  const hotel = id ? hotelDetails[String(id)] : undefined
  const [isFavorite, setIsFavorite] = useState(false)
  const [expandedFacility, setExpandedFacility] = useState<string | null>(null)

  if (!hotel) {
    return (
      <View style={styles.container}>
        <Text>Hotel not found</Text>
      </View>
    )
  }

  const renderRatingBreakdown = () => (
    <View style={styles.ratingBreakdownContainer}>
      {hotel.ratingBreakdown.map((item, index) => (
        <View key={index} style={styles.ratingRow}>
          <View style={styles.ratingStars}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={12}
                color={i < item.stars ? "#FFA500" : "#E5E7EB"}
                fill={i < item.stars ? "#FFA500" : "none"}
              />
            ))}
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingBarFill, { width: `${item.percentage}%` }]} />
          </View>
          <Text style={styles.ratingCount}>{item.count}</Text>
        </View>
      ))}
    </View>
  )

  const renderLocationMap = () => (
    <View style={styles.locationMapContainer}>
      <View style={styles.mapPlaceholder}>
        <MapPin size={40} color="#17A2B8" />
        <Text style={styles.mapText}>Location Map</Text>
      </View>
      <View style={styles.locationInfo}>
        <MapPin size={16} color="#17A2B8" />
        <Text style={styles.locationAddress}>{hotel.location}</Text>
      </View>
    </View>
  )

  const renderReviewItem = (review: any) => (
    <View style={styles.reviewItem} key={review.id}>
      <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewAuthor}>{review.author}</Text>
          <Text style={styles.reviewDate}>{review.date}</Text>
        </View>
        <View style={styles.reviewRating}>
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              color={i < review.rating ? "#FFA500" : "#E5E7EB"}
              fill={i < review.rating ? "#FFA500" : "none"}
            />
          ))}
        </View>
        <Text style={styles.reviewText}>{review.text}</Text>
      </View>
    </View>
  )

  const renderRoomType = (room: any) => (
    <View style={styles.roomTypeCard} key={room.id}>
      <Image source={{ uri: room.image }} style={styles.roomImage} />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{room.name}</Text>
        <View style={styles.roomMeta}>
          <Text style={styles.roomGuests}>👥 {room.guests} Guests</Text>
          <Text style={styles.roomArea}>📍 {room.area}</Text>
        </View>
        <Text style={styles.roomAmenities}>
          {Array.isArray(room.amenities) ? room.amenities.join(", ") : room.amenities}
        </Text>
        <View style={styles.roomFooter}>
          <Text style={styles.roomPrice}>
            ${room.price}
            <Text style={styles.priceUnit}>/night</Text>
          </Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.selectButtonText}>Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderFacilityCategory = (category: any) => (
    <View key={category.category} style={styles.facilityCategory}>
      <TouchableOpacity
        style={styles.facilityHeader}
        onPress={() => setExpandedFacility(expandedFacility === category.category ? null : category.category)}
      >
        <Text style={styles.facilityTitle}>{category.category}</Text>
        <Text style={styles.expandIcon}>{expandedFacility === category.category ? "▼" : "▶"}</Text>
      </TouchableOpacity>
      {expandedFacility === category.category && (
        <View style={styles.facilityItems}>
          {category.items.map((item: string, index: number) => (
            <Text key={index} style={styles.facilityItem}>
              • {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: hotel.image }} style={styles.headerImage} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Share2 size={20} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButtonHeader} onPress={() => setIsFavorite(!isFavorite)}>
          <Heart size={20} color={isFavorite ? "#FF6B6B" : "white"} fill={isFavorite ? "#FF6B6B" : "none"} />
        </TouchableOpacity>
      </View>

      {/* Hotel Info */}
      <View style={styles.hotelInfoSection}>
        <Text style={styles.hotelName}>{hotel.name}</Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color="#666" />
          <Text style={styles.locationText}>{hotel.location}</Text>
        </View>

        {/* Rating and Reviews */}
        <View style={styles.ratingSection}>
          <View style={styles.ratingBox}>
            <Star size={20} color="#FFA500" fill="#FFA500" />
            <Text style={styles.ratingNumber}>{hotel.rating}</Text>
            <Text style={styles.reviewCount}>{hotel.reviews} reviews</Text>
          </View>
        </View>

        {/* Property Facilities */}
        <View style={styles.facilitiesSection}>
          <View style={styles.facilitiesHeader}>
            <Text style={styles.facilitiesTitle}>Property Facilities</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.facilitiesGrid}>
            {hotel.facilities.map((facility, index) => (
              <View key={index} style={styles.facilityItem}>
                <View style={styles.facilityIcon}>
                  <Text style={styles.facilityIconText}>
                    {facility === "Wifi" && "📶"}
                    {facility === "Pool" && "🏊"}
                    {facility === "Beach" && "🏖️"}
                    {facility === "AC" && "❄️"}
                    {facility === "Gym" && "💪"}
                  </Text>
                </View>
                <Text style={styles.facilityName}>{facility}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{hotel.description}</Text>
        </View>

        {/* Price */}
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            ${hotel.price}
            <Text style={styles.priceUnitLarge}>/night</Text>
          </Text>
        </View>
      </View>

      {/* Reviews Section with Rating Breakdown */}
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllLink}>See all</Text>
          </TouchableOpacity>
        </View>
        {renderRatingBreakdown()}
        {hotel.reviews_list.slice(0, 1).map(renderReviewItem)}
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>
        {renderLocationMap()}
      </View>

      {/* Room Types Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Room Type</Text>
        {hotel.roomTypes.map(renderRoomType)}
      </View>

      {/* All Facilities Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Property Facilities</Text>
        {hotel.facilities_list.map(renderFacilityCategory)}
      </View>

      {/* Reviews Section */}
      <View style={styles.section}>
        <View style={styles.reviewsHeader}>
          <Text style={styles.sectionTitle}>All Reviews</Text>
          <Text style={styles.reviewCount}>{hotel.reviews} Reviews</Text>
        </View>
        {hotel.reviews_list.map(renderReviewItem)}
      </View>

      {/* Book Button */}
      <TouchableOpacity
        onPress={() => {
          if (id) {
            router.push({ pathname: "/booking/id", params: { id: String(id) } })
          }
        }}
        style={styles.bookButton}
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 300,
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  favoriteButtonHeader: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  hotelInfoSection: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  hotelName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#666",
    flex: 1,
  },
  ratingSection: {
    marginBottom: 16,
  },
  ratingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  reviewCount: {
    fontSize: 12,
    color: "#666",
  },
  facilitiesSection: {
    marginBottom: 16,
  },
  facilitiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  facilitiesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  seeAllLink: {
    fontSize: 12,
    color: "#17A2B8",
    fontWeight: "600",
  },
  facilitiesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  facilityItem: {
    alignItems: "center",
    flex: 1,
  },
  facilityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  facilityIconText: {
    fontSize: 20,
  },
  facilityName: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
  },
  descriptionSection: {
    marginBottom: 16,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
  },
  priceSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  priceLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#17A2B8",
  },
  priceUnitLarge: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666",
  },
  section: {
    backgroundColor: "white",
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 12,
  },
  ratingBreakdownContainer: {
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  ratingStars: {
    flexDirection: "row",
    gap: 2,
    width: 60,
  },
  ratingBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#FFA500",
  },
  ratingCount: {
    fontSize: 12,
    color: "#666",
    width: 40,
    textAlign: "right",
  },
  locationMapContainer: {
    marginBottom: 16,
  },
  mapPlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: "#F0F0F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  mapText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  locationAddress: {
    fontSize: 12,
    color: "#666",
    flex: 1,
    lineHeight: 18,
  },
  roomTypeCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  roomImage: {
    width: "100%",
    height: 120,
  },
  roomInfo: {
    padding: 12,
  },
  roomName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  roomMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 6,
  },
  roomGuests: {
    fontSize: 11,
    color: "#666",
  },
  roomArea: {
    fontSize: 11,
    color: "#666",
  },
  roomAmenities: {
    fontSize: 11,
    color: "#666",
    marginBottom: 8,
  },
  roomFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomPrice: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#17A2B8",
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: "normal",
    color: "#666",
  },
  selectButton: {
    backgroundColor: "#17A2B8",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  facilityCategory: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8,
  },
  facilityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  facilityTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  expandIcon: {
    fontSize: 12,
    color: "#666",
  },
  facilityItems: {
    paddingLeft: 12,
    paddingBottom: 8,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewItem: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewContent: {
    flex: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewAuthor: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  reviewDate: {
    fontSize: 11,
    color: "#999",
  },
  reviewRating: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 6,
  },
  reviewText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  bookButton: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 56,
    backgroundColor: "#17A2B8",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  bookButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
})
