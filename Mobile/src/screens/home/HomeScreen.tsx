import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Dimensions,
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
  
  // Comment Interaction States
  const [replyingTo, setReplyingTo] = useState<{ id: number, fullname: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentLoading, setEditCommentLoading] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerUrls, setImageViewerUrls] = useState<string[]>([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  // Share States
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [activeSharePostId, setActiveSharePostId] = useState<number | null>(null);
  const [shareCaption, setShareCaption] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  // Edit Post States
  const [editPostModalVisible, setEditPostModalVisible] = useState(false);
  const [editPostId, setEditPostId] = useState<number | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [isEditingPost, setIsEditingPost] = useState(false);

  // Chatbot States
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Chào bạn! Mình là PolyHUB Copilot. Mình có thể giúp gì cho bạn hôm nay?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatFlatListRef = useRef<FlatList>(null);

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
    setReplyingTo(null);
    setEditingCommentId(null);
    setNewCommentText('');

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
    if (activePostId === null) return;
    
    if (editingCommentId) {
       // Handle Edit
       if (!editCommentText.trim() || editCommentLoading) return;
       setEditCommentLoading(true);
       try {
         const response = await api.put(`/api/comments/${editingCommentId}`, {
           content: editCommentText.trim()
         });
         
         setComments(prev => prev.map(c => {
           if (c.id === editingCommentId) return { ...c, ...response.data };
           if (c.replies && c.replies.some((r: any) => r.id === editingCommentId)) {
             return { ...c, replies: c.replies.map((r: any) => r.id === editingCommentId ? { ...r, ...response.data } : r) };
           }
           return c;
         }));
         setEditingCommentId(null);
         setEditCommentText('');
         setNewCommentText('');
       } catch (error) {
         console.error('Failed to edit comment:', error);
         Alert.alert('Lỗi', 'Không thể sửa bình luận.');
       } finally {
         setEditCommentLoading(false);
       }
       return;
    }

    if (!newCommentText.trim()) return;

    const tempText = newCommentText;
    setNewCommentText('');

    try {
      const payload: any = {
        postId: activePostId,
        content: tempText.trim(),
      };
      if (replyingTo) {
        payload.parentId = replyingTo.id;
      }

      const response = await api.post('/api/comments', payload);

      if (replyingTo) {
        setComments((prev) => prev.map(c => {
          if (c.id === replyingTo.id) {
            return { ...c, replies: [...(c.replies || []), response.data] };
          }
          return c;
        }));
      } else {
        setComments((prev) => [response.data, ...prev]);
      }
      
      setReplyingTo(null);
      
      // Update comment count on home feed only if it's a root comment, or if backend increments it for replies too.
      // Usually replies also increment the count.
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

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa bình luận này?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/comments/${commentId}`);
            setComments(prev => {
              const newComments = prev.filter(c => c.id !== commentId);
              return newComments.map(c => {
                if (c.replies && c.replies.some((r: any) => r.id === commentId)) {
                  return { ...c, replies: c.replies.filter((r: any) => r.id !== commentId) };
                }
                return c;
              });
            });
            // Decrement post comment count
            setPosts((prevPosts) =>
              prevPosts.map((p) => {
                if (p.id === activePostId) {
                  return { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) };
                }
                return p;
              })
            );
          } catch (error) {
             console.error('Failed to delete comment:', error);
             Alert.alert('Lỗi', 'Xóa bình luận thất bại.');
          }
        }
      }
    ]);
  };

  const handleCommentLongPress = (item: any) => {
    if (item.username !== user?.username) return; // Only owner can edit/delete
    Alert.alert('Tùy chọn', 'Bạn muốn làm gì với bình luận này?', [
      { 
        text: 'Chỉnh sửa', 
        onPress: () => {
          setEditingCommentId(item.id);
          setEditCommentText(item.content);
          setNewCommentText(item.content);
          setReplyingTo(null);
          setTimeout(() => commentInputRef.current?.focus(), 100);
        } 
      },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: () => handleDeleteComment(item.id) 
      },
      { text: 'Hủy', style: 'cancel' }
    ]);
  };

  const handleShare = async () => {
    if (!activeSharePostId || isSharing) return;
    setIsSharing(true);
    try {
      await api.post(`/api/v2/posts/${activeSharePostId}/share`, { content: shareCaption.trim() });
      
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === activeSharePostId) {
            return { ...p, sharesCount: (p.sharesCount || 0) + 1 };
          }
          return p;
        })
      );
      
      setShareModalVisible(false);
      setShareCaption('');
      loadFeed(0, true);
    } catch (error) {
      console.error('Failed to share post:', error);
      Alert.alert('Lỗi', 'Không thể chia sẻ bài viết. Vui lòng thử lại.');
    } finally {
      setIsSharing(false);
    }
  };

  const handlePostLongPress = (item: any) => {
    if (item.user?.username !== user?.username) return; // Only owner
    Alert.alert('Tùy chọn bài viết', 'Bạn muốn làm gì với bài viết này?', [
      { 
        text: 'Chỉnh sửa', 
        onPress: () => {
          setEditPostId(item.id);
          setEditPostContent(item.content || '');
          setEditPostModalVisible(true);
        } 
      },
      { 
        text: 'Xóa', 
        style: 'destructive', 
        onPress: () => handleDeletePost(item.id) 
      },
      { text: 'Hủy', style: 'cancel' }
    ]);
  };

  const handleDeletePost = (postId: number) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bài viết này không?', [
      { text: 'Hủy', style: 'cancel' },
      { 
        text: 'Xóa', 
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/v2/posts/${postId}`);
            setPosts(prev => prev.filter(p => p.id !== postId));
          } catch (error) {
            console.error('Failed to delete post:', error);
            Alert.alert('Lỗi', 'Không thể xóa bài viết. Vui lòng thử lại.');
          }
        }
      }
    ]);
  };

  const submitEditPost = async () => {
    if (!editPostId || isEditingPost) return;
    setIsEditingPost(true);
    try {
      await api.put(`/api/v2/posts/${editPostId}`, { content: editPostContent.trim() });
      
      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === editPostId) {
            return { ...p, content: editPostContent.trim() };
          }
          return p;
        })
      );
      
      setEditPostModalVisible(false);
      setEditPostId(null);
      setEditPostContent('');
    } catch (error) {
      console.error('Failed to update post:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật bài viết. Vui lòng thử lại.');
    } finally {
      setIsEditingPost(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsChatLoading(true);
    
    // Auto scroll down
    setTimeout(() => chatFlatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await api.post('/api/chatbot', { message: userText });
      setChatMessages(prev => [...prev, { role: 'ai', text: response.data.reply || response.data }]);
    } catch (error: any) {
      setChatMessages(prev => [...prev, { role: 'ai', text: 'Xin lỗi bạn, hệ thống AI đang gặp sự cố: ' + (error.message || 'Lỗi không xác định') }]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => chatFlatListRef.current?.scrollToEnd({ animated: true }), 100);
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
    
    const getFullUrl = (url: string) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${getApiBaseUrl()}${url}`;
    };

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={() => handleSave(item.id)} style={{ padding: 4 }}>
              <Icon
                name="bookmark"
                size={20}
                color={item.isSaved ? theme.colors.primary : theme.colors.textLight}
              />
            </TouchableOpacity>
            {item.user?.username === user?.username && (
              <TouchableOpacity onPress={() => handlePostLongPress(item)} style={{ padding: 4, marginLeft: 8 }}>
                <Icon name="more-horizontal" size={20} color={theme.colors.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <PolyText style={styles.postContentText}>{item.content}</PolyText>
        </View>

        {/* Post Images Gallery */}
        {(() => {
          const urls = (item.imageUrls && item.imageUrls.length > 0)
            ? item.imageUrls
            : (item.imageUrl ? [item.imageUrl] : []);
          
          if (urls.length === 0) return null;
          
          const handleImagePress = (index: number) => {
            const fullUrls = urls.map(getFullUrl);
            setImageViewerUrls(fullUrls);
            setInitialImageIndex(index);
            setImageViewerVisible(true);
          };

          if (urls.length === 1) {
            return (
              <TouchableOpacity activeOpacity={0.9} onPress={() => handleImagePress(0)}>
                <Image source={{ uri: getFullUrl(urls[0]) }} style={styles.postImage} />
              </TouchableOpacity>
            );
          }

          const remaining = urls.length - 2;
          return (
            <View style={styles.imageGrid}>
              {urls.slice(0, 2).map((url: string, i: number) => (
                <TouchableOpacity key={i} style={styles.gridImageContainer} activeOpacity={0.9} onPress={() => handleImagePress(i)}>
                  <Image source={{ uri: getFullUrl(url) }} style={styles.gridImage} />
                  {i === 1 && remaining > 0 && (
                    <View style={styles.imageOverlay}>
                      <PolyText style={styles.overlayText}>+{remaining}</PolyText>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })()}

        {/* Nested Shared Post */}
        {item.sharedPost && (
          <View style={styles.sharedPostContainer}>
            <View style={styles.sharedPostHeader}>
              <Image source={{ uri: getAvatarUri(item.sharedPost.user?.avatar) }} style={styles.sharedPostAvatar} />
              <View>
                <PolyText weight="bold" variant="small">{item.sharedPost.user?.fullname}</PolyText>
                <PolyText variant="small" color={theme.colors.textMuted}>
                  {dayjs(item.sharedPost.createdAt).fromNow()}
                </PolyText>
              </View>
            </View>
            <View style={styles.sharedPostContent}>
              <PolyText style={styles.postContentText}>{item.sharedPost.content}</PolyText>
            </View>
            {/* Render images for shared post if any */}
            {(() => {
              const sharedUrls = (item.sharedPost.imageUrls && item.sharedPost.imageUrls.length > 0)
                ? item.sharedPost.imageUrls
                : (item.sharedPost.imageUrl ? [item.sharedPost.imageUrl] : []);
              if (sharedUrls.length === 0) return null;
              return (
                 <View style={styles.sharedPostImageGrid}>
                   <Image source={{ uri: getFullUrl(sharedUrls[0]) }} style={styles.sharedPostImage} />
                 </View>
              );
            })()}
          </View>
        )}

        {/* Interaction Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="thumbs-up" size={14} color={theme.colors.primary} />
            <PolyText variant="small" color={theme.colors.textMuted} style={styles.statText}>
              {item.likesCount || 0} lượt thích
            </PolyText>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <PolyText variant="small" color={theme.colors.textMuted}>
              {item.commentsCount || 0} bình luận
            </PolyText>
            {(item.sharesCount > 0) && (
              <PolyText variant="small" color={theme.colors.textMuted}>
                {item.sharesCount} chia sẻ
              </PolyText>
            )}
          </View>
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
              setActiveSharePostId(item.id);
              setShareCaption('');
              setShareModalVisible(true);
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
        leftComponent={
          <TouchableOpacity
            style={styles.menuIconButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="menu" size={24} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
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
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => navigation.navigate('Profile')}
            >
              <Image
                source={{ uri: getAvatarUri(user?.avatar) }}
                style={styles.headerAvatar}
              />
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
                renderItem={({ item }) => {
                  const renderComment = (commentItem: any, isReply = false) => (
                    <TouchableOpacity 
                      style={[styles.commentItem, isReply && { marginLeft: 36, marginTop: 12, marginBottom: 0 }]} 
                      onLongPress={() => handleCommentLongPress(commentItem)}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: getAvatarUri(commentItem.avatar) }}
                        style={[styles.commentAvatar, isReply && { width: 24, height: 24, borderRadius: 12 }]}
                      />
                      <View style={styles.commentTextContainer}>
                        <View style={[styles.commentBubble, isReply && { backgroundColor: theme.colors.card, borderWidth: 1, borderColor: theme.colors.border }]}>
                          <PolyText weight="bold" variant="caption">
                            {commentItem.fullname}
                          </PolyText>
                          <PolyText style={styles.commentBody}>
                            {commentItem.content}
                          </PolyText>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginTop: 4 }}>
                          <PolyText variant="small" color={theme.colors.textLight}>
                            {dayjs(commentItem.createdAt).fromNow()}
                          </PolyText>
                          {!isReply && (
                            <TouchableOpacity onPress={() => { setReplyingTo({ id: commentItem.id, fullname: commentItem.fullname }); setEditingCommentId(null); setNewCommentText(''); setTimeout(() => commentInputRef.current?.focus(), 100); }}>
                              <PolyText variant="small" weight="bold" color={theme.colors.textMuted} style={{ marginLeft: 16 }}>Phản hồi</PolyText>
                            </TouchableOpacity>
                          )}
                        </View>
                        {/* Render replies if any */}
                        {!isReply && commentItem.replies && commentItem.replies.length > 0 && (
                          <View style={{ marginTop: 4, paddingBottom: 8 }}>
                            {commentItem.replies.map((reply: any) => (
                              <React.Fragment key={reply.id}>
                                {renderComment(reply, true)}
                              </React.Fragment>
                            ))}
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                  return renderComment(item);
                }}
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
            <View style={{ backgroundColor: theme.colors.card }}>
              {(replyingTo || editingCommentId) && (
                <View style={styles.replyStatusRow}>
                  <PolyText variant="small" color={theme.colors.textMuted}>
                    {editingCommentId ? 'Đang chỉnh sửa bình luận' : `Đang trả lời ${replyingTo?.fullname}`}
                  </PolyText>
                  <TouchableOpacity onPress={() => { setReplyingTo(null); setEditingCommentId(null); setNewCommentText(''); }}>
                    <Icon name="x" size={16} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}
              <View style={styles.commentInputRow}>
                <Image
                  source={{ uri: getAvatarUri(user?.avatar) }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    ref={commentInputRef}
                    style={styles.commentInput}
                    placeholder="Viết bình luận..."
                    placeholderTextColor={theme.colors.textLight}
                    value={newCommentText}
                    onChangeText={(text) => {
                      setNewCommentText(text);
                      if (editingCommentId) setEditCommentText(text);
                    }}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.sendCommentBtn}
                    onPress={handleAddComment}
                    disabled={!newCommentText.trim() || editCommentLoading}
                  >
                    {editCommentLoading ? (
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                    ) : (
                      <Icon
                        name="send"
                        size={18}
                        color={newCommentText.trim() ? theme.colors.primary : theme.colors.textLight}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={editPostModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditPostModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { height: 'auto', minHeight: 250 }]}>
            <View style={styles.modalHeader}>
              <PolyText variant="h3" weight="bold">Chỉnh sửa bài viết</PolyText>
              <TouchableOpacity onPress={() => setEditPostModalVisible(false)}>
                <Icon name="x" size={24} color={theme.colors.textMain} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: theme.spacing.lg }}>
              <TextInput
                style={[styles.commentInput, { minHeight: 120, backgroundColor: theme.colors.background, padding: 12, borderRadius: 8, textAlignVertical: 'top' }]}
                placeholder="Nhập nội dung bài viết..."
                placeholderTextColor={theme.colors.textLight}
                value={editPostContent}
                onChangeText={setEditPostContent}
                multiline
                autoFocus
              />
              <PolyButton
                title="Cập nhật"
                onPress={submitEditPost}
                isLoading={isEditingPost}
                disabled={isEditingPost || !editPostContent.trim()}
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.imageViewerCloseBtn} 
            onPress={() => setImageViewerVisible(false)}
          >
            <Icon name="x" size={28} color="#FFF" />
          </TouchableOpacity>
          <FlatList
            data={imageViewerUrls}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialImageIndex}
            getItemLayout={(data, index) => (
              { length: Dimensions.get('window').width, offset: Dimensions.get('window').width * index, index }
            )}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 500));
              wait.then(() => {
                // @ts-ignore - flatListRef could be used here but keeping it simple
              });
            }}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item, index }) => (
              <View style={{ width: Dimensions.get('window').width, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                <Image source={{ uri: item }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                {imageViewerUrls.length > 1 && (
                  <View style={styles.imageViewerCounter}>
                    <PolyText variant="small" weight="bold" color="#FFF">
                      {index + 1} / {imageViewerUrls.length}
                    </PolyText>
                  </View>
                )}
              </View>
            )}
          />
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { height: 'auto', minHeight: 250 }]}>
            <View style={styles.modalHeader}>
              <PolyText variant="h3" weight="bold">Chia sẻ bài viết</PolyText>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Icon name="x" size={24} color={theme.colors.textMain} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: theme.spacing.lg }}>
              <TextInput
                style={[styles.commentInput, { minHeight: 80, backgroundColor: theme.colors.background, padding: 12, borderRadius: 8, textAlignVertical: 'top' }]}
                placeholder="Hãy nói gì đó về bài viết này..."
                placeholderTextColor={theme.colors.textLight}
                value={shareCaption}
                onChangeText={setShareCaption}
                multiline
                autoFocus
              />
              <PolyButton
                title="Chia sẻ ngay"
                onPress={handleShare}
                isLoading={isSharing}
                disabled={isSharing}
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Floating Chatbot Button */}
      {!isChatbotVisible && (
        <TouchableOpacity 
          style={styles.chatbotFab} 
          activeOpacity={0.8}
          onPress={() => setIsChatbotVisible(true)}
        >
          <Icon name="message-circle" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* Chatbot Modal */}
      <Modal
        visible={isChatbotVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatbotVisible(false)}
      >
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: '#F27125', borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomWidth: 0 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                  <Icon name="cpu" size={18} color="#FFF" />
                </View>
                <PolyText variant="h3" weight="bold" color="#FFF">Trợ Lý Poly</PolyText>
              </View>
              <TouchableOpacity onPress={() => setIsChatbotVisible(false)}>
                <Icon name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            {/* Chat List */}
            <FlatList
              ref={chatFlatListRef}
              data={chatMessages}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
              style={{ backgroundColor: '#F9F9F9' }}
              renderItem={({ item }) => (
                <View style={{
                  alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: item.role === 'user' ? '#F27125' : '#FFF',
                  padding: 12,
                  borderRadius: 16,
                  borderTopRightRadius: item.role === 'user' ? 0 : 16,
                  borderTopLeftRadius: item.role === 'ai' ? 0 : 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                  borderWidth: item.role === 'ai' ? 1 : 0,
                  borderColor: '#EEE'
                }}>
                  <PolyText color={item.role === 'user' ? '#FFF' : '#1C1E21'}>
                    {item.text}
                  </PolyText>
                </View>
              )}
              ListFooterComponent={isChatLoading ? (
                <View style={{ alignSelf: 'flex-start', backgroundColor: '#FFF', padding: 12, borderRadius: 16, borderTopLeftRadius: 0, borderWidth: 1, borderColor: '#EEE' }}>
                  <ActivityIndicator size="small" color="#F27125" />
                </View>
              ) : null}
            />

            {/* Chat Input */}
            <View style={{ flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#EEE', alignItems: 'center' }}>
              <TextInput
                style={{
                  flex: 1,
                  minHeight: 40,
                  maxHeight: 100,
                  backgroundColor: '#F0F2F5',
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                  marginRight: 10,
                  color: '#1C1E21'
                }}
                placeholder="Nhập câu hỏi..."
                value={chatInput}
                onChangeText={setChatInput}
                multiline
              />
              <TouchableOpacity 
                onPress={handleSendChat}
                disabled={!chatInput.trim() || isChatLoading}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: chatInput.trim() ? '#F27125' : '#E4E6EB',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon name="send" size={20} color={chatInput.trim() ? '#FFF' : '#BCC0C4'} />
              </TouchableOpacity>
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
  menuIconButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  iconButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.primarySoft,
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
  imageGrid: {
    flexDirection: 'row',
    height: 250,
  },
  gridImageContainer: {
    flex: 1,
    position: 'relative',
    marginHorizontal: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
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
  replyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: 4,
    backgroundColor: theme.colors.card,
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
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  imageViewerCounter: {
    position: 'absolute',
    top: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sharedPostContainer: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  sharedPostHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  sharedPostAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: theme.spacing.sm,
  },
  sharedPostContent: {
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  sharedPostImageGrid: {
    width: '100%',
    height: 180,
  },
  sharedPostImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  chatbotFab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F27125',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F27125',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
});
