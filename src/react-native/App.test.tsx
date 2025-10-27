import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 가장 기본적인 앱 - 네비게이션 없음
export default function App() {
  console.log('✅ App.test.tsx is rendering');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ 앱 작동 중!</Text>
      <Text style={styles.subtitle}>React Native가 정상 작동합니다</Text>
      <Text style={styles.info}>이 화면이 보이면 기본 설정은 완료되었습니다</Text>
      
      <View style={styles.statusBox}>
        <Text style={styles.statusTitle}>🔍 상태 확인</Text>
        <Text style={styles.statusItem}>✅ React Native: 작동</Text>
        <Text style={styles.statusItem}>✅ Expo: 작동</Text>
        <Text style={styles.statusItem}>✅ 렌더링: 작동</Text>
      </View>
      
      <Text style={styles.note}>
        다음 단계: App.tsx 파일을 확인하세요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#075985',
    marginBottom: 8,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 24,
    textAlign: 'center',
  },
  statusBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0ea5e9',
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusItem: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 8,
    paddingLeft: 8,
  },
  note: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
