import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { THEME } from '../../theme/theme';

interface KButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const KButton: React.FC<KButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return { backgroundColor: THEME.colors.surfaceLight };
      case 'outline':
        return { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.colors.primary };
      case 'ghost':
        return { backgroundColor: 'transparent' };
      case 'danger':
        return { backgroundColor: THEME.colors.error };
      default:
        return { backgroundColor: THEME.colors.primary };
    }
  };

  const getLabelStyle = () => {
    if (variant === 'outline') return { color: THEME.colors.primary };
    if (variant === 'ghost') return { color: THEME.colors.textSecondary };
    return { color: THEME.colors.textPrimary };
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 };
      case 'lg':
        return { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 16 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        getVariantStyles(),
        getSizeStyles(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? THEME.colors.primary : '#FFF'} />
      ) : (
        <Text style={[styles.label, getLabelStyle(), textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.5,
  },
});
