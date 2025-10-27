import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';

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

const SAMPLE_FOODS: Food[] = [
  { id: '1', name: '닭가슴살', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g' },
  { id: '2', name: '현미밥', calories: 150, protein: 3, carbs: 32, fat: 1.2, serving: '1공기' },
  { id: '3', name: '계란', calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: '1개' },
  { id: '4', name: '고구마', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '100g' },
  { id: '5', name: '브로콜리', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: '100g' },
];

export function FoodLogger() {
  const [todaysFoods, setTodaysFoods] = useState<FoodEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'log' | 'plan' | 'recipe'>('log');

  const dailyGoals = {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
  };

  const currentTotals = todaysFoods.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.food.calories * entry.quantity,
      protein: acc.protein + entry.food.protein * entry.quantity,
      carbs: acc.carbs + entry.food.carbs * entry.quantity,
      fat: acc.fat + entry.food.fat * entry.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const addFood = (food: Food) => {
    const entry: FoodEntry = {
      id: Date.now().toString(),
      food,
      quantity: 1,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setTodaysFoods([...todaysFoods, entry]);
    setSearchQuery('');
  };

  const removeFood = (id: string) => {
    setTodaysFoods(todaysFoods.filter((entry) => entry.id !== id));
  };

  const ProgressBar = ({ current, goal, label, unit = 'g' }: {
    current: number;
    goal: number;
    label: string;
    unit?: string;
  }) => {
    const percentage = Math.min((current / goal) * 100, 100);

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>
            {Math.round(current)}{unit} / {goal}{unit}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.card, style]}>{children}</View>
  );

  const filteredFoods = SAMPLE_FOODS.filter((food) =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>식단 관리</Text>
        <TouchableOpacity>
          <Icon name="settings" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'log' && styles.activeTab]}
          onPress={() => setActiveTab('log')}
        >
          <Text style={[styles.tabText, activeTab === 'log' && styles.activeTabText]}>
            식단 기록
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plan' && styles.activeTab]}
          onPress={() => setActiveTab('plan')}
        >
          <Text style={[styles.tabText, activeTab === 'plan' && styles.activeTabText]}>
            식단 계획
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recipe' && styles.activeTab]}
          onPress={() => setActiveTab('recipe')}
        >
          <Text style={[styles.tabText, activeTab === 'recipe' && styles.activeTabText]}>
            레시피
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {activeTab === 'log' && (
          <>
            {/* Today's Summary */}
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>오늘의 영양소</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryBox, { backgroundColor: '#ede9fe' }]}>
                    <Text style={[styles.summaryValue, { color: '#6366f1' }]}>
                      {Math.round(currentTotals.calories)}
                    </Text>
                    <Text style={styles.summaryLabel}>섭취 칼로리</Text>
                  </View>
                  <View style={[styles.summaryBox, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                      {Math.round(dailyGoals.calories - currentTotals.calories)}
                    </Text>
                    <Text style={styles.summaryLabel}>남은 칼로리</Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <ProgressBar
                    current={currentTotals.calories}
                    goal={dailyGoals.calories}
                    label="칼로리"
                    unit="kcal"
                  />
                  <ProgressBar
                    current={currentTotals.protein}
                    goal={dailyGoals.protein}
                    label="단백질"
                  />
                  <ProgressBar
                    current={currentTotals.carbs}
                    goal={dailyGoals.carbs}
                    label="탄수화물"
                  />
                  <ProgressBar
                    current={currentTotals.fat}
                    goal={dailyGoals.fat}
                    label="지방"
                  />
                </View>
              </View>
            </Card>

            {/* Food Search */}
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>음식 추가</Text>
              </View>
              <View style={styles.cardContent}>
                <View style={styles.searchContainer}>
                  <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="음식 검색..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {searchQuery && (
                  <View style={styles.searchResults}>
                    {filteredFoods.map((food) => (
                      <TouchableOpacity
                        key={food.id}
                        style={styles.foodItem}
                        onPress={() => addFood(food)}
                      >
                        <View style={styles.foodInfo}>
                          <Text style={styles.foodName}>{food.name}</Text>
                          <Text style={styles.foodServing}>{food.serving}</Text>
                        </View>
                        <View style={styles.foodNutrition}>
                          <Text style={styles.foodCalories}>{food.calories}kcal</Text>
                          <Icon name="plus-circle" size={20} color="#6366f1" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </Card>

            {/* Today's Foods */}
            <Card>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>오늘 먹은 음식</Text>
                <Text style={styles.cardSubtitle}>{todaysFoods.length}개</Text>
              </View>
              <View style={styles.cardContent}>
                {todaysFoods.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Icon name="coffee" size={48} color="#d1d5db" />
                    <Text style={styles.emptyText}>아직 기록된 음식이 없습니다</Text>
                    <Text style={styles.emptySubtext}>
                      위에서 음식을 검색하여 추가하세요
                    </Text>
                  </View>
                ) : (
                  todaysFoods.map((entry) => (
                    <View key={entry.id} style={styles.foodEntry}>
                      <View style={styles.entryInfo}>
                        <Text style={styles.entryTime}>{entry.time}</Text>
                        <Text style={styles.entryName}>{entry.food.name}</Text>
                        <Text style={styles.entryNutrition}>
                          {Math.round(entry.food.calories * entry.quantity)}kcal • 
                          P: {Math.round(entry.food.protein * entry.quantity)}g • 
                          C: {Math.round(entry.food.carbs * entry.quantity)}g • 
                          F: {Math.round(entry.food.fat * entry.quantity)}g
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeFood(entry.id)}>
                        <Icon name="trash-2" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </Card>
          </>
        )}

        {activeTab === 'plan' && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>오늘의 식단 계획</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.mealPlan}>
                <View style={styles.mealSection}>
                  <Text style={styles.mealTitle}>🌅 아침</Text>
                  <Text style={styles.mealFood}>계란 2개 + 현미밥 1공기</Text>
                  <Text style={styles.mealCalories}>약 455kcal</Text>
                </View>
                <View style={styles.mealSection}>
                  <Text style={styles.mealTitle}>🌞 점심</Text>
                  <Text style={styles.mealFood}>닭가슴살 150g + 고구마 200g</Text>
                  <Text style={styles.mealCalories}>약 420kcal</Text>
                </View>
                <View style={styles.mealSection}>
                  <Text style={styles.mealTitle}>🌙 저녁</Text>
                  <Text style={styles.mealFood}>연어 구이 + 샐러드</Text>
                  <Text style={styles.mealCalories}>약 350kcal</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.generateButton}>
                <Icon name="refresh-cw" size={16} color="#ffffff" />
                <Text style={styles.generateButtonText}>새 계획 생성</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {activeTab === 'recipe' && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>추천 레시피</Text>
            </View>
            <View style={styles.cardContent}>
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>🍗 닭가슴살 샐러드</Text>
                <Text style={styles.recipeDescription}>
                  조리 시간: 15분 • 난이도: 쉬움
                </Text>
                <Text style={styles.recipeNutrition}>
                  350kcal • 단백질 45g • 탄수화물 20g
                </Text>
              </View>
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>🥗 고구마 샐러드</Text>
                <Text style={styles.recipeDescription}>
                  조리 시간: 20분 • 난이도: 쉬움
                </Text>
                <Text style={styles.recipeNutrition}>
                  280kcal • 단백질 8g • 탄수화물 52g
                </Text>
              </View>
              <View style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>🐟 연어 구이</Text>
                <Text style={styles.recipeDescription}>
                  조리 시간: 25분 • 난이도: 중간
                </Text>
                <Text style={styles.recipeNutrition}>
                  420kcal • 단백질 38g • 탄수화물 5g
                </Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
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
    paddingTop: 48,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardContent: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressSection: {
    gap: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
  },
  searchResults: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  foodServing: {
    fontSize: 12,
    color: '#6b7280',
  },
  foodNutrition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  foodCalories: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6366f1',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  foodEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  entryInfo: {
    flex: 1,
  },
  entryTime: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 4,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  entryNutrition: {
    fontSize: 11,
    color: '#6b7280',
  },
  mealPlan: {
    gap: 16,
    marginBottom: 16,
  },
  mealSection: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  mealFood: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  mealCalories: {
    fontSize: 12,
    color: '#6b7280',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  recipeCard: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 6,
  },
  recipeNutrition: {
    fontSize: 12,
    color: '#4b5563',
  },
});
