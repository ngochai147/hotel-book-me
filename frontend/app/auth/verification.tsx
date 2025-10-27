import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Check } from 'lucide-react-native';

export default function VerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    setIsVerified(true);
    setTimeout(() => {
      router.replace('/tabs');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {isVerified ? (
            <View style={styles.successIcon}>
              <Check size={40} color="white" />
            </View>
          ) : (
            <View style={styles.icon}>
              <Text style={styles.iconText}>@</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>
          {isVerified ? 'Congratulations!' : 'Please Verify Your Email'}
        </Text>
        <Text style={styles.subtitle}>
          {isVerified
            ? 'Your account has been verified successfully'
            : 'Enter the 6-digit code we sent to\nhasanabdulgaffar@gmail.com'}
        </Text>

        {!isVerified && (
          <>
            <View style={styles.codeContainer}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref: TextInput | null) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.codeInput,
                    digit && styles.codeInputFilled,
                  ]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
              <Text style={styles.verifyButtonText}>Verify</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Didn't receive the code? </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {isVerified && (
          <TouchableOpacity style={styles.verifyButton} onPress={() => router.replace('/tabs')}>
            <Text style={styles.verifyButtonText}>Back to Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  iconContainer: {
    marginBottom: 30,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
    color: '#17A2B8',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a1a1a',
  },
  codeInputFilled: {
    borderColor: '#17A2B8',
    backgroundColor: '#E3F7FA',
  },
  verifyButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#17A2B8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerLink: {
    fontSize: 14,
    color: '#17A2B8',
    fontWeight: '600',
  },
});
