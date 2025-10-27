import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface CardTitleProps {
  children: React.ReactNode;
  style?: TextStyle;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

export const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  return <View style={[styles.cardHeader, style]}>{children}</View>;
};

export const CardTitle: React.FC<CardTitleProps> = ({ children, style }) => {
  return <Text style={[styles.cardTitle, style]}>{children}</Text>;
};

export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return <View style={[styles.cardContent, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    // 필요시 스타일 추가
  },
});
