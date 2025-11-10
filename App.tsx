import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Feather as Icon } from '@expo/vector-icons';

import { Dashboard } from './src/react-native/screens/Dashboard';
import { FoodLogger } from './src/react-native/screens/FoodLogger';
import { WorkoutLogger } from './src/react-native/screens/WorkoutLogger';
import { Challenge } from './src/react-native/screens/Challenge';
import { Community } from './src/react-native/screens/Community';
import { MyPage } from './src/react-native/screens/MyPage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoginScreen } from './src/react-native/screens/Auth/Login';
import { BackgroundWebView } from './src/react-native/components/BackgroundWebView';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 인증 스크린 네비게이터 (로그인 화면)
function AuthNavigator({ onLoggedIn }: { onLoggedIn: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {() => <LoginScreen onLoggedIn={onLoggedIn} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// 메인 탭 네비게이터 (로그인 후 화면)
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

          return <Icon name={iconName as any} size={size} color={color} />;
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
      <Tab.Screen name="챌린지" component={Challenge} />
      <Tab.Screen name="커뮤니티" component={Community} />
      <Tab.Screen name="마이">
        {() => <MyPage onLoggedOut={onLoggedOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Android 네비게이션 바 숨기기
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setVisibilityAsync('hidden');
      } catch {}
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // 안전 타임아웃: 2초 내 초기화 실패 시 로그인 화면 노출
    const failSafe = setTimeout(() => {
      if (mounted && isAuthed === null) {
        setIsAuthed(false);
      }
    }, 2000);

    (async () => {
      try {
        const user = await AsyncStorage.getItem('currentUser');
        if (mounted) {
          setIsAuthed(Boolean(user));
        }
      } catch {
        if (mounted) {
          setIsAuthed(false);
        }
      }
    })();

    return () => {
      mounted = false;
      try { clearTimeout(failSafe); } catch {}
    };
  }, []);

  if (isAuthed === null) {
    // 초기 로딩 표시
    return (
      <>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#fff" 
          hidden={false}
        />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} />
      </>
    );
  }

  return (
    <>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        hidden={false}
      />
      <NavigationContainer>
        {/* NOTE: 
            이 루트 Stack.Navigator는 Auth와 MainTabs를 전환합니다.
            LoginScreen은 AuthNavigator 내부의 Stack에 있으므로,
            LoginScreen에서 navigation.reset()으로 'MainTabs'로 이동하려고 하면
            "The action 'RESET' ... was not handled by any navigator" 경고가 발생합니다.
            대신 onLoggedIn() 콜백을 통해 App.tsx의 isAuthed 상태를 변경하여
            자동으로 MainTabs로 이동하도록 합니다.
            
            로그인 완료 후에도 LoginScreen의 WebView를 유지하기 위해
            AuthHidden 스크린을 추가하여 로그인 완료 후에도 LoginScreen을 렌더링합니다.
        */}
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthed ? (
            <Stack.Screen name="Auth">
              {() => <AuthNavigator onLoggedIn={() => setIsAuthed(true)} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="MainTabs">
                {() => <MainTabs onLoggedOut={() => setIsAuthed(false)} />}
              </Stack.Screen>
              {/* 로그인 이후 백그라운드 WebView를 항상 유지 */}
              <Stack.Screen name="__bg_wv" options={{ presentation: 'transparentModal' }}>
                {() => <BackgroundWebView />}
              </Stack.Screen>
              {/* 로그인 완료 후에도 LoginScreen을 렌더링하여 WebView 유지 (화면에서는 숨김) */}
              <Stack.Screen 
                name="AuthHidden" 
                options={{ 
                  presentation: 'transparentModal',
                  headerShown: false,
                  cardStyle: { backgroundColor: 'transparent' },
                  cardOverlayEnabled: false,
                }}
              >
                {() => (
                  <View style={{ width: 1, height: 1, opacity: 0, position: 'absolute', top: -1000, left: -1000, zIndex: -1 }}>
                    <AuthNavigator onLoggedIn={() => {}} />
                  </View>
                )}
              </Stack.Screen>
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
