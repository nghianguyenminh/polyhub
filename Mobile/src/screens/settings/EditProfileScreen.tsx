import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();

  // Form State
  const [name, setName] = useState('Nguyễn Văn A');
  const [email, setEmail] = useState('nguyenvana@gmail.com');
  const [phone, setPhone] = useState('0987654321');
  const [bio, setBio] = useState('Student at FPT Polytechnic 🎓 | React Native Developer 💻');

  const handleSave = () => {
    // Logic lưu thông tin
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PolyHeader 
        title="Thông tin cá nhân" 
        showBack 
        onBackPress={() => navigation.goBack()} 
      />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Icon name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <PolyText color={theme.colors.textMuted} style={styles.avatarHint}>
            Chạm để thay đổi ảnh đại diện
          </PolyText>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <PolyText weight="semibold" style={styles.label}>Họ và Tên</PolyText>
            <View style={styles.inputContainer}>
              <Icon name="user" size={20} color={theme.colors.textLight} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập họ và tên"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <PolyText weight="semibold" style={styles.label}>Email</PolyText>
            <View style={styles.inputContainer}>
              <Icon name="mail" size={20} color={theme.colors.textLight} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Nhập địa chỉ email"
                keyboardType="email-address"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <PolyText weight="semibold" style={styles.label}>Số điện thoại</PolyText>
            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color={theme.colors.textLight} style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
                placeholderTextColor={theme.colors.textLight}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <PolyText weight="semibold" style={styles.label}>Tiểu sử (Bio)</PolyText>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput 
                style={styles.textArea}
                value={bio}
                onChangeText={setBio}
                placeholder="Giới thiệu bản thân..."
                multiline
                numberOfLines={3}
                placeholderTextColor={theme.colors.textLight}
                textAlignVertical="top"
              />
            </View>
          </View>

        </View>

      </ScrollView>

      <View style={styles.footer}>
        <PolyButton 
          title="Lưu thay đổi" 
          onPress={handleSave} 
          disabled={!name.trim() || !email.trim()}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.background,
  },
  avatarHint: {
    fontSize: 13,
  },
  formSection: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.soft,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textMain,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMain,
    height: '100%',
  },
  textAreaContainer: {
    height: 100,
    paddingVertical: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  textArea: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMain,
    height: '100%',
    width: '100%',
  },
  footer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: Platform.OS === 'ios' ? 34 : theme.spacing.lg,
  },
});
