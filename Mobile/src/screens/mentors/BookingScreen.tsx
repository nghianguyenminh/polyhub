import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import api, { getApiBaseUrl } from '../../services/api';

const Icon = Feather as any;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DayAvailability {
  date: string;
  dayOfWeek: number;
  isAvailable: boolean;
  slots: { startTime: string; endTime: string }[];
  busySlots: { startTime: string; endTime: string; status: string }[];
}

export const BookingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { mentor } = route.params;

  const [loading, setLoading] = useState(true);
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);

  // Form states
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState<number>(30);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [hasManuallySelectedTime, setHasManuallySelectedTime] = useState(false);

  // Timepicker modal state
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [tempHour, setTempHour] = useState('09');
  const [tempMin, setTempMin] = useState('00');

  // Validation feedback
  const [validationMsg, setValidationMsg] = useState({ text: '', isValid: false });
  const [lockStatus, setLockStatus] = useState<{ locked: boolean; message: string; expiresAt?: string } | null>(null);

  useEffect(() => {
    if (mentor?.user?.username) {
      loadAvailability();
    }
  }, [mentor]);

  const loadAvailability = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/api/bookings/mentor/${mentor.user.username}/availability`);
      const data = response.data;
      setAvailability(data);
      const firstAvailable = data.find((d: DayAvailability) => d.isAvailable);
      if (firstAvailable) {
        setSelectedDay(firstAvailable);
      }
    } catch (err: any) {
      console.error('Failed to load mentor availability', err);
      setError(err.message || 'Không thể tải lịch của Mentor. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getEarliestAvailableTime = (day: DayAvailability, dur: number): string | null => {
    if (!day || day.slots.length === 0) return null;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const isToday = day.date === todayStr;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const slot of day.slots) {
      const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
      const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
      const slotStartMin = slotSh * 60 + slotSm;
      const slotEndMin = slotEh * 60 + slotEm;

      const searchStartMin = isToday ? Math.max(slotStartMin, currentMinutes + 5) : slotStartMin;

      for (let timeMin = searchStartMin; timeMin + dur <= slotEndMin; timeMin += 5) {
        const testEndMin = timeMin + dur;
        let isOverlap = false;

        for (const busy of day.busySlots) {
          const [busySh, busySm] = busy.startTime.split(':').map(Number);
          const [busyEh, busyEm] = busy.endTime.split(':').map(Number);
          const busyStartMin = busySh * 60 + busySm;
          const busyEndMin = busyEh * 60 + busyEm;

          if (timeMin < busyEndMin && testEndMin > busyStartMin) {
            isOverlap = true;
            break;
          }
        }

        if (!isOverlap) {
          const h = Math.floor(timeMin / 60);
          const m = timeMin % 60;
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }
    }
    return null;
  };

  // Suggest earliest time when selectedDay or duration changes, if not manual
  useEffect(() => {
    if (selectedDay && !hasManuallySelectedTime) {
      const suggested = getEarliestAvailableTime(selectedDay, duration);
      if (suggested) {
        setStartTime(suggested);
        setError('');
      } else {
        setValidationMsg({ text: 'Ngày được chọn đã bận hoàn toàn hoặc không còn giờ rảnh.', isValid: false });
      }
    }
  }, [selectedDay, duration, hasManuallySelectedTime]);

  // Validation loop
  useEffect(() => {
    if (!selectedDay || !startTime) {
      setValidationMsg({ text: '', isValid: false });
      return;
    }

    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = startMinutes + duration;

      const eh = Math.floor(endMinutes / 60);
      const em = endMinutes % 60;
      const endTimeStr = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      const todayStr = new Date().toLocaleDateString('en-CA');
      if (selectedDay.date === todayStr) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (startMinutes < currentMinutes) {
          setValidationMsg({
            text: `Giờ bắt đầu (${startTime}) đã trôi qua. Vui lòng chọn khung giờ trong tương lai.`,
            isValid: false
          });
          return;
        }
      }

      let isWithinRange = false;
      for (const slot of selectedDay.slots) {
        const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
        const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
        const slotStartMin = slotSh * 60 + slotSm;
        const slotEndMin = slotEh * 60 + slotEm;

        if (startMinutes >= slotStartMin && endMinutes <= slotEndMin) {
          isWithinRange = true;
          break;
        }
      }

      if (!isWithinRange) {
        setValidationMsg({
          text: `Khung giờ ${startTime} - ${endTimeStr} nằm ngoài lịch rảnh của Mentor.`,
          isValid: false
        });
        return;
      }

      for (const busy of selectedDay.busySlots) {
        const [busySh, busySm] = busy.startTime.split(':').map(Number);
        const [busyEh, busyEm] = busy.endTime.split(':').map(Number);
        const busyStartMin = busySh * 60 + busySm;
        const busyEndMin = busyEh * 60 + busyEm;

        if (startMinutes < busyEndMin && endMinutes > busyStartMin) {
          setValidationMsg({
            text: `Khung giờ trùng với lịch đã bận (${busy.startTime} - ${busy.endTime}).`,
            isValid: false
          });
          return;
        }
      }

      setValidationMsg({
        text: `Thời gian hợp lệ: ${startTime} – ${endTimeStr}`,
        isValid: true
      });

    } catch (e) {
      setValidationMsg({ text: 'Thời gian nhập không hợp lệ.', isValid: false });
    }
  }, [selectedDay, startTime, duration]);

  useEffect(() => {
    if (!selectedDay || !startTime || !validationMsg.isValid) {
      setLockStatus(null);
      return;
    }

    const lockTimer = setTimeout(async () => {
      try {
        const response = await api.post('/api/bookings/lock-slot', {
          mentorUsername: mentor.user?.username,
          date: selectedDay.date,
          startTime: startTime
        });
        const data = response.data;
        if (data.locked) {
          setLockStatus({
            locked: true,
            message: 'Khung giờ này đã được giữ chỗ riêng cho bạn trong 3 phút.',
            expiresAt: data.expiresAt
          });
        } else {
          setLockStatus({
            locked: false,
            message: data.message || 'Lưu ý: Bạn đang đặt lịch ngoài khung giờ ưu tiên, vị trí chọn không được khóa bảo vệ.'
          });
        }
      } catch (err: any) {
        setLockStatus({
          locked: false,
          message: err.response?.data?.error || err.message || 'Khung giờ này đã bị khóa giữ chỗ bởi một người dùng khác.'
        });
        setValidationMsg({ text: 'Khung giờ này đang bị người khác giữ chỗ.', isValid: false });
      }
    }, 600);

    return () => clearTimeout(lockTimer);
  }, [selectedDay?.date, startTime, validationMsg.isValid, mentor.user?.username]);

  const handleSubmit = async () => {
    if (!selectedDay || !validationMsg.isValid) return;

    setSubmitting(true);
    setError('');

    try {
      await api.post('/api/bookings', {
        mentorUsername: mentor.user?.username,
        bookingDate: selectedDay.date,
        startTime: startTime,
        duration: duration,
        note: note.trim(),
      });

      Alert.alert('Thành công', 'Đặt lịch hẹn thành công! Đang chuyển hướng...', [
        { text: 'OK', onPress: () => navigation.navigate('Lịch hẹn') }
      ]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  const getDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[day];
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatFullDateVietnamese = (dateStr: string) => {
    const d = new Date(dateStr);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${dayNames[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const openTimePicker = () => {
    const [h, m] = startTime.split(':');
    setTempHour(h || '09');
    setTempMin(m || '00');
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    const chosenTime = `${tempHour}:${tempMin}`;
    setStartTime(chosenTime);
    setHasManuallySelectedTime(true);
    setTimePickerVisible(false);
  };

  // Helper rendering for Timeline ticks
  const renderTimelineTicks = () => {
    if (!selectedDay) return null;
    const ticks = [];
    const minStart = 480;  // 08:00
    const minEnd = 1260;   // 21:00
    const totalMins = minEnd - minStart;

    // Render every 60 minutes
    for (let time = minStart; time <= minEnd; time += 60) {
      const pct = (time - minStart) / totalMins;
      const h = Math.floor(time / 60);
      const label = `${String(h).padStart(2, '0')}:00`;
      ticks.push(
        <View key={time} style={[styles.tickItem, { left: `${pct * 100}%` }]}>
          <View style={styles.tickLine} />
          <PolyText variant="small" color={theme.colors.textLight} style={styles.tickLabel}>
            {label}
          </PolyText>
        </View>
      );
    }
    return ticks;
  };

  const renderTimelineBar = () => {
    if (!selectedDay) return null;
    const minStart = 480;  // 08:00
    const minEnd = 1260;   // 21:00
    const total = minEnd - minStart;

    return (
      <View style={styles.timelineBarContainer}>
        {/* Gray Base */}
        <View style={styles.timelineBaseLine} />

        {/* Free slots (Green) */}
        {selectedDay.slots.map((s, idx) => {
          const [sh, sm] = s.startTime.split(':').map(Number);
          const [eh, em] = s.endTime.split(':').map(Number);
          const sMin = sh * 60 + sm - minStart;
          const eMin = eh * 60 + em - minStart;
          const leftPct = (sMin / total) * 100;
          const widthPct = ((eMin - sMin) / total) * 100;

          return (
            <View
              key={`free-${idx}`}
              style={[
                styles.timelineSlot,
                styles.timelineFree,
                { left: `${leftPct}%`, width: `${widthPct}%` }
              ]}
            />
          );
        })}

        {/* Busy slots (Red) */}
        {selectedDay.busySlots.map((b, idx) => {
          const [sh, sm] = b.startTime.split(':').map(Number);
          const [eh, em] = b.endTime.split(':').map(Number);
          const sMin = sh * 60 + sm - minStart;
          const eMin = eh * 60 + em - minStart;
          const leftPct = (sMin / total) * 100;
          const widthPct = ((eMin - sMin) / total) * 100;

          return (
            <View
              key={`busy-${idx}`}
              style={[
                styles.timelineSlot,
                styles.timelineBusy,
                { left: `${leftPct}%`, width: `${widthPct}%` }
              ]}
            />
          );
        })}
      </View>
    );
  };

  const getAvatarUri = () => {
    const avatar = mentor.user?.avatar;
    if (!avatar || avatar === 'default.png') {
      return `https://ui-avatars.com/api/?name=${mentor.fullname}&background=random`;
    }
    if (avatar.startsWith('http')) return avatar;
    return `${getApiBaseUrl()}${avatar}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <PolyHeader title="Đặt lịch hẹn" showBack onBackPress={() => navigation.goBack()} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <PolyText color={theme.colors.textMuted} style={{ marginTop: 12 }}>
            Đang tải lịch của Mentor...
          </PolyText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <PolyHeader title="Đặt lịch hẹn" showBack onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mentor Info */}
        <PolyCard style={styles.mentorCard}>
          <Image source={{ uri: getAvatarUri() }} style={styles.mentorAvatar} />
          <View style={styles.mentorMeta}>
            <PolyText weight="bold" variant="h3">{mentor.fullname}</PolyText>
            <PolyText variant="caption" color={theme.colors.textMuted}>
              {mentor.user?.major || 'Mentor'}
            </PolyText>
          </View>
        </PolyCard>

        {error ? (
          <View style={styles.errorBox}>
            <Icon name="alert-circle" size={18} color={theme.colors.danger} />
            <PolyText color={theme.colors.danger} style={{ marginLeft: 8, flex: 1 }}>{error}</PolyText>
          </View>
        ) : null}

        {/* Step 1: Select Day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionNum}><PolyText color="#FFF" weight="bold" variant="small">1</PolyText></View>
            <PolyText weight="bold">Chọn ngày hẹn (14 ngày tới)</PolyText>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysList}>
            {availability.map((day) => {
              const isSelected = selectedDay?.date === day.date;
              return (
                <TouchableOpacity
                  key={day.date}
                  disabled={!day.isAvailable}
                  style={[
                    styles.dayBtn,
                    isSelected && styles.dayBtnSelected,
                    !day.isAvailable && styles.dayBtnDisabled
                  ]}
                  onPress={() => {
                    setSelectedDay(day);
                    setHasManuallySelectedTime(false);
                    setError('');
                  }}
                >
                  <PolyText
                    weight="bold"
                    color={isSelected ? '#FFF' : day.isAvailable ? theme.colors.textMain : theme.colors.textLight}
                  >
                    {getDayLabel(day.date)}
                  </PolyText>
                  <PolyText
                    variant="caption"
                    color={isSelected ? '#FFF' : day.isAvailable ? theme.colors.textMuted : theme.colors.textLight}
                    style={{ marginTop: 4 }}
                  >
                    {formatDateLabel(day.date)}
                  </PolyText>
                  {!day.isAvailable && (
                    <View style={styles.busyLabelBadge}>
                      <PolyText variant="small" color={theme.colors.textLight} style={{ fontSize: 9 }}>
                        Bận
                      </PolyText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {selectedDay && (
          <>
            {/* Step 2: Timeline Chart */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><PolyText color="#FFF" weight="bold" variant="small">2</PolyText></View>
                <PolyText weight="bold">Biểu đồ rảnh/bận trong ngày</PolyText>
              </View>

              <PolyCard style={styles.timelineCard}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.timelineInner}>
                    {renderTimelineBar()}
                    <View style={styles.ticksContainer}>
                      {renderTimelineTicks()}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                    <PolyText variant="small" color={theme.colors.textMuted}>Lịch rảnh</PolyText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                    <PolyText variant="small" color={theme.colors.textMuted}>Đã bận</PolyText>
                  </View>
                </View>
              </PolyCard>
            </View>

            {/* Step 3 & 4: Start Time & Duration */}
            <View style={styles.rowSection}>
              {/* Start Time */}
              <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionNum}><PolyText color="#FFF" weight="bold" variant="small">3</PolyText></View>
                  <PolyText weight="bold">Giờ bắt đầu</PolyText>
                </View>
                <TouchableOpacity style={styles.timeSelectBtn} onPress={openTimePicker}>
                  <Icon name="clock" size={18} color={theme.colors.primary} />
                  <PolyText weight="semibold" style={{ marginLeft: 8 }}>
                    {startTime}
                  </PolyText>
                </TouchableOpacity>
              </View>

              {/* Duration */}
              <View style={[styles.section, { flex: 1.2, marginLeft: 8 }]}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionNum}><PolyText color="#FFF" weight="bold" variant="small">4</PolyText></View>
                  <PolyText weight="bold">Thời lượng</PolyText>
                </View>
                <View style={styles.durationRow}>
                  {[20, 30, 50, 60].map((dur) => (
                    <TouchableOpacity
                      key={dur}
                      style={[
                        styles.durBtn,
                        duration === dur && styles.durBtnSelected
                      ]}
                      onPress={() => setDuration(dur)}
                    >
                      <PolyText
                        variant="caption"
                        weight="semibold"
                        color={duration === dur ? '#FFF' : theme.colors.textMuted}
                      >
                        {dur}m
                      </PolyText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Validation Banner */}
            <View style={[
              styles.validationBanner,
              validationMsg.isValid ? styles.validBanner : styles.invalidBanner
            ]}>
              <Icon
                name={validationMsg.isValid ? 'check-circle' : 'alert-triangle'}
                size={16}
                color={validationMsg.isValid ? theme.colors.success : theme.colors.danger}
              />
              <PolyText
                variant="caption"
                color={validationMsg.isValid ? theme.colors.success : theme.colors.danger}
                style={{ marginLeft: 8, flex: 1 }}
              >
                {validationMsg.text}
              </PolyText>
            </View>

            {lockStatus && (
              <View style={[
                styles.validationBanner,
                { marginTop: 10, backgroundColor: lockStatus.locked ? 'rgba(25, 135, 84, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: lockStatus.locked ? theme.colors.success : theme.colors.danger, borderWidth: 1 }
              ]}>
                <Icon
                  name={lockStatus.locked ? 'lock' : 'info'}
                  size={16}
                  color={lockStatus.locked ? theme.colors.success : theme.colors.danger}
                />
                <PolyText
                  variant="caption"
                  color={lockStatus.locked ? theme.colors.success : theme.colors.danger}
                  style={{ marginLeft: 8, flex: 1 }}
                >
                  {lockStatus.message}
                </PolyText>
              </View>
            )}

            {/* Step 5: Notes */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionNum}><PolyText color="#FFF" weight="bold" variant="small">5</PolyText></View>
                <PolyText weight="bold">Nội dung cần hỗ trợ *</PolyText>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Nêu chi tiết nội dung hoặc dự án bạn muốn Mentor tư vấn..."
                placeholderTextColor={theme.colors.textLight}
                multiline
                numberOfLines={4}
                value={note}
                onChangeText={setNote}
                maxLength={500}
              />
              <PolyText variant="small" color={theme.colors.textLight} align="right" style={{ marginTop: 4 }}>
                {note.length}/500 ký tự
              </PolyText>
            </View>

            {/* Submit Button */}
            <PolyButton
              title="Xác nhận đặt lịch"
              disabled={submitting || !validationMsg.isValid || !note.trim()}
              isLoading={submitting}
              onPress={handleSubmit}
              style={styles.submitBtn}
            />
          </>
        )}
      </ScrollView>

      {/* Simple Time Picker Modal */}
      <Modal visible={timePickerVisible} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <PolyCard style={styles.pickerBox}>
            <PolyText variant="h2" weight="bold" align="center" style={{ marginBottom: 20 }}>
              Chọn giờ bắt đầu
            </PolyText>

            <View style={styles.pickerRow}>
              {/* Hour Scroll */}
              <View style={styles.pickerCol}>
                <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }}>Giờ</PolyText>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 14 }).map((_, i) => {
                    const h = String(i + 8).padStart(2, '0'); // 08h to 21h
                    const isSelected = tempHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => setTempHour(h)}
                      >
                        <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain}>
                          {h}
                        </PolyText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <PolyText variant="h2" style={{ alignSelf: 'center', marginHorizontal: 12 }}>:</PolyText>

              {/* Minute Scroll */}
              <View style={styles.pickerCol}>
                <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }}>Phút</PolyText>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => {
                    const isSelected = tempMin === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => setTempMin(m)}
                      >
                        <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain}>
                          {m}
                        </PolyText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            <View style={styles.pickerActions}>
              <PolyButton
                variant="ghost"
                title="Hủy"
                style={{ flex: 1 }}
                onPress={() => setTimePickerVisible(false)}
              />
              <PolyButton
                variant="primary"
                title="Xác nhận"
                style={{ flex: 1, marginLeft: 12 }}
                onPress={confirmTimePicker}
              />
            </View>
          </PolyCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  mentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  mentorMeta: {
    marginLeft: theme.spacing.md,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  rowSection: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  daysList: {
    paddingVertical: 4,
  },
  dayBtn: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    ...theme.shadows.soft,
    position: 'relative',
  },
  dayBtnSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayBtnDisabled: {
    backgroundColor: '#E4E6EB',
    opacity: 0.6,
  },
  busyLabelBadge: {
    position: 'absolute',
    bottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  timelineCard: {
    padding: theme.spacing.md,
  },
  timelineInner: {
    width: 460, // Width to support 08h to 21h scroll
    height: 55,
    paddingTop: 10,
  },
  timelineBarContainer: {
    height: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  timelineBaseLine: {
    height: 6,
    backgroundColor: '#E4E6EB',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  timelineSlot: {
    height: 10,
    borderRadius: 5,
    position: 'absolute',
  },
  timelineFree: {
    backgroundColor: '#22c55e',
  },
  timelineBusy: {
    backgroundColor: '#ef4444',
  },
  ticksContainer: {
    flexDirection: 'row',
    position: 'relative',
    height: 25,
    marginTop: 6,
  },
  tickItem: {
    position: 'absolute',
    alignItems: 'center',
    width: 60,
    marginLeft: -30,
  },
  tickLine: {
    width: 1,
    height: 6,
    backgroundColor: theme.colors.divider,
  },
  tickLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  timeSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.soft,
    justifyContent: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  durBtn: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    ...theme.shadows.soft,
  },
  durBtnSelected: {
    backgroundColor: theme.colors.primary,
  },
  validationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
  },
  validBanner: {
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
  },
  invalidBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  noteInput: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    height: 100,
    color: theme.colors.textMain,
    fontSize: theme.typography.sizes.caption,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitBtn: {
    marginTop: theme.spacing.sm,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerBox: {
    width: '100%',
    maxWidth: 320,
    padding: 20,
    borderRadius: theme.borderRadius.xl,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 180,
    marginBottom: 20,
  },
  pickerCol: {
    width: 80,
    alignItems: 'center',
  },
  pickerScroll: {
    flex: 1,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primarySoft,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
});
