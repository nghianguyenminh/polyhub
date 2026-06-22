import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface PolyTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
}

export const PolyText: React.FC<PolyTextProps> = ({
  variant = 'body',
  weight = 'regular',
  color = theme.colors.textMain,
  align = 'left',
  style,
  children,
  ...props
}) => {
  return (
    <Text
      style={[
        styles.base,
        {
          fontSize: theme.typography.sizes[variant],
          fontFamily: theme.typography.fontFamily[weight],
          color: color,
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
