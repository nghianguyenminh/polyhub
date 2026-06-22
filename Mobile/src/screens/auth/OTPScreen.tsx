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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { PolyCard } from '../../components/PolyCard';
import api from '../../services/api';

const Icon = Feather as any;

export const OTPScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleResetPassword = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/verify-otp', {
        email: email,
        otp: otp.trim(),
        newPassword: newPassword,
        confirmPassword: confirmPassword,
      });

      setSuccessMsg('Đổi mật khẩu thành công! Hãy đăng nhập lại.');
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate('Login');
      }, 1500);

    } catch (error: any) {
      console.error('OTP reset password failed:', error);
      setErrorMsg(error.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
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
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={theme.colors.textMain} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Icon name="shield" size={32} color={theme.colors.primary} />
            </View>
            <PolyText variant="h1" weight="bold" align="center" style={styles.title}>
              Xác thực OTP
            </PolyText>
            <View style={styles.badge}>
              <PolyText variant="small" weight="medium" color={theme.colors.primary}>
                Đã gửi đến {email}
              </PolyText>
            </View>
          </View>

          <PolyCard style={styles.card}>
            {errorMsg ? (
              <View style={[styles.banner, styles.errorBanner]}>
                <Icon name="alert-circle" size={18} color={theme.colors.danger} style={styles.bannerIcon} />
                <PolyText style={styles.bannerText} color={theme.colors.danger} variant="caption">
                  {errorMsg}
                </PolyText>
              </View>
            ) : null}

            {successMsg ? (
              <View style={[styles.banner, styles.successBanner]}>
                <Icon name="check-circle" size={18} color={theme.colors.success} style={styles.bannerIcon} />
                <PolyText style={styles.bannerText} color={theme.colors.success} variant="caption">
                  {successMsg}
                </PolyText>
              </View>
            ) : null}

            {/* OTP Input */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Mã xác minh OTP (6 số)
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="key" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="• • • • • •"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val.replace(/\D/g, ''));
                    setErrorMsg('');
                  }}
                />
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Mật khẩu mới
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới..."
                  placeholderTextColor={theme.colors.textLight}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    setErrorMsg('');
                  }}
                  autoCapitalize="none"
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

            {/* Confirm New Password */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Xác nhận mật khẩu mới
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="shield-lock" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                {/* Fallback to check-shield or shield if shield-lock is missing */}
                <Icon name="shield" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu mới..."
                  placeholderTextColor={theme.colors.textLight}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    setErrorMsg('');
                  }}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.togglePassBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={theme.colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <PolyButton
              title="Đặt lại mật khẩu"
              isLoading={isLoading}
              onPress={handleResetPassword}
              style={styles.submitBtn}
            />
          </PolyCard>
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
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 20,
    left: theme.spacing.xxl,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxxl,
    marginTop: 40,
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
    marginBottom: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.pill,
  },
  card: {
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  successBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  bannerIcon: {
    marginRight: theme.spacing.sm,
  },
  bannerText: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: theme.spacing.xl,
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
  },
  otpInput: {
    textAlign: 'center',
    fontSize: theme.typography.sizes.h2,
    fontFamily: theme.typography.fontFamily.bold,
    letterSpacing: 8,
  },
  togglePassBtn: {
    padding: theme.spacing.sm,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
});
