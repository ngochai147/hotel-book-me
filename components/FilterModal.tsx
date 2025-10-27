import { Star, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
// import Slider from '@react-native-community/slider';

const { height } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');

  const facilities = ['Swimming Pool', 'Wifi', 'Restaurant', 'Parking'];
  const propertyTypes = ['Hotel', 'Villa', 'Apartment', 'Resort'];

  const toggleFacility = (facility: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(facility)
        ? prev.filter((f) => f !== facility)
        : [...prev, facility]
    );
  };

  const handleApply = () => {
    onApply({
      priceRange,
      rating: selectedRating,
      facilities: selectedFacilities,
      propertyType: selectedPropertyType,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Filter</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#1a1a1a" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Rating */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <View style={styles.ratingContainer}>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingChip,
                      selectedRating === rating && styles.ratingChipActive,
                    ]}
                    onPress={() => setSelectedRating(rating)}
                  >
                    <Star
                      size={16}
                      color={selectedRating === rating ? '#fff' : '#FFA500'}
                      fill={selectedRating === rating ? '#fff' : '#FFA500'}
                    />
                    <Text
                      style={[
                        styles.ratingText,
                        selectedRating === rating && styles.ratingTextActive,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range (per night)</Text>
              <View style={styles.priceRangeContainer}>
                <View style={styles.priceBox}>
                  <Text style={styles.priceBoxLabel}>Minimum</Text>
                  <Text style={styles.priceBoxValue}>${priceRange[0]}</Text>
                  <View style={styles.priceControls}>
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => {
                        const newMin = Math.max(0, priceRange[0] - 10);
                        setPriceRange([newMin, priceRange[1]]);
                      }}
                    >
                      <Text style={styles.priceButtonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => {
                        const newMin = Math.min(priceRange[1] - 10, priceRange[0] + 10);
                        setPriceRange([newMin, priceRange[1]]);
                      }}
                    >
                      <Text style={styles.priceButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.priceSeparator} />
                <View style={styles.priceBox}>
                  <Text style={styles.priceBoxLabel}>Maximum</Text>
                  <Text style={styles.priceBoxValue}>${priceRange[1]}</Text>
                  <View style={styles.priceControls}>
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => {
                        const newMax = Math.max(priceRange[0] + 10, priceRange[1] - 10);
                        setPriceRange([priceRange[0], newMax]);
                      }}
                    >
                      <Text style={styles.priceButtonText}>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.priceButton}
                      onPress={() => {
                        const newMax = Math.min(1000, priceRange[1] + 10);
                        setPriceRange([priceRange[0], newMax]);
                      }}
                    >
                      <Text style={styles.priceButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <Text style={styles.priceHint}>Use +/- buttons to adjust price range</Text>
            </View>

            {/* Facilities */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <View style={styles.facilitiesGrid}>
                {facilities.map((facility) => (
                  <TouchableOpacity
                    key={facility}
                    style={[
                      styles.facilityChip,
                      selectedFacilities.includes(facility) && styles.facilityChipActive,
                    ]}
                    onPress={() => toggleFacility(facility)}
                  >
                    <Text
                      style={[
                        styles.facilityText,
                        selectedFacilities.includes(facility) && styles.facilityTextActive,
                      ]}
                    >
                      {facility}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Property Type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Property Type</Text>
              <View style={styles.propertyTypeGrid}>
                {propertyTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.propertyTypeChip,
                      selectedPropertyType === type && styles.propertyTypeChipActive,
                    ]}
                    onPress={() => setSelectedPropertyType(type)}
                  >
                    <Text
                      style={[
                        styles.propertyTypeText,
                        selectedPropertyType === type && styles.propertyTypeTextActive,
                      ]}
                    >
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    gap: 4,
  },
  ratingChipActive: {
    backgroundColor: '#17A2B8',
    borderColor: '#17A2B8',
  },
  ratingText: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  ratingTextActive: {
    color: 'white',
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
  },
  priceSliderPlaceholder: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 16,
  },
  priceSliderFill: {
    height: '100%',
    backgroundColor: '#17A2B8',
    borderRadius: 3,
  },
  priceValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
  },
  priceBoxLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17A2B8',
    marginBottom: 8,
  },
  priceControls: {
    flexDirection: 'row',
    gap: 8,
  },
  priceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  priceSeparator: {
    width: 1,
    height: 60,
    backgroundColor: '#E5E7EB',
  },
  priceHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  facilityChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  facilityChipActive: {
    backgroundColor: '#17A2B8',
    borderColor: '#17A2B8',
  },
  facilityText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  facilityTextActive: {
    color: 'white',
  },
  propertyTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  propertyTypeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  propertyTypeChipActive: {
    backgroundColor: '#17A2B8',
    borderColor: '#17A2B8',
  },
  propertyTypeText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  propertyTypeTextActive: {
    color: 'white',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  applyButton: {
    height: 56,
    backgroundColor: '#17A2B8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
