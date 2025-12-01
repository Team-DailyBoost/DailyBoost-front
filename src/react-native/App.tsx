import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather as Icon } from '@expo/vector-icons';

import { Dashboard } from './screens/Dashboard';
import { FoodLogger } from './screens/FoodLogger';
import { WorkoutLogger } from './screens/WorkoutLogger';
import { Challenge } from './screens/Challenge';
import { Community } from './screens/Community';
import { MyPage } from './screens/MyPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from './screens/Auth/Login';
import { SocialLoginScreen } from './screens/Auth/SocialLoginScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

// 인증 전용 Stack 네비게이터
function AuthStackNavigator({ onLoggedIn }: { onLoggedIn: () => void }) {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login">
        {() => <LoginScreen onLoggedIn={onLoggedIn} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="SocialLogin">
        {() => <SocialLoginScreen onLoggedIn={onLoggedIn} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
}

// 챌린지 컴포넌트 (Stack Navigator 대신 직접 컴포넌트 사용)
function ChallengeStackNavigator() {
  return <Challenge />;
}

// 로그인 이후 탭 네비게이터
function MainTabs({ onLoggedOut }: { onLoggedOut: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case '홈':
              iconName = 'home';
              break;
            case '식단':
              iconName = 'coffee';
              break;
            case '운동':
              iconName = 'activity';
              break;
            case '챌린지':
              iconName = 'award';
              break;
            case '커뮤니티':
              iconName = 'users';
              break;
            case '마이':
              iconName = 'user';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="홈" component={Dashboard} />
      <Tab.Screen name="식단" component={FoodLogger} />
      <Tab.Screen name="운동" component={WorkoutLogger} />
      <Tab.Screen name="챌린지" component={ChallengeStackNavigator} />
      <Tab.Screen name="커뮤니티" component={Community} />
      <Tab.Screen name="마이">
        {() => <MyPage onLoggedOut={onLoggedOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [navKey, setNavKey] = useState(0); // NavigationContainer 강제 리렌더링용

  const checkAuthStatus = async () => {
    try {
      // currentUser와 accessToken 모두 확인
      const user = await AsyncStorage.getItem('currentUser');
      const token = await AsyncStorage.getItem('@accessToken');
      
      // 사용자 정보가 있으면 로그인된 것으로 간주 (토큰은 선택적)
      // 로컬 로그인이나 세션 쿠키 기반 인증도 지원
      const authenticated = !!user;
      console.log('[App] 로그인 상태 확인:', { 
        hasUser: !!user, 
        hasToken: !!token, 
        authenticated,
        userData: user ? JSON.parse(user) : null
      });
      setIsAuthed(authenticated);
      return authenticated;
    } catch (error) {
      console.error('[App] 로그인 상태 확인 실패:', error);
      setIsAuthed(false);
      return false;
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLoggedIn = async () => {
    console.log('[App] ========== onLoggedIn 콜백 호출됨 ==========');
    console.log('[App] 현재 isAuthed 상태:', isAuthed);
    
    // 즉시 상태 업데이트 (가장 중요!)
    setIsAuthed(true);
    setNavKey(prev => prev + 1); // NavigationContainer 강제 리렌더링
    console.log('[App] isAuthed를 즉시 true로 설정하고 NavigationContainer 리렌더링');
    
    // AsyncStorage 저장 확인 (비동기로 처리, 상태는 이미 true)
    setTimeout(async () => {
      const user = await AsyncStorage.getItem('currentUser');
      const token = await AsyncStorage.getItem('@accessToken');
      console.log('[App] 저장 확인:', { hasUser: !!user, hasToken: !!token });
      
      // 저장이 안 되어 있으면 다시 시도
      if (!user) {
        console.warn('[App] 사용자 정보가 저장되지 않았습니다. 재확인 중...');
        setTimeout(async () => {
          const retryUser = await AsyncStorage.getItem('currentUser');
          if (retryUser) {
            console.log('[App] 재확인 성공, 사용자 정보 저장됨');
            // 재확인 성공해도 이미 상태는 true이므로 추가 작업 불필요
          } else {
            console.error('[App] 사용자 정보 저장 실패');
            // 저장 실패해도 로그인은 진행 (토큰이 있을 수 있음)
          }
        }, 200);
      }
    }, 50);
    
    console.log('[App] ========== onLoggedIn 처리 완료 ==========');
  };

  const handleLoggedOut = async () => {
    console.log('[App] 로그아웃 처리');
    setIsAuthed(false);
  };

  if (isAuthed === null) {
    return null; // 로딩 중
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        hidden={false}
      />
      <NavigationContainer key={navKey}>
        {isAuthed ? (
          <MainTabs onLoggedOut={handleLoggedOut} />
        ) : (
          <AuthStackNavigator onLoggedIn={handleLoggedIn} />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
