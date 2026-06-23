import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import api from '../../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const Icon = Feather as any;

export const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      await api.put(`/api/notifications/${id}/read`);
    } catch (error) {
      console.error('Failed to mark as read:', error);
      fetchNotifications();
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await api.put('/api/notifications/read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      fetchNotifications();
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.notiItem, !item.isRead && styles.unreadItem]}
      activeOpacity={0.7}
      onPress={() => {
        if (!item.isRead) handleMarkAsRead(item.id);
      }}
    >
      <View style={[styles.avatar, styles.iconAvatar]}>
        <Icon name="bell" size={24} color={theme.colors.primary} />
      </View>
      <View style={styles.content}>
        <PolyText>
          <PolyText weight="bold">{item.title}</PolyText>
          {'\n'}{item.content}
        </PolyText>
        <PolyText variant="caption" color={!item.isRead ? '#0866FF' : theme.colors.textMuted} style={styles.time}>
          {dayjs(item.createdAt).fromNow()}
        </PolyText>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PolyHeader 
        title="Thông báo" 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity style={styles.iconButtonCircle} onPress={handleMarkAllAsRead}>
            <Icon name="check-circle" size={20} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="bell-off" size={48} color={theme.colors.textMuted} />
            <PolyText color={theme.colors.textMuted} style={{ marginTop: 16 }}>
              Bạn chưa có thông báo nào
            </PolyText>
          </View>
        }
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
  iconAvatar: {
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
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
