import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { theme } from '../../constants/theme';
import api, { getApiBaseUrl } from '../../services/api';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const ChatListScreen = () => {
  const navigation = useNavigation<any>();
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadChatRooms = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await api.get('/api/chat-data');
      setChatRooms(response.data.allUsers || []);
    } catch (error) {
      console.error('Failed to load chat data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadChatRooms();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadChatRooms(true);
  };

  const getFilteredChats = () => {
    if (!searchQuery.trim()) return chatRooms;
    return chatRooms.filter((chat) =>
      chat.fullname?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const getAvatarUri = (avatarName: string | undefined) => {
    if (!avatarName || avatarName === 'default.png') {
      return 'https://i.pravatar.cc/150?img=12'; // Fallback mockup avatar
    }
    if (avatarName.startsWith('http')) return avatarName;
    return `${getApiBaseUrl()}${avatarName}`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const hasUnread = item.isLastMessageRead === false && item.lastSenderId !== undefined && item.lastSenderId !== item.username;
    
    return (
      <TouchableOpacity 
        style={styles.chatItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('ChatDetail', { 
          roomId: item.roomId,
          targetUser: {
            username: item.username,
            fullname: item.fullname,
            avatar: getAvatarUri(item.avatar),
          }
        })}
      >
        <View style={styles.avatarContainer}>
          <Image source={{ uri: getAvatarUri(item.avatar) }} style={styles.avatar} />
        </View>
        
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <PolyText weight="bold" style={styles.name}>{item.fullname}</PolyText>
            {item.lastUpdated && (
              <PolyText variant="small" color={theme.colors.textLight}>
                {new Date(item.lastUpdated).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </PolyText>
            )}
          </View>
          <View style={styles.messageRow}>
            <PolyText 
              variant="caption" 
              color={hasUnread ? theme.colors.textMain : theme.colors.textMuted}
              weight={hasUnread ? 'bold' : 'regular'}
              style={styles.lastMessage}
              numberOfLines={1}
            >
              {item.lastMessage || 'Bắt đầu cuộc trò chuyện mới'}
            </PolyText>
            {hasUnread && (
              <View style={styles.unreadBadge} />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PolyHeader 
        title="Tin nhắn" 
        showBack 
        onBackPress={() => navigation.goBack()}
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè"
            placeholderTextColor={theme.colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="x" size={18} color={theme.colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={getFilteredChats()}
          keyExtractor={item => item.username}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="message-circle" size={40} color={theme.colors.textLight} />
              <PolyText color={theme.colors.textMuted} style={{ marginTop: 8 }}>
                Chưa có cuộc hội thoại nào.
              </PolyText>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: theme.spacing.md,
    height: 40,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMain,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 15,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
