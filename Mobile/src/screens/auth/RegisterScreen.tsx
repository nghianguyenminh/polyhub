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

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState(''); // e.g. YYYY-MM-DD
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!fullname.trim() || !username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ các trường thông tin bắt buộc.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/auth/register', {
        fullname: fullname.trim(),
        username: username.trim().toUpperCase(), // Student ID is usually uppercase
        email: email.trim(),
        phone: phone.trim() || undefined,
        birthday: birthday.trim() || undefined,
        password,
        confirmPassword,
      });

      setSuccessMsg('Đăng ký tài khoản thành công!');
      setTimeout(() => {
        setIsLoading(false);
        navigation.navigate('Login');
      }, 1500);

    } catch (error: any) {
      console.error('Registration failed:', error);
      setErrorMsg(error.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại!');
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
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoBadge}>
              <Icon name="user-plus" size={32} color={theme.colors.primary} />
            </View>
            <PolyText variant="h1" weight="bold" align="center" style={styles.title}>
              Tạo tài khoản mới
            </PolyText>
            <PolyText color={theme.colors.textMuted} align="center" style={styles.subtitle}>
              Tham gia cộng đồng PolyHUB ngay hôm nay
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

            {/* Fullname */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Họ và tên *
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="edit-2" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor={theme.colors.textLight}
                  value={fullname}
                  onChangeText={(val) => {
                    setFullname(val);
                    setErrorMsg('');
                  }}
                />
              </View>
            </View>

            {/* Student ID */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Mã sinh viên *
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="card" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                {/* Fallback to credit-card icon if 'card' isn't in Feather */}
                <Icon name="credit-card" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="VD: PS12345"
                  placeholderTextColor={theme.colors.textLight}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    setErrorMsg('');
                  }}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Địa chỉ Email *
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="mail" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="VD: email@fpt.edu.vn"
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
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Số điện thoại
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="VD: 0912345678"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Birthday */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Ngày sinh
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="calendar" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="VD: YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textLight}
                  value={birthday}
                  onChangeText={setBirthday}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Mật khẩu *
              </PolyText>
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <PolyText variant="caption" weight="medium" style={styles.inputLabel}>
                Xác nhận mật khẩu *
              </PolyText>
              <View style={styles.inputWrapper}>
                <Icon name="shield" size={18} color={theme.colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
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
              title="Đăng ký tài khoản"
              isLoading={isLoading}
              onPress={handleRegister}
              style={styles.submitBtn}
            />
          </PolyCard>

          {/* Footer */}
          <View style={styles.footer}>
            <PolyText color={theme.colors.textMuted} variant="caption">
              Đã có tài khoản?{' '}
            </PolyText>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <PolyText variant="caption" weight="semibold" color={theme.colors.primary}>
                Đăng nhập
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
    marginBottom: theme.spacing.xxl,
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
