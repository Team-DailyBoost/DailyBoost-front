import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
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

const Tab = createBottomTabNavigator();

export default function App() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await AsyncStorage.getItem('currentUser');
        setIsAuthed(Boolean(user));
      } catch {
        setIsAuthed(false);
      }
    })();
  }, []);

  if (isAuthed === null) {
    return null;
  }

  if (!isAuthed) {
    return (
      <SafeAreaProvider>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#fff" 
          hidden={false}
        />
        <LoginScreen onLoggedIn={() => setIsAuthed(true)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#fff" 
        hidden={false}
      />
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
            },
          })}
        >
          <Tab.Screen name="홈" component={Dashboard} />
          <Tab.Screen name="식단" component={FoodLogger} />
          <Tab.Screen name="운동" component={WorkoutLogger} />
          <Tab.Screen name="챌린지" component={Challenge} />
          <Tab.Screen name="커뮤니티" component={Community} />
          <Tab.Screen name="마이">
            {() => <MyPage onLoggedOut={() => setIsAuthed(false)} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
