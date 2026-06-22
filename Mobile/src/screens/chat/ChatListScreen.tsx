import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

const MOCK_CHATS = [
  {
    id: '1',
    user: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?img=11',
    lastMessage: 'Bạn làm xong bài React Native chưa?',
    time: '10:30',
    unread: 2,
    online: true,
  },
  {
    id: '2',
    user: 'Trần Thị B',
    avatar: 'https://i.pravatar.cc/150?img=5',
    lastMessage: 'Ok, cảm ơn bạn nhé!',
    time: 'Hôm qua',
    unread: 0,
    online: false,
  },
  {
    id: '3',
    user: 'Thầy C (Mentor)',
    avatar: 'https://i.pravatar.cc/150?img=60',
    lastMessage: 'Lịch hẹn lúc 3h chiều nay nhé em.',
    time: 'T2',
    unread: 0,
    online: true,
  },
];

export const ChatListScreen = () => {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: typeof MOCK_CHATS[0] }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('ChatDetail', { userName: item.user, avatar: item.avatar, online: item.online })}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        {item.online && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <PolyText weight="bold" style={styles.name}>{item.user}</PolyText>
          <PolyText variant="caption" color={theme.colors.textLight}>{item.time}</PolyText>
        </View>
        <View style={styles.messageRow}>
          <PolyText 
            variant="body" 
            color={item.unread > 0 ? theme.colors.textMain : theme.colors.textMuted}
            weight={item.unread > 0 ? 'semibold' : 'regular'}
            style={styles.lastMessage}
            numberOfLines={1}
          >
            {item.lastMessage}
          </PolyText>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <PolyText variant="small" color="#FFF" weight="bold">{item.unread}</PolyText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PolyHeader 
        title="Tin nhắn" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.iconButtonCircle}>
            <Icon name="edit" size={20} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Tìm kiếm tin nhắn"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.success,
    borderWidth: 2,
    borderColor: theme.colors.card,
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
    fontSize: 16,
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
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  iconButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
