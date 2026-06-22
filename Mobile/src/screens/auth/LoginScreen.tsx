import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { PolyCard } from '../../components/PolyCard';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const Icon = Feather as any;

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { login: storeLogin, setTransitioning } = useAuthStore();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tài khoản và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await api.post('/api/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });
      
      const { token, user } = response.data;

      // Kích hoạt hiệu ứng chuyển cảnh
      setTransitioning(true);
      
      // Chờ logo hội tụ
      await new Promise(r => setTimeout(r, 1200));

      // Lưu trạng thái đăng nhập (luồng Navigation sẽ tự động chuyển trang)
      await storeLogin(token, user);
      
      // Chờ hoàn thành chuyển cảnh
      setTimeout(() => {
        setTransitioning(false);
      }, 800);

    } catch (error: any) {
      console.error('Login failed:', error);
      setErrorMsg(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Icon name="hexagon" size={32} color={theme.colors.primary} />
            </View>
            <PolyText variant="h1" weight="bold" align="center" style={styles.title}>
              Chào mừng trở lại!
            </PolyText>
            <PolyText color={theme.colors.textMuted} align="center" style={styles.subtitle}>
              Vui lòng đăng nhập vào tài khoản của bạn
            </PolyText>
          </View>

          <PolyCard style={styles.card}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Icon name="alert-circle" size={18} color={theme.colors.danger} style={styles.errorIcon} />
                <PolyText style={styles.errorText} color={theme.colors.danger} variant="caption">
                  {errorMsg}
                </PolyText>
              </View>
            ) : null}

            {/* Email / Username Input */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Email hoặc Mã sinh viên
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email hoặc mã sinh viên"
                  placeholderTextColor={theme.colors.textLight}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    setErrorMsg('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <View style={styles.passwordHeader}>
                <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                  Mật khẩu
                </PolyText>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <PolyText variant="caption" weight="semibold" color={theme.colors.primary}>
                    Quên mật khẩu?
                  </PolyText>
                </TouchableOpacity>
              </View>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textLight}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMsg('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.togglePassBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <PolyButton
              title="Đăng nhập"
              isLoading={isLoading}
              onPress={handleLogin}
              style={styles.submitBtn}
            />
          </PolyCard>

          <View style={styles.footer}>
            <PolyText color={theme.colors.textMuted} variant="caption">
              Chưa có tài khoản?{' '}
            </PolyText>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <PolyText variant="caption" weight="semibold" color={theme.colors.primary}>
                Đăng ký ngay
              </PolyText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xxl,
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  errorIcon: {
    marginRight: theme.spacing.sm,
  },
  errorText: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    height: 48,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.textMain,
    fontSize: theme.typography.sizes.body,
    // Add default font family if custom fonts are used
  },
  togglePassBtn: {
    padding: theme.spacing.sm,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xxxl,
  },
});
