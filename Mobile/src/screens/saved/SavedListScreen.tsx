import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import api, { getApiBaseUrl } from '../../services/api';
import dayjs from 'dayjs';

const Icon = Feather as any;

export const SavedListScreen = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'posts' | 'documents'>('posts');
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadSavedItems = async (pageNumber = 1, refresh = false) => {
    if (pageNumber > totalPages && !refresh) return;

    if (pageNumber === 1 && !refresh) {
      setIsLoading(true);
    } else if (pageNumber > 1) {
      setLoadingMore(true);
    }

    try {
      // API call: GET /api/saved?type=posts or type=documents
      const typeParam = activeTab === 'posts' ? 'posts' : 'documents';
      const response = await api.get('/api/saved', {
        params: {
          type: typeParam,
          page: pageNumber,
          size: 10,
        },
      });

      const data = response.data;
      const list = data.content || [];

      if (pageNumber === 1) {
        setSavedItems(list);
      } else {
        setSavedItems((prev) => [...prev, ...list]);
      }
      setPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load saved items:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSavedItems(1, true);
    }, [activeTab])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSavedItems(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !isLoading) {
      loadSavedItems(page + 1);
    }
  };

  const handleUnsavePost = async (postId: number) => {
    try {
      // Optimistic update
      setSavedItems((prev) => prev.filter((item) => item.post?.id !== postId));
      await api.post(`/api/saved/posts/toggle?postId=${postId}`);
    } catch (error) {
      console.error('Failed to unsave post:', error);
      loadSavedItems(1, true);
    }
  };

  const handleUnsaveDoc = async (docId: number) => {
    try {
      // Optimistic update
      setSavedItems((prev) => prev.filter((item) => item.document?.id !== docId));
      await api.post(`/api/saved/documents/toggle?documentId=${docId}`);
    } catch (error) {
      console.error('Failed to unsave document:', error);
      loadSavedItems(1, true);
    }
  };

  const getAvatarUri = (avatarName: string | undefined) => {
    if (!avatarName || avatarName === 'default.png') {
      return 'https://i.pravatar.cc/150?img=12'; // Fallback
    }
    if (avatarName.startsWith('http')) return avatarName;
    return `${getApiBaseUrl()}${avatarName}`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDocIconClass = (docType: string) => {
    switch (docType?.toUpperCase()) {
      case 'PDF': return { icon: 'file-text', color: '#e74c3c' }; // Red
      case 'WORD': return { icon: 'file', color: '#2980b9' }; // Blue
      case 'EXCEL': return { icon: 'grid', color: '#27ae60' }; // Green
      case 'ZIP': return { icon: 'archive', color: '#f39c12' }; // Orange
      default: return { icon: 'file', color: theme.colors.primary };
    }
  };

  const renderPostImages = (post: any) => {
    const images = post.imageUrls || (post.imageUrl ? [post.imageUrl] : []);
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <Image source={{ uri: images[0] }} style={styles.singleImage} />
      );
    }
    
    return (
      <View style={styles.imageGridContainer}>
        {images.slice(0, 4).map((uri: string, index: number) => (
          <View key={index} style={[styles.gridImageWrapper, images.length === 2 ? { width: '49%' } : (images.length === 3 && index === 0 ? { width: '100%', height: 150 } : { width: '49%', height: 120 })]}>
            <Image source={{ uri }} style={styles.gridImage} />
            {index === 3 && images.length > 4 && (
              <View style={styles.overlayMore}>
                <PolyText variant="h3" color="#FFF" weight="bold">
                  +{images.length - 4}
                </PolyText>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderPostItem = ({ item }: { item: any }) => {
    const post = item.post;
    if (!post) return null;

    const timeAgo = dayjs(post.createdAt).fromNow();
    return (
      <PolyCard style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: getAvatarUri(post.user?.avatar) }} style={styles.avatar} />
          <View style={styles.metaInfo}>
            <PolyText weight="bold">{post.user?.fullname || 'Ẩn danh'}</PolyText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="calendar" size={12} color={theme.colors.textMuted} />
              <PolyText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4, marginRight: 8 }}>
                {timeAgo}
              </PolyText>
              <Icon name={post.isPrivate ? 'lock' : 'globe'} size={12} color={theme.colors.textMuted} />
              <PolyText variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                {post.isPrivate ? 'Riêng tư' : 'Công khai'}
              </PolyText>
            </View>
          </View>
          <TouchableOpacity onPress={() => handleUnsavePost(post.id)}>
            <Icon name="bookmark" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        
        {post.content ? (
          <PolyText style={styles.bodyText}>
            {post.content}
          </PolyText>
        ) : null}
        
        {renderPostImages(post)}
        
        {/* Post Stats */}
        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <Icon name="heart" size={16} color="#e74c3c" />
            <PolyText variant="small" style={styles.statText}>{post.likesCount || 0}</PolyText>
          </View>
          <View style={styles.statItem}>
            <Icon name="message-circle" size={16} color={theme.colors.textLight} />
            <PolyText variant="small" style={styles.statText}>{post.commentsCount || 0}</PolyText>
          </View>
          <View style={styles.statItem}>
            <Icon name="share-2" size={16} color={theme.colors.textLight} />
            <PolyText variant="small" style={styles.statText}>{post.sharesCount || 0}</PolyText>
          </View>
        </View>
      </PolyCard>
    );
  };

  const renderDocItem = ({ item }: { item: any }) => {
    const doc = item.document;
    if (!doc) return null;

    const { icon, color } = getDocIconClass(doc.documentType);

    return (
      <PolyCard style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.docIconBox, { backgroundColor: color + '20' }]}>
            <Icon name={icon} size={24} color={color} />
          </View>
          <View style={styles.metaInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
              <Icon name="tag" size={12} color={theme.colors.primary} />
              <PolyText variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>
                {doc.category?.name || 'Chuyên ngành'}
              </PolyText>
            </View>
            <PolyText weight="bold" numberOfLines={1}>{doc.title}</PolyText>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
              <View style={styles.docStat}>
                <Icon name="user" size={12} color={theme.colors.textMuted} />
                <PolyText variant="caption" color={theme.colors.textMuted} style={styles.docStatText}>
                  {doc.uploader?.fullname || 'Hệ thống'}
                </PolyText>
              </View>
              <View style={styles.docStat}>
                <Icon name="file" size={12} color={theme.colors.textMuted} />
                <PolyText variant="caption" color={theme.colors.textMuted} style={styles.docStatText}>
                  {doc.documentType}
                </PolyText>
              </View>
              {doc.fileSize > 0 && (
                <View style={styles.docStat}>
                  <Icon name="hard-drive" size={12} color={theme.colors.textMuted} />
                  <PolyText variant="caption" color={theme.colors.textMuted} style={styles.docStatText}>
                    {formatFileSize(doc.fileSize)}
                  </PolyText>
                </View>
              )}
              {doc.downloadCount > 0 && (
                <View style={styles.docStat}>
                  <Icon name="download" size={12} color={theme.colors.textMuted} />
                  <PolyText variant="caption" color={theme.colors.textMuted} style={styles.docStatText}>
                    {doc.downloadCount}
                  </PolyText>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity onPress={() => handleUnsaveDoc(doc.id)} style={{ alignSelf: 'flex-start' }}>
            <Icon name="bookmark" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <PolyText numberOfLines={2} color={theme.colors.textMuted} style={styles.bodyText}>
          {doc.description || 'Không có mô tả cho tài liệu này.'}
        </PolyText>
        <PolyButton
          variant="primary"
          title="Tải về"
          icon={<Icon name="download" size={16} color="#FFF" />}
          style={styles.detailBtn}
          onPress={() => {
            const url = `${getApiBaseUrl()}/api/documents/download/${doc.id}`;
            Linking.openURL(url).catch(() => Alert.alert('Lỗi', 'Không thể mở liên kết.'));
          }}
        />
      </PolyCard>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PolyHeader title="Mục đã lưu" />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'posts' && styles.tabBtnActive]}
          onPress={() => setActiveTab('posts')}
        >
          <PolyText
            weight={activeTab === 'posts' ? 'bold' : 'medium'}
            color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textMuted}
          >
            Bài viết
          </PolyText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'documents' && styles.tabBtnActive]}
          onPress={() => setActiveTab('documents')}
        >
          <PolyText
            weight={activeTab === 'documents' ? 'bold' : 'medium'}
            color={activeTab === 'documents' ? theme.colors.primary : theme.colors.textMuted}
          >
            Tài liệu
          </PolyText>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={savedItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={activeTab === 'posts' ? renderPostItem : renderDocItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="bookmark" size={40} color={theme.colors.textLight} />
              <PolyText color={theme.colors.textMuted} style={{ marginTop: 8 }}>
                Chưa lưu mục nào ở đây.
              </PolyText>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 16 }} />
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: theme.colors.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  itemCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  bodyText: {
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  detailBtn: {
    height: 38,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    resizeMode: 'cover',
  },
  imageGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: 4,
  },
  gridImageWrapper: {
    height: 120,
    marginBottom: 4,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlayMore: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  statText: {
    marginLeft: 4,
    color: theme.colors.textLight,
  },
  docStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  docStatText: {
    marginLeft: 4,
  },
});
