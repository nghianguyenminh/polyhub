import React from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import { useNavigation } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
const Icon = Feather as any;

export const HomeScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <PolyHeader title="PolyHUB" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Create Post Section */}
        <PolyCard style={styles.createPostCard}>
          <View style={styles.createPostRow}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
              style={styles.avatar} 
            />
            <TouchableOpacity 
              style={styles.inputSimulator}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <PolyText color={theme.colors.textMuted}>Bạn đang nghĩ gì thế?</PolyText>
            </TouchableOpacity>
          </View>
          <View style={styles.createPostActions}>
            <PolyButton 
              variant="ghost" 
              title="Ảnh/Video" 
              icon={<Icon name="image" size={20} color="#22c55e" />}
              style={styles.actionBtn}
            />
            <PolyButton 
              variant="ghost" 
              title="Đính kèm" 
              icon={<Icon name="paperclip" size={20} color={theme.colors.primary} />}
              style={styles.actionBtn}
            />
          </View>
        </PolyCard>

        {/* Mockup Feed Post */}
        <PolyCard noPadding>
          <View style={styles.postHeader}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/150?img=12' }} 
              style={styles.avatar} 
            />
            <View style={styles.postMeta}>
              <PolyText weight="bold">Nguyễn Văn A</PolyText>
              <PolyText variant="caption" color={theme.colors.textMuted}>2 giờ trước • 🌍</PolyText>
            </View>
            <Icon name="more-horizontal" size={20} color={theme.colors.textMuted} />
          </View>

          <View style={styles.postContent}>
            <PolyText>
              Hôm nay thật tuyệt vời! Vừa hoàn thành xong project React Native đầu tiên tại FPT Polytechnic. Cảm ơn mọi người đã hỗ trợ! 🚀🔥
            </PolyText>
          </View>

          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop' }} 
            style={styles.postImage} 
          />

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
            <PolyButton 
              variant="ghost" 
              icon={<Icon name="share-2" size={20} color={theme.colors.textMuted} />} 
              title="Chia sẻ"
            />
          </View>
        </PolyCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  createPostCard: {
    marginBottom: theme.spacing.xl,
  },
  createPostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primarySoft,
  },
  inputSimulator: {
    flex: 1,
    height: 40,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  createPostActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
    justifyContent: 'space-around',
  },
  actionBtn: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  postMeta: {
    flex: 1,
  },
  postContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  postImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
