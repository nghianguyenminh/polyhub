import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  Image, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

export const CreatePostScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState('');

  const handlePost = () => {
    // Xử lý logic đăng bài ở đây
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Modal */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Icon name="x" size={24} color={theme.colors.textMain} />
        </TouchableOpacity>
        <PolyText variant="h3" weight="bold">Tạo bài viết</PolyText>
        <PolyButton 
          title="Đăng" 
          disabled={!content.trim()} 
          onPress={handlePost}
          style={styles.postBtn}
        />
      </View>

      <ScrollView style={styles.content}>
        {/* User Info */}
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=11' }} 
            style={styles.avatar} 
          />
          <View>
            <PolyText weight="bold">Thiên</PolyText>
            <View style={styles.privacyBadge}>
              <Icon name="globe" size={12} color={theme.colors.textMuted} />
              <PolyText variant="small" color={theme.colors.textMuted} style={{ marginLeft: 4 }}>
                Công khai
              </PolyText>
            </View>
          </View>
        </View>

        {/* Input Area */}
        <TextInput
          style={styles.input}
          placeholder="Bạn đang nghĩ gì thế?"
          placeholderTextColor={theme.colors.textLight}
          multiline
          autoFocus
          value={content}
          onChangeText={setContent}
        />
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 20 }]}>
        <PolyText color={theme.colors.textMuted} style={styles.addToPostText}>
          Thêm vào bài viết
        </PolyText>
        <View style={styles.actionIcons}>
          <TouchableOpacity style={styles.actionIconBtn}>
            <Icon name="image" size={24} color="#22c55e" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn}>
            <Icon name="user-plus" size={24} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn}>
            <Icon name="smile" size={24} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIconBtn}>
            <Icon name="map-pin" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  closeBtn: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.iconBackground,
    borderRadius: 20,
  },
  postBtn: {
    height: 36,
    paddingHorizontal: theme.spacing.lg,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: theme.spacing.md,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  input: {
    fontSize: 18,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMain,
    minHeight: 150,
    textAlignVertical: 'top',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addToPostText: {
    fontFamily: theme.typography.fontFamily.medium,
  },
  actionIcons: {
    flexDirection: 'row',
  },
  actionIconBtn: {
    marginLeft: theme.spacing.lg,
  },
});
