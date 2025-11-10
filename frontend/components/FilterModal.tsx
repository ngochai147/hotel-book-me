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

const { height } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
  const [priceRange, setPriceRange] = useState([0, 20000000]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleApply = () => {
    onApply({
      priceRange,
      rating: selectedRating,
    });
    onClose();
  };

  const handleReset = () => {
    setPriceRange([0, 20000000]);
    setSelectedRating(null);
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
              <Text style={styles.sectionTitle}>Rating (Stars)</Text>
              <View style={styles.ratingGrid}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingChip,
                      selectedRating === rating && styles.ratingChipActive,
                    ]}
                    onPress={() => setSelectedRating(rating === selectedRating ? null : rating)}
                  >
                    {rating > 0 && (
                      <Star
                        size={14}
                        color={selectedRating === rating ? '#fff' : '#FFA500'}
                        fill={selectedRating === rating ? '#fff' : '#FFA500'}
                      />
                    )}
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
              <Text style={styles.ratingHint}>Select minimum rating (0 = show all)</Text>
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
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
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
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    gap: 4,
    minWidth: 50,
    justifyContent: 'center',
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
  ratingHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#F8F9FA',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
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
