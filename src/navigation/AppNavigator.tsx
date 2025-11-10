/**
 * App Navigator
 * 
 * 로그인 상태에 따라 화면을 전환하는 네비게이션 설정입니다.
 * 
 * 로그인 성공 후 흐름:
 * 1. LoginWebView에서 로그인 성공 감지
 * 2. 쿠키/토큰을 AsyncStorage에 저장
 * 3. onLoginSuccess 콜백 호출
 * 4. AppNavigator가 로그인 상태를 확인하여 메인 화면으로 이동
 */
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SessionStorage } from '../storage/session';
import { LoginWebView } from '../screens/LoginWebView';

// 임시 화면 컴포넌트들 (실제 화면으로 교체 필요)
const HomeScreen = () => {
  const { View, Text, StyleSheet, Button } = require('react-native');
  const { SessionStorage } = require('../storage/session');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await SessionStorage.getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = async () => {
    await SessionStorage.clearAll();
    // 로그인 화면으로 이동은 AppNavigator에서 처리
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>홈 화면</Text>
      {user && (
        <View>
          <Text>환영합니다, {user.name}님!</Text>
          <Text>이메일: {user.email}</Text>
        </View>
      )}
      <Button title="로그아웃" onPress={handleLogout} />
    </View>
  );
};

const PlaceholderScreen = ({ title }: { title: string }) => {
  const { View, Text, StyleSheet } = require('react-native');
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
};

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * 메인 탭 네비게이터 (로그인 후 화면)
 */
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="식단" component={() => <PlaceholderScreen title="식단" />} />
      <Tab.Screen name="운동" component={() => <PlaceholderScreen title="운동" />} />
      <Tab.Screen name="커뮤니티" component={() => <PlaceholderScreen title="커뮤니티" />} />
      <Tab.Screen name="마이" component={() => <PlaceholderScreen title="마이" />} />
    </Tab.Navigator>
  );
}

/**
 * 인증 스택 네비게이터 (로그인 화면)
 */
function AuthStack({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {() => (
          <LoginWebView
            provider="naver"
            onLoginSuccess={onLoginSuccess}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

/**
 * 메인 앱 네비게이터
 * 
 * 로그인 상태를 확인하여 적절한 화면을 표시합니다.
 */
export function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // 앱 시작 시 로그인 상태 확인
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SessionStorage.getAccessToken();
      const cookie = await SessionStorage.getSessionCookie();
      const user = await SessionStorage.getCurrentUser();
      
      // 토큰 또는 쿠키가 있으면 로그인 상태로 간주
      setIsAuthenticated(!!(token || cookie || user));
    } catch (error) {
      console.error('인증 상태 확인 오류:', error);
      setIsAuthenticated(false);
    }
  };

  const handleLoginSuccess = async () => {
    console.log('✅ 로그인 성공 콜백 호출');
    await checkAuthStatus();
    setShowLogin(false);
  };

  const handleLogout = async () => {
    await SessionStorage.clearAll();
    setIsAuthenticated(false);
    setShowLogin(true);
  };

  // 로딩 중
  if (isAuthenticated === null) {
    return null; // 또는 로딩 화면
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // 로그인 상태: 메인 탭 화면
          <Stack.Screen name="Main">
            {() => <MainTabs />}
          </Stack.Screen>
        ) : (
          // 비로그인 상태: 로그인 화면
          <Stack.Screen name="Auth">
            {() => (
              <AuthStack onLoginSuccess={handleLoginSuccess} />
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

