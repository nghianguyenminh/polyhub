import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { useAppTheme } from '../../store/themeStore';
import Feather from '@expo/vector-icons/Feather';
import api from '../../services/api';
import dayjs from 'dayjs';

const Icon = Feather as any;

export const MentorBusyScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, styles } = useAppTheme(createStyles);

  // States
  const [busyType, setBusyType] = useState<'EMERGENCY' | 'PLANNED'>('EMERGENCY');
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  
  const [startHour, setStartHour] = useState('09');
  const [startMin, setStartMin] = useState('00');
  const [endHour, setEndHour] = useState('17');
  const [endMin, setEndMin] = useState('00');

  const [pickerMode, setPickerMode] = useState<'start' | 'end' | null>(null);
  const [tempHour, setTempHour] = useState('09');
  const [tempMin, setTempMin] = useState('00');

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  // Calendar generation logic
  const today = useMemo(() => dayjs(), []);
  const [currentMonth, setCurrentMonth] = useState(() => dayjs().startOf('month'));

  const daysInMonth = useMemo(() => {
    const startDay = currentMonth.day(); // 0 = Sun, 1 = Mon ...
    const totalDays = currentMonth.daysInMonth();
    
    const days: (dayjs.Dayjs | null)[] = [];
    
    // Padding for empty prefix slots
    const emptyPrefixes = startDay === 0 ? 6 : startDay - 1; // Align to Mon
    for (let i = 0; i < emptyPrefixes; i++) {
      days.push(null);
    }
    
    // Add days
    for (let d = 1; d <= totalDays; d++) {
      days.push(currentMonth.date(d));
    }
    
    return days;
  }, [currentMonth]);

  const handleDayPress = (dateStr: string) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(dateStr);
      setSelectedEndDate(null);
    } else {
      if (dayjs(dateStr).isBefore(dayjs(selectedStartDate))) {
        setSelectedStartDate(dateStr);
        setSelectedEndDate(null);
      } else {
        setSelectedEndDate(dateStr);
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handleSubmit = async () => {
    if (!selectedStartDate) {
      Alert.alert('Lỗi', 'Vui lòng chọn ngày báo bận trên lịch biểu');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do nghỉ phép / báo bận');
      return;
    }

    const startDatePart = selectedStartDate;
    const endDatePart = selectedEndDate || selectedStartDate;

    const startTimeStr = `${startDatePart}T${startHour.padStart(2, '0')}:${startMin.padStart(2, '0')}:00`;
    const endTimeStr = `${endDatePart}T${endHour.padStart(2, '0')}:${endMin.padStart(2, '0')}:00`;

    const startDateTime = dayjs(startTimeStr);
    const endDateTime = dayjs(endTimeStr);

    if (startDateTime.isAfter(endDateTime) || startDateTime.isSame(endDateTime)) {
      Alert.alert('Lỗi', 'Thời gian kết thúc phải sau thời gian bắt đầu bận');
      return;
    }

    if (startDateTime.isBefore(dayjs())) {
      Alert.alert('Lỗi', 'Thời gian báo bận không thể ở quá khứ');
      return;
    }

    if (busyType === 'PLANNED') {
      const minStart = dayjs().add(24, 'hour');
      if (startDateTime.isBefore(minStart)) {
        Alert.alert('Lỗi', 'Bận báo trước phải đăng ký trước ít nhất 24 giờ (1 ngày)');
        return;
      }
    }

    Alert.alert(
      'Xác nhận báo bận',
      'Hệ thống sẽ hủy toàn bộ lịch hẹn trùng và gửi thông báo cho sinh viên. Bạn có chắc chắn muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.post('/api/bookings/mentor/busy', {
                startTime: startTimeStr,
                endTime: endTimeStr,
                reason: `[${busyType === 'EMERGENCY' ? 'Bận đột xuất' : 'Bận báo trước'}] ${reason}`,
              });
              Alert.alert('Thành công', response.data?.message || 'Báo bận đột xuất thành công!');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Lỗi', err.response?.data?.error || err.message || 'Báo bận thất bại');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PolyHeader
        title="Báo bận đột xuất"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner cảnh báo */}
        <View style={styles.warningBanner}>
          <Icon name="alert-triangle" size={20} color="#FF9800" style={{ marginRight: 10 }} />
          <PolyText style={styles.warningText} color="#FF9800" variant="small">
            {busyType === 'EMERGENCY'
              ? 'Lưu ý: Đăng ký báo bận đột xuất (có việc gấp) sẽ hủy toàn bộ lịch đặt trùng giờ trong khoảng này.'
              : 'Lưu ý: Báo bận trước (đi du lịch/công tác) cần lên lịch trước ít nhất 1 ngày để hệ thống cập nhật cho sinh viên.'}
          </PolyText>
        </View>

        {/* Toggle loại bận */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              busyType === 'EMERGENCY' && styles.toggleButtonActive,
              { borderColor: busyType === 'EMERGENCY' ? theme.colors.danger : theme.colors.border }
            ]}
            onPress={() => setBusyType('EMERGENCY')}
            activeOpacity={0.8}
          >
            <Icon name="alert-triangle" size={18} color={busyType === 'EMERGENCY' ? theme.colors.danger : theme.colors.textMuted} />
            <PolyText weight="bold" color={busyType === 'EMERGENCY' ? theme.colors.danger : theme.colors.textMain} style={{ marginTop: 4 }}>
              Bận đột xuất
            </PolyText>
            <PolyText variant="caption" color={theme.colors.textLight} align="center" style={{ marginTop: 2, fontSize: 10.5 }}>
              Báo việc gấp, nghỉ ngay
            </PolyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              busyType === 'PLANNED' && styles.toggleButtonActive,
              { borderColor: busyType === 'PLANNED' ? theme.colors.danger : theme.colors.border }
            ]}
            onPress={() => setBusyType('PLANNED')}
            activeOpacity={0.8}
          >
            <Icon name="calendar" size={18} color={busyType === 'PLANNED' ? theme.colors.danger : theme.colors.textMuted} />
            <PolyText weight="bold" color={busyType === 'PLANNED' ? theme.colors.danger : theme.colors.textMain} style={{ marginTop: 4 }}>
              Bận báo trước
            </PolyText>
            <PolyText variant="caption" color={theme.colors.textLight} align="center" style={{ marginTop: 2, fontSize: 10.5 }}>
              Lên kế hoạch trước 1-2 ngày
            </PolyText>
          </TouchableOpacity>
        </View>

        {/* Lịch biểu self-made */}
        <View style={styles.sectionCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowBtn}>
              <Icon name="chevron-left" size={20} color={theme.colors.textMain} />
            </TouchableOpacity>
            <PolyText variant="h3" weight="bold" color={theme.colors.textMain}>
              Tháng {currentMonth.format('MM/YYYY')}
            </PolyText>
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowBtn}>
              <Icon name="chevron-right" size={20} color={theme.colors.textMain} />
            </TouchableOpacity>
          </View>

          {/* Thứ trong tuần */}
          <View style={styles.weekdaysRow}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <PolyText key={idx} style={styles.weekdayText} color={theme.colors.textLight} align="center">
                {w}
              </PolyText>
            ))}
          </View>

          {/* Ô ngày */}
          <View style={styles.daysGrid}>
            {daysInMonth.map((day, idx) => {
              if (!day) {
                return <View key={idx} style={styles.emptyDayCell} />;
              }

              const dateStr = day.format('YYYY-MM-DD');
              const isToday = day.isSame(today, 'day');
              
              const isSelectedStart = selectedStartDate === dateStr;
              const isSelectedEnd = selectedEndDate === dateStr;
              const isBetween =
                selectedStartDate &&
                selectedEndDate &&
                day.isAfter(dayjs(selectedStartDate), 'day') &&
                day.isBefore(dayjs(selectedEndDate), 'day');

              const isSelected = isSelectedStart || isSelectedEnd || isBetween;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayCell,
                    isToday && styles.todayCell,
                    isSelected && styles.selectedCell,
                    isSelectedStart && styles.selectedCellStart,
                    isSelectedEnd && styles.selectedCellEnd,
                  ]}
                  onPress={() => handleDayPress(dateStr)}
                >
                  <PolyText
                    weight={isSelected || isToday ? 'bold' : 'regular'}
                    color={isSelected ? '#FFF' : isToday ? theme.colors.primary : theme.colors.textMain}
                  >
                    {day.date()}
                  </PolyText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Chọn ngày hiển thị */}
        {selectedStartDate && (
          <View style={styles.selectedDatesWrap}>
            <PolyText color={theme.colors.textLight} variant="small">
              Ngày đã chọn:{' '}
              <PolyText weight="bold" color={theme.colors.primary}>
                {selectedStartDate}
              </PolyText>
              {selectedEndDate && (
                <>
                  {' '}đến{' '}
                  <PolyText weight="bold" color={theme.colors.primary}>
                    {selectedEndDate}
                  </PolyText>
                </>
              )}
            </PolyText>
          </View>
        )}

        {/* Khung cấu hình giờ bận */}
        <View style={styles.sectionCard}>
          <PolyText weight="bold" color={theme.colors.textMain} style={styles.sectionTitle}>
            Khung giờ bận
          </PolyText>

          <View style={styles.timeSelectRow}>
            <View style={{ flex: 1 }}>
              <PolyText variant="caption" color={theme.colors.textLight} style={{ marginBottom: 6 }}>
                Giờ bắt đầu
              </PolyText>
              <TouchableOpacity
                style={styles.timeSelectBtn}
                onPress={() => {
                  setTempHour(startHour);
                  setTempMin(startMin);
                  setPickerMode('start');
                }}
                activeOpacity={0.8}
              >
                <Icon name="clock" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <PolyText weight="bold" color={theme.colors.textMain}>
                  {startHour}:{startMin}
                </PolyText>
              </TouchableOpacity>
            </View>

            <View style={{ width: 20, alignItems: 'center', justifyContent: 'center', paddingTop: 20 }}>
              <PolyText color={theme.colors.textLight}>–</PolyText>
            </View>

            <View style={{ flex: 1 }}>
              <PolyText variant="caption" color={theme.colors.textLight} style={{ marginBottom: 6 }}>
                Giờ kết thúc
              </PolyText>
              <TouchableOpacity
                style={styles.timeSelectBtn}
                onPress={() => {
                  setTempHour(endHour);
                  setTempMin(endMin);
                  setPickerMode('end');
                }}
                activeOpacity={0.8}
              >
                <Icon name="clock" size={16} color={theme.colors.primary} style={{ marginRight: 8 }} />
                <PolyText weight="bold" color={theme.colors.textMain}>
                  {endHour}:{endMin}
                </PolyText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Lý do báo bận */}
        <View style={styles.sectionCard}>
          <PolyText weight="bold" color={theme.colors.textMain} style={styles.sectionTitle}>
            Lý do báo bận
          </PolyText>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            placeholder="Nhập lý do báo bận đột xuất (bận công tác, ốm đau...)"
            placeholderTextColor={theme.colors.textLight}
          />
        </View>

        {/* Submit */}
        <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: 16 }}>
          {loading ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : (
            <PolyButton
              title="Gửi báo bận"
              onPress={handleSubmit}
              style={{ backgroundColor: theme.colors.danger }}
            />
          )}
        </View>
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal visible={pickerMode !== null} transparent animationType="fade">
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <PolyText variant="h2" weight="bold" align="center" style={{ marginBottom: 20, color: theme.colors.textMain }}>
              {pickerMode === 'start' ? 'Chọn giờ bắt đầu' : 'Chọn giờ kết thúc'}
            </PolyText>

            <View style={styles.pickerRow}>
              {/* Hour Scroll */}
              <View style={styles.pickerCol}>
                <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }} align="center">Giờ</PolyText>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 24 }).map((_, i) => {
                    const h = String(i).padStart(2, '0');
                    const isSelected = tempHour === h;
                    return (
                      <TouchableOpacity
                        key={h}
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => setTempHour(h)}
                      >
                        <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain} align="center">
                          {h}
                        </PolyText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <PolyText variant="h2" style={{ alignSelf: 'center', marginHorizontal: 12, color: theme.colors.textMain }}>:</PolyText>

              {/* Minute Scroll */}
              <View style={styles.pickerCol}>
                <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }} align="center">Phút</PolyText>
                <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                  {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => {
                    const isSelected = tempMin === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                        onPress={() => setTempMin(m)}
                      >
                        <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain} align="center">
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
                onPress={() => setPickerMode(null)}
              />
              <PolyButton
                variant="primary"
                title="Xác nhận"
                style={{ flex: 1, marginLeft: 12 }}
                onPress={() => {
                  if (pickerMode === 'start') {
                    setStartHour(tempHour);
                    setStartMin(tempMin);
                  } else if (pickerMode === 'end') {
                    setEndHour(tempHour);
                    setEndMin(tempMin);
                  }
                  setPickerMode(null);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.08)',
    borderColor: 'rgba(255, 152, 0, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
  },
  warningText: {
    flex: 1,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekdayText: {
    width: '14.28%',
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 42,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  selectedCell: {
    backgroundColor: 'rgba(242, 113, 37, 0.25)',
    borderRadius: 0,
  },
  selectedCellStart: {
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  selectedCellEnd: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  selectedDatesWrap: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    marginBottom: 14,
  },
  timeSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.iconBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  timeInput: {
    fontSize: 16,
    color: theme.colors.textMain,
    textAlign: 'center',
    width: 30,
    fontWeight: 'bold',
    padding: 0,
  },
  reasonInput: {
    backgroundColor: theme.colors.iconBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    color: theme.colors.textMain,
    fontSize: 14.5,
    height: 80,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    borderWidth: 1,
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
    width: '100%',
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
