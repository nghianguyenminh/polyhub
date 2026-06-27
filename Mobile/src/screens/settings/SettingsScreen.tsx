import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PolyHeader } from '../../components/PolyHeader';
import { PolyText } from '../../components/PolyText';
import { useAppTheme, useThemeStore, ThemeMode } from '../../store/themeStore';
import Feather from '@expo/vector-icons/Feather';
import { useAuthStore } from '../../store/authStore';

const Icon = Feather as any;

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, styles } = useAppTheme(createStyles);
  const themeMode = useThemeStore(state => state.themeMode);
  const setThemeMode = useThemeStore(state => state.setThemeMode);
  
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { logout: storeLogout, setTransitioning } = useAuthStore();

  const handleLogout = async () => {
    setTransitioning(true);
    await new Promise(r => setTimeout(r, 1200)); // wait for logo merge
    await storeLogout();
    setTimeout(() => {
      setTransitioning(false);
    }, 800);
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <PolyText variant="h3" weight="bold" color={theme.colors.textMain}>{title}</PolyText>
    </View>
  );

  const renderSettingItem = (
    iconName: string,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    danger?: boolean
  ) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, danger && { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
        <Icon name={iconName} size={20} color={danger ? theme.colors.danger : theme.colors.textMuted} />
      </View>
      <View style={styles.itemContent}>
        <PolyText weight={danger ? 'bold' : 'medium'} color={danger ? theme.colors.danger : theme.colors.textMain}>
          {title}
        </PolyText>
        {subtitle && (
          <PolyText variant="small" color={theme.colors.textLight} style={{ marginTop: 2 }}>
            {subtitle}
          </PolyText>
        )}
      </View>
      {rightElement ? rightElement : (onPress ? <Icon name="chevron-right" size={20} color={theme.colors.textLight} /> : null)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PolyHeader
        title="Cài đặt "
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Account Section */}
        {renderSectionHeader('Tài khoản')}
        <View style={styles.sectionBlock}>
          {renderSettingItem('user', 'Thông tin cá nhân', 'Chỉnh sửa tên, số điện thoại', () => navigation.navigate('EditProfile'))}
          {renderSettingItem('lock', 'Mật khẩu và bảo mật', 'Đổi mật khẩu, xác thực 2 yếu tố', () => { })}
          {renderSettingItem('shield', 'Quyền riêng tư', 'Kiểm soát ai có thể thấy bài đăng của bạn', () => { })}
        </View>

        {/* Display Section */}
        {renderSectionHeader('Hiển thị & Tuỳ chỉnh')}
        <View style={styles.sectionBlock}>
          {renderSettingItem('moon', 'Giao diện (Theme)', 
            themeMode === 'system' ? 'Theo hệ thống' : themeMode === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng', 
            () => setShowThemeModal(true)
          )}
          {renderSettingItem('globe', 'Ngôn ngữ', 'Tiếng Việt', () => { })}
          {renderSettingItem('bell', 'Thông báo đẩy', 'Quản lý thông báo ứng dụng', undefined,
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          )}
        </View>

        {/* Support Section */}
        {renderSectionHeader('Trợ giúp & Hỗ trợ')}
        <View style={styles.sectionBlock}>
          {renderSettingItem('help-circle', 'Trung tâm trợ giúp', '', () => { })}
          {renderSettingItem('message-square', 'Báo cáo sự cố', '', () => { })}
          {renderSettingItem('info', 'Điều khoản & Chính sách', '', () => { })}
        </View>

        {/* Logout */}
        <View style={[styles.sectionBlock, { marginTop: theme.spacing.lg }]}>
          {renderSettingItem('log-out', 'Đăng xuất', 'Đăng xuất khỏi thiết bị này', handleLogout, undefined, true)}
        </View>


        <PolyText align="center" variant="caption" color={theme.colors.textLight} style={styles.versionText}>
          PolyHUB phiên bản 1.0.0
        </PolyText>
      </ScrollView>

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowThemeModal(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowThemeModal(false)}>
          <View style={styles.modalContent}>
            <PolyText variant="h3" weight="bold" style={styles.modalTitle}>Chọn giao diện</PolyText>
            
            {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
              <TouchableOpacity 
                key={mode} 
                style={styles.modalOption}
                onPress={() => {
                  setThemeMode(mode);
                  setShowThemeModal(false);
                }}
              >
                <PolyText weight={themeMode === mode ? 'bold' : 'regular'} color={themeMode === mode ? theme.colors.primary : theme.colors.textMain}>
                  {mode === 'light' ? 'Giao diện Sáng' : mode === 'dark' ? 'Giao diện Tối' : 'Theo hệ thống'}
                </PolyText>
                {themeMode === mode && <Icon name="check" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
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
  sectionHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.sm,
  },
  sectionBlock: {
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.card,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  itemContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  versionText: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  modalTitle: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.textMain,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  }
});
