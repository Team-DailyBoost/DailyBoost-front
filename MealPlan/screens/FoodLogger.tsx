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
  Alert,
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { StorageKeys } from '../utils/storage';
import type { Food, FoodEntry } from '../types';

const screenWidth = Dimensions.get('window').width;

export function FoodLogger() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'recommended' | 'recipe'>('tracking');
  const [foodEntries, setFoodEntries] = useAsyncStorage<FoodEntry[]>(StorageKeys.FOOD_ENTRIES, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);

  // 목표 설정
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

  // 샘플 음식 데이터베이스
  const foodDatabase: Food[] = [
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
      calories: 70,
      protein: 6,
      carbs: 0.6,
      fat: 5,
      serving: '1개',
    },
    {
      id: '4',
      name: '바나나',
      calories: 89,
      protein: 1.1,
      carbs: 23,
      fat: 0.3,
      serving: '1개',
    },
    {
      id: '5',
      name: '브로콜리',
      calories: 34,
      protein: 2.8,
      carbs: 7,
      fat: 0.4,
      serving: '100g',
    },
    {
      id: '6',
      name: '연어',
      calories: 208,
      protein: 22,
      carbs: 0,
      fat: 13,
      serving: '100g',
    },
    {
      id: '7',
      name: '고구마',
      calories: 86,
      protein: 1.6,
      carbs: 20,
      fat: 0.1,
      serving: '1개',
    },
    {
      id: '8',
      name: '그릭요거트',
      calories: 97,
      protein: 9,
      carbs: 6,
      fat: 5,
      serving: '100g',
    },
  ];

  // 필터된 음식 목록
  const filteredFoods = foodDatabase.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 음식 추가
  const addFood = async (food: Food) => {
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      food,
      quantity: 1,
      time: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    await setFoodEntries([...foodEntries, newEntry]);
    setAddModalVisible(false);
    setSearchQuery('');
  };

  // 음식 삭제
  const removeFood = async (id: string) => {
    Alert.alert('삭제 확인', '이 음식을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await setFoodEntries(foodEntries.filter((entry) => entry.id !== id));
        },
      },
    ]);
  };

  // 원형 차트 데이터
  const getPieChartData = () => {
    if (todayNutrition.calories === 0) return [];

    return [
      {
        name: '단백질',
        population: todayNutrition.protein * 4, // 1g = 4kcal
        color: '#ef4444',
        legendFontColor: '#6b7280',
        legendFontSize: 12,
      },
      {
        name: '탄수화물',
        population: todayNutrition.carbs * 4,
        color: '#3b82f6',
        legendFontColor: '#6b7280',
        legendFontSize: 12,
      },
      {
        name: '지방',
        population: todayNutrition.fat * 9, // 1g = 9kcal
        color: '#f59e0b',
        legendFontColor: '#6b7280',
        legendFontSize: 12,
      },
    ];
  };

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
            <Card style={styles.card}>
              <CardTitle>오늘의 영양소</CardTitle>
              <View style={styles.nutritionGrid}>
                <View style={styles.nutritionItem}>
                  <Icon name="zap" size={20} color="#ef4444" />
                  <Text style={styles.nutritionLabel}>칼로리</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.calories)}/{dailyGoals.calories}
                    kcal
                  </Text>
                  <ProgressBar
                    value={todayNutrition.calories}
                    max={dailyGoals.calories}
                    color="#ef4444"
                    height={6}
                    style={styles.nutritionProgress}
                  />
                </View>

                <View style={styles.nutritionItem}>
                  <Icon name="droplet" size={20} color="#3b82f6" />
                  <Text style={styles.nutritionLabel}>단백질</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.protein)}/{dailyGoals.protein}g
                  </Text>
                  <ProgressBar
                    value={todayNutrition.protein}
                    max={dailyGoals.protein}
                    color="#3b82f6"
                    height={6}
                    style={styles.nutritionProgress}
                  />
                </View>

                <View style={styles.nutritionItem}>
                  <Icon name="sun" size={20} color="#f59e0b" />
                  <Text style={styles.nutritionLabel}>탄수화물</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.carbs)}/{dailyGoals.carbs}g
                  </Text>
                  <ProgressBar
                    value={todayNutrition.carbs}
                    max={dailyGoals.carbs}
                    color="#f59e0b"
                    height={6}
                    style={styles.nutritionProgress}
                  />
                </View>

                <View style={styles.nutritionItem}>
                  <Icon name="circle" size={20} color="#10b981" />
                  <Text style={styles.nutritionLabel}>지방</Text>
                  <Text style={styles.nutritionValue}>
                    {Math.round(todayNutrition.fat)}/{dailyGoals.fat}g
                  </Text>
                  <ProgressBar
                    value={todayNutrition.fat}
                    max={dailyGoals.fat}
                    color="#10b981"
                    height={6}
                    style={styles.nutritionProgress}
                  />
                </View>
              </View>
            </Card>

            {/* 원형 차트 */}
            {todayNutrition.calories > 0 && (
              <Card style={styles.card}>
                <CardTitle>영양소 분포</CardTitle>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={getPieChartData()}
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
              </Card>
            )}

            {/* 식단 기록 목록 */}
            <Card style={[styles.card, styles.lastCard]}>
              <CardTitle>오늘 먹은 음식</CardTitle>
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
                        {Math.round(entry.food.calories * entry.quantity)}kcal
                      </Text>
                      <Text style={styles.foodTime}>{entry.time}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFood(entry.id)}>
                      <Icon name="trash-2" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Card>
          </>
        )}

        {activeTab === 'recommended' && (
          <Card style={styles.card}>
            <CardTitle>추천 식단</CardTitle>
            <Text style={styles.emptyText}>추천 식단 기능 준비 중입니다.</Text>
          </Card>
        )}

        {activeTab === 'recipe' && (
          <Card style={styles.card}>
            <CardTitle>AI 레시피</CardTitle>
            <Text style={styles.emptyText}>AI 레시피 기능 준비 중입니다.</Text>
          </Card>
        )}
      </ScrollView>

      {/* 음식 추가 모달 */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
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
              autoFocus
            />

            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.foodItem}
                  onPress={() => addFood(item)}
                >
                  <View>
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemDetails}>
                      {item.calories}kcal | 단백질 {item.protein}g | {item.serving}
                    </Text>
                  </View>
                  <Icon name="plus-circle" size={24} color="#6366f1" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              }
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
    marginHorizontal: 16,
    marginTop: 16,
  },
  lastCard: {
    marginBottom: 16,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  nutritionItem: {
    width: '50%',
    paddingRight: 8,
    marginBottom: 16,
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
  nutritionProgress: {
    marginTop: 8,
  },
  chartContainer: {
    marginTop: 16,
    alignItems: 'center',
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
  modalOverlay: {
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
