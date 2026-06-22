import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import Feather from '@expo/vector-icons/Feather';
import api, { getApiBaseUrl } from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const Icon = Feather as any;

export const HomeScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Comment Modal States
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  const loadFeed = async (pageNumber = 0, refresh = false) => {
    if (pageNumber > 0 && !hasNext && !refresh) return;

    if (pageNumber === 0 && !refresh) {
      setIsLoading(true);
    } else if (pageNumber > 0) {
      setLoadingMore(true);
    }

    try {
      const response = await api.get(`/api/v2/posts/feed?page=${pageNumber}&size=10`);
      const data = response.data;
      
      const newPosts = data.posts || [];
      if (pageNumber === 0) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setPage(data.currentPage || 0);
      setHasNext(!!data.hasNext);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFeed(0, true);
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFeed(0, true);
  };

  const handleLoadMore = () => {
    if (hasNext && !loadingMore && !isLoading) {
      loadFeed(page + 1);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      // Optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            const isLiked = !p.isLiked;
            return {
              ...p,
              isLiked,
              likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
            };
          }
          return p;
        })
      );

      await api.post(`/api/v2/posts/${postId}/like`);
    } catch (error) {
      console.error('Failed to like post:', error);
      // Revert state if API fails
      loadFeed(0, true);
    }
  };

  const handleSave = async (postId: number) => {
    try {
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return { ...p, isSaved: !p.isSaved };
          }
          return p;
        })
      );
      await api.post(`/api/saved/posts/toggle?postId=${postId}`);
    } catch (error) {
      console.error('Failed to save post:', error);
    }
  };

  // Comments Actions
  const openComments = async (postId: number) => {
    setActivePostId(postId);
    setCommentModalVisible(true);
    setCommentsLoading(true);
    setComments([]);

    try {
      const response = await api.get(`/api/comments/${postId}`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || activePostId === null) return;

    const tempText = newCommentText;
    setNewCommentText('');

    try {
      const response = await api.post('/api/comments', {
        postId: activePostId,
        content: tempText.trim(),
      });

      setComments((prev) => [response.data, ...prev]);
      
      // Update comment count on home feed
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === activePostId) {
            return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
          }
          return p;
        })
      );
    } catch (error) {
      console.error('Failed to add comment:', error);
      Alert.alert('Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
    }
  };

  const getAvatarUri = (avatarName: string | undefined) => {
    if (!avatarName || avatarName === 'default.png') {
      return 'https://i.pravatar.cc/150?img=12'; // Fallback mockup avatar
    }
    if (avatarName.startsWith('http')) return avatarName;
    return `${getApiBaseUrl()}${avatarName}`;
  };

  const getPostImageUri = (imgUrl: string | undefined) => {
    if (!imgUrl) return null;
    if (imgUrl.startsWith('http')) return imgUrl;
    return `${getApiBaseUrl()}${imgUrl}`;
  };

  const renderPostItem = ({ item }: { item: any }) => {
    const postImageUri = getPostImageUri(item.imageUrl);
    const timeAgo = dayjs(item.createdAt).fromNow();

    return (
      <PolyCard noPadding style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <Image
            source={{ uri: getAvatarUri(item.user?.avatar) }}
            style={styles.avatar}
          />
          <View style={styles.postMeta}>
            <PolyText weight="bold">{item.user?.fullname || 'Ẩn danh'}</PolyText>
            <PolyText variant="caption" color={theme.colors.textMuted}>
              {timeAgo} • {item.isPrivate ? '🔒' : '🌍'}
            </PolyText>
          </View>
          <TouchableOpacity onPress={() => handleSave(item.id)}>
            <Icon
              name="bookmark"
              size={20}
              color={item.isSaved ? theme.colors.primary : theme.colors.textLight}
            />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <PolyText style={styles.postContentText}>{item.content}</PolyText>
        </View>

        {/* Post Image */}
        {postImageUri ? (
          <Image source={{ uri: postImageUri }} style={styles.postImage} />
        ) : null}

        {/* Interaction Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="thumbs-up" size={14} color={theme.colors.primary} />
            <PolyText variant="small" color={theme.colors.textMuted} style={styles.statText}>
              {item.likesCount || 0} lượt thích
            </PolyText>
          </View>
          <PolyText variant="small" color={theme.colors.textMuted}>
            {item.commentsCount || 0} bình luận
          </PolyText>
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <PolyButton
            variant="ghost"
            style={styles.actionBtn}
            icon={
              <Icon
                name="thumbs-up"
                size={18}
                color={item.isLiked ? theme.colors.primary : theme.colors.textMuted}
              />
            }
            title="Thích"
            onPress={() => handleLike(item.id)}
          />
          <PolyButton
            variant="ghost"
            style={styles.actionBtn}
            icon={<Icon name="message-square" size={18} color={theme.colors.textMuted} />}
            title="Bình luận"
            onPress={() => openComments(item.id)}
          />
          <PolyButton
            variant="ghost"
            style={styles.actionBtn}
            icon={<Icon name="share-2" size={18} color={theme.colors.textMuted} />}
            title="Chia sẻ"
            onPress={() => {
              Alert.alert('Chia sẻ', 'Tính năng chia sẻ bài viết đang được phát triển.');
            }}
          />
        </View>
      </PolyCard>
    );
  };

  return (
    <View style={styles.container}>
      <PolyHeader
        title="PolyHUB"
        rightComponent={
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconButtonCircle}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Icon name="bell" size={20} color={theme.colors.textMain} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButtonCircle, { marginLeft: 8 }]}
              onPress={() => navigation.navigate('ChatList')}
            >
              <Icon name="message-circle" size={20} color={theme.colors.textMain} />
            </TouchableOpacity>
          </View>
        }
      />

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPostItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <PolyCard style={styles.createPostCard}>
            <View style={styles.createPostRow}>
              <Image
                source={{ uri: getAvatarUri(user?.avatar) }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.inputSimulator}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('CreatePost')}
              >
                <PolyText color={theme.colors.textMuted}>Bạn đang nghĩ gì thế?</PolyText>
              </TouchableOpacity>
            </View>
            <View style={styles.createPostActions}>
              <PolyButton
                variant="ghost"
                title="Ảnh/Video"
                icon={<Icon name="image" size={18} color="#22c55e" />}
                style={styles.actionBtn}
                onPress={() => navigation.navigate('CreatePost')}
              />
              <PolyButton
                variant="ghost"
                title="Đăng bài"
                icon={<Icon name="plus" size={18} color={theme.colors.primary} />}
                style={styles.actionBtn}
                onPress={() => navigation.navigate('CreatePost')}
              />
            </View>
          </PolyCard>
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              style={{ marginTop: 40 }}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="smile" size={40} color={theme.colors.textLight} />
              <PolyText color={theme.colors.textMuted} style={{ marginTop: 8 }}>
                Chưa có bài viết nào trên bảng tin.
              </PolyText>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.primary}
              style={{ marginVertical: 16 }}
            />
          ) : null
        }
      />

      {/* Comment Bottom Sheet Modal */}
      <Modal
        visible={commentModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <PolyText variant="h3" weight="bold">Bình luận</PolyText>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Icon name="x" size={24} color={theme.colors.textMain} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            {commentsLoading ? (
              <ActivityIndicator
                size="large"
                color={theme.colors.primary}
                style={{ flex: 1 }}
              />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.commentsListContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <View style={styles.commentItem}>
                    <Image
                      source={{ uri: getAvatarUri(item.avatar) }}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentTextContainer}>
                      <View style={styles.commentBubble}>
                        <PolyText weight="bold" variant="caption">
                          {item.fullname}
                        </PolyText>
                        <PolyText style={styles.commentBody}>
                          {item.content}
                        </PolyText>
                      </View>
                      <PolyText variant="small" color={theme.colors.textLight} style={{ marginLeft: 8, marginTop: 2 }}>
                        {dayjs(item.createdAt).fromNow()}
                      </PolyText>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyComments}>
                    <PolyText color={theme.colors.textLight} align="center">
                      Chưa có bình luận nào. Hãy là người đầu tiên!
                    </PolyText>
                  </View>
                }
              />
            )}

            {/* Comment Input */}
            <View style={styles.commentInputRow}>
              <Image
                source={{ uri: getAvatarUri(user?.avatar) }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentInputWrapper}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Viết bình luận..."
                  placeholderTextColor={theme.colors.textLight}
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                  multiline
                />
                <TouchableOpacity
                  style={styles.sendCommentBtn}
                  onPress={handleAddComment}
                  disabled={!newCommentText.trim()}
                >
                  <Icon
                    name="send"
                    size={18}
                    color={newCommentText.trim() ? theme.colors.primary : theme.colors.textLight}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  createPostCard: {
    marginBottom: theme.spacing.xl,
  },
  createPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primarySoft,
  },
  inputSimulator: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  createPostActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    justifyContent: 'space-around',
  },
  actionBtn: {
    flex: 1,
  },
  postCard: {
    marginBottom: theme.spacing.xl,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  postMeta: {
    flex: 1,
  },
  postContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  postContentText: {
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: theme.spacing.xs,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    height: '75%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  commentsListContent: {
    padding: theme.spacing.lg,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: theme.spacing.md,
  },
  commentTextContainer: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  commentBody: {
    marginTop: 2,
    lineHeight: 18,
  },
  emptyComments: {
    paddingVertical: 40,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  commentInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: theme.spacing.md,
    minHeight: 36,
    maxHeight: 100,
  },
  commentInput: {
    flex: 1,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textMain,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendCommentBtn: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
});
