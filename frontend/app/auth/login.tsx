import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { loginWithToken } from '../../services/authService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter your password');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(false);

    try {
      // Get token trong firebase
      const {user} = await signInWithEmailAndPassword(auth, email.trim(), password);
      const firebaseToken = await user.getIdToken();

      // Co token roi gui nguoc len backend
      const response = await loginWithToken(firebaseToken);

      //neu thanh cong thi luu vao firebaseToken
      if (response.success && response.data) {

            router.replace('/tabs')
      } else {
        Alert.alert('Error', response.message || 'Login failed');
        setError(true);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={24} color="#1a1a1a" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>B</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Welcome back to explore about our app</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, error && !email && styles.inputError]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#999"
          />
          {error && !email && <Text style={styles.errorText}>Email is required</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.passwordContainer, error && !password && styles.inputError]}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#999" />
              ) : (
                <Eye size={20} color="#999" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>G</Text>
            <Text style={styles.socialLabel}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.socialButtonText}>f</Text>
            <Text style={styles.socialLabel}>Facebook</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.footerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    padding: 20,
  },
  inputError: {
    borderColor: '#ff0000',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 30,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#17A2B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    paddingHorizontal: 20,
    fontSize: 14,
    color: '#1a1a1a',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    height: 50,
    paddingHorizontal: 20,
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#17A2B8',
    textAlign: 'right',
    marginBottom: 20,
  },
  loginButton: {
    height: 56,
    backgroundColor: '#17A2B8',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CD4DC',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 30,
  },
  socialButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  socialButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  socialLabel: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
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
