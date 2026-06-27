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
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { PolyCard } from '../../components/PolyCard';
import api from '../../services/api';

const Icon = Feather as any;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSendOTP = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ email.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/forgot-password', {
        email: email.trim(),
      });

      setSuccessMsg('Đã gửi mã xác nhận OTP qua email của bạn.');
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate('OTP', { email: email.trim() });
      }, 1500);

    } catch (error: any) {
      console.error('Forgot password request failed:', error);
      setErrorMsg(error.message || 'Gửi yêu cầu thất bại. Vui lòng kiểm tra lại!');
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
              <Icon name="key" size={32} color={theme.colors.primary} />
            </View>
            <PolyText variant="h1" weight="bold" align="center" style={styles.title}>
              Quên mật khẩu?
            </PolyText>
            <PolyText color={theme.colors.textMuted} align="center" style={styles.subtitle}>
              Nhập email đăng ký của bạn để khôi phục mật khẩu tài khoản
            </PolyText>
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

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Email đăng nhập
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập email của bạn..."
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="email-address"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setErrorMsg('');
                  }}
                  autoCapitalize="none"
                />
              </View>
              <PolyText variant="small" color={theme.colors.textMuted} style={styles.hintText}>
                Hệ thống sẽ gửi một mã OTP gồm 6 chữ số đến email này để xác thực.
              </PolyText>
            </View>

            {/* Submit */}
            <PolyButton
              title="Gửi mã xác nhận"
              isLoading={isLoading}
              onPress={handleSendOTP}
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
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    paddingHorizontal: theme.spacing.xl,
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
  hintText: {
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: theme.spacing.md,
  },
});
