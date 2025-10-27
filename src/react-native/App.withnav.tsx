import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather as Icon } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

// 에러 바운더리 컴포넌트
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>앱 오류</Text>
          <Text style={styles.errorText}>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다'}
          </Text>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// 간단한 화면 컴포넌트들
function HomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>🏠 홈</Text>
      <Text style={styles.subtitle}>피트니스 앱에 오신 것을 환영합니다!</Text>
      <Text style={styles.info}>대시보드와 통계를 확인하세요</Text>
    </View>
  );
}

function FoodScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>🍎 식단</Text>
      <Text style={styles.subtitle}>오늘의 식단을 기록하세요</Text>
      <Text style={styles.info}>칼로리와 영양소를 추적합니다</Text>
    </View>
  );
}

function WorkoutScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>💪 운동</Text>
      <Text style={styles.subtitle}>운동 기록을 관리하세요</Text>
      <Text style={styles.info}>부위별 운동을 추천받으세요</Text>
    </View>
  );
}

function ChallengeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>🏆 챌린지</Text>
      <Text style={styles.subtitle}>친구들과 경쟁하세요</Text>
      <Text style={styles.info}>랭킹 시스템으로 동기부여를!</Text>
    </View>
  );
}

function CommunityScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>👥 커뮤니티</Text>
      <Text style={styles.subtitle}>다른 사람들과 소통하세요</Text>
      <Text style={styles.info}>운동 팁과 식단을 공유하세요</Text>
    </View>
  );
}

function MyPageScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>👤 마이페이지</Text>
      <Text style={styles.subtitle}>내 프로필과 설정</Text>
      <Text style={styles.info}>계정 정보를 관리하세요</Text>
    </View>
  );
}

export default function App() {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
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
            <Tab.Screen name="홈" component={HomeScreen} />
            <Tab.Screen name="식단" component={FoodScreen} />
            <Tab.Screen name="운동" component={WorkoutScreen} />
            <Tab.Screen name="챌린지" component={ChallengeScreen} />
            <Tab.Screen name="커뮤니티" component={CommunityScreen} />
            <Tab.Screen name="마이" component={MyPageScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
});
