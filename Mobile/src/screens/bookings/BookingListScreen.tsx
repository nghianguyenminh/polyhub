import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Feather from '@expo/vector-icons/Feather';
import { theme } from '../../constants/theme';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyCard } from '../../components/PolyCard';
import { PolyText } from '../../components/PolyText';
import { PolyButton } from '../../components/PolyButton';
import { useAuthStore } from '../../store/authStore';
import api, { getApiBaseUrl } from '../../services/api';

const Icon = Feather as any;

export const BookingListScreen = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [currentRoleTab, setCurrentRoleTab] = useState<'bookings' | 'schedule'>('bookings');
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'history'>('accepted');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mentor schedule states
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [scheduleSlots, setScheduleSlots] = useState<any[]>([]);
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');
  const [activeScheduleDay, setActiveScheduleDay] = useState<number>(0); // 0 = Tất cả
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Enhanced schedule type/recurrence states
  const [scheduleType, setScheduleType] = useState<'weekly' | 'specific'>('weekly');
  const [specificDate, setSpecificDate] = useState<string | null>(null);
  const [recurrenceType, setRecurrenceType] = useState<'forever' | '1week' | '2week' | 'custom'>('forever');
  const [expireDate, setExpireDate] = useState<string | null>(null);

  // Picker modals states
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'specific' | 'expire' | null>(null);

  const [tempHour, setTempHour] = useState('09');
  const [tempMin, setTempMin] = useState('00');
  const [tempDay, setTempDay] = useState('17');
  const [tempMonth, setTempMonth] = useState('07');
  const [tempYear, setTempYear] = useState('2026');

  const isMentor = user?.role === 'MENTOR';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getDayOfWeekLabel = (day: number) => {
    return day === 8 ? 'Chủ Nhật' : `Thứ ${day}`;
  };

  useEffect(() => {
    setCurrentRoleTab('bookings');
  }, [user]);

  const loadBookings = async () => {
    setIsLoading(true);
    try {
      if (isMentor) {
        // Fetch both mentor bookings (requests) and student bookings (own appointments) concurrently
        const [mentorRes, studentRes] = await Promise.all([
          api.get('/api/bookings/mentor'),
          api.get('/api/bookings/student')
        ]);
        
        const mergedBookings = [...(mentorRes.data || []), ...(studentRes.data || [])];
        
        // Remove duplicates by ID if a booking appears in both (shouldn't happen, but safe check)
        const uniqueBookings = mergedBookings.filter(
          (value, index, self) => self.findIndex((b) => b.id === value.id) === index
        );
        
        // Sort by booking datetime descending (newest first)
        uniqueBookings.sort((a, b) => {
          const dateA = new Date(`${a.bookingDate}T${a.startTime}`);
          const dateB = new Date(`${b.bookingDate}T${b.startTime}`);
          return dateB.getTime() - dateA.getTime();
        });
        
        setBookings(uniqueBookings);
      } else {
        // Students only fetch their own appointments
        const response = await api.get('/api/bookings/student');
        const sorted = (response.data || []).sort((a: any, b: any) => {
          const dateA = new Date(`${a.bookingDate}T${a.startTime}`);
          const dateB = new Date(`${b.bookingDate}T${b.startTime}`);
          return dateB.getTime() - dateA.getTime();
        });
        setBookings(sorted);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadMentorSchedule = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/mentor/schedule');
      const slots = response.data || [];
      
      const formattedSlots = slots.map((s: any) => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime.substring(0, 5),
        endTime: s.endTime.substring(0, 5),
        specificDate: s.specificDate,
        expireDate: s.expireDate
      }));
      setScheduleSlots(formattedSlots);
      
      const days = Array.from(new Set(formattedSlots.map((s: any) => s.dayOfWeek))) as number[];
      setSelectedDays(days);
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to load mentor schedule:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadData = () => {
    if (currentRoleTab === 'schedule') {
      loadMentorSchedule();
    } else {
      loadBookings();
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentRoleTab, user])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleUpdateStatus = async (bookingId: number, status: string, reason = '') => {
    Alert.alert(
      'Xác nhận',
      `Bạn chắc chắn muốn chuyển trạng thái cuộc hẹn thành ${
        status === 'ACCEPTED' ? 'Chấp nhận' : status === 'REJECTED' ? 'Từ chối' : 'Hủy bỏ'
      }?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              setIsLoading(true);
              await api.put(`/api/bookings/${bookingId}/status`, null, {
                params: {
                  status: status,
                  rejectReason: reason || undefined,
                },
              });
              loadBookings();
            } catch (error: any) {
              console.error(error);
              Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái lịch hẹn.');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleJoinCall = async (booking: any) => {
    try {
      const response = await api.post(`/api/bookings/${booking.id}/join`);
      navigation.navigate('VideoCall', {
        bookingId: booking.id,
        userName: user?.fullname || 'User',
      });
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', error.message || 'Không thể tham gia cuộc gọi lúc này.');
    }
  };

  const getFilteredBookings = () => {
    if (activeTab === 'pending') {
      return bookings.filter((b) => b.status === 'PENDING');
    }
    if (activeTab === 'accepted') {
      return bookings.filter((b) => b.status === 'ACCEPTED');
    }
    return bookings.filter((b) => ['COMPLETED', 'REJECTED', 'CANCELLED', 'CLOSED'].includes(b.status));
  };

  const getPartnerInfo = (booking: any) => {
    // If the booking uploader (student) matches the current user's username,
    // the current user is the student, so the partner is the mentor.
    // Otherwise, the partner is the student.
    const isCurrentUserStudent = booking.student?.username === user?.username;
    const targetUser = isCurrentUserStudent ? booking.mentor : booking.student;
    
    return {
      fullname: targetUser?.fullname || 'N/A',
      major: targetUser?.major || 'Đang cập nhật',
      avatar: targetUser?.avatar,
      isStudentView: isCurrentUserStudent,
    };
  };

  const getAvatarUri = (avatarName: string | undefined) => {
    if (!avatarName || avatarName === 'default.png') {
      return 'https://i.pravatar.cc/150?img=12';
    }
    if (avatarName.startsWith('http')) return avatarName;
    return `${getApiBaseUrl()}${avatarName}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return theme.colors.warning;
      case 'ACCEPTED': return theme.colors.success;
      case 'COMPLETED': return theme.colors.primary;
      case 'CLOSED': return theme.colors.textMuted;
      case 'REJECTED':
      case 'CANCELLED':
      default:
        return theme.colors.danger;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'ACCEPTED': return 'Sắp diễn ra';
      case 'COMPLETED': return 'Hoàn thành';
      case 'CLOSED': return 'Đã kết thúc';
      case 'REJECTED': return 'Từ chối';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const handleToggleDay = (day: number) => {
    setIsDirty(true);
    if (selectedDays.includes(day)) {
      const updatedDays = selectedDays.filter(d => d !== day);
      setSelectedDays(updatedDays);
      setScheduleSlots(scheduleSlots.filter(s => s.dayOfWeek !== day || s.specificDate));
      if (activeScheduleDay === day) {
        setActiveScheduleDay(0);
      }
    } else {
      const updatedDays = [...selectedDays, day];
      setSelectedDays(updatedDays);
      setActiveScheduleDay(day);
    }
  };

  const openTimePicker = (target: 'start' | 'end') => {
    setTimePickerTarget(target);
    const currentVal = target === 'start' ? newSlotStart : newSlotEnd;
    const [h, m] = currentVal.split(':');
    setTempHour(h);
    setTempMin(m);
    setTimePickerVisible(true);
  };

  const confirmTimePicker = () => {
    const formatted = `${tempHour}:${tempMin}`;
    if (timePickerTarget === 'start') {
      setNewSlotStart(formatted);
    } else if (timePickerTarget === 'end') {
      setNewSlotEnd(formatted);
    }
    setTimePickerVisible(false);
  };

  const openDatePicker = (target: 'specific' | 'expire') => {
    setDatePickerTarget(target);
    const today = new Date();
    const currentVal = target === 'specific' ? specificDate : expireDate;
    if (currentVal) {
      const parts = currentVal.split('-');
      setTempYear(parts[0]);
      setTempMonth(parts[1]);
      setTempDay(parts[2]);
    } else {
      setTempYear(String(today.getFullYear()));
      setTempMonth(String(today.getMonth() + 1).padStart(2, '0'));
      setTempDay(String(today.getDate()).padStart(2, '0'));
    }
    setDatePickerVisible(true);
  };

  const confirmDatePicker = () => {
    const y = Number(tempYear);
    const m = Number(tempMonth) - 1;
    const d = Number(tempDay);
    const dateObj = new Date(y, m, d);
    if (dateObj.getFullYear() !== y || dateObj.getMonth() !== m || dateObj.getDate() !== d) {
      Alert.alert('Lỗi', 'Ngày đã chọn không hợp lệ.');
      return;
    }

    const formatted = `${tempYear}-${tempMonth}-${tempDay}`;
    if (datePickerTarget === 'specific') {
      setSpecificDate(formatted);
    } else if (datePickerTarget === 'expire') {
      setExpireDate(formatted);
    }
    setDatePickerVisible(false);
  };

  const handleAddSlot = () => {
    if (!newSlotStart || !newSlotEnd) return;
    
    const timeRegex = /^[0-2][0-9]:[0-5][0-9]$/;
    if (!timeRegex.test(newSlotStart) || !timeRegex.test(newSlotEnd)) {
      Alert.alert('Lỗi', 'Định dạng giờ không hợp lệ. Vui lòng nhập dạng HH:MM (ví dụ: 09:00).');
      return;
    }

    const [sh, sm] = newSlotStart.split(':').map(Number);
    const [eh, em] = newSlotEnd.split(':').map(Number);
    
    if (sh * 60 + sm >= eh * 60 + em) {
      Alert.alert('Lỗi', 'Thời gian bắt đầu phải trước thời gian kết thúc.');
      return;
    }

    let calculatedDayOfWeek = activeScheduleDay === 0 ? 2 : activeScheduleDay;
    let slotSpecificDate = null;
    let slotExpireDate = null;

    if (scheduleType === 'specific') {
      if (!specificDate) {
        Alert.alert('Lỗi', 'Vui lòng chọn ngày rảnh cụ thể.');
        return;
      }
      slotSpecificDate = specificDate;
      const d = new Date(specificDate);
      let dayVal = d.getDay(); // 0 = Sun, 1 = Mon ...
      calculatedDayOfWeek = dayVal === 0 ? 8 : dayVal + 1; // 2 = Mon, 8 = Sun
    } else {
      if (recurrenceType === '1week') {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        slotExpireDate = d.toISOString().split('T')[0];
      } else if (recurrenceType === '2week') {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        slotExpireDate = d.toISOString().split('T')[0];
      } else if (recurrenceType === 'custom') {
        if (!expireDate) {
          Alert.alert('Lỗi', 'Vui lòng chọn ngày hết hạn.');
          return;
        }
        slotExpireDate = expireDate;
      }
    }

    // Check overlap
    const daySlots = scheduleSlots.filter(s => {
      if (slotSpecificDate && s.specificDate) {
        return s.specificDate === slotSpecificDate;
      } else if (!slotSpecificDate && !s.specificDate) {
        return s.dayOfWeek === calculatedDayOfWeek;
      } else {
        const spec = slotSpecificDate ? slotSpecificDate : s.specificDate;
        const rec = slotSpecificDate ? s : { dayOfWeek: calculatedDayOfWeek, expireDate: slotExpireDate };
        
        const specDateObj = new Date(spec);
        let specDayVal = specDateObj.getDay();
        const specDayOfWeek = specDayVal === 0 ? 8 : specDayVal + 1;

        if (specDayOfWeek === rec.dayOfWeek) {
          if (!rec.expireDate || !(new Date(spec).getTime() > new Date(rec.expireDate).getTime())) {
            return true;
          }
        }
        return false;
      }
    });

    const newStartMin = sh * 60 + sm;
    const newEndMin = eh * 60 + em;

    for (const slot of daySlots) {
      const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
      const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
      const startMin = slotSh * 60 + slotSm;
      const endMin = slotEh * 60 + slotEm;
      if (newStartMin < endMin && newEndMin > startMin) {
        Alert.alert('Lỗi', 'Khung giờ rảnh bị trùng lặp với một khung giờ đã cài đặt.');
        return;
      }
    }

    const newSlot = {
      dayOfWeek: calculatedDayOfWeek,
      startTime: newSlotStart,
      endTime: newSlotEnd,
      specificDate: slotSpecificDate,
      expireDate: slotExpireDate
    };

    setScheduleSlots([...scheduleSlots, newSlot].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setIsDirty(true);
  };

  const handleRemoveSlot = (index: number) => {
    setScheduleSlots(scheduleSlots.filter((_, idx) => idx !== index));
    setIsDirty(true);
  };

  const handleSaveSchedule = async () => {
    setIsSavingSchedule(true);
    try {
      await api.post('/api/mentor/schedule', scheduleSlots);
      Alert.alert('Thành công', 'Lưu cấu hình lịch rảnh thành công!');
      setIsDirty(false);
      loadMentorSchedule();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', error.response?.data?.error || error.message || 'Lưu cấu hình thất bại');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const renderBookingItem = ({ item }: { item: any }) => {
    const partner = getPartnerInfo(item);
    const isStudentView = partner.isStudentView;
    
    const dateLabel = new Date(item.bookingDate).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return (
      <PolyCard style={styles.bookingCard}>
        {/* Header with status badge */}
        <View style={styles.cardHeader}>
          <View style={styles.partnerInfo}>
            <Image source={{ uri: getAvatarUri(partner.avatar) }} style={styles.partnerAvatar} />
            <View style={styles.partnerText}>
              <PolyText weight="bold" variant="h3">{partner.fullname}</PolyText>
              <PolyText variant="small" color={theme.colors.textMuted}>
                {partner.major} {isMentor && `(${isStudentView ? 'Đặt lịch' : 'Được đặt'})`}
              </PolyText>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <PolyText variant="small" weight="bold" color={getStatusColor(item.status)}>
              {getStatusText(item.status)}
            </PolyText>
          </View>
        </View>

        {/* Date and Time Details */}
        <View style={styles.detailsBlock}>
          <View style={styles.detailRow}>
            <Icon name="calendar" size={16} color={theme.colors.primary} />
            <PolyText variant="caption" style={styles.detailText}>{dateLabel}</PolyText>
          </View>
          <View style={styles.detailRow}>
            <Icon name="clock" size={16} color={theme.colors.primary} />
            <PolyText variant="caption" style={styles.detailText}>
              {item.startTime} – {item.endTime} ({item.duration} phút)
            </PolyText>
          </View>
          {item.note ? (
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <Icon name="file-text" size={16} color={theme.colors.textLight} style={{ marginTop: 2 }} />
              <PolyText variant="caption" color={theme.colors.textMuted} style={[styles.detailText, { fontStyle: 'italic' }]}>
                "{item.note}"
              </PolyText>
            </View>
          ) : null}
          {item.rejectionReason ? (
            <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
              <Icon name="alert-triangle" size={16} color={theme.colors.danger} style={{ marginTop: 2 }} />
              <PolyText variant="caption" color={theme.colors.danger} style={[styles.detailText, { fontWeight: '500' }]}>
                Chi tiết: {item.rejectionReason}
              </PolyText>
            </View>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          {item.status === 'PENDING' ? (
            !isStudentView ? (
              // Mentor pending choices (acted as Mentor)
              <>
                <PolyButton
                  variant="outline"
                  title="Từ chối"
                  style={[styles.actionBtn, styles.declineBtn]}
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      Alert.prompt(
                        'Lý do từ chối',
                        'Vui lòng nhập lý do từ chối cuộc hẹn này:',
                        [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Gửi từ chối',
                            onPress: (reason?: string) => handleUpdateStatus(item.id, 'REJECTED', reason || 'Lịch bận đột xuất'),
                          },
                        ],
                        'plain-text'
                      );
                    } else {
                      Alert.alert(
                        'Từ chối lịch hẹn',
                        'Bạn có chắc chắn muốn từ chối lịch hẹn này không?',
                        [
                          { text: 'Hủy', style: 'cancel' },
                          {
                            text: 'Từ chối',
                            onPress: () => handleUpdateStatus(item.id, 'REJECTED', 'Lịch bận đột xuất'),
                          }
                        ]
                      );
                    }
                  }}
                />
                <PolyButton
                  variant="primary"
                  title="Chấp nhận"
                  style={[styles.actionBtn, { marginLeft: 8 }]}
                  onPress={() => handleUpdateStatus(item.id, 'ACCEPTED')}
                />
              </>
            ) : (
              // Student pending choices (acted as Student)
              <PolyButton
                variant="outline"
                title="Hủy lịch hẹn"
                style={styles.fullActionBtn}
                onPress={() => handleUpdateStatus(item.id, 'CANCELLED')}
              />
            )
          ) : item.status === 'ACCEPTED' ? (
            <>
              <PolyButton
                variant="outline"
                title="Hủy lịch"
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={() => handleUpdateStatus(item.id, 'CANCELLED')}
              />
              <PolyButton
                variant="primary"
                title="Tham gia gọi"
                icon={<Icon name="video" size={16} color="#FFF" />}
                style={[styles.actionBtn, { marginLeft: 8 }]}
                onPress={() => handleJoinCall(item)}
              />
            </>
          ) : null}
        </View>
      </PolyCard>
    );
  };

  const renderScheduleSlot = (slot: any, index: number) => {
    let typeLabel = '';
    let typeColor = theme.colors.textMuted;
    
    if (slot.specificDate) {
      typeLabel = `Ngày cụ thể: ${formatDate(slot.specificDate)} (Một lần duy nhất)`;
      typeColor = theme.colors.primary;
    } else {
      const dayLabel = getDayOfWeekLabel(slot.dayOfWeek);
      if (slot.expireDate) {
        typeLabel = `${dayLabel} hàng tuần (Đến ngày ${formatDate(slot.expireDate)})`;
        typeColor = theme.colors.warning;
      } else {
        typeLabel = `${dayLabel} hàng tuần (Lặp vô hạn)`;
        typeColor = theme.colors.success || '#22c55e';
      }
    }

    return (
      <View key={index} style={styles.schSlotItem}>
        <View style={{ flex: 1 }}>
          <View style={styles.schSlotTime}>
            <Icon name="clock" size={14} color={theme.colors.primary} />
            <PolyText variant="body" style={styles.schSlotTimeText}>
              {slot.startTime} – {slot.endTime}
            </PolyText>
          </View>
          <PolyText variant="caption" style={{ marginTop: 4, color: typeColor, fontSize: 11.5 }}>
            {typeLabel}
          </PolyText>
        </View>
        <TouchableOpacity
          onPress={() => handleRemoveSlot(scheduleSlots.indexOf(slot))}
          style={styles.schSlotDel}
        >
          <Icon name="trash-2" size={16} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderScheduleConfig = () => {
    const displayedSlots = scheduleSlots.filter(s => {
      if (activeScheduleDay === 0) return true;
      return s.dayOfWeek === activeScheduleDay;
    });

    return (
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.schScrollContent}>
          <View style={styles.schCard}>
            <PolyText variant="h3" weight="bold" style={styles.schTitle}>
              Cấu hình Lịch rảnh
            </PolyText>
            <PolyText variant="caption" color={theme.colors.textMuted} style={styles.schSub}>
              Cài đặt lịch rảnh của bạn trong tuần hoặc ngày cụ thể trên lịch. Sinh viên sẽ dựa vào lịch này để đặt giờ hẹn call video.
            </PolyText>

            {/* Form thêm slot */}
            <View style={styles.schAddForm}>
              <PolyText variant="body" weight="bold" color={theme.colors.textMain} style={{ marginBottom: 12 }}>
                Tạo khung giờ rảnh mới
              </PolyText>

              {/* Segmented control for Schedule Type */}
              <View style={styles.segmentedContainer}>
                <TouchableOpacity
                  style={[styles.segmentedBtn, scheduleType === 'weekly' && styles.segmentedBtnActive]}
                  onPress={() => setScheduleType('weekly')}
                >
                  <PolyText weight={scheduleType === 'weekly' ? 'bold' : 'medium'} color={scheduleType === 'weekly' ? theme.colors.primary : theme.colors.textMuted}>
                    Lặp hàng tuần
                  </PolyText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.segmentedBtn, scheduleType === 'specific' && styles.segmentedBtnActive]}
                  onPress={() => setScheduleType('specific')}
                >
                  <PolyText weight={scheduleType === 'specific' ? 'bold' : 'medium'} color={scheduleType === 'specific' ? theme.colors.primary : theme.colors.textMuted}>
                    Ngày cụ thể
                  </PolyText>
                </TouchableOpacity>
              </View>

              {scheduleType === 'weekly' ? (
                <View style={{ marginBottom: 12 }}>
                  {/* Day of Week Selection */}
                  <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 6 }}>
                    Chọn thứ trong tuần
                  </PolyText>
                  <View style={styles.daySelectionRow}>
                    {[2, 3, 4, 5, 6, 7, 8].map((day) => {
                      const isDayActive = activeScheduleDay === day;
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setActiveScheduleDay(day)}
                          style={[styles.daySelectCircle, isDayActive && styles.daySelectCircleActive]}
                        >
                          <PolyText weight="bold" color={isDayActive ? '#FFF' : theme.colors.textMain} style={{ fontSize: 12 }}>
                            {day === 8 ? 'CN' : `T${day}`}
                          </PolyText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Recurrence selection */}
                  <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 6, marginTop: 12 }}>
                    Thời hạn hiệu lực
                  </PolyText>
                  <View style={styles.recurrenceRow}>
                    {(['forever', '1week', '2week', 'custom'] as const).map((rType) => {
                      const isRTypeActive = recurrenceType === rType;
                      let label = '';
                      if (rType === 'forever') label = 'Vô hạn';
                      else if (rType === '1week') label = '1 tuần';
                      else if (rType === '2week') label = '2 tuần';
                      else label = 'Tùy chọn';

                      return (
                        <TouchableOpacity
                          key={rType}
                          onPress={() => setRecurrenceType(rType)}
                          style={[styles.recurrenceBtn, isRTypeActive && styles.recurrenceBtnActive]}
                        >
                          <PolyText variant="small" weight="bold" color={isRTypeActive ? '#FFF' : theme.colors.textMuted}>
                            {label}
                          </PolyText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {recurrenceType === 'custom' && (
                    <View style={{ marginTop: 12 }}>
                      <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 6 }}>
                        Hết hạn sau ngày *
                      </PolyText>
                      <TouchableOpacity style={styles.dateSelectorBtn} onPress={() => openDatePicker('expire')}>
                        <Icon name="calendar" size={16} color={theme.colors.primary} />
                        <PolyText weight="semibold" style={{ marginLeft: 8 }}>
                          {expireDate ? formatDate(expireDate) : 'Chọn ngày hết hạn'}
                        </PolyText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ marginBottom: 12 }}>
                  {/* Specific Date selection */}
                  <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 6 }}>
                    Chọn ngày rảnh cụ thể *
                  </PolyText>
                  <TouchableOpacity style={styles.dateSelectorBtn} onPress={() => openDatePicker('specific')}>
                    <Icon name="calendar" size={16} color={theme.colors.primary} />
                    <PolyText weight="semibold" style={{ marginLeft: 8 }}>
                      {specificDate ? formatDate(specificDate) : 'Chọn ngày trên lịch'}
                    </PolyText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Start Time & End Time */}
              <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 6, marginTop: 4 }}>
                Chọn khung giờ rảnh (Giờ bắt đầu - Giờ kết thúc)
              </PolyText>
              <View style={styles.timePickerRow}>
                <TouchableOpacity style={styles.timeFieldBtn} onPress={() => openTimePicker('start')}>
                  <Icon name="clock" size={16} color={theme.colors.primary} />
                  <PolyText weight="semibold" style={{ marginLeft: 8 }}>
                    {newSlotStart}
                  </PolyText>
                </TouchableOpacity>
                
                <PolyText style={{ alignSelf: 'center', marginHorizontal: 6, color: theme.colors.textLight }}>–</PolyText>
                
                <TouchableOpacity style={styles.timeFieldBtn} onPress={() => openTimePicker('end')}>
                  <Icon name="clock" size={16} color={theme.colors.primary} />
                  <PolyText weight="semibold" style={{ marginLeft: 8 }}>
                    {newSlotEnd}
                  </PolyText>
                </TouchableOpacity>
              </View>

              <PolyButton
                title="Thêm khung giờ rảnh"
                icon={<Icon name="plus" size={16} color="#FFF" />}
                onPress={handleAddSlot}
                style={{ marginTop: 14 }}
              />
            </View>

            {/* Danh sách khung giờ đã cài đặt */}
            <PolyText variant="body" weight="bold" style={[styles.schStepLabel, { marginTop: 24 }]}>
              Khung giờ rảnh đã cấu hình
            </PolyText>

            {/* Tabs lọc theo ngày */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.schDayTabsScroll}>
              <View style={styles.schDayTabs}>
                {[0, 2, 3, 4, 5, 6, 7, 8].map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setActiveScheduleDay(day)}
                    style={[styles.schDayTab, activeScheduleDay === day && styles.schDayTabActive]}
                  >
                    <PolyText
                      variant="caption"
                      weight={activeScheduleDay === day ? 'bold' : 'medium'}
                      color={activeScheduleDay === day ? theme.colors.primary : theme.colors.textMuted}
                    >
                      {day === 0 ? 'Tất cả' : day === 8 ? 'CN' : `Thứ ${day}`}
                    </PolyText>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* List of slots */}
            <View style={styles.schSlotList}>
              {displayedSlots.length === 0 ? (
                <View style={styles.schEmptySlots}>
                  <Icon name="clock" size={24} color={theme.colors.textLight} />
                  <PolyText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
                    Chưa có khung giờ rảnh nào được cài đặt.
                  </PolyText>
                </View>
              ) : (
                displayedSlots.map((slot, idx) => renderScheduleSlot(slot, idx))
              )}
            </View>

            {/* Nút lưu cấu hình */}
            <View style={styles.schSaveWrap}>
              {isDirty && (
                <View style={styles.schDirtyWarning}>
                  <Icon name="alert-triangle" size={14} color={theme.colors.warning} />
                  <PolyText variant="caption" color={theme.colors.warning} style={{ marginLeft: 6 }}>
                    Bạn có thay đổi chưa lưu. Hãy nhấn "Lưu cấu hình" bên dưới.
                  </PolyText>
                </View>
              )}
              <PolyButton
                title={isSavingSchedule ? "Đang lưu..." : "Lưu cấu hình lịch rảnh"}
                isLoading={isSavingSchedule}
                onPress={handleSaveSchedule}
                style={styles.schSaveBtn}
              />
            </View>
          </View>
        </ScrollView>

        {/* Modal chọn Giờ */}
        <Modal visible={timePickerVisible} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <PolyCard style={styles.pickerBox}>
              <PolyText variant="h2" weight="bold" align="center" style={{ marginBottom: 20 }}>
                Chọn giờ
              </PolyText>
              <View style={styles.pickerRow}>
                {/* Hour */}
                <View style={styles.pickerCol}>
                  <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }}>Giờ</PolyText>
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
                          <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain}>
                            {h}
                          </PolyText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <PolyText variant="h2" style={{ alignSelf: 'center', marginHorizontal: 12 }}>:</PolyText>
                {/* Minute */}
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
                <PolyButton variant="ghost" title="Hủy" style={{ flex: 1 }} onPress={() => setTimePickerVisible(false)} />
                <PolyButton variant="primary" title="Xác nhận" style={{ flex: 1, marginLeft: 12 }} onPress={confirmTimePicker} />
              </View>
            </PolyCard>
          </View>
        </Modal>

        {/* Modal chọn Ngày */}
        <Modal visible={datePickerVisible} transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <PolyCard style={styles.pickerBox}>
              <PolyText variant="h2" weight="bold" align="center" style={{ marginBottom: 20 }}>
                Chọn ngày
              </PolyText>
              <View style={styles.pickerRow}>
                {/* Day */}
                <View style={styles.pickerCol}>
                  <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }}>Ngày</PolyText>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 31 }).map((_, i) => {
                      const d = String(i + 1).padStart(2, '0');
                      const isSelected = tempDay === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                          onPress={() => setTempDay(d)}
                        >
                          <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain}>
                            {d}
                          </PolyText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <PolyText variant="h2" style={{ alignSelf: 'center', marginHorizontal: 6 }}>/</PolyText>
                {/* Month */}
                <View style={styles.pickerCol}>
                  <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }}>Tháng</PolyText>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const m = String(i + 1).padStart(2, '0');
                      const isSelected = tempMonth === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                          onPress={() => setTempMonth(m)}
                        >
                          <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain}>
                            {m}
                          </PolyText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <PolyText variant="h2" style={{ alignSelf: 'center', marginHorizontal: 6 }}>/</PolyText>
                {/* Year */}
                <View style={[styles.pickerCol, { width: 90 }]}>
                  <PolyText weight="bold" color={theme.colors.primary} style={{ marginBottom: 6 }}>Năm</PolyText>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {['2026', '2027', '2028', '2029', '2030'].map((y) => {
                      const isSelected = tempYear === y;
                      return (
                        <TouchableOpacity
                          key={y}
                          style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
                          onPress={() => setTempYear(y)}
                        >
                          <PolyText weight={isSelected ? 'bold' : 'regular'} color={isSelected ? theme.colors.primary : theme.colors.textMain}>
                            {y}
                          </PolyText>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
              <View style={styles.pickerActions}>
                <PolyButton variant="ghost" title="Hủy" style={{ flex: 1 }} onPress={() => setDatePickerVisible(false)} />
                <PolyButton variant="primary" title="Xác nhận" style={{ flex: 1, marginLeft: 12 }} onPress={confirmDatePicker} />
              </View>
            </PolyCard>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PolyHeader title="Lịch hẹn tư vấn" />

      {/* Top Role-based tabs (only visible to MENTOR) */}
      {isMentor && (
        <View style={styles.roleTabsContainer}>
          <TouchableOpacity
            style={[styles.roleTabBtn, currentRoleTab === 'bookings' && styles.roleTabBtnActive]}
            onPress={() => setCurrentRoleTab('bookings')}
          >
            <PolyText
              weight={currentRoleTab === 'bookings' ? 'bold' : 'medium'}
              color={currentRoleTab === 'bookings' ? theme.colors.primary : theme.colors.textMuted}
            >
              Danh sách lịch hẹn
            </PolyText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleTabBtn, currentRoleTab === 'schedule' && styles.roleTabBtnActive]}
            onPress={() => setCurrentRoleTab('schedule')}
          >
            <PolyText
              weight={currentRoleTab === 'schedule' ? 'bold' : 'medium'}
              color={currentRoleTab === 'schedule' ? theme.colors.primary : theme.colors.textMuted}
            >
              Cài đặt lịch rảnh
            </PolyText>
          </TouchableOpacity>
        </View>
      )}

      {currentRoleTab === 'schedule' ? (
        renderScheduleConfig()
      ) : (
        <>
          {/* Sub filter tabs for bookings */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'accepted' && styles.tabBtnActive]}
              onPress={() => setActiveTab('accepted')}
            >
              <PolyText
                weight={activeTab === 'accepted' ? 'bold' : 'medium'}
                color={activeTab === 'accepted' ? theme.colors.primary : theme.colors.textMuted}
              >
                Sắp diễn ra
              </PolyText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pending')}
            >
              <PolyText
                weight={activeTab === 'pending' ? 'bold' : 'medium'}
                color={activeTab === 'pending' ? theme.colors.primary : theme.colors.textMuted}
              >
                Chờ duyệt
              </PolyText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
              onPress={() => setActiveTab('history')}
            >
              <PolyText
                weight={activeTab === 'history' ? 'bold' : 'medium'}
                color={activeTab === 'history' ? theme.colors.primary : theme.colors.textMuted}
              >
                Lịch sử
              </PolyText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={getFilteredBookings()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderBookingItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={
              isLoading ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="calendar" size={40} color={theme.colors.textLight} />
                  <PolyText color={theme.colors.textMuted} style={{ marginTop: 8 }}>
                    Không có cuộc hẹn nào ở trạng thái này.
                  </PolyText>
                </View>
              )
            }
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  roleTabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingVertical: 4,
  },
  roleTabBtn: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  roleTabBtnActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: theme.colors.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 40,
  },
  bookingCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  partnerText: {
    marginLeft: theme.spacing.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailsBlock: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    marginLeft: theme.spacing.md,
    color: theme.colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  actionBtn: {
    flex: 1,
    height: 40,
  },
  declineBtn: {
    borderColor: theme.colors.danger,
  },
  fullActionBtn: {
    flex: 1,
    height: 40,
    borderColor: theme.colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  // Schedule Styles
  schScrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 60,
  },
  schCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  schTitle: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.textMain,
  },
  schSub: {
    marginBottom: theme.spacing.xl,
  },
  schStepLabel: {
    color: theme.colors.textMain,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  schDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.xl,
  },
  schDayToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  schDayToggleActive: {
    borderColor: theme.colors.primarySoft,
    backgroundColor: theme.colors.primarySoft + '10',
  },
  schDayToggleText: {
    marginLeft: 6,
    color: theme.colors.textMuted,
  },
  schDayToggleTextActive: {
    color: theme.colors.primary,
  },
  schDayTabsScroll: {
    marginBottom: theme.spacing.md,
  },
  schDayTabs: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  schDayTab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  schDayTabActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.card,
  },
  schSlotList: {
    marginBottom: theme.spacing.xl,
  },
  schEmptySlots: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  schSlotItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  schSlotTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  schSlotTimeText: {
    marginLeft: 8,
    color: theme.colors.textMain,
    fontWeight: '500',
  },
  schSlotDel: {
    padding: 6,
  },
  schAddForm: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 2,
    marginBottom: 14,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md - 2,
  },
  segmentedBtnActive: {
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  daySelectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  daySelectCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySelectCircleActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  recurrenceRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  recurrenceBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  recurrenceBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    height: 40,
    paddingHorizontal: 12,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  timeFieldBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    height: 40,
    paddingHorizontal: 12,
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
    backgroundColor: theme.colors.card,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 180,
    marginBottom: 20,
  },
  pickerCol: {
    width: 70,
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
  schAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primarySoft + '10',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  schSaveWrap: {
    marginTop: theme.spacing.xl,
  },
  schDirtyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  schSaveBtn: {
    width: '100%',
  },
});
