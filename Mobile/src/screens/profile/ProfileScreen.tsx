import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api, { getApiBaseUrl } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { useAppTheme } from '../../store/themeStore';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const ProfileScreen = () => {
  const { theme, styles } = useAppTheme(createStyles);
  const navigation = useNavigation<any>();
  const { user, updateUser } = useAuthStore();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const response = await api.get(`/api/users/${user.username}`);
      setProfileData(response.data);
      
      const postsResponse = await api.get(`/api/v2/posts/user/${user.username}`);
      setUserPosts(postsResponse.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const getImageUrl = (imgName: string | undefined, type: 'avatar' | 'cover' = 'avatar') => {
    if (!imgName || imgName === 'default.png') {
      return type === 'avatar' 
        ? 'https://i.pravatar.cc/150?img=12' 
        : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000';
    }
    if (imgName.startsWith('http')) return imgName;
    return `${getApiBaseUrl()}${imgName}`;
  };

  const handleSelectImage = async (type: 'avatar' | 'cover') => {
    if (!user) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'avatar' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (result.canceled) return;
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const formData = new FormData();
        const uriParts = asset.uri.split('/');
        const fileName = asset.fileName || uriParts[uriParts.length - 1] || 'image.jpg';

        formData.append(type, {
          uri: asset.uri,
          name: fileName,
          type: asset.mimeType || 'image/jpeg',
        } as any);

        if (type === 'avatar') setIsUploadingAvatar(true);
        else setIsUploadingCover(true);

        const response = await api.put(`/api/users/${user.username}/${type}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (response.data) {
          if (type === 'avatar') await updateUser({ avatar: response.data.avatar });
          if (type === 'cover') await updateUser({ coverImage: response.data.coverImage });
          Alert.alert('Thành công', `Cập nhật ảnh ${type === 'avatar' ? 'đại diện' : 'bìa'} thành công!`);
        }
      }
    } catch (error: any) {
      console.error('Lỗi cập nhật ảnh:', error);
      Alert.alert('Lỗi', `Không thể cập nhật ảnh ${type === 'avatar' ? 'đại diện' : 'bìa'}`);
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  return (
    <View style={styles.container}>
      <PolyHeader 
        title="Trang cá nhân" 
        showBack 
        onBackPress={() => navigation.goBack()} 
        rightComponent={
          <TouchableOpacity 
            style={styles.iconButtonCircle}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={20} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => handleSelectImage('cover')} disabled={isUploadingCover}>
            <Image 
              source={{ uri: getImageUrl(user?.coverImage, 'cover') }} 
              style={styles.coverPhoto} 
            />
            {isUploadingCover && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}
            {!isUploadingCover && (
              <View style={styles.editCoverBtn}>
                <Icon name="camera" size={18} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={() => handleSelectImage('avatar')} disabled={isUploadingAvatar}>
            <Image 
              source={{ uri: getImageUrl(user?.avatar, 'avatar') }} 
              style={styles.avatar} 
            />
            {isUploadingAvatar && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 50, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}
            {!isUploadingAvatar && (
              <View style={styles.editAvatarBtn}>
                <Icon name="camera" size={16} color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          <PolyText variant="h2" weight="bold" style={styles.name}>{user?.fullname || 'Chưa cập nhật'}</PolyText>
          <PolyText color={theme.colors.textMuted} style={styles.bio}>
            {user?.bio || 'Chưa có tiểu sử'}
          </PolyText>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <PolyText weight="bold">{profileData?.followersCount || 0}</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>Người theo dõi</PolyText>
            </View>
            <View style={styles.statItem}>
              <PolyText weight="bold">{profileData?.followingCount || 0}</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>Đang theo dõi</PolyText>
            </View>
            <View style={styles.statItem}>
              <PolyText weight="bold">{profileData?.postsCount || 0}</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>Bài viết</PolyText>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <PolyButton title="Chỉnh sửa trang" style={{ flex: 1, marginRight: 8 }} onPress={() => navigation.navigate('EditProfile')} />
            <PolyButton title="Chia sẻ" variant="outline" style={{ flex: 1 }} onPress={() => Alert.alert('Thông báo', 'Tính năng đang phát triển')} />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info Highlights */}
        <View style={styles.detailsContainer}>
          <PolyText variant="h3" weight="bold" style={styles.sectionTitle}>Giới thiệu</PolyText>
          {user?.major && (
            <View style={styles.detailRow}>
              <Icon name="book" size={20} color={theme.colors.textLight} />
              <PolyText style={styles.detailText}>Chuyên ngành <PolyText weight="bold">{user.major}</PolyText></PolyText>
            </View>
          )}
          {user?.phone && (
            <View style={styles.detailRow}>
              <Icon name="phone" size={20} color={theme.colors.textLight} />
              <PolyText style={styles.detailText}>{user.phone}</PolyText>
            </View>
          )}
          <View style={styles.detailRow}>
            <Icon name="mail" size={20} color={theme.colors.textLight} />
            <PolyText style={styles.detailText}>{user?.email}</PolyText>
          </View>
        </View>

        {/* Feed Posts */}
        <View style={styles.feedContainer}>
           <PolyText variant="h3" weight="bold" style={styles.sectionTitle}>Bài viết của bạn</PolyText>
           {userPosts.map(post => (
             <PolyCard noPadding key={post.id} style={{ marginBottom: 16 }}>
              <View style={styles.postHeader}>
                <Image 
                  source={{ uri: getImageUrl(post.user?.avatar, 'avatar') }} 
                  style={styles.postAvatar} 
                />
                <View style={styles.postMeta}>
                  <PolyText weight="bold">{post.user?.fullname}</PolyText>
                  <PolyText variant="caption" color={theme.colors.textMuted}>
                    {new Date(post.createdAt).toLocaleDateString('vi-VN')} • {post.isPrivate ? '🔒' : '🌍'}
                  </PolyText>
                </View>
                <Icon name="more-horizontal" size={20} color={theme.colors.textMuted} />
              </View>

              <View style={styles.postContent}>
                <PolyText>{post.content}</PolyText>
                {post.imageUrl && (
                  <Image source={{ uri: getImageUrl(post.imageUrl, 'cover') }} style={{ width: '100%', height: 200, marginTop: 8, borderRadius: 8 }} />
                )}
              </View>

              <View style={styles.postActions}>
                <PolyButton 
                  variant="ghost" 
                  icon={<Icon name="thumbs-up" size={20} color={post.isLiked ? theme.colors.primary : theme.colors.textMuted} />} 
                  title={post.likesCount > 0 ? `${post.likesCount} Thích` : 'Thích'}
                />
                <PolyButton 
                  variant="ghost" 
                  icon={<Icon name="message-square" size={20} color={theme.colors.textMuted} />} 
                  title={post.commentsCount > 0 ? `${post.commentsCount} Bình luận` : 'Bình luận'}
                />
              </View>
            </PolyCard>
           ))}
           {userPosts.length === 0 && (
             <PolyText style={{ textAlign: 'center', marginVertical: 20 }} color={theme.colors.textMuted}>
               Chưa có bài viết nào
             </PolyText>
           )}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  iconButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoContainer: {
    position: 'relative',
    height: 200,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editCoverBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  profileInfoContainer: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginTop: -60,
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.card,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: theme.colors.textMain,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  name: {
    marginBottom: 4,
  },
  bio: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  divider: {
    height: 8,
    backgroundColor: theme.colors.border,
  },
  detailsContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailText: {
    marginLeft: theme.spacing.md,
  },
  feedContainer: {
    padding: theme.spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  postMeta: {
    flex: 1,
  },
  postContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
