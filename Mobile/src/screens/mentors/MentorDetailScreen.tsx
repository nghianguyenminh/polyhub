import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { PolyCard } from '../../components/PolyCard';
import { getApiBaseUrl } from '../../services/api';

const Icon = Feather as any;

export const MentorDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mentor, openBooking } = route.params;

  useEffect(() => {
    // If navigated with openBooking = true, automatically redirect to booking screen
    if (openBooking) {
      navigation.navigate('Booking', { mentor });
    }
  }, [openBooking]);

  const getAvatarUri = () => {
    const avatar = mentor.user?.avatar;
    if (!avatar || avatar === 'default.png') {
      return `https://ui-avatars.com/api/?name=${mentor.fullname}&background=random`;
    }
    if (avatar.startsWith('http')) return avatar;
    return `${getApiBaseUrl()}${avatar}`;
  };

  const handleDownloadCV = () => {
    if (!mentor.cvFile) {
      Alert.alert('Thông báo', 'Mentor này chưa tải lên CV.');
      return;
    }
    
    // Construct CV download URL
    // Endpoint: GET /api/mentors/{id}/cv or static file path
    const url = mentor.cvFile.startsWith('http') 
      ? mentor.cvFile 
      : `${getApiBaseUrl()}/uploads/cv/${mentor.cvFile}`;
      
    Linking.openURL(url).catch((err) => {
      console.error("Couldn't open CV link", err);
      Alert.alert('Lỗi', 'Không thể mở liên kết tải CV.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <PolyHeader
        title="Chi tiết Mentor"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo Simulator */}
        <View style={styles.coverPhoto} />

        {/* Profile Card */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: getAvatarUri() }} style={styles.avatar} />
          <PolyText weight="bold" variant="h1" style={styles.name}>
            {mentor.fullname}
          </PolyText>
          <View style={styles.majorBadge}>
            <PolyText variant="small" color={theme.colors.primary} weight="bold">
              {mentor.user?.major || 'Mentor'}
            </PolyText>
          </View>
        </View>

        {/* About Card */}
        <PolyCard style={styles.sectionCard}>
          <PolyText weight="bold" variant="h3" style={styles.sectionTitle}>
            Giới thiệu bản thân
          </PolyText>
          <PolyText color={theme.colors.textMuted} style={styles.bodyText}>
            {mentor.introduction || 'Mentor chưa cập nhật thông tin giới thiệu.'}
          </PolyText>
        </PolyCard>

        {/* Motivation Card */}
        <PolyCard style={styles.sectionCard}>
          <PolyText weight="bold" variant="h3" style={styles.sectionTitle}>
            Định hướng & Mục tiêu hỗ trợ
          </PolyText>
          <PolyText color={theme.colors.textMuted} style={styles.bodyText}>
            {mentor.motivation || 'Mentor chưa cập nhật mục tiêu/định hướng.'}
          </PolyText>
        </PolyCard>

        {/* Credentials Card */}
        <PolyCard style={styles.sectionCard}>
          <PolyText weight="bold" variant="h3" style={styles.sectionTitle}>
            Tài liệu & Chứng chỉ
          </PolyText>
          <TouchableOpacity style={styles.cvRow} onPress={handleDownloadCV}>
            <View style={styles.cvIconBox}>
              <Icon name="file-text" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.cvInfo}>
              <PolyText weight="semibold">Hồ sơ năng lực (CV)</PolyText>
              <PolyText variant="small" color={theme.colors.textLight}>
                {mentor.cvFile ? 'Nhấp để tải xuống xem chi tiết' : 'Chưa cập nhật'}
              </PolyText>
            </View>
            {mentor.cvFile && <Icon name="download" size={20} color={theme.colors.textMuted} />}
          </TouchableOpacity>
        </PolyCard>
      </ScrollView>

      {/* Persistent Bottom Action Bar */}
      <View style={styles.actionToolbar}>
        <PolyButton
          variant="outline"
          title="Nhắn tin"
          style={styles.toolbarBtn}
          icon={<Icon name="message-circle" size={18} color={theme.colors.primary} />}
          onPress={() => {
            navigation.navigate('ChatDetail', {
              userName: mentor.fullname,
              avatar: getAvatarUri(),
              online: true,
            });
          }}
        />
        <PolyButton
          variant="primary"
          title="Đặt lịch hẹn"
          style={[styles.toolbarBtn, { marginLeft: 12 }]}
          icon={<Icon name="calendar" size={18} color="#FFFFFF" />}
          onPress={() => navigation.navigate('Booking', { mentor })}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 100, // Safe space for floating toolbar
  },
  coverPhoto: {
    height: 120,
    backgroundColor: '#FFEFDB',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: -45,
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: theme.colors.card,
  },
  name: {
    marginTop: theme.spacing.md,
  },
  majorBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
  },
  sectionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  bodyText: {
    lineHeight: 22,
  },
  cvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  cvIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: theme.colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cvInfo: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  actionToolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  toolbarBtn: {
    flex: 1,
    height: 48,
  },
});
