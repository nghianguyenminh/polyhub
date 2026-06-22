import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

// Mock data for notifications
const NOTIFICATIONS = [
  {
    id: '1',
    user: 'Trần Bình',
    avatar: 'https://i.pravatar.cc/150?img=12',
    action: 'đã bình luận về bài viết của bạn',
    time: '2 phút trước',
    unread: true,
  },
  {
    id: '2',
    user: 'Poly Mentor',
    avatar: 'https://i.pravatar.cc/150?img=32',
    action: 'Lịch hẹn Call video của bạn sắp bắt đầu trong 15 phút.',
    time: '1 giờ trước',
    unread: true,
  },
  {
    id: '3',
    user: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?img=11',
    action: 'đã thích bài viết của bạn',
    time: '3 giờ trước',
    unread: false,
  },
  {
    id: '4',
    user: 'FPT Polytechnic',
    avatar: 'https://i.pravatar.cc/150?img=3',
    action: 'đã đăng một tài liệu mới trong Góc Tài liệu.',
    time: '1 ngày trước',
    unread: false,
  },
];

export const NotificationScreen = () => {
  const navigation = useNavigation();

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notiItem, item.unread && styles.unreadItem]}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.content}>
        <PolyText>
          <PolyText weight="bold">{item.user}</PolyText> {item.action}
        </PolyText>
        <PolyText variant="caption" color={item.unread ? '#0866FF' : theme.colors.textMuted} style={styles.time}>
          {item.time}
        </PolyText>
      </View>
      {item.unread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PolyHeader 
        title="Thông báo" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.iconButtonCircle}>
            <Icon name="check-circle" size={20} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={NOTIFICATIONS}
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
    backgroundColor: theme.colors.card, // Trắng hoàn toàn giống popup web
  },
  listContent: {
    padding: theme.spacing.md,
  },
  notiItem: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: theme.colors.primarySoft,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: theme.spacing.md,
  },
  content: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  time: {
    marginTop: 4,
  },
  unreadDot: {
    width: 12,
    height: 12,
    backgroundColor: '#0866FF',
    borderRadius: 6,
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
