// 커스텀 폰트를 사용하고 싶을 때의 예시 App.tsx

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import * as Font from 'expo-font';

import { Dashboard } from './screens/Dashboard';
import { FoodLogger } from './screens/FoodLogger';
import { WorkoutLogger } from './screens/WorkoutLogger';
import { Challenge } from './screens/Challenge';
import { Community } from './screens/Community';
import { MyPage } from './screens/MyPage';

const Tab = createBottomTabNavigator();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          // 여기에 커스텀 폰트 추가
          // 'CustomFont-Regular': require('./assets/fonts/CustomFont-Regular.ttf'),
          // 'CustomFont-Bold': require('./assets/fonts/CustomFont-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // 폰트 로딩 실패해도 앱은 계속 실행
        setFontsLoaded(true);
      }
    }

    loadFonts();
  }, []);

  // 폰트 로딩 중일 때 로딩 화면 표시
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer>
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
              // 커스텀 폰트 사용 시
              // fontFamily: 'CustomFont-Regular',
            },
          })}
        >
          <Tab.Screen name="홈" component={Dashboard} />
          <Tab.Screen name="식단" component={FoodLogger} />
          <Tab.Screen name="운동" component={WorkoutLogger} />
          <Tab.Screen name="챌린지" component={Challenge} />
          <Tab.Screen name="커뮤니티" component={Community} />
          <Tab.Screen name="마이" component={MyPage} />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

// Font.getLoadedFonts() 사용 예시
// const loadedFonts = Font.getLoadedFonts();
// console.log('Loaded fonts:', loadedFonts);
