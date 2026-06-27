import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import api, { getApiBaseUrl } from '../../services/api';

const Icon = Feather as any;

export const MentorListScreen = () => {
  const navigation = useNavigation<any>();
  const [mentors, setMentors] = useState<any[]>([]);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMentors = async (pageNumber = 1, refresh = false) => {
    if (pageNumber > totalPages && !refresh) return;

    if (pageNumber === 1 && !refresh) {
      setIsLoading(true);
    } else if (pageNumber > 1) {
      setLoadingMore(true);
    }

    try {
      const response = await api.get('/api/mentors', {
        params: {
          page: pageNumber,
          keyword: keyword.trim() || undefined,
          sort: sort,
        },
      });
      const data = response.data;
      
      const list = data.mentors || [];
      if (pageNumber === 1) {
        setMentors(list);
      } else {
        setMentors((prev) => [...prev, ...list]);
      }
      setPage(data.currentPage || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to load mentors:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadMentors(1, true);
  }, [sort]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadMentors(1, true);
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore && !isLoading) {
      loadMentors(page + 1);
    }
  };

  const handleSearch = () => {
    loadMentors(1, true);
  };

  const getAvatarUri = (item: any) => {
    const avatar = item.user?.avatar;
    if (!avatar || avatar === 'default.png') {
      return `https://ui-avatars.com/api/?name=${item.fullname}&background=random`;
    }
    if (avatar.startsWith('http')) return avatar;
    return `${getApiBaseUrl()}${avatar}`;
  };

  const renderMentorItem = ({ item }: { item: any }) => (
    <PolyCard style={styles.mentorCard}>
      <View style={styles.mentorCover} />
      
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: getAvatarUri(item) }}
          style={styles.mentorAvatar}
        />
        <View style={styles.mentorMeta}>
          <View style={styles.nameRow}>
            <PolyText weight="bold" variant="h3">
              {item.fullname}
            </PolyText>
            <Icon name="check-circle" size={16} color={theme.colors.primary} style={styles.badgeIcon} />
          </View>
          <PolyText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
            {item.introduction || 'Chưa cập nhật giới thiệu'}
          </PolyText>
        </View>
      </View>

      <PolyText numberOfLines={2} color={theme.colors.textMuted} style={styles.mentorBio}>
        {item.motivation || 'Chưa cập nhật mục tiêu/định hướng.'}
      </PolyText>

      <View style={styles.tagContainer}>
        <View style={styles.tag}>
          <PolyText variant="small" color={theme.colors.primary} weight="medium">
            {item.user?.major || 'Mentor'}
          </PolyText>
        </View>
        <View style={styles.tag}>
          <PolyText variant="small" color={theme.colors.textMuted} weight="medium">
            PolyHUB
          </PolyText>
        </View>
      </View>

      <View style={styles.cardActions}>
        <PolyButton
          variant="outline"
          title="Hồ sơ"
          style={styles.actionBtn}
          onPress={() => navigation.navigate('MentorDetail', { mentor: item })}
        />
        <PolyButton
          variant="primary"
          title="Đặt lịch"
          style={[styles.actionBtn, { marginLeft: 8 }]}
          onPress={() => navigation.navigate('MentorDetail', { mentor: item, openBooking: true })}
        />
      </View>
    </PolyCard>
  );

  return (
    <View style={styles.container}>
      <PolyHeader title="Danh sách Mentors" />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color={theme.colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm mentor..."
            placeholderTextColor={theme.colors.textLight}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
          />
          {keyword ? (
            <TouchableOpacity onPress={() => { setKeyword(''); loadMentors(1, true); }}>
              <Icon name="x" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {/* Sort select simulator */}
        <TouchableOpacity 
          style={styles.sortBtn}
          onPress={() => {
            const nextSort = sort === 'newest' ? 'oldest' : 'newest';
            setSort(nextSort);
          }}
        >
          <Icon name="sliders" size={18} color={theme.colors.primary} />
          <PolyText variant="small" color={theme.colors.primary} weight="semibold" style={{ marginLeft: 6 }}>
            {sort === 'newest' ? 'Mới nhất' : 'Cũ nhất'}
          </PolyText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mentors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderMentorItem}
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
              <Icon name="award" size={40} color={theme.colors.textLight} />
              <PolyText color={theme.colors.textMuted} style={{ marginTop: 8 }}>
                Không tìm thấy mentor nào.
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    height: 40,
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
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.pill,
    height: 40,
    justifyContent: 'center',
    marginLeft: theme.spacing.md,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  mentorCard: {
    marginBottom: theme.spacing.xl,
    padding: 0,
    overflow: 'hidden',
  },
  mentorCover: {
    height: 70,
    backgroundColor: '#FFEFDB',
  },
  cardHeader: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginTop: -25,
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  mentorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: theme.colors.card,
  },
  mentorMeta: {
    flex: 1,
    marginLeft: theme.spacing.md,
    paddingBottom: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginLeft: 4,
  },
  mentorBio: {
    paddingHorizontal: theme.spacing.lg,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  tag: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
  },
  cardActions: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionBtn: {
    flex: 1,
    height: 40,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
