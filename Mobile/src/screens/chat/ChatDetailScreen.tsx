import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

const MOCK_MESSAGES = [
  { id: '1', text: 'Chào bạn, cho mình hỏi về khóa học React Native với.', sender: 'other', time: '10:20' },
  { id: '2', text: 'Chào bạn, bạn cần hỗ trợ phần nào nhỉ?', sender: 'me', time: '10:22' },
  { id: '3', text: 'Mình đang thắc mắc cách cấu hình Redux Toolkit.', sender: 'other', time: '10:25' },
  { id: '4', text: 'À phần đó bạn xem bài 4 trong giáo trình nhé, có hướng dẫn chi tiết luôn.', sender: 'me', time: '10:28' },
  { id: '5', text: 'Bạn làm xong bài React Native chưa?', sender: 'other', time: '10:30' },
];

export const ChatDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  
  const { userName, avatar, online } = route.params || {
    userName: 'Nguyễn Văn A',
    avatar: 'https://i.pravatar.cc/150?img=11',
    online: true,
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender === 'me';
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && <Image source={{ uri: avatar }} style={styles.messageAvatar} />}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <PolyText color={isMe ? '#FFFFFF' : theme.colors.textMain}>{item.text}</PolyText>
          <PolyText 
            variant="small" 
            color={isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textLight} 
            style={styles.messageTime}
          >
            {item.time}
          </PolyText>
        </View>
      </View>
    );
  };

  // Custom Header component for Chat to show Avatar & Status
  const renderHeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.iconButton}>
        <Icon name="phone" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Icon name="video" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton}>
        <Icon name="info" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PolyHeader 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightComponent={renderHeaderRight()}
        title="" // We will use absolute center to override title rendering
      />
      
      {/* Overlay custom title block for header */}
      <View style={[styles.headerCenter, { top: insets.top }]}>
        <View style={styles.headerUserInfo}>
          <View style={styles.avatarContainer}>
             <Image source={{ uri: avatar }} style={styles.headerAvatar} />
             {online && <View style={styles.onlineDot} />}
          </View>
          <View>
            <PolyText weight="bold" style={styles.headerName}>{userName}</PolyText>
            <PolyText variant="small" color={theme.colors.textMuted}>
              {online ? 'Đang hoạt động' : 'Hoạt động 2 giờ trước'}
            </PolyText>
          </View>
        </View>
      </View>

      <FlatList
        data={MOCK_MESSAGES}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <TouchableOpacity style={styles.attachBtn}>
          <Icon name="plus-circle" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.textInputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhắn tin..."
            placeholderTextColor={theme.colors.textLight}
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity style={styles.smileyBtn}>
             <Icon name="smile" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {message.trim().length > 0 ? (
          <TouchableOpacity style={styles.sendBtn}>
            <Icon name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.attachBtn}>
            <Icon name="thumbs-up" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerCenter: {
    position: 'absolute',
    left: 60, // Avoid back button
    right: 120, // Avoid right icons
    height: 60,
    justifyContent: 'center',
    zIndex: 20,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.success,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  headerName: {
    fontSize: 15,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.sm,
    marginLeft: 4,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  messageWrapperMe: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleMe: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  messageTime: {
    alignSelf: 'flex-end',
    marginTop: 4,
    fontSize: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  attachBtn: {
    padding: theme.spacing.sm,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    marginHorizontal: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: 40,
    maxHeight: 100,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.sizes.body,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.textMain,
    paddingTop: 10,
    paddingBottom: 10,
  },
  smileyBtn: {
    padding: 4,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.sm,
  },
});
