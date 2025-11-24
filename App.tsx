import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, Platform, View, ActivityIndicator } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { Feather as Icon } from '@expo/vector-icons';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Dashboard } from './src/react-native/screens/Dashboard';
import { FoodLogger } from './src/react-native/screens/FoodLogger';
import { WorkoutLogger } from './src/react-native/screens/WorkoutLogger';
import { Challenge } from './src/react-native/screens/Challenge';
import { Community } from './src/react-native/screens/Community';
import { MyPage } from './src/react-native/screens/MyPage';
import { LoginScreen } from './src/react-native/screens/Auth/Login';
import { WelcomeScreen } from './src/react-native/components/WelcomeScreen';
import { BackgroundWebView } from './src/react-native/components/BackgroundWebView';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function AuthNavigator({ onLoggedIn }: { onLoggedIn: () => void }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {() => <LoginScreen onLoggedIn={onLoggedIn} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

function MainTabs({ onLoggedOut }: { onLoggedOut: () => void }) {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          switch (route.name) {
            case '홈': iconName = 'home'; break;
            case '식단': iconName = 'coffee'; break;
            case '운동': iconName = 'activity'; break;
            case '챌린지': iconName = 'award'; break;
            case '커뮤니티': iconName = 'users'; break;
            case '마이': iconName = 'user'; break;
            default: iconName = 'circle';
          }
          return <Icon name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 10,
          borderTopWidth: 0,
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
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
  const [isReady, setIsReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setVisibilityAsync('visible');
      } catch {}
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const user = await AsyncStorage.getItem('currentUser');
        if (mounted) {
          setIsAuthed(Boolean(user));
          setIsReady(true);
        }
      } catch {
        if (mounted) {
          setIsAuthed(false);
          setIsReady(true);
        }
      }
    };
    
    const timeout = setTimeout(() => {
      if (mounted && !isReady) {
        setIsAuthed(false);
        setIsReady(true);
      }
    }, 1000);
    
    checkAuth();
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  if (showWelcome) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        <WelcomeScreen onComplete={() => setShowWelcome(false)} />
      </SafeAreaProvider>
    );
  }

  if (!isReady || isAuthed === null) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isAuthed ? (
            <Stack.Screen name="Auth">
              {() => <AuthNavigator onLoggedIn={() => setIsAuthed(true)} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="MainTabs">
              {() => <MainTabs onLoggedOut={() => setIsAuthed(false)} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      {isAuthed && <BackgroundWebView />}
    </SafeAreaProvider>
  );
}

