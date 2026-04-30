import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { THEME } from '../../theme/theme';

interface KCardProps {
  children: React.ReactNode;
  variant?: 'flat' | 'elevated' | 'glass' | 'outline';
  style?: ViewStyle;
}

export const KCard: React.FC<KCardProps> = ({ children, variant = 'flat', style }) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'glass':
        return styles.glass;
      case 'outline':
        return styles.outline;
      default:
        return styles.flat;
    }
  };

  return <View style={[styles.base, getVariantStyles(), style]}>{children}</View>;
};

const styles = StyleSheet.create({
  base: {
    padding: THEME.spacing.md,
    borderRadius: THEME.radius.lg,
  },
  flat: {
    backgroundColor: THEME.colors.surface,
  },
  elevated: {
    backgroundColor: THEME.colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glass: {
    backgroundColor: THEME.colors.glass,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
});
