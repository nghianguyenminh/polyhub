import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import api, { getApiBaseUrl } from '../../services/api';

const Icon = Feather as any;

export const DocumentListScreen = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Detail Modal
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  const loadCategories = async () => {
    try {
      const response = await api.get('/api/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadDocuments = async (pageNumber = 1, refresh = false) => {
    if (pageNumber > totalPages && !refresh) return;

    if (pageNumber === 1 && !refresh) {
      setIsLoading(true);
    } else if (pageNumber > 1) {
      setLoadingMore(true);
    }

    try {
      const response = await api.get('/api/documents', {
        params: {
          page: pageNumber,
          keyword: keyword.trim() || undefined,
          category: selectedCategory || undefined,
        },
      });
      const data = response.data;
      
      const list = data.content || []; // Spring Boot Page object usually has 'content'
      if (pageNumber === 1) {
        setDocuments(list);
      } else {
        setDocuments((prev) => [...prev, ...list]);
      }
      setPage((data.number ?? 0) + 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadDocuments(1, true);
  }, [selectedCategory]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDocuments(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !isLoading) {
      loadDocuments(page + 1);
    }
  };

  const handleSearch = () => {
    loadDocuments(1, true);
  };

  const handleToggleSave = async (docId: number) => {
    try {
      // Optimistic update
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id === docId) {
            return { ...d, isSaved: !d.isSaved };
          }
          return d;
        })
      );
      if (selectedDoc && selectedDoc.id === docId) {
        setSelectedDoc((prev: any) => ({ ...prev, isSaved: !prev.isSaved }));
      }
      await api.post(`/api/saved/documents/toggle?documentId=${docId}`);
    } catch (error) {
      console.error('Failed to toggle save document:', error);
    }
  };

  const handleDownload = (doc: any) => {
    // Call download link
    const downloadUrl = `${getApiBaseUrl()}/api/documents/download/${doc.id}`;
    Linking.openURL(downloadUrl).catch((err) => {
      console.error("Couldn't open download link", err);
      Alert.alert('Lỗi', 'Không thể tải xuống tài liệu lúc này.');
    });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getDocIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf': return { name: 'file-text', color: '#ef4444' };
      case 'docx':
      case 'doc':
        return { name: 'file-text', color: '#2563eb' };
      case 'xlsx':
      case 'xls':
        return { name: 'file-text', color: '#10b981' };
      case 'pptx':
      case 'ppt':
        return { name: 'file-text', color: '#f59e0b' };
      case 'zip':
      case 'rar':
        return { name: 'archive', color: '#8b5cf6' };
      default:
        return { name: 'file', color: theme.colors.textMuted };
    }
  };

  const renderDocItem = ({ item }: { item: any }) => {
    const icon = getDocIcon(item.documentType);
    return (
      <TouchableOpacity
        style={styles.docItem}
        activeOpacity={0.7}
        onPress={() => setSelectedDoc(item)}
      >
        <PolyCard style={styles.docCard}>
          <View style={styles.docCardRow}>
            <View style={[styles.docIconBox, { backgroundColor: icon.color + '15' }]}>
              <Icon name={icon.name} size={24} color={icon.color} />
            </View>
            <View style={styles.docMeta}>
              <PolyText weight="bold" numberOfLines={1}>
                {item.title}
              </PolyText>
              <PolyText variant="small" color={theme.colors.textMuted} numberOfLines={1}>
                {item.uploader?.fullname || 'Hệ thống'} • {item.documentType?.toUpperCase()}
              </PolyText>
              <PolyText variant="small" color={theme.colors.textLight} style={{ marginTop: 2 }}>
                {formatFileSize(item.fileSize)} • {item.downloadCount || 0} lượt tải
              </PolyText>
            </View>
            <TouchableOpacity onPress={() => handleToggleSave(item.id)} style={styles.saveBtn}>
              <Icon
                name="bookmark"
                size={20}
                color={item.isSaved ? theme.colors.primary : theme.colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </PolyCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PolyHeader title="Thư viện tài liệu" />

      {/* Search and Category Filter */}
      <View style={styles.searchBlock}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm tài liệu..."
            placeholderTextColor={theme.colors.textLight}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => { setKeyword(''); loadDocuments(1, true); }}>
              <Icon name="x" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories Scroller */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryPill, selectedCategory === null && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <PolyText variant="small" color={selectedCategory === null ? '#FFF' : theme.colors.textMuted} weight="medium">
              Tất cả
            </PolyText>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <PolyText variant="small" color={isSelected ? '#FFF' : theme.colors.textMuted} weight="medium">
                  {cat.name}
                </PolyText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Documents List */}
      <FlatList
        data={documents}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderDocItem}
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
              <Icon name="book" size={40} color={theme.colors.textLight} />
              <PolyText color={theme.colors.textMuted} style={{ marginTop: 8 }}>
                Không tìm thấy tài liệu nào.
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

      {/* Document Details Overlay Panel */}
      {selectedDoc ? (
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.overlayDismiss} onPress={() => setSelectedDoc(null)} />
          <PolyCard style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <PolyText weight="bold" variant="h2" style={{ flex: 1 }}>
                Chi tiết Tài liệu
              </PolyText>
              <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                <Icon name="x" size={24} color={theme.colors.textMain} />
              </TouchableOpacity>
            </View>

            <View style={styles.detailBody}>
              <PolyText weight="bold" variant="h3" style={styles.detailTitle}>
                {selectedDoc.title}
              </PolyText>

              <View style={styles.detailMetaRow}>
                <PolyText variant="small" color={theme.colors.textMuted}>
                  Người đăng: <PolyText variant="small" weight="bold">{selectedDoc.uploader?.fullname || 'Hệ thống'}</PolyText>
                </PolyText>
                <PolyText variant="small" color={theme.colors.textMuted}>
                  Định dạng: <PolyText variant="small" weight="bold">{selectedDoc.documentType?.toUpperCase()}</PolyText>
                </PolyText>
              </View>

              <PolyText color={theme.colors.textMuted} style={styles.detailDesc}>
                {selectedDoc.description || 'Không có mô tả chi tiết cho tài liệu này.'}
              </PolyText>

              <View style={styles.detailStatsBlock}>
                <View style={styles.detailStatBox}>
                  <PolyText weight="bold">{formatFileSize(selectedDoc.fileSize)}</PolyText>
                  <PolyText variant="small" color={theme.colors.textLight}>Dung lượng</PolyText>
                </View>
                <View style={styles.detailStatBox}>
                  <PolyText weight="bold">{selectedDoc.downloadCount || 0}</PolyText>
                  <PolyText variant="small" color={theme.colors.textLight}>Lượt tải về</PolyText>
                </View>
              </View>
            </View>

            <View style={styles.detailActions}>
              <PolyButton
                variant="outline"
                style={{ flex: 1, marginRight: 8 }}
                title={selectedDoc.isSaved ? 'Đã lưu' : 'Lưu tài liệu'}
                icon={<Icon name="bookmark" size={18} color={selectedDoc.isSaved ? theme.colors.primary : theme.colors.textMuted} />}
                onPress={() => handleToggleSave(selectedDoc.id)}
              />
              <PolyButton
                variant="primary"
                style={{ flex: 1.2, marginLeft: 8 }}
                title="Tải xuống"
                icon={<Icon name="download" size={18} color="#FFFFFF" />}
                onPress={() => handleDownload(selectedDoc)}
              />
            </View>
          </PolyCard>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBlock: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    height: 40,
    marginHorizontal: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.caption,
    color: theme.colors.textMain,
  },
  categoryScroll: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  categoryPill: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  docItem: {
    marginBottom: theme.spacing.lg,
  },
  docCard: {
    padding: theme.spacing.md,
  },
  docCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docMeta: {
    flex: 1,
    marginLeft: theme.spacing.md,
    marginRight: theme.spacing.sm,
  },
  saveBtn: {
    padding: theme.spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  overlayDismiss: {
    flex: 1,
  },
  detailCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
  },
  detailBody: {
    marginVertical: theme.spacing.lg,
  },
  detailTitle: {
    marginBottom: theme.spacing.xs,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  detailDesc: {
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  detailStatsBlock: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  detailStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  detailActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.lg,
  },
});
