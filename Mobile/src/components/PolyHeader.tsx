import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../store/themeStore';
import { PolyText } from './PolyText';
import Feather from '@expo/vector-icons/Feather';
const Icon = Feather as any;

interface PolyHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  leftComponent?: React.ReactNode;
}

export const PolyHeader: React.FC<PolyHeaderProps> = ({
  title = 'PolyHUB',
  showBack = false,
  onBackPress,
  rightComponent,
  leftComponent,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, styles } = useAppTheme(createStyles);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          height: 60 + insets.top,
        },
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={onBackPress} style={styles.iconButton}>
            <Icon name="arrow-left" size={24} color={theme.colors.textMain} />
          </TouchableOpacity>
        ) : leftComponent}
      </View>

      <View style={styles.center}>
        <PolyText
          variant="h3"
          weight="bold"
          color={title === 'PolyHUB' ? theme.colors.primary : theme.colors.textMain}
          numberOfLines={1}
        >
          {title}
        </PolyText>
      </View>

      <View style={styles.right}>
        {rightComponent}
      </View>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 10,
    ...theme.shadows.soft,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
  },
  center: {
    flex: 2,
    alignItems: 'center',
  },
  right: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rightIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: theme.spacing.sm,
    marginLeft: -theme.spacing.sm,
  },
  iconButtonCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.iconBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: theme.colors.primarySoft,
  },
});
