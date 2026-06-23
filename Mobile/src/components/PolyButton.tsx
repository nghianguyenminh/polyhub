import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { useAppTheme } from '../store/themeStore';
import { PolyText } from './PolyText';

// Optional: if expo-linear-gradient is installed later, we can replace this with a real gradient
// import { LinearGradient } from 'expo-linear-gradient';

interface PolyButtonProps extends TouchableOpacityProps {
  title?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const PolyButton: React.FC<PolyButtonProps> = ({
  title,
  variant = 'primary',
  isLoading = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const { theme, styles } = useAppTheme(createStyles);
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      style={[
        styles.button,
        isPrimary && styles.primary,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={isPrimary ? '#FFF' : theme.colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          {title && (
            <PolyText
              weight="semibold"
              style={[
                styles.text,
                isPrimary && styles.textPrimary,
                isOutline && styles.textOutline,
                isGhost && styles.textGhost,
                isDisabled && styles.textDisabled,
              ]}
            >
              {title}
            </PolyText>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  button: {
    height: 48,
    borderRadius: theme.borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.primaryGlow,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    fontSize: theme.typography.sizes.body,
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textGhost: {
    color: theme.colors.textMuted,
  },
  textDisabled: {
    // optional subtle change
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
});
