import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 최소한의 앱 - 디버깅용
export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello, React Native!</Text>
      <Text style={styles.small}>앱이 작동합니다 ✅</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  small: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});
