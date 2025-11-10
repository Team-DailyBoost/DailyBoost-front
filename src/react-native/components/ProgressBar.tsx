import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ProgressBarProps {
  value?: number;
  max?: number;
  progress?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  progress,
  color = '#6366f1',
  backgroundColor = '#E0E0E0',
  height = 8,
  style,
}) => {
  // Support both value/max and progress props for flexibility
  const percentage = progress !== undefined 
    ? Math.min(Math.max(progress, 0), 100)
    : value !== undefined
    ? Math.min(Math.max((value / max) * 100, 0), 100)
    : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          height,
          borderRadius: height / 2,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.progress,
          {
            width: `${percentage}%`,
            backgroundColor: color,
            height,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    width: '100%',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
