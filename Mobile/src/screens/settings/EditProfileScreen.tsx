import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api, { getApiBaseUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const EditProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [name, setName] = useState(user?.fullname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  const getAvatarUri = (avatarName: string | undefined) => {
    if (!avatarName || avatarName === 'default.png') {
      return 'https://i.pravatar.cc/150?img=12'; // Fallback
    }
    if (avatarName.startsWith('http')) return avatarName;
    return `${getApiBaseUrl()}${avatarName}`;
  };

  const handleSelectAvatar = async () => {
    if (!user) return;
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return;
      
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        setIsUploading(true);
        const formData = new FormData();
        
        const uriParts = asset.uri.split('/');
        const fileName = asset.fileName || uriParts[uriParts.length - 1] || 'avatar.jpg';

        formData.append('avatar', {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || 'image/jpeg',
        } as any);

        const response = await api.put(`/api/users/${user.username}/avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data && response.data.avatar) {
          await updateUser({ avatar: response.data.avatar });
          Alert.alert('Thành công', 'Cập nhật ảnh đại diện thành công!');
        }
      }
    } catch (error: any) {
      console.error('Lỗi cập nhật avatar:', error);
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật ảnh đại diện');
    } finally {
      setIsUploading(false);
    }
  };

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
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleSelectAvatar} disabled={isUploading}>
            <Image 
              source={{ uri: getAvatarUri(user?.avatar) }} 
              style={styles.avatar} 
            />
            {isUploading && (
              <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
                <ActivityIndicator color="#FFF" size="large" />
              </View>
            )}
            {!isUploading && (
              <View style={styles.editAvatarBtn}>
                <Icon name="camera" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
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
  loadingOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
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
