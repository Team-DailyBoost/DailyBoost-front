import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather as Icon } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

// 간단한 화면 컴포넌트들
function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>홈 화면</Text>
      <Text style={styles.subtitle}>피트니스 앱에 오신 것을 환영합니다!</Text>
    </View>
  );
}

function FoodScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>식단</Text>
      <Text style={styles.subtitle}>오늘의 식단을 기록하세요</Text>
    </View>
  );
}

function WorkoutScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>운동</Text>
      <Text style={styles.subtitle}>운동 기록을 관리하세요</Text>
    </View>
  );
}

function ChallengeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>챌린지</Text>
      <Text style={styles.subtitle}>친구들과 경쟁하세요</Text>
    </View>
  );
}

function CommunityScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>커뮤니티</Text>
      <Text style={styles.subtitle}>다른 사람들과 소통하세요</Text>
    </View>
  );
}

function MyPageScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>마이페이지</Text>
      <Text style={styles.subtitle}>내 프로필과 설정</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: any;

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
          },
        })}
      >
        <Tab.Screen name="홈" component={HomeScreen} />
        <Tab.Screen name="식단" component={FoodScreen} />
        <Tab.Screen name="운동" component={WorkoutScreen} />
        <Tab.Screen name="챌린지" component={ChallengeScreen} />
        <Tab.Screen name="커뮤니티" component={CommunityScreen} />
        <Tab.Screen name="마이" component={MyPageScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
