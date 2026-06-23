import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../store/themeStore';

interface PolyCardProps extends ViewProps {
  noPadding?: boolean;
}

export const PolyCard: React.FC<PolyCardProps> = ({
  style,
  children,
  noPadding = false,
  ...props
}) => {
  const { theme, styles } = useAppTheme(createStyles);
  return (
    <View
      style={[
        styles.card,
        !noPadding && styles.padding,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.015)',
    ...theme.shadows.soft,
  },
  padding: {
    padding: theme.spacing.lg,
  },
});
