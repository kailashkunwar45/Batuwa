import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextInputProps 
} from 'react-native';
import { THEME } from '../../theme/theme';

interface KInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const KInput: React.FC<KInputProps> = ({
  label,
  error,
  helperText,
  containerStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        !!error && styles.inputError,
      ]}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        
        <TextInput
          style={styles.input}
          placeholderTextColor={THEME.colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      
      {!!error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        !!helperText && <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    height: 56,
    paddingHorizontal: THEME.spacing.md,
  },
  inputFocused: {
    borderColor: THEME.colors.primary,
    backgroundColor: THEME.colors.surfaceLight,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  input: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    height: '100%',
  },
  iconLeft: {
    marginRight: 10,
  },
  iconRight: {
    marginLeft: 10,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
