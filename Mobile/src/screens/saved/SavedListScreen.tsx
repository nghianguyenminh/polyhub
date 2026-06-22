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
            <PolyText variant="caption" color={theme.colors.textMuted}>{timeAgo}</PolyText>
          </View>
          <TouchableOpacity onPress={() => handleUnsavePost(post.id)}>
            <Icon name="bookmark" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <PolyText numberOfLines={3} style={styles.bodyText}>
          {post.content}
        </PolyText>
        <PolyButton
          variant="outline"
          title="Xem chi tiết"
          style={styles.detailBtn}
          onPress={() => {
            // Can open a preview or alert for now
            Alert.alert('Bài viết', post.content);
          }}
        />
      </PolyCard>
    );
  };

  const renderDocItem = ({ item }: { item: any }) => {
    const doc = item.document;
    if (!doc) return null;

    return (
      <PolyCard style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={styles.docIconBox}>
            <Icon name="file-text" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.metaInfo}>
            <PolyText weight="bold" numberOfLines={1}>{doc.title}</PolyText>
            <PolyText variant="caption" color={theme.colors.textMuted}>
              {doc.documentType?.toUpperCase()} • {doc.uploader?.fullname || 'Hệ thống'}
            </PolyText>
          </View>
          <TouchableOpacity onPress={() => handleUnsaveDoc(doc.id)}>
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
});
