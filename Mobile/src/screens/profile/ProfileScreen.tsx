import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const ProfileScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <PolyHeader 
        title="Trang cá nhân" 
        showBack 
        onBackPress={() => navigation.goBack()} 
        rightComponent={
          <TouchableOpacity 
            style={styles.iconButtonCircle}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={20} color={theme.colors.textMain} />
          </TouchableOpacity>
        }
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover Photo */}
        <View style={styles.coverPhotoContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000' }} 
            style={styles.coverPhoto} 
          />
          <TouchableOpacity style={styles.editCoverBtn}>
            <Icon name="camera" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.avatarWrapper}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Icon name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>

          <PolyText variant="h2" weight="bold" style={styles.name}>Nguyễn Văn A</PolyText>
          <PolyText color={theme.colors.textMuted} style={styles.bio}>
            Student at FPT Polytechnic 🎓 | React Native Developer 💻
          </PolyText>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <PolyText weight="bold">1.2K</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>Người theo dõi</PolyText>
            </View>
            <View style={styles.statItem}>
              <PolyText weight="bold">250</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>Đang theo dõi</PolyText>
            </View>
            <View style={styles.statItem}>
              <PolyText weight="bold">45</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>Bài viết</PolyText>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <PolyButton title="Chỉnh sửa trang" style={{ flex: 1, marginRight: 8 }} />
            <PolyButton title="Chia sẻ" variant="outline" style={{ flex: 1 }} />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Info Highlights */}
        <View style={styles.detailsContainer}>
          <PolyText variant="h3" weight="bold" style={styles.sectionTitle}>Giới thiệu</PolyText>
          <View style={styles.detailRow}>
            <Icon name="briefcase" size={20} color={theme.colors.textLight} />
            <PolyText style={styles.detailText}>Làm việc tại <PolyText weight="bold">PolyHUB</PolyText></PolyText>
          </View>
          <View style={styles.detailRow}>
            <Icon name="book" size={20} color={theme.colors.textLight} />
            <PolyText style={styles.detailText}>Học tại <PolyText weight="bold">FPT Polytechnic</PolyText></PolyText>
          </View>
          <View style={styles.detailRow}>
            <Icon name="map-pin" size={20} color={theme.colors.textLight} />
            <PolyText style={styles.detailText}>Sống tại <PolyText weight="bold">TP. Hồ Chí Minh</PolyText></PolyText>
          </View>
          <View style={styles.detailRow}>
            <Icon name="link" size={20} color={theme.colors.textLight} />
            <PolyText style={styles.detailText} color={theme.colors.primary}>github.com/nguyenvana</PolyText>
          </View>
        </View>

        {/* Feed Posts */}
        <View style={styles.feedContainer}>
           <PolyText variant="h3" weight="bold" style={styles.sectionTitle}>Bài viết của bạn</PolyText>
           <PolyCard noPadding>
            <View style={styles.postHeader}>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
                style={styles.postAvatar} 
              />
              <View style={styles.postMeta}>
                <PolyText weight="bold">Nguyễn Văn A</PolyText>
                <PolyText variant="caption" color={theme.colors.textMuted}>Hôm qua • 🌍</PolyText>
              </View>
              <Icon name="more-horizontal" size={20} color={theme.colors.textMuted} />
            </View>

            <View style={styles.postContent}>
              <PolyText>Cập nhật avatar mới nha mọi người! 🚀</PolyText>
            </View>

            <View style={styles.postActions}>
              <PolyButton 
                variant="ghost" 
                icon={<Icon name="thumbs-up" size={20} color={theme.colors.textMuted} />} 
                title="Thích"
              />
              <PolyButton 
                variant="ghost" 
                icon={<Icon name="message-square" size={20} color={theme.colors.textMuted} />} 
                title="Bình luận"
              />
            </View>
          </PolyCard>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  iconButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPhotoContainer: {
    position: 'relative',
    height: 200,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editCoverBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  profileInfoContainer: {
    backgroundColor: theme.colors.card,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
  },
  avatarWrapper: {
    marginTop: -60,
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.card,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: theme.colors.textMain,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  name: {
    marginBottom: 4,
  },
  bio: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  divider: {
    height: 8,
    backgroundColor: theme.colors.border,
  },
  detailsContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailText: {
    marginLeft: theme.spacing.md,
  },
  feedContainer: {
    padding: theme.spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
  },
  postMeta: {
    flex: 1,
  },
  postContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
