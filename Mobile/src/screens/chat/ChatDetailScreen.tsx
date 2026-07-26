import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import api, { getApiBaseUrl } from '../../services/api';
import Feather from '@expo/vector-icons/Feather';
import { Client } from '@stomp/stompjs';

// Polyfill for TextEncoder/TextDecoder required by StompJS in React Native
if (typeof TextEncoder === 'undefined') {
  class TextEncoderPolyfill {
    encode(str: string) {
      try {
        const utf8 = unescape(encodeURIComponent(str));
        const arr = new Uint8Array(utf8.length);
        for (let i = 0; i < utf8.length; i++) {
          arr[i] = utf8.charCodeAt(i);
        }
        return arr;
      } catch (e) {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
          arr[i] = str.charCodeAt(i) & 0xff;
        }
        return arr;
      }
    }
  }
  globalThis.TextEncoder = TextEncoderPolyfill as any;
}

if (typeof TextDecoder === 'undefined') {
  class TextDecoderPolyfill {
    decode(arr: Uint8Array) {
      let str = '';
      for (let i = 0; i < arr.length; i++) {
        str += String.fromCharCode(arr[i]);
      }
      try {
        return decodeURIComponent(escape(str));
      } catch (e) {
        return str;
      }
    }
  }
  globalThis.TextDecoder = TextDecoderPolyfill as any;
}

const Icon = Feather as any;

export const ChatDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const stompClientRef = useRef<Client | null>(null);
  const flatListRef = useRef<FlatList | null>(null);

  const { roomId: initialRoomId, targetUser } = route.params || {};
  const [roomId, setRoomId] = useState<string | null>(initialRoomId || null);

  const targetUsername = targetUser?.username;
  const targetFullname = targetUser?.fullname || 'Bạn bè';
  const targetAvatar = targetUser?.avatar || 'https://i.pravatar.cc/150?img=12';

  // 1. Resolve room ID and load chat history
  const initChat = async () => {
    setIsLoading(true);
    try {
      let activeRoomId = roomId;

      // If we don't have a roomId, resolve/create one using backend api
      if (!activeRoomId && targetUsername) {
        const response = await api.get(`/api/chat-data`, {
          params: { userId: targetUsername }
        });
        activeRoomId = response.data.roomId;
        setRoomId(activeRoomId);
      }

      if (activeRoomId) {
        // Load history
        const historyResponse = await api.get(`/api/chat/history`, {
          params: { roomId: activeRoomId }
        });
        setMessages(historyResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to initialize chat detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initChat();
  }, [initialRoomId, targetUsername]);

  // 2. Connect to WebSocket once roomId is resolved
  useEffect(() => {
    if (!roomId) return;

    // Convert HTTP API URL to WebSocket protocol (ws/wss)
    const baseApi = getApiBaseUrl();
    const wsUrl = baseApi.replace(/^http/, 'ws') + '/ws-chat/websocket';

    console.log('Connecting to WebSocket:', wsUrl);

    const client = new Client({
      brokerURL: wsUrl,
      forceBinaryWSFrames: true,
      appendMissingNULLonIncoming: true,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('STOMP connected successfully');
        setIsConnected(true);

        // Subscribe to current room
        client.subscribe(`/topic/chat/${roomId}`, (message) => {
          const newMsg = JSON.parse(message.body);
          
          if (newMsg.type === 'CALL_OFFER') {
            if (newMsg.senderId !== user?.username) {
              setIncomingCall(newMsg);
            }
            return;
          }

          if (newMsg.type === 'CALL_REJECT') {
            if (newMsg.senderId !== user?.username) {
              setIncomingCall(null);
              Alert.alert('Thông báo', 'Cuộc gọi đã bị từ chối.');
            }
            return;
          }

          if (newMsg.type === 'CALL_ENDED') {
            setMessages((prev) => [...prev, newMsg]);
            setIncomingCall(null);
            return;
          }

          // Only add text message or call actions
          setMessages((prev) => {
            // Check if message is already added (e.g. sent by me and optimistically added)
            if (prev.some((m) => m.id === newMsg.id)) {
              return prev;
            }
            return [...prev, newMsg];
          });
        });
      },
      onDisconnect: () => {
        console.log('STOMP disconnected');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
      }
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !roomId || !isConnected || !stompClientRef.current) return;

    const msgObj = {
      roomId: roomId,
      senderId: user?.username,
      content: inputText.trim(),
      type: 'TEXT',
    };

    // Publish to backend STOMP endpoint
    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(msgObj),
    });

    setInputText('');
  };

  const handleVideoCall = () => {
    if (!roomId || !isConnected || !stompClientRef.current) {
      Alert.alert('Chờ kết nối', 'Đang thiết lập phòng hội thoại, vui lòng thử lại sau.');
      return;
    }

    const callOfferMsg = {
      roomId: roomId,
      senderId: user?.username,
      content: `${user?.fullname || user?.username || 'Ai đó'} đang gọi video cho bạn`,
      type: 'CALL_OFFER',
    };

    stompClientRef.current.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(callOfferMsg),
    });

    // Navigate to ZegoCloud VideoCall
    navigation.navigate('VideoCall', {
      bookingId: roomId,
      userName: user?.fullname || 'User',
      isPeerToPeer: true,
    });
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.senderId === user?.username;
    const timeStr = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '';

    if (item.type === 'CALL_ENDED') {
      return (
        <View style={styles.callEventWrapper}>
          <View style={styles.callEventBadge}>
            <Icon name="video" size={14} color={theme.colors.textLight} />
            <PolyText variant="small" color={theme.colors.textLight} style={{ marginLeft: 6 }}>
              {isMe ? 'Bạn đã kết thúc cuộc gọi video' : `${targetFullname} đã kết thúc cuộc gọi video`}
            </PolyText>
          </View>
          {timeStr ? <PolyText variant="small" color={theme.colors.textLight} style={styles.callEventTime}>{timeStr}</PolyText> : null}
        </View>
      );
    }

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && <Image source={{ uri: targetAvatar }} style={styles.messageAvatar} />}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <PolyText color={isMe ? '#FFFFFF' : theme.colors.textMain}>{item.content}</PolyText>
          {timeStr ? (
            <PolyText 
              variant="small" 
              color={isMe ? 'rgba(255,255,255,0.7)' : theme.colors.textLight} 
              style={styles.messageTime}
            >
              {timeStr}
            </PolyText>
          ) : null}
        </View>
      </View>
    );
  };

  const renderHeaderRight = () => (
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.iconButton} onPress={() => Alert.alert('Gọi thoại', 'Tính năng gọi thoại đang được nâng cấp.')}>
        <Icon name="phone" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconButton} onPress={handleVideoCall}>
        <Icon name="video" size={20} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <PolyHeader 
        showBack 
        onBackPress={() => navigation.goBack()}
        rightComponent={renderHeaderRight()}
        title="" // We will use custom center header
      />
      
      {/* Overlay custom title block for header */}
      <View style={[styles.headerCenter, { top: insets.top }]}>
        <View style={styles.headerUserInfo}>
          <Image source={{ uri: targetAvatar }} style={styles.headerAvatar} />
          <View>
            <PolyText weight="bold" style={styles.headerName}>{targetFullname}</PolyText>
            <PolyText variant="small" color={theme.colors.textMuted}>
              {isConnected ? 'Đang trực tuyến' : 'Đang kết nối...'}
            </PolyText>
          </View>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
        <View style={styles.textInputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor={theme.colors.textLight}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && { backgroundColor: theme.colors.background }]} 
          onPress={handleSendMessage}
          disabled={!inputText.trim()}
        >
          <Icon name="send" size={18} color={inputText.trim() ? "#FFFFFF" : theme.colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Incoming Call Overlay */}
      {incomingCall && (
        <View style={styles.incomingCallOverlay}>
          <View style={styles.incomingCallCard}>
            <View style={styles.incomingAvatarWrapper}>
              <Image source={{ uri: targetAvatar }} style={styles.incomingAvatar} />
            </View>
            <PolyText weight="bold" style={styles.incomingName}>{targetFullname}</PolyText>
            <PolyText color={theme.colors.textLight} style={styles.incomingLabel}>Đang gọi video cho bạn...</PolyText>
            
            <View style={styles.incomingActions}>
              <TouchableOpacity 
                style={[styles.callActionBtn, styles.callRejectBtn]} 
                onPress={() => {
                  setIncomingCall(null);
                  if (!user) return;
                  stompClientRef.current?.publish({
                    destination: '/app/chat.sendMessage',
                    body: JSON.stringify({ roomId, senderId: user.username, content: "Đã từ chối cuộc gọi", type: "CALL_REJECT" })
                  });
                }}
              >
                <Icon name="phone-off" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.callActionBtn, styles.callAcceptBtn]} 
                onPress={() => {
                  setIncomingCall(null);
                  navigation.navigate('VideoCall', {
                    bookingId: roomId,
                    userName: user?.fullname || 'User',
                    isPeerToPeer: true,
                  });
                }}
              >
                <Icon name="video" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: theme.spacing.sm,
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
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    marginRight: theme.spacing.sm,
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
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callEventWrapper: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  callEventBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  callEventTime: {
    fontSize: 10,
    marginTop: 4,
  },
  incomingCallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  incomingCallCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  incomingAvatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    padding: 2,
  },
  incomingAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  incomingName: {
    fontSize: 20,
    marginBottom: 8,
  },
  incomingLabel: {
    marginBottom: 32,
  },
  incomingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  callActionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callRejectBtn: {
    backgroundColor: theme.colors.danger,
  },
  callAcceptBtn: {
    backgroundColor: theme.colors.success,
  },
});
