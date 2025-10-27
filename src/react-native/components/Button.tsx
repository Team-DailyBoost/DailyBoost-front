import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'default' ? '#fff' : '#6366f1'}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  // Variants
  default: {
    backgroundColor: '#6366f1',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  // Sizes
  defaultSize: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  smSize: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  lgSize: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  // Disabled
  disabled: {
    opacity: 0.5,
  },
  // Text styles
  text: {
    fontWeight: '600',
  },
  defaultText: {
    color: '#fff',
    fontSize: 16,
  },
  outlineText: {
    color: '#1f2937',
    fontSize: 16,
  },
  ghostText: {
    color: '#1f2937',
    fontSize: 16,
  },
  destructiveText: {
    color: '#fff',
    fontSize: 16,
  },
  defaultSizeText: {
    fontSize: 16,
  },
  smText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 18,
  },
  disabledText: {
    opacity: 0.5,
  },
});
