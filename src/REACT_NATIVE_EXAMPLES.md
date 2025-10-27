# React Native 변환 예시 코드

이 문서는 주요 컴포넌트들의 React Native 변환 예시를 제공합니다.

---

## 📱 App.tsx (메인 네비게이션)

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import { StatusBar } from 'react-native';

import { Dashboard } from './screens/Dashboard';
import { FoodLogger } from './screens/FoodLogger';
import { WorkoutLogger } from './screens/WorkoutLogger';
import { Challenge } from './screens/Challenge';
import { Community } from './screens/Community';
import { MyPage } from './screens/MyPage';

const Tab = createBottomTabNavigator();

export default function App() {
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
            },
            tabBarLabelStyle: {
              fontSize: 12,
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
```

---

## 🏠 Dashboard.tsx (대시보드 화면)

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

export function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [userData, setUserData] = useState({
    name: '사용자',
    level: 5,
    streak: 7,
  });

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const dailyGoals = {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
    exercise: 60,
  };

  const current = {
    calories: 1650,
    protein: 95,
    carbs: 180,
    fat: 52,
    exercise: 45,
  };

  const weeklyData = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        data: [45, 60, 30, 70, 45, 0, 0],
      },
    ],
  };

  const exerciseProgress = (current.exercise / dailyGoals.exercise) * 100;

  const getCharacterState = () => {
    if (exerciseProgress >= 100) {
      return {
        emoji: '💪',
        message: '완벽해요! 오늘의 목표를 달성했어요!',
        color: '#10b981',
      };
    } else if (exerciseProgress >= 75) {
      return {
        emoji: '😊',
        message: '조금만 더! 거의 다 왔어요!',
        color: '#3b82f6',
      };
    } else if (exerciseProgress >= 50) {
      return {
        emoji: '🙂',
        message: '좋아요! 꾸준히 가고 있어요!',
        color: '#f59e0b',
      };
    } else if (exerciseProgress >= 25) {
      return {
        emoji: '😐',
        message: '힘내세요! 아직 시간이 있어요!',
        color: '#ef4444',
      };
    } else {
      return {
        emoji: '😴',
        message: '시작이 반이에요! 운동을 시작해볼까요?',
        color: '#6b7280',
      };
    }
  };

  const character = getCharacterState();

  const onRefresh = async () => {
    setRefreshing(true);
    // 데이터 새로고침 로직
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요, {userData.name}님!</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* 캐릭터 카드 */}
      <View style={styles.card}>
        <View style={styles.characterContainer}>
          <Text style={styles.characterEmoji}>{character.emoji}</Text>
          <Text style={[styles.characterMessage, { color: character.color }]}>
            {character.message}
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>오늘의 운동</Text>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.min(exerciseProgress, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {current.exercise} / {dailyGoals.exercise}분
          </Text>
        </View>
      </View>

      {/* 통계 그리드 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Icon name="flame" size={24} color="#ef4444" />
          <Text style={styles.statValue}>
            {current.calories}
            <Text style={styles.statUnit}>/{dailyGoals.calories}</Text>
          </Text>
          <Text style={styles.statLabel}>칼로리</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="droplet" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>
            {current.protein}
            <Text style={styles.statUnit}>/{dailyGoals.protein}g</Text>
          </Text>
          <Text style={styles.statLabel}>단백질</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="zap" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>
            {current.carbs}
            <Text style={styles.statUnit}>/{dailyGoals.carbs}g</Text>
          </Text>
          <Text style={styles.statLabel}>탄수화물</Text>
        </View>

        <View style={styles.statCard}>
          <Icon name="sun" size={24} color="#10b981" />
          <Text style={styles.statValue}>
            {current.fat}
            <Text style={styles.statUnit}>/{dailyGoals.fat}g</Text>
          </Text>
          <Text style={styles.statLabel}>지방</Text>
        </View>
      </View>

      {/* 주간 차트 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>주간 운동 시간</Text>
        <BarChart
          data={weeklyData}
          width={screenWidth - 64}
          height={220}
          yAxisSuffix="분"
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForLabels: {
              fontSize: 12,
            },
          }}
          style={{
            marginVertical: 8,
            borderRadius: 16,
          }}
        />
      </View>

      {/* 달성 배지 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>달성 배지</Text>
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Icon name="award" size={32} color="#f59e0b" />
            <Text style={styles.badgeText}>7일 연속</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="target" size={32} color="#10b981" />
            <Text style={styles.badgeText}>목표 달성</Text>
          </View>
          <View style={styles.badge}>
            <Icon name="trending-up" size={32} color="#3b82f6" />
            <Text style={styles.badgeText}>꾸준함</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  characterContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  characterEmoji: {
    fontSize: 64,
  },
  characterMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statCardInner: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  badge: {
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});
```

---

## 🍽️ FoodLogger.tsx (식단 기록 화면)

```tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';

const screenWidth = Dimensions.get('window').width;

interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

interface FoodEntry {
  id: string;
  food: Food;
  quantity: number;
  time: string;
}

export function FoodLogger() {
  const [activeTab, setActiveTab] = useState('tracking');
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);

  const dailyGoals = {
    calories: 2400,
    protein: 100,
    carbs: 300,
    fat: 80,
  };

  // 오늘 섭취한 영양소 계산
  const todayNutrition = foodEntries.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.food.calories * entry.quantity,
      protein: acc.protein + entry.food.protein * entry.quantity,
      carbs: acc.carbs + entry.food.carbs * entry.quantity,
      fat: acc.fat + entry.food.fat * entry.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 샘플 음식 데이터
  const sampleFoods: Food[] = [
    {
      id: '1',
      name: '닭가슴살',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
      serving: '100g',
    },
    {
      id: '2',
      name: '현미밥',
      calories: 350,
      protein: 7,
      carbs: 73,
      fat: 3,
      serving: '1공기',
    },
    {
      id: '3',
      name: '계란',
      calories: 155,
      protein: 13,
      carbs: 1.1,
      fat: 11,
      serving: '2개',
    },
  ];

  const addFood = (food: Food) => {
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      food,
      quantity: 1,
      time: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setFoodEntries([...foodEntries, newEntry]);
    setAddModalVisible(false);
  };

  const removeFood = (id: string) => {
    setFoodEntries(foodEntries.filter((entry) => entry.id !== id));
  };

  const pieChartData = [
    {
      name: '단백질',
      population: todayNutrition.protein,
      color: '#ef4444',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
    {
      name: '탄수화물',
      population: todayNutrition.carbs,
      color: '#3b82f6',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
    {
      name: '지방',
      population: todayNutrition.fat,
      color: '#f59e0b',
      legendFontColor: '#6b7280',
      legendFontSize: 12,
    },
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>식단 관리</Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
          <Icon name="plus" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tracking' && styles.activeTab]}
          onPress={() => setActiveTab('tracking')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'tracking' && styles.activeTabText,
            ]}
          >
            추적
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recommended' && styles.activeTab]}
          onPress={() => setActiveTab('recommended')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'recommended' && styles.activeTabText,
            ]}
          >
            추천 식단
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipe' && styles.activeTab]}
          onPress={() => setActiveTab('recipe')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'recipe' && styles.activeTabText,
            ]}
          >
            AI 레시피
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'tracking' && (
          <>
            {/* 영양소 요약 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>오늘의 영양소</Text>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Icon name="zap" size={20} color="#ef4444" />
                  <Text style={styles.nutritionLabel}>칼로리</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.calories)}/{dailyGoals.calories}
                    kcal
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Icon name="droplet" size={20} color="#3b82f6" />
                  <Text style={styles.nutritionLabel}>단백질</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.protein)}/{dailyGoals.protein}g
                  </Text>
                </View>
              </View>
              <View style={styles.nutritionRow}>
                <View style={styles.nutritionItem}>
                  <Icon name="sun" size={20} color="#f59e0b" />
                  <Text style={styles.nutritionLabel}>탄수화물</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.carbs)}/{dailyGoals.carbs}g
                  </Text>
                </View>
                <View style={styles.nutritionItem}>
                  <Icon name="circle" size={20} color="#10b981" />
                  <Text style={styles.nutritionLabel}>지방</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.fat)}/{dailyGoals.fat}g
                  </Text>
                </View>
              </View>
            </View>

            {/* 원형 차트 */}
            {todayNutrition.calories > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>영양소 분포</Text>
                <PieChart
                  data={pieChartData}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            )}

            {/* 식단 기록 목록 */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>오늘 먹은 음식</Text>
              {foodEntries.length === 0 ? (
                <Text style={styles.emptyText}>
                  아직 기록된 음식이 없습니다.
                </Text>
              ) : (
                foodEntries.map((entry) => (
                  <View key={entry.id} style={styles.foodEntry}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{entry.food.name}</Text>
                      <Text style={styles.foodDetails}>
                        {entry.food.serving} x {entry.quantity} |{' '}
                        {entry.food.calories * entry.quantity}kcal
                      </Text>
                      <Text style={styles.foodTime}>{entry.time}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFood(entry.id)}>
                      <Icon name="trash-2" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          </>
        )}

        {activeTab === 'recommended' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>추천 식단</Text>
            <Text style={styles.emptyText}>추천 식단 기능 준비 중입니다.</Text>
          </View>
        )}

        {activeTab === 'recipe' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>AI 레시피</Text>
            <Text style={styles.emptyText}>AI 레시피 기능 준비 중입니다.</Text>
          </View>
        )}
      </ScrollView>

      {/* 음식 추가 모달 */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>음식 추가</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="음식 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={sampleFoods}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.foodItem}
                  onPress={() => addFood(item)}
                >
                  <View>
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemDetails}>
                      {item.calories}kcal | 단백질 {item.protein}g
                    </Text>
                  </View>
                  <Icon name="plus-circle" size={24} color="#6366f1" />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nutritionItem: {
    flex: 1,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 20,
  },
  foodEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  foodDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  foodTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    fontSize: 16,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  foodItemDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
```

---

## 🔧 공통 컴포넌트 예시

### ProgressBar.tsx
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  backgroundColor?: string;
  height?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = '#6366f1',
  backgroundColor = '#e5e7eb',
  height = 8,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <View style={[styles.container, { backgroundColor, height }]}>
      <View
        style={[
          styles.bar,
          {
            width: `${percentage}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    borderRadius: 4,
  },
});
```

### Card.tsx
```tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({ title, children, style }) => {
  return (
    <View style={[styles.card, style]}>
      {title && <Text style={styles.title}>{title}</Text>}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
});
```

---

## 📦 package.json

```json
{
  "name": "fitness-app",
  "version": "1.0.0",
  "main": "expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.74.1",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/bottom-tabs": "^6.5.11",
    "@react-navigation/stack": "^6.3.20",
    "react-native-screens": "~3.29.0",
    "react-native-safe-area-context": "4.8.2",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-reanimated": "~3.6.2",
    "@react-native-async-storage/async-storage": "1.21.0",
    "react-native-chart-kit": "^6.12.0",
    "react-native-svg": "14.1.0",
    "react-native-vector-icons": "^10.0.3",
    "date-fns": "^3.0.0",
    "expo": "~50.0.0",
    "expo-status-bar": "~1.11.1"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0",
    "@types/react": "~18.2.45",
    "typescript": "^5.3.0"
  }
}
```

---

## 🚀 시작하기

1. 프로젝트 생성
```bash
npx create-expo-app fitness-app
cd fitness-app
```

2. 의존성 설치
```bash
npm install
```

3. 개발 서버 실행
```bash
npm start
```

4. 앱 실행
- iOS: `i` 키 누르기
- Android: `a` 키 누르기
- 웹: `w` 키 누르기

---

이 예시 코드들을 참고하여 나머지 컴포넌트들도 변환하시면 됩니다!
