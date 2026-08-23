import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../store/themeStore';

interface PolyTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const PolyText: React.FC<PolyTextProps> = ({
  variant = 'body',
  weight = 'regular',
  color,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const { theme } = useAppTheme();
  const finalColor = color || theme.colors.textMain;

  return (
    <Text
      style={[
        styles.base,
        {
          fontSize: theme?.typography?.sizes?.[variant] || 16,
          fontFamily: theme?.typography?.fontFamily?.[weight],
          color: finalColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    // any base text styles
  },
});
