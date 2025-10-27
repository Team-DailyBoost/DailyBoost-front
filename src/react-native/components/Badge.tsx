import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  style,
  textStyle,
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  default: {
    backgroundColor: '#6366f1',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  destructive: {
    backgroundColor: '#ef4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  defaultText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#1f2937',
  },
  destructiveText: {
    color: '#fff',
  },
  outlineText: {
    color: '#1f2937',
  },
});
