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
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 10 }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        console.error(response.errorMessage);
        return;
      }
      if (response.assets && response.assets.length > 0) {
        const uris = response.assets.map(asset => asset.uri).filter(Boolean) as string[];
        const files = response.assets.map(asset => ({
          uri: Platform.OS === 'android' ? asset.uri : asset.uri?.replace('file://', ''),
          name: asset.fileName || `post-image-${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        
        setImageUris(prev => [...prev, ...uris].slice(0, 10));
        setImageFiles(prev => [...prev, ...files].slice(0, 10));
      }
    });
  };

  const handlePost = async () => {
    if (!content.trim() && imageUris.length === 0) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('isPrivate', 'false'); // Mặc định là công khai
      
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(file => {
          formData.append('images', file as any);
        });
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

  const handleImproveText = async () => {
    if (!content.trim()) return;
    setIsAiLoading(true);
    try {
      const response = await api.post('/api/ai/improve-text', { text: content });
      if (response.data) {
        setContent(response.data);
      }
    } catch (error: any) {
      console.error('AI improvement failed:', error);
      Alert.alert('Lỗi', 'Không thể cải thiện văn bản lúc này.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSuggestCaption = async () => {
    if (imageFiles.length === 0) return;
    setIsAiLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFiles[0] as any);
      const response = await api.post('/api/ai/suggest-caption', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data) {
        setContent(response.data);
      }
    } catch (error: any) {
      console.error('AI caption suggestion failed:', error);
      Alert.alert('Lỗi', 'Không thể tạo gợi ý từ ảnh lúc này.');
    } finally {
      setIsAiLoading(false);
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
          disabled={(!content.trim() && imageUris.length === 0) || isSubmitting} 
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

        {/* AI Auxiliary Buttons */}
        <View style={styles.aiButtonsContainer}>
          <TouchableOpacity 
            style={[styles.aiButton, (!content.trim() || isAiLoading) && styles.aiButtonDisabled]} 
            onPress={handleImproveText}
            disabled={!content.trim() || isAiLoading}
          >
            <Icon name="zap" size={16} color={(!content.trim() || isAiLoading) ? theme.colors.textMuted : theme.colors.primary} />
            <PolyText 
              variant="small" 
              weight="medium"
              color={(!content.trim() || isAiLoading) ? theme.colors.textMuted : theme.colors.primary}
              style={{ marginLeft: 6 }}
            >
              {isAiLoading ? 'AI đang xử lý...' : 'Cải thiện văn bản'}
            </PolyText>
          </TouchableOpacity>

          {imageUris.length > 0 && (
            <TouchableOpacity 
              style={[styles.aiButton, isAiLoading && styles.aiButtonDisabled, { marginLeft: 10 }]} 
              onPress={handleSuggestCaption}
              disabled={isAiLoading}
            >
              <Icon name="star" size={16} color={isAiLoading ? theme.colors.textMuted : '#22c55e'} />
              <PolyText 
                variant="small" 
                weight="medium"
                color={isAiLoading ? theme.colors.textMuted : '#22c55e'}
                style={{ marginLeft: 6 }}
              >
                Gợi ý caption
              </PolyText>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Image Preview */}
        {imageUris.length > 0 ? (
          <View style={styles.imagePreviewWrapper}>
            <View style={styles.imagePreviewGrid}>
              {imageUris.map((uri, index) => (
                <View key={index} style={[
                  styles.imagePreviewContainer,
                  imageUris.length === 1 ? styles.fullWidthImage : styles.gridImage
                ]}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity 
                    style={styles.removeImageBtn}
                    onPress={() => {
                      setImageUris(prev => prev.filter((_, i) => i !== index));
                      setImageFiles(prev => prev.filter((_, i) => i !== index));
                    }}
                  >
                    <Icon name="x" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <PolyText variant="small" color={theme.colors.textMuted} style={{ marginTop: 8 }}>
              {imageUris.length}/10 ảnh
            </PolyText>
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
  aiButtonsContainer: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  aiButtonDisabled: {
    opacity: 0.6,
    backgroundColor: theme.colors.background,
  },
  imagePreviewWrapper: {
    marginTop: theme.spacing.xl,
  },
  imagePreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    padding: 4,
  },
  fullWidthImage: {
    width: '100%',
    aspectRatio: 1,
  },
  gridImage: {
    width: '33.33%',
    aspectRatio: 1,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: theme.borderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
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
