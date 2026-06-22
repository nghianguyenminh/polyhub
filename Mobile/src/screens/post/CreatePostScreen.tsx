import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { launchImageLibrary } from 'react-native-image-picker';
import api, { getApiBaseUrl } from '../../services/api';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const CreatePostScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        console.error(response.errorMessage);
        return;
      }
      const asset = response.assets?.[0];
      if (asset && asset.uri) {
        setImageUri(asset.uri);
        setImageFile({
          uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
          name: asset.fileName || 'post-image.jpg',
          type: asset.type || 'image/jpeg',
        });
      }
    });
  };

  const handlePost = async () => {
    if (!content.trim() && !imageUri) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('isPrivate', 'false'); // Mặc định là công khai
      if (imageFile) {
        formData.append('file', imageFile as any);
      }

      await api.post('/api/v2/posts/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to create post:', error);
      Alert.alert('Lỗi', error.message || 'Không thể đăng bài viết. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvatarUri = (avatarName: string | undefined) => {
    if (!avatarName || avatarName === 'default.png') {
      return 'https://i.pravatar.cc/150?img=12'; // Fallback
    }
    if (avatarName.startsWith('http')) return avatarName;
    return `${getApiBaseUrl()}${avatarName}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Modal */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="x" size={24} color={theme.colors.textMain} />
        </TouchableOpacity>
        <PolyText variant="h3" weight="bold">Tạo bài viết</PolyText>
        <PolyButton 
          title="Đăng" 
          disabled={(!content.trim() && !imageUri) || isSubmitting} 
          isLoading={isSubmitting}
          onPress={handlePost}
          style={styles.postBtn}
        />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: getAvatarUri(user?.avatar) }} 
            style={styles.avatar} 
          />
          <View>
            <PolyText weight="bold">{user?.fullname || 'Ẩn danh'}</PolyText>
            <View style={styles.privacyBadge}>
              <Icon name="globe" size={12} color={theme.colors.textMuted} />
              <PolyText variant="small" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                Công khai
              </PolyText>
            </View>
          </View>
        </View>

        {/* Input Area */}
        <TextInput
          style={styles.input}
          placeholder="Bạn đang nghĩ gì thế?"
          placeholderTextColor={theme.colors.textLight}
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
        />

        {/* Selected Image Preview */}
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageBtn}
              onPress={() => {
                setImageUri(null);
                setImageFile(null);
              }}
            >
              <Icon name="x" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <PolyText color={theme.colors.textMuted} style={styles.addToPostText}>
          Thêm vào bài viết
        </PolyText>
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.actionIconBtn} onPress={selectImage}>
            <Icon name="image" size={24} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIconBtn}
            onPress={() => Alert.alert('Gắn thẻ', 'Tính năng gắn thẻ bạn bè đang được phát triển.')}
          >
            <Icon name="user-plus" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIconBtn}
            onPress={() => Alert.alert('Cảm xúc', 'Tính năng cảm xúc đang được phát triển.')}
          >
            <Icon name="smile" size={24} color="#f59e0b" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeBtn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.iconBackground,
    borderRadius: 20,
  },
  postBtn: {
    height: 36,
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: theme.spacing.md,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  input: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMain,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToPostText: {
    fontFamily: theme.typography.fontFamily.medium,
  },
  actionIcons: {
    flexDirection: 'row',
  },
  actionIconBtn: {
    marginLeft: theme.spacing.lg,
  },
});
