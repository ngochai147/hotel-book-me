import { Star, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

const MIN_PRICE = 100000; 
const MAX_PRICE = 10000000; 
const PRICE_STEP = 100000;

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

export default function FilterModal({ visible, onClose, onApply }: FilterModalProps) {
  const [priceRange, setPriceRange] = useState([MIN_PRICE, MAX_PRICE]);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [minPriceInput, setMinPriceInput] = useState(MIN_PRICE.toString());
  const [maxPriceInput, setMaxPriceInput] = useState(MAX_PRICE.toString());

  const handleApply = () => {
    onApply({
      priceRange,
      rating: selectedRating,
    });
    onClose();
  };

  const handleReset = () => {
    setPriceRange([MIN_PRICE, MAX_PRICE]);
    setMinPriceInput(MIN_PRICE.toString());
    setMaxPriceInput(MAX_PRICE.toString());
    setSelectedRating(null);
  };

  const handleMinPriceChange = (text: string) => {
    // Cho phép nhập và lưu text thô
    setMinPriceInput(text);
    // Chỉ cập nhật priceRange khi có số hợp lệ
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText) {
      const value = parseInt(numericText);
      const clampedValue = Math.max(MIN_PRICE, Math.min(priceRange[1], value));
      setPriceRange([clampedValue, priceRange[1]]);
    }
  };

  const handleMaxPriceChange = (text: string) => {
    // Cho phép nhập và lưu text thô
    setMaxPriceInput(text);
    // Chỉ cập nhật priceRange khi có số hợp lệ
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText) {
      const value = parseInt(numericText);
      const clampedValue = Math.min(MAX_PRICE, Math.max(priceRange[0], value));
      setPriceRange([priceRange[0], clampedValue]);
    }
  };

  const handleMinPriceBlur = () => {
    // Khi blur, format lại và đảm bảo giá trị hợp lệ
    const numericText = minPriceInput.replace(/[^0-9]/g, '');
    const value = parseInt(numericText) || MIN_PRICE;
    const clampedValue = Math.max(MIN_PRICE, Math.min(priceRange[1], value));
    setPriceRange([clampedValue, priceRange[1]]);
    setMinPriceInput(clampedValue.toLocaleString('vi-VN'));
  };

  const handleMaxPriceBlur = () => {
    // Khi blur, format lại và đảm bảo giá trị hợp lệ
    const numericText = maxPriceInput.replace(/[^0-9]/g, '');
    const value = parseInt(numericText) || MAX_PRICE;
    const clampedValue = Math.min(MAX_PRICE, Math.max(priceRange[0], value));
    setPriceRange([priceRange[0], clampedValue]);
    setMaxPriceInput(clampedValue.toLocaleString('vi-VN'));
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
              <Text style={styles.sectionTitle}>Đánh giá tối thiểu</Text>
              <View style={styles.ratingGrid}>
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingChip,
                      selectedRating === rating && styles.ratingChipActive,
                    ]}
                    onPress={() => setSelectedRating(rating === selectedRating ? null : rating)}
                  >
                    <View style={styles.starContainer}>
                      {[...Array(rating > 0 ? rating : 0)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          color={selectedRating === rating ? '#fff' : '#FFD700'}
                          fill={selectedRating === rating ? '#fff' : '#FFD700'}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.ratingText,
                        selectedRating === rating && styles.ratingTextActive,
                      ]}
                    >
                      {rating === 0 ? 'Tất cả' : `${rating}★`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.ratingHint}>Chọn đánh giá tối thiểu (0 = hiển thị tất cả)</Text>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Khoảng giá (mỗi đêm)</Text>
              
              {/* Min Price */}
              <View style={styles.priceInputGroup}>
                <Text style={styles.priceInputLabel}>Giá tối thiểu</Text>
                <View style={styles.priceInputContainer}>
                  <TouchableOpacity
                    style={styles.priceButtonControl}
                    onPress={() => {
                      const newMin = Math.max(MIN_PRICE, priceRange[0] - PRICE_STEP);
                      setPriceRange([newMin, priceRange[1]]);
                      setMinPriceInput(newMin.toString());
                    }}
                  >
                    <Text style={styles.priceButtonControlText}>−</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.priceInputWrapper}>
                    <TextInput
                      style={styles.priceInput}
                      value={minPriceInput}
                      onBlur={handleMinPriceBlur}
                      onChangeText={handleMinPriceChange}
                      keyboardType="numeric"
                      placeholder={MIN_PRICE.toLocaleString('vi-VN')}
                    />
                    <Text style={styles.priceInputUnit}>VND</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.priceButtonControl}
                    onPress={() => {
                      const newMin = Math.min(priceRange[1] - PRICE_STEP, priceRange[0] + PRICE_STEP);
                      setPriceRange([newMin, priceRange[1]]);
                      setMinPriceInput(newMin.toString());
                    }}
                  >
                    <Text style={styles.priceButtonControlText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Max Price */}
              <View style={styles.priceInputGroup}>
                <Text style={styles.priceInputLabel}>Giá tối đa</Text>
                <View style={styles.priceInputContainer}>
                  <TouchableOpacity
                    style={styles.priceButtonControl}
                    onPress={() => {
                      const newMax = Math.max(priceRange[0] + PRICE_STEP, priceRange[1] - PRICE_STEP);
                      setPriceRange([priceRange[0], newMax]);
                      setMaxPriceInput(newMax.toString());
                    }}
                  >
                    <Text style={styles.priceButtonControlText}>−</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.priceInputWrapper}>
                    <TextInput
                      style={styles.priceInput}
                      value={maxPriceInput}
                      onBlur={handleMaxPriceBlur}
                      onChangeText={handleMaxPriceChange}
                      keyboardType="numeric"
                      placeholder={MAX_PRICE.toLocaleString('vi-VN')}
                    />
                    <Text style={styles.priceInputUnit}>VND</Text>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.priceButtonControl}
                    onPress={() => {
                      const newMax = Math.min(MAX_PRICE, priceRange[1] + PRICE_STEP);
                      setPriceRange([priceRange[0], newMax]);
                      setMaxPriceInput(newMax.toString());
                    }}
                  >
                    <Text style={styles.priceButtonControlText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <Text style={styles.priceHint}>
                Khoảng giá: {MIN_PRICE.toLocaleString('vi-VN')} - {MAX_PRICE.toLocaleString('vi-VN')} VND
              </Text>
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
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: 'white',
    gap: 6,
    minWidth: 70,
    justifyContent: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    gap: 2,
    minHeight: 12,
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
    marginTop: 12,
    textAlign: 'center',
  },
  priceInputGroup: {
    marginBottom: 16,
  },
  priceInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceButtonControl: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17A2B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priceButtonControlText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 52,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  priceInputUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#17A2B8',
    marginLeft: 8,
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
    height: 52,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    height: 52,
    backgroundColor: '#17A2B8',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#17A2B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});
