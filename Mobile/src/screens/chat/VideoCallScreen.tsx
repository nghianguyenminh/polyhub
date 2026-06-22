import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';

const Icon = Feather as any;

// ZegoCloud configuration
const APP_ID = 1435055187;
const APP_SIGN = "b4651fdf344e4930bff5005595c6c0a4b4651fdf344e4930bff5005595c6c0a4"; // Placeholder

let ZegoUIKitPrebuiltCall: any = null;
let ONE_ON_ONE_VIDEO_CALL_CONFIG: any = null;
let isZegoSupported = false;

try {
  // Dynamically require to prevent crashing on Expo Go where native module is missing
  const ZegoPrebuilt = require('@zegocloud/zego-uikit-prebuilt-call-rn');
  ZegoUIKitPrebuiltCall = ZegoPrebuilt.ZegoUIKitPrebuiltCall;
  ONE_ON_ONE_VIDEO_CALL_CONFIG = ZegoPrebuilt.ONE_ON_ONE_VIDEO_CALL_CONFIG;
  isZegoSupported = true;
} catch (error) {
  console.warn('ZegoCloud is not supported in this environment (likely Expo Go):', error);
  isZegoSupported = false;
}

export const VideoCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  
  const { bookingId, userName } = route.params || { bookingId: 'call_test', userName: 'User' };
  const userId = user?.username || 'user_' + Math.floor(Math.random() * 1000);

  if (!isZegoSupported) {
    return (
      <View style={styles.fallbackContainer}>
        <View style={styles.iconBox}>
          <Icon name="video-off" size={48} color={theme.colors.danger} />
        </View>
        <PolyText variant="h2" weight="bold" color="#FFFFFF" style={styles.fallbackTitle}>
          Không hỗ trợ cuộc gọi
        </PolyText>
        <PolyText color={theme.colors.textLight} align="center" style={styles.fallbackDesc}>
          ZegoCloud Video Call yêu cầu mã nguồn native nên không chạy được trên ứng dụng Expo Go. 
          Vui lòng build file APK hoặc chạy bằng Development Build.
        </PolyText>
        <PolyButton
          variant="outline"
          title="Quay lại"
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={APP_ID}
        appSign={APP_SIGN}
        userID={userId}
        userName={userName}
        callID={bookingId.toString()}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onHangUp: () => {
            navigation.goBack();
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  fallbackTitle: {
    marginBottom: 12,
  },
  fallbackDesc: {
    lineHeight: 22,
    marginBottom: 32,
  },
  backBtn: {
    width: '100%',
    maxWidth: 200,
    borderColor: '#FFFFFF',
  },
});

export default VideoCallScreen;
