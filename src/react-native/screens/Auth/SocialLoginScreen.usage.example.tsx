/**
 * SocialLoginScreen 사용 예시
 * 
 * 이 파일은 SocialLoginScreen 컴포넌트를 React Navigation과 함께 사용하는 방법을 보여줍니다.
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { SocialLoginScreen } from './SocialLoginScreen';
import { LoginScreen } from './Login';
import { Dashboard } from '../Dashboard';

// Stack Navigator 타입 정의
type AuthStackParamList = {
  Login: undefined;
  SocialLogin: {
    provider: 'naver' | 'kakao';
  };
  Home: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * 인증 스크린 네비게이터
 * 
 * 사용 예시:
 * 1. 로그인 화면에서 "네이버로 로그인" 버튼 클릭
 * 2. navigation.navigate('SocialLogin', { provider: 'naver' }) 호출
 * 3. SocialLoginScreen에서 Whitelabel 페이지 감지 후 navigation.replace('Home') 호출
 */
export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SocialLogin" component={SocialLoginScreen} />
      <Stack.Screen name="Home" component={Dashboard} />
    </Stack.Navigator>
  );
}

/**
 * LoginScreen에서 SocialLoginScreen으로 이동하는 예시
 */
export function LoginScreenExample() {
  const navigation = useNavigation();

  const handleNaverLogin = () => {
    // 네이버 로그인 화면으로 이동
    navigation.navigate('SocialLogin', { provider: 'naver' });
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 화면으로 이동
    navigation.navigate('SocialLogin', { provider: 'kakao' });
  };

  return (
    // ... 로그인 UI
    // <TouchableOpacity onPress={handleNaverLogin}>
    //   <Text>네이버로 로그인</Text>
    // </TouchableOpacity>
    // <TouchableOpacity onPress={handleKakaoLogin}>
    //   <Text>카카오로 로그인</Text>
    // </TouchableOpacity>
  );
}

