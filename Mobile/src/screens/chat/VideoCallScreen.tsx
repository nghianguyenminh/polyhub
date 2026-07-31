import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { theme } from '../../constants/theme';
import Feather from '@expo/vector-icons/Feather';
import api from '../../services/api';

const Icon = Feather as any;

// ZegoCloud configuration
const APP_ID = 1435055187;
const APP_SIGN = "b4651fdf344e4930bff5005595c6c0a4b4651fdf344e4930bff5005595c6c0a4";

let ZegoUIKitPrebuiltCall: any = null;
let ONE_ON_ONE_VIDEO_CALL_CONFIG: any = null;
let isZegoSupported = false;

try {
  const ZegoPrebuilt = require('@zegocloud/zego-uikit-prebuilt-call-rn');
  ZegoUIKitPrebuiltCall = ZegoPrebuilt.ZegoUIKitPrebuiltCall;
  ONE_ON_ONE_VIDEO_CALL_CONFIG = ZegoPrebuilt.ONE_ON_ONE_VIDEO_CALL_CONFIG;
  isZegoSupported = true;
} catch (error) {
  console.warn('ZegoCloud is not supported in this environment (likely Expo Go):', error);
  isZegoSupported = false;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 30_000;      // Polling mỗi 30 giây để sync với server
const WARNING_THRESHOLD_SEC = 60;      // Hiện popup khi còn ≤ 60 giây (1 phút)
const EXTENSION_OPTIONS = [3, 5, 10, 15, 20, 25, 30]; // Mốc phút gia hạn mặc định

// ─── Types ────────────────────────────────────────────────────────────────────
interface RemainingTimeInfo {
  remainingSeconds: number;
  duration: number;
  extensionCount: number;
  maxExtensions: number;
  extendedMinutes: number;
  canExtend: boolean;
  status: string;
  startedAt: string | null;
  calculatedEndAt: string | null;
}

// ─── Helper: format seconds thành MM:SS hoặc HH:MM:SS ───────────────────────
const formatTime = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return '00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const VideoCallScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  const { bookingId, userName, isPeerToPeer } = route.params || { bookingId: 'call_test', userName: 'User', isPeerToPeer: false };
  const rawUserId = user?.username || 'user_' + Math.floor(Math.random() * 1000);
  const userId = rawUserId.replace(/[^a-zA-Z0-9_]/g, '_');

  // ── State ─────────────────────────────────────────────────────────────────
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [timeInfo, setTimeInfo] = useState<RemainingTimeInfo | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningShownForThisSession, setWarningShownForThisSession] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [extendMessage, setExtendMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [allowedOptions, setAllowedOptions] = useState<number[]>(EXTENSION_OPTIONS);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remainingSecondsRef = useRef<number>(0);
  const hasAutoClosedRef = useRef(false);
  const warningAnimValue = useRef(new Animated.Value(0)).current;
  const pulseAnimValue = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  const clearAllTimers = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (pollRef.current) clearInterval(pollRef.current);
    pulseLoopRef.current?.stop();
  }, []);

  // ── Auto-close khi hết giờ ────────────────────────────────────────────────
  const handleAutoClose = useCallback(async () => {
    if (hasAutoClosedRef.current) return;
    hasAutoClosedRef.current = true;
    clearAllTimers();
    if (!isPeerToPeer) {
      try {
        await api.put(`/api/bookings/${bookingId}/status`, {
          status: 'CLOSED',
          reason: 'Cuộc gọi video đã được tự động kết thúc do hết thời lượng.',
        });
      } catch (e) {
        console.warn('Không thể cập nhật trạng thái booking:', e);
      }
    }
    navigation.goBack();
  }, [bookingId, navigation, clearAllTimers, isPeerToPeer]);

  // ── Warning animation ─────────────────────────────────────────────────────
  const startWarningAnimation = useCallback(() => {
    warningAnimValue.setValue(0);
    Animated.timing(warningAnimValue, {
      toValue: 1,
      duration: 450,
      easing: Easing.out(Easing.back(1.4)),
      useNativeDriver: true,
    }).start();

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimValue, { toValue: 1.08, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnimValue, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current.start();
  }, [warningAnimValue, pulseAnimValue]);

  // ── Fetch extend limit từ server ──────────────────────────────────────────
  const fetchExtendLimit = useCallback(async () => {
    if (isPeerToPeer || !bookingId || bookingId === 'call_test') return;
    try {
      const response = await api.get(`/api/bookings/${bookingId}/extend-limit`);
      if (response.data && response.data.allowedOptions) {
        setAllowedOptions(response.data.allowedOptions);
      }
    } catch (e) {
      console.warn('Không thể lấy giới hạn gia hạn từ server:', e);
    }
  }, [bookingId]);

  // ── Start countdown ───────────────────────────────────────────────────────
  const startCountdown = useCallback((initialSeconds: number, currentWarningShown: boolean) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    remainingSecondsRef.current = initialSeconds;
    setRemainingSeconds(initialSeconds);

    countdownRef.current = setInterval(() => {
      const newVal = remainingSecondsRef.current - 1;
      remainingSecondsRef.current = newVal;
      setRemainingSeconds(newVal);

      if (newVal <= WARNING_THRESHOLD_SEC && newVal > 0 && !currentWarningShown) {
        setWarningShownForThisSession(true);
        setShowWarningModal(true);
        fetchExtendLimit(); // Quét và lấy các mốc gia hạn hợp lệ thời gian thực
        startWarningAnimation();
      }

      if (newVal <= 0) {
        handleAutoClose();
      }
    }, 1000);
  }, [handleAutoClose, startWarningAnimation, fetchExtendLimit]);

  // ── Fetch remaining time từ server ────────────────────────────────────────
  const fetchRemainingTime = useCallback(async () => {
    if (isPeerToPeer || !bookingId || bookingId === 'call_test') return;
    try {
      const response = await api.get(`/api/bookings/${bookingId}/remaining-time`);
      const data: RemainingTimeInfo = response.data;
      setTimeInfo(data);

      if (data.status !== 'APPROVED') {
        clearAllTimers();
        navigation.goBack();
        return;
      }

      // Nếu server có nhiều thời gian hơn local hơn 30s → ai đó vừa gia hạn → sync lại
      if (data.remainingSeconds > remainingSecondsRef.current + 30) {
        setRemainingSeconds(data.remainingSeconds);
        remainingSecondsRef.current = data.remainingSeconds;
        // Restart countdown với thời gian mới, reset warning trigger
        setWarningShownForThisSession(false);
        startCountdown(data.remainingSeconds, false);
      }
    } catch (e) {
      console.warn('Không thể lấy thời gian còn lại từ server:', e);
    }
  }, [bookingId, navigation, clearAllTimers, startCountdown]);

  // ── Initialize ────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (isPeerToPeer || !bookingId || bookingId === 'call_test') return;
      try {
        const response = await api.get(`/api/bookings/${bookingId}/remaining-time`);
        if (!mounted) return;
        const data: RemainingTimeInfo = response.data;
        setTimeInfo(data);

        if (data.remainingSeconds > 0) {
          startCountdown(data.remainingSeconds, false);
        }
        // Start polling mỗi 30s để detect gia hạn từ bên kia
        pollRef.current = setInterval(fetchRemainingTime, POLL_INTERVAL_MS);
      } catch (e) {
        console.warn('Không thể khởi tạo timer cuộc gọi:', e);
      }
    };
    init();
    return () => {
      mounted = false;
      clearAllTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fast poll (3s) khi popup đang hiển — detect gia hạn từ bên kia ————————
  useEffect(() => {
    if (isPeerToPeer || !showWarningModal || !bookingId || bookingId === 'call_test') return;
    const fastPoll = setInterval(async () => {
      try {
        const response = await api.get(`/api/bookings/${bookingId}/remaining-time`);
        const data: RemainingTimeInfo = response.data;
        // Nếu server nhiều hơn local > 30s → bên kia đã gia hạn → đóng popup + sync timer
        if (data.remainingSeconds > remainingSecondsRef.current + 30) {
          setTimeInfo(data);
          remainingSecondsRef.current = data.remainingSeconds;
          setRemainingSeconds(data.remainingSeconds);
          setWarningShownForThisSession(false);
          setShowWarningModal(false); // ← Đóng popup ở User B
          // Restart countdown với thời gian mới
          startCountdown(data.remainingSeconds, false);
        }
      } catch (_) {}
    }, 3000);
    return () => clearInterval(fastPoll);
  }, [showWarningModal, bookingId]);

  const handleExtend = useCallback(async (additionalMinutes: number) => {
    if (isPeerToPeer) return;
    setIsExtending(true);
    setExtendMessage(null);
    try {
      const response = await api.post(`/api/bookings/${bookingId}/extend`, {
        additionalMinutes,
      });
      const data = response.data;

      setTimeInfo((prev) =>
        prev
          ? {
              ...prev,
              remainingSeconds: data.remainingSeconds,
              duration: data.newDuration,
              extensionCount: data.extensionCount,
              maxExtensions: data.maxExtensions,
              extendedMinutes: data.extendedMinutes,
              canExtend: data.canExtend,
            }
          : prev
      );

      setExtendMessage({ text: `Đã gia hạn thêm ${additionalMinutes} phút!`, success: true });

      // Restart countdown với thời gian mới và reset warning trigger
      setWarningShownForThisSession(false);
      startCountdown(data.remainingSeconds, false);

      // Đóng modal sau 1.5s
      setTimeout(() => {
        setShowWarningModal(false);
        setExtendMessage(null);
        warningAnimValue.setValue(0);
        pulseLoopRef.current?.stop();
      }, 1500);
    } catch (e: any) {
      setExtendMessage({ text: e.message || 'Gia hạn thất bại. Vui lòng thử lại.', success: false });
    } finally {
      setIsExtending(false);
    }
  }, [bookingId, startCountdown, warningAnimValue]);

  // ── Handle End Call ───────────────────────────────────────────────────────
  const handleEndCallFromWarning = useCallback(() => {
    setShowWarningModal(false);
    handleAutoClose();
  }, [handleAutoClose]);

  const handleHangUp = useCallback(() => {
    clearAllTimers();
    navigation.goBack();
  }, [navigation, clearAllTimers]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const isWarningTime = remainingSeconds <= WARNING_THRESHOLD_SEC && remainingSeconds > 0;
  const isNearlyExpired = remainingSeconds <= 60 && remainingSeconds > 0;
  const timerColor = isNearlyExpired ? '#FF4444' : isWarningTime ? '#FF9800' : '#FFFFFF';
  const extensionCount = timeInfo?.extensionCount ?? 0;
  const maxExtensions = timeInfo?.maxExtensions ?? 3;
  const canExtend = timeInfo?.canExtend ?? true;

  // ── Fallback (Expo Go) ────────────────────────────────────────────────────
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

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ZegoCloud Video Call */}
      <ZegoUIKitPrebuiltCall
        appID={APP_ID}
        appSign={APP_SIGN}
        userID={userId}
        userName={userName}
        callID={bookingId.toString()}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onHangUp: handleHangUp,
        }}
      />

      {/* ── Timer Overlay (floating trên màn hình call) ── */}
      {remainingSeconds > 0 && (
        <Animated.View
          style={[
            styles.timerOverlay,
            isWarningTime && styles.timerOverlayWarning,
            isNearlyExpired && styles.timerOverlayCritical,
            isWarningTime && { transform: [{ scale: pulseAnimValue }] },
          ]}
        >
          <Icon
            name={isNearlyExpired ? 'alert-circle' : 'clock'}
            size={13}
            color={timerColor}
            style={{ marginRight: 5 }}
          />
          <PolyText weight="bold" style={[styles.timerText, { color: timerColor }]}>
            {formatTime(remainingSeconds)}
          </PolyText>
          {extensionCount > 0 && (
            <View style={styles.extBadge}>
              <PolyText style={styles.extBadgeText}>+{timeInfo?.extendedMinutes}ph</PolyText>
            </View>
          )}
        </Animated.View>
      )}

      {/* ── Warning / Extension Modal ── */}
      <Modal
        visible={showWarningModal}
        transparent
        animationType="none"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: warningAnimValue,
                transform: [
                  {
                    translateY: warningAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [70, 0],
                    }),
                  },
                  {
                    scale: warningAnimValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <Icon name="clock" size={30} color="#FF9800" />
              </View>
              <PolyText variant="h2" weight="bold" color="#FFFFFF" style={styles.modalTitle}>
                Sắp hết thời gian!
              </PolyText>
              <PolyText color="rgba(255,255,255,0.65)" align="center" style={styles.modalSubtitle}>
                Còn{' '}
                <PolyText weight="bold" color="#FF9800">
                  {formatTime(remainingSeconds)}
                </PolyText>{' '}
                trong cuộc gọi này
              </PolyText>
            </View>

            {/* Extension count info */}
            <View style={styles.extInfoBar}>
              <Icon name="refresh-cw" size={12} color="rgba(255,255,255,0.5)" />
              <PolyText style={styles.extInfoText}>
                Đã gia hạn {extensionCount}/{maxExtensions} lần
              </PolyText>
            </View>

            {/* Feedback message */}
            {extendMessage && (
              <View style={[styles.feedbackMsg, extendMessage.success ? styles.feedbackSuccess : styles.feedbackError]}>
                <Icon
                  name={extendMessage.success ? 'check-circle' : 'x-circle'}
                  size={15}
                  color={extendMessage.success ? '#4CAF50' : '#F44336'}
                  style={{ marginRight: 8 }}
                />
                <PolyText color="#FFFFFF" style={{ flex: 1, fontSize: 13 }}>
                  {extendMessage.text}
                </PolyText>
              </View>
            )}

            <View style={styles.modalDivider} />

            {/* Extension options */}
            {canExtend && allowedOptions.length > 0 ? (
              <>
                <PolyText color="rgba(255,255,255,0.7)" weight="bold" style={styles.sectionLabel}>
                  Chọn thời gian gia hạn (tối đa {timeInfo?.maxExtensions ?? 2} lần):
                </PolyText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.extButtonsRow}>
                  {allowedOptions.map((mins) => (
                    <TouchableOpacity
                      key={mins}
                      style={[styles.extBtn, isExtending && styles.extBtnDisabled]}
                      onPress={() => handleExtend(mins)}
                      disabled={isExtending}
                      activeOpacity={0.7}
                    >
                      <Icon name="plus-circle" size={18} color="#FF9800" style={{ marginBottom: 5 }} />
                      <PolyText weight="bold" color="#FFFFFF" style={styles.extBtnLabel}>
                        +{mins}
                      </PolyText>
                      <PolyText style={styles.extBtnSub} color="rgba(255,255,255,0.55)">
                        phút
                      </PolyText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <View style={styles.maxExtReached}>
                <Icon name="alert-triangle" size={16} color="#FF9800" style={{ marginRight: 8, marginTop: 1 }} />
                <PolyText color="rgba(255,255,255,0.7)" style={styles.maxExtText}>
                  Đã đạt giới hạn gia hạn ({maxExtensions} lần).{'\n'}Cuộc gọi sẽ kết thúc khi hết giờ.
                </PolyText>
              </View>
            )}

            {/* End call button */}
            <TouchableOpacity
              style={styles.endCallBtn}
              onPress={handleEndCallFromWarning}
              activeOpacity={0.8}
            >
              <Icon name="phone-off" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
              <PolyText weight="bold" color="#FFFFFF" style={{ fontSize: 15 }}>
                Kết thúc cuộc gọi
              </PolyText>
            </TouchableOpacity>

            {/* Dismiss */}
            {canExtend && (
              <TouchableOpacity style={styles.dismissBtn} onPress={() => setShowWarningModal(false)}>
                <PolyText color="rgba(255,255,255,0.4)" style={styles.dismissText}>
                  Đóng cảnh báo & tiếp tục gọi
                </PolyText>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // Timer Overlay
  timerOverlay: {
    position: 'absolute',
    top: 54,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -75,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minWidth: 150,
    justifyContent: 'center',
    zIndex: 100,
  },
  timerOverlayWarning: {
    backgroundColor: 'rgba(255,152,0,0.18)',
    borderColor: 'rgba(255,152,0,0.45)',
  },
  timerOverlayCritical: {
    backgroundColor: 'rgba(255,68,68,0.2)',
    borderColor: 'rgba(255,68,68,0.55)',
  },
  timerText: {
    fontSize: 18,
    letterSpacing: 1.5,
    fontVariant: ['tabular-nums'],
  },
  extBadge: {
    backgroundColor: '#FF9800',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  extBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalCard: {
    backgroundColor: '#191C2A',
    borderRadius: 26,
    paddingTop: 30,
    paddingHorizontal: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.28)',
    shadowColor: '#FF9800',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,152,0,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,152,0,0.35)',
  },
  modalTitle: {
    marginBottom: 8,
    fontSize: 21,
  },
  modalSubtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  extInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  extInfoText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  feedbackMsg: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(76,175,80,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(76,175,80,0.4)',
  },
  feedbackError: {
    backgroundColor: 'rgba(244,67,54,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.4)',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginVertical: 18,
  },
  sectionLabel: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  extButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  extBtn: {
    width: 80,
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,152,0,0.38)',
  },
  extBtnDisabled: {
    opacity: 0.45,
  },
  extBtnLabel: {
    fontSize: 22,
    lineHeight: 26,
  },
  extBtnSub: {
    fontSize: 11,
    marginTop: 3,
  },
  maxExtReached: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,152,0,0.08)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.22)',
  },
  maxExtText: {
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  endCallBtn: {
    backgroundColor: '#B71C1C',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  dismissBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 13,
  },

  // Fallback
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

