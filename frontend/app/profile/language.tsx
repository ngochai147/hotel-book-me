import { useRouter } from 'expo-router';
import { Check, ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Language = {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages: Language[] = [
    { id: 1, code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { id: 2, code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { id: 3, code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { id: 4, code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { id: 5, code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { id: 6, code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { id: 7, code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { id: 8, code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { id: 9, code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { id: 10, code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  ];

  const handleSelectLanguage = (code: string) => {
    setSelectedLanguage(code);
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.title}>Language</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.description}>
          Select your preferred language. The app will restart to apply the changes.
        </Text>

        {languages.map((language) => (
          <TouchableOpacity
            key={language.id}
            style={[
              styles.languageItem,
              selectedLanguage === language.code && styles.languageItemSelected
            ]}
            onPress={() => handleSelectLanguage(language.code)}
          >
            <View style={styles.languageLeft}>
              <Text style={styles.flag}>{language.flag}</Text>
              <View>
                <Text style={styles.languageName}>{language.name}</Text>
                <Text style={styles.languageNative}>{language.nativeName}</Text>
              </View>
            </View>
            {selectedLanguage === language.code && (
              <View style={styles.checkCircle}>
                <Check size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageItemSelected: {
    borderColor: '#17A2B8',
    backgroundColor: '#E3F7FA',
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  flag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  languageNative: {
    fontSize: 13,
    color: '#666',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
