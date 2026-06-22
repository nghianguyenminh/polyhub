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
  const [activeScheduleDay, setActiveScheduleDay] = useState<number>(2);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isMentor = user?.role === 'MENTOR';

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
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime.substring(0, 5),
        endTime: s.endTime.substring(0, 5)
      }));
      setScheduleSlots(formattedSlots);
      
      const days = Array.from(new Set(formattedSlots.map((s: any) => s.dayOfWeek))) as number[];
      setSelectedDays(days);
      setActiveScheduleDay(days.length > 0 ? days[0] : 2);
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
      setScheduleSlots(scheduleSlots.filter(s => s.dayOfWeek !== day));
      if (activeScheduleDay === day) {
        setActiveScheduleDay(updatedDays.length > 0 ? updatedDays[0] : 2);
      }
    } else {
      const updatedDays = [...selectedDays, day];
      setSelectedDays(updatedDays);
      setActiveScheduleDay(day);
    }
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

    const daySlots = scheduleSlots.filter(s => s.dayOfWeek === activeScheduleDay);
    const newStartMin = sh * 60 + sm;
    const newEndMin = eh * 60 + em;

    for (const slot of daySlots) {
      const [slotSh, slotSm] = slot.startTime.split(':').map(Number);
      const [slotEh, slotEm] = slot.endTime.split(':').map(Number);
      const startMin = slotSh * 60 + slotSm;
      const endMin = slotEh * 60 + slotEm;
      if (newStartMin < endMin && newEndMin > startMin) {
        Alert.alert('Lỗi', 'Khung giờ rảnh bị đè lên khung giờ rảnh khác của ngày hôm nay.');
        return;
      }
    }

    const newSlot = { dayOfWeek: activeScheduleDay, startTime: newSlotStart, endTime: newSlotEnd };
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
      const filteredSlots = scheduleSlots.filter(s => selectedDays.includes(s.dayOfWeek));
      await api.post('/api/mentor/schedule', filteredSlots);
      Alert.alert('Thành công', 'Lưu cấu hình lịch rảnh thành công!');
      setIsDirty(false);
      loadMentorSchedule();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', error.message || 'Lưu cấu hình thất bại');
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

  const renderScheduleConfig = () => {
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.schScrollContent}>
        <View style={styles.schCard}>
          <PolyText variant="h3" weight="bold" style={styles.schTitle}>
            Thiết lập Lịch rảnh hàng tuần
          </PolyText>
          <PolyText variant="caption" color={theme.colors.textMuted} style={styles.schSub}>
            Chọn các ngày bạn rảnh trong tuần và cấu hình khung giờ để sinh viên có thể đặt lịch hẹn. Bạn có thể thiết lập nhiều khung giờ khác nhau trong cùng một ngày.
          </PolyText>

          {/* Bước 1: Chọn ngày */}
          <PolyText variant="body" weight="bold" style={styles.schStepLabel}>
            1. Chọn ngày bạn rảnh trong tuần
          </PolyText>
          <View style={styles.schDayGrid}>
            {[2, 3, 4, 5, 6, 7, 8].map((day) => {
              const isActive = selectedDays.includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => handleToggleDay(day)}
                  style={[styles.schDayToggle, isActive && styles.schDayToggleActive]}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={isActive ? 'check-circle' : 'circle'}
                    size={16}
                    color={isActive ? theme.colors.primary : theme.colors.textMuted}
                  />
                  <PolyText
                    variant="caption"
                    weight={isActive ? 'bold' : 'medium'}
                    style={[styles.schDayToggleText, isActive && styles.schDayToggleTextActive]}
                  >
                    {day === 8 ? 'Chủ Nhật' : `Thứ ${day}`}
                  </PolyText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Bước 2: Cấu hình giờ */}
          <PolyText variant="body" weight="bold" style={styles.schStepLabel}>
            2. Cài đặt khung giờ rảnh cho từng ngày
          </PolyText>

          {selectedDays.length > 0 ? (
            <View>
              {/* Tabs ngày */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.schDayTabsScroll}>
                <View style={styles.schDayTabs}>
                  {[...selectedDays].sort((a, b) => a - b).map((day) => (
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
                        {day === 8 ? 'Chủ Nhật' : `Thứ ${day}`}
                      </PolyText>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Danh sách slot */}
              <View style={styles.schSlotList}>
                {scheduleSlots.filter((s) => s.dayOfWeek === activeScheduleDay).length === 0 ? (
                  <View style={styles.schEmptySlots}>
                    <Icon name="clock" size={24} color={theme.colors.textLight} />
                    <PolyText variant="caption" color={theme.colors.textMuted} style={{ marginTop: 4 }}>
                      Chưa có khung giờ. Hãy thêm ở bên dưới.
                    </PolyText>
                  </View>
                ) : (
                  scheduleSlots
                    .filter((s) => s.dayOfWeek === activeScheduleDay)
                    .map((slot, idx) => (
                      <View key={idx} style={styles.schSlotItem}>
                        <View style={styles.schSlotTime}>
                          <Icon name="clock" size={14} color={theme.colors.primary} />
                          <PolyText variant="body" style={styles.schSlotTimeText}>
                            {slot.startTime} – {slot.endTime}
                          </PolyText>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveSlot(scheduleSlots.indexOf(slot))}
                          style={styles.schSlotDel}
                        >
                          <Icon name="trash-2" size={16} color={theme.colors.danger} />
                        </TouchableOpacity>
                      </View>
                    ))
                )}
              </View>

              {/* Form thêm slot */}
              <View style={styles.schAddForm}>
                <PolyText variant="caption" weight="bold" color={theme.colors.textMain} style={{ marginBottom: theme.spacing.sm }}>
                  Thêm khung giờ rảnh mới
                </PolyText>
                
                <View style={styles.schTimeRow}>
                  <View style={styles.schTimeField}>
                    <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 4 }}>Bắt đầu</PolyText>
                    <TextInput
                      style={styles.schTimeInput}
                      value={newSlotStart}
                      onChangeText={setNewSlotStart}
                      placeholder="09:00"
                      placeholderTextColor={theme.colors.textLight}
                      maxLength={5}
                      autoCapitalize="none"
                    />
                  </View>
                  
                  <PolyText style={styles.schTimeSeparator}>–</PolyText>

                  <View style={styles.schTimeField}>
                    <PolyText variant="small" color={theme.colors.textMuted} style={{ marginBottom: 4 }}>Kết thúc</PolyText>
                    <TextInput
                      style={styles.schTimeInput}
                      value={newSlotEnd}
                      onChangeText={setNewSlotEnd}
                      placeholder="11:00"
                      placeholderTextColor={theme.colors.textLight}
                      maxLength={5}
                      autoCapitalize="none"
                    />
                  </View>

                  <TouchableOpacity onPress={handleAddSlot} style={styles.schAddBtn} activeOpacity={0.8}>
                    <Icon name="plus" size={16} color="#FFF" />
                    <PolyText variant="small" weight="bold" color="#FFF" style={{ marginLeft: 2 }}>Thêm</PolyText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.schAlert}>
              <Icon name="info" size={16} color={theme.colors.primary} />
              <PolyText variant="caption" color={theme.colors.primary} style={{ marginLeft: 8, flex: 1 }}>
                Vui lòng chọn ít nhất 1 ngày rảnh ở Bước 1 để bắt đầu cấu hình khung giờ.
              </PolyText>
            </View>
          )}

          {/* Nút lưu */}
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
  schTimeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  schTimeField: {
    flex: 1,
  },
  schTimeInput: {
    height: 40,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.textMain,
    fontSize: theme.typography.sizes.caption,
    backgroundColor: theme.colors.card,
    marginTop: 6,
  },
  schTimeSeparator: {
    alignSelf: 'center',
    color: theme.colors.textLight,
    fontWeight: 'bold',
    fontSize: 16,
    paddingBottom: 8,
  },
  schAddBtn: {
    height: 40,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
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
