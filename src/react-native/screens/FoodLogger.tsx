import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import { ProgressBar } from '../components/ProgressBar';
import { FoodService } from '../../services/foodService';

// Types
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

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  calories: number;
  time: number;
  difficulty: string;
}

interface RecommendedMeal {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Sample Data
const SAMPLE_RECIPES: Recipe[] = [
  {
    id: '1',
    name: '닭가슴살 샐러드',
    ingredients: ['닭가슴살 150g', '양상추', '토마토', '오이', '견과류'],
    calories: 350,
    time: 15,
    difficulty: '쉬움',
  },
  {
    id: '2',
    name: '고구마 샐러드',
    ingredients: ['고구마 200g', '양파', '올리브오일', '베이비채소'],
    calories: 280,
    time: 20,
    difficulty: '쉬움',
  },
  {
    id: '3',
    name: '연어 구이',
    ingredients: ['연어 150g', '레몬', '허브', '올리브오일'],
    calories: 420,
    time: 25,
    difficulty: '중간',
  },
  {
    id: '4',
    name: '계란찜',
    ingredients: ['계란 3개', '우유', '파', '버터'],
    calories: 250,
    time: 10,
    difficulty: '쉬움',
  },
];

const RECOMMENDED_MEALS: RecommendedMeal[] = [
  {
    id: '1',
    mealType: 'breakfast',
    name: '계란 2개 + 현미밥 1공기',
    description: '🌅 아침',
    calories: 455,
    protein: 29,
    carbs: 35,
    fat: 15,
  },
  {
    id: '2',
    mealType: 'lunch',
    name: '닭가슴살 150g + 고구마 200g',
    description: '🌞 점심',
    calories: 420,
    protein: 47,
    carbs: 40,
    fat: 5,
  },
  {
    id: '3',
    mealType: 'dinner',
    name: '연어 구이 + 샐러드',
    description: '🌙 저녁',
    calories: 350,
    protein: 33,
    carbs: 12,
    fat: 18,
  },
];

type TabType = 'record' | 'track' | 'recommend' | 'ai';

export function FoodLogger() {
  const [activeTab, setActiveTab] = useState<TabType>('record');
  const [todaysFoods, setTodaysFoods] = useState<FoodEntry[]>([]);
  const [recipeInput, setRecipeInput] = useState('');
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [recommendedMeals, setRecommendedMeals] = useState<RecommendedMeal[]>(RECOMMENDED_MEALS);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const recipeInputRef = useRef<TextInput>(null);

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

  const addRecommendedMeal = (meal: RecommendedMeal) => {
    // RecommendedMeal을 Food 형식으로 변환
    const food: Food = {
      id: meal.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      serving: '1식',
    };
    
    const entry: FoodEntry = {
      id: Date.now().toString(),
      food,
      quantity: 1,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    
    setTodaysFoods([...todaysFoods, entry]);
    Alert.alert('추가됨', `${meal.name}이 추가되었습니다.`);
  };

  const removeFood = (id: string) => {
    setTodaysFoods(todaysFoods.filter((entry) => entry.id !== id));
  };

  const searchRecipes = async () => {
    if (!recipeInput.trim()) {
      Alert.alert('알림', '재료를 입력해주세요.');
      return;
    }
    
    setLoadingRecommendations(true);
    try {
      // 실제 API 호출 (123 123 로그인 포함)
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }
      
      const response = await FoodService.getRecipeRecommendation(recipeInput);
      
      if (response.success && response.data) {
        const recipeData = response.data.value || response.data;
        if (recipeData.foodInfoDto && recipeData.foodInfoDto.length > 0) {
          const recipe = recipeData.foodInfoDto[0];
          const newRecipe: Recipe = {
            id: Date.now().toString(),
            name: recipe.name || '추천 레시피',
            ingredients: recipe.description ? recipe.description.split('\n') : [],
            calories: parseInt(recipe.calory) || 0,
            time: 30,
            difficulty: '중간',
          };
          setRecommendedRecipes([newRecipe]);
          Alert.alert('성공', '레시피 추천을 받았습니다!');
        } else {
          Alert.alert('알림', '레시피를 찾을 수 없습니다.');
        }
      } else {
        Alert.alert('알림', response.error || '레시피 추천에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('레시피 추천 오류:', error);
      Alert.alert('오류', `레시피 추천 중 오류가 발생했습니다.\n${error.message || error}`);
    } finally {
      setLoadingRecommendations(false);
      setRecipeInput('');
    }
  };

  const loadFoodRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      // 실제 API 호출 (123 123 로그인 포함)
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }
      
      const user = JSON.parse(userStr);
      const response = await FoodService.getFoodRecommendations(user.id || user.email);
      
      if (response.success && response.data) {
        const data = response.data.value || response.data;
        if (Array.isArray(data) && data.length > 0) {
          const meals: RecommendedMeal[] = data.map((item: any, index: number) => ({
            id: item.id || index.toString(),
            mealType: item.foodKind === 'BREAKFAST' ? 'breakfast' : 
                     item.foodKind === 'LUNCH' ? 'lunch' : 'dinner',
            name: item.name || '추천 식단',
            description: item.foodKind === 'BREAKFAST' ? '🌅 아침' :
                        item.foodKind === 'LUNCH' ? '🌞 점심' : '🌙 저녁',
            calories: parseInt(item.calory) || 0,
            protein: parseInt(item.protein) || 0,
            carbs: parseInt(item.carbohydrate) || 0,
            fat: parseInt(item.fat) || 0,
          }));
          setRecommendedMeals(meals);
          Alert.alert('성공', '식단 추천을 받았습니다!');
        } else {
          Alert.alert('알림', '추천할 식단이 없습니다.');
        }
      } else {
        Alert.alert('알림', response.error || '식단 추천에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('식단 추천 오류:', error);
      Alert.alert('오류', `식단 추천 중 오류가 발생했습니다.\n${error.message || error}`);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Record Tab Component
  const RecordTab = () => (
    <>
      {/* Total Calories Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>오늘의 총 칼로리</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.totalCalorieBox}>
            <Text style={styles.totalCalorieValue}>
              {Math.round(currentTotals.calories)}
              <Text style={styles.totalCalorieUnit}>kcal</Text>
            </Text>
            <Text style={styles.totalCalorieGoal}>/ {dailyGoals.calories}kcal</Text>
          </View>
          <ProgressBar
            progress={Math.min((currentTotals.calories / dailyGoals.calories) * 100, 100)}
          />
        </View>
      </View>

      {/* Today's Foods */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>오늘 먹은 음식</Text>
          <Text style={styles.cardSubtitle}>{todaysFoods.length}개</Text>
        </View>
        <View style={styles.cardContent}>
          {todaysFoods.length === 0 ? (
            <View style={styles.emptyState}>
              <Icon name="coffee" size={48} color="#E0E0E0" />
              <Text style={styles.emptyText}>아직 기록된 음식이 없습니다</Text>
              <Text style={styles.emptySubtext}>식단추천에서 음식을 추가해보세요</Text>
            </View>
          ) : (
            todaysFoods.map((entry) => (
              <View key={entry.id} style={styles.foodEntry}>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryTime}>{entry.time}</Text>
                  <Text style={styles.entryName}>{entry.food.name}</Text>
                  <Text style={styles.entryNutrition}>
                    {Math.round(entry.food.calories * entry.quantity)}kcal • P:{' '}
                    {Math.round(entry.food.protein * entry.quantity)}g • C:{' '}
                    {Math.round(entry.food.carbs * entry.quantity)}g • F:{' '}
                    {Math.round(entry.food.fat * entry.quantity)}g
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeFood(entry.id)}>
                  <Icon name="trash-2" size={18} color="#2B2B2B" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );

  // Track Tab Component
  const TrackTab = () => {
    const macroRatio = {
      protein: (currentTotals.protein / (currentTotals.protein + currentTotals.carbs + currentTotals.fat)) * 100,
      carbs: (currentTotals.carbs / (currentTotals.protein + currentTotals.carbs + currentTotals.fat)) * 100,
      fat: (currentTotals.fat / (currentTotals.protein + currentTotals.carbs + currentTotals.fat)) * 100,
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>영양소 추적</Text>
        </View>
        <View style={styles.cardContent}>
          {/* Calories Summary */}
          <View style={styles.calorieSummary}>
            <Text style={styles.calorieValue}>
              {Math.round(currentTotals.calories)}
              <Text style={styles.calorieUnit}>kcal</Text>
            </Text>
            <Text style={styles.calorieGoal}>/ {dailyGoals.calories}kcal</Text>
          </View>
          <ProgressBar
            progress={Math.min((currentTotals.calories / dailyGoals.calories) * 100, 100)}
          />

          {/* Macro Nutrients */}
          <View style={styles.macroSection}>
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.macroLabel}>단백질</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(currentTotals.protein)}g / {dailyGoals.protein}g
              </Text>
              <ProgressBar
                progress={Math.min((currentTotals.protein / dailyGoals.protein) * 100, 100)}
                color="#4CAF50"
              />
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.macroLabel}>탄수화물</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(currentTotals.carbs)}g / {dailyGoals.carbs}g
              </Text>
              <ProgressBar
                progress={Math.min((currentTotals.carbs / dailyGoals.carbs) * 100, 100)}
                color="#2196F3"
              />
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.macroLabel}>지방</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(currentTotals.fat)}g / {dailyGoals.fat}g
              </Text>
              <ProgressBar
                progress={Math.min((currentTotals.fat / dailyGoals.fat) * 100, 100)}
                color="#FF9800"
              />
            </View>
          </View>

          {/* Macro Ratio */}
          <View style={styles.ratioSection}>
            <Text style={styles.ratioTitle}>영양소 비율</Text>
            <View style={styles.ratioBar}>
              <View
                style={[
                  styles.ratioSegment,
                  { width: `${macroRatio.protein}%`, backgroundColor: '#4CAF50' },
                ]}
              />
              <View
                style={[
                  styles.ratioSegment,
                  { width: `${macroRatio.carbs}%`, backgroundColor: '#2196F3' },
                ]}
              />
              <View
                style={[
                  styles.ratioSegment,
                  { width: `${macroRatio.fat}%`, backgroundColor: '#FF9800' },
                ]}
              />
            </View>
            <View style={styles.ratioLabels}>
              <Text style={styles.ratioLabel}>단백질 {macroRatio.protein.toFixed(1)}%</Text>
              <Text style={styles.ratioLabel}>탄수 {macroRatio.carbs.toFixed(1)}%</Text>
              <Text style={styles.ratioLabel}>지방 {macroRatio.fat.toFixed(1)}%</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Recommend Tab Component
  const RecommendTab = () => (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>오늘의 추천 식단</Text>
          <TouchableOpacity 
            onPress={loadFoodRecommendations}
            disabled={loadingRecommendations}
            style={styles.refreshButton}
          >
            {loadingRecommendations ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Icon name="refresh-cw" size={20} color="#6366f1" />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.recommendGoal}>
            하루 권장 칼로리: <Text style={styles.boldText}>2000kcal</Text>
          </Text>

          <View style={styles.mealPlan}>
            {recommendedMeals.map((meal) => (
              <View key={meal.id} style={styles.mealSection}>
                <Text style={styles.mealTitle}>{meal.description}</Text>
                <Text style={styles.mealFood}>{meal.name}</Text>
                <Text style={styles.mealCalories}>약 {meal.calories}kcal</Text>
                <View style={styles.mealMacros}>
                  <View style={styles.macroIndicator}>
                    <View style={[styles.macroDotSmall, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.macroText}>P: {meal.protein}g</Text>
                  </View>
                  <View style={styles.macroIndicator}>
                    <View style={[styles.macroDotSmall, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.macroText}>C: {meal.carbs}g</Text>
                  </View>
                  <View style={styles.macroIndicator}>
                    <View style={[styles.macroDotSmall, { backgroundColor: '#FF9800' }]} />
                    <Text style={styles.macroText}>F: {meal.fat}g</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.addMealButton}
                  onPress={() => addRecommendedMeal(meal)}
                >
                  <Text style={styles.addMealButtonText}>+ 추가하기</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </View>
    </>
  );

  // AI Recipe Tab Component
  const AIRecipeTab = () => (
    <>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiIcon}>🧑‍🍳</Text>
            <Text style={styles.cardTitle}>AI 레시피 추천</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.aiDescription}>가지고 있는 재료를 입력하면 레시피를 추천해드립니다</Text>
          
          <View style={styles.recipeInputContainer}>
            <TextInput
              ref={recipeInputRef}
              style={styles.recipeInput}
              placeholder="예: 닭가슴살, 토마토, 양파"
              placeholderTextColor="#9E9E9E"
              value={recipeInput}
              onChangeText={(text) => {
                setRecipeInput(text);
                // 키보드가 닫히는 것을 방지하기 위해 포커스 유지
                setTimeout(() => {
                  recipeInputRef.current?.focus();
                }, 0);
              }}
              multiline
              blurOnSubmit={false}
              returnKeyType="none"
              onSubmitEditing={() => {
                // 키보드가 닫히지 않도록 아무 동작도 하지 않음
              }}
              keyboardType="default"
              textContentType="none"
              autoCorrect={false}
              editable={true}
            />
            <TouchableOpacity 
              style={styles.searchButton} 
              onPress={searchRecipes}
              disabled={loadingRecommendations}
            >
              {loadingRecommendations ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="search" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {recommendedRecipes.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>추천 레시피</Text>
          </View>
          <View style={styles.cardContent}>
            {recommendedRecipes.map((recipe) => (
              <View key={recipe.id} style={styles.recipeCard}>
                <Text style={styles.recipeTitle}>{recipe.name}</Text>
                <Text style={styles.recipeDescription}>
                  조리 시간: {recipe.time}분 • 난이도: {recipe.difficulty}
                </Text>
                <Text style={styles.recipeNutrition}>
                  {recipe.calories}kcal • 단백질 {Math.floor(recipe.calories * 0.3 / 4)}g • 탄수화물{' '}
                  {Math.floor(recipe.calories * 0.5 / 4)}g
                </Text>
                <View style={styles.ingredientsContainer}>
                  {recipe.ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingredientTag}>
                      <Text style={styles.ingredientText}>{ing}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>식단 🍽️</Text>
          <Text style={styles.headerSubtitle}>오늘의 식단을 기록하고 추천받으세요</Text>
        </View>
      </View>

      {/* Tab Navigation - Top */}
      <View style={styles.tabContainer}>
        {(['기록', '추적', '식단추천', 'AI레시피'] as const).map((tab, index) => {
          const tabKeys: TabType[] = ['record', 'track', 'recommend', 'ai'];
          const isActive = activeTab === tabKeys[index];
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tabKeys[index])}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'record' && <RecordTab />}
        {activeTab === 'track' && <TrackTab />}
        {activeTab === 'recommend' && <RecommendTab />}
        {activeTab === 'ai' && <AIRecipeTab />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 20,
    paddingTop: 48,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#2B2B2B',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  refreshButton: {
    padding: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  cardContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2B2B2B',
  },
  searchResults: {
    marginTop: 12,
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  foodNutrition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B2B2B',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9E9E9E',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 8,
    textAlign: 'center',
  },
  foodEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  entryInfo: {
    flex: 1,
  },
  entryTime: {
    fontSize: 12,
    color: '#9E9E9E',
    marginBottom: 6,
  },
  entryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  entryNutrition: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  // Record Tab - Total Calories
  totalCalorieBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  totalCalorieValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  totalCalorieUnit: {
    fontSize: 28,
    fontWeight: '600',
  },
  totalCalorieGoal: {
    fontSize: 18,
    color: '#9E9E9E',
    marginLeft: 8,
  },
  // Track Tab Styles
  calorieSummary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 16,
  },
  calorieValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  calorieUnit: {
    fontSize: 24,
    fontWeight: '500',
  },
  calorieGoal: {
    fontSize: 18,
    color: '#9E9E9E',
    marginLeft: 8,
  },
  macroSection: {
    gap: 20,
    marginTop: 24,
  },
  macroItem: {
    gap: 8,
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  macroValue: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  ratioSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  ratioTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 12,
  },
  ratioBar: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ratioSegment: {
    height: '100%',
  },
  ratioLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  ratioLabel: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  // Recommend Tab Styles
  recommendGoal: {
    fontSize: 15,
    color: '#9E9E9E',
    marginBottom: 20,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2B2B2B',
  },
  mealPlan: {
    gap: 16,
    marginBottom: 20,
  },
  mealSection: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 12,
  },
  mealFood: {
    fontSize: 14,
    color: '#2B2B2B',
    marginBottom: 8,
    fontWeight: '500',
  },
  mealCalories: {
    fontSize: 13,
    color: '#9E9E9E',
    marginBottom: 12,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 16,
  },
  macroIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  addButton: {
    backgroundColor: '#2B2B2B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addMealButton: {
    backgroundColor: '#2B2B2B',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  addMealButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // AI Recipe Tab Styles
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIcon: {
    fontSize: 24,
  },
  aiDescription: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: 16,
    lineHeight: 20,
  },
  recipeInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recipeInput: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#2B2B2B',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: '#2B2B2B',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeCard: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 13,
    color: '#9E9E9E',
    marginBottom: 8,
  },
  recipeNutrition: {
    fontSize: 13,
    color: '#9E9E9E',
    marginBottom: 12,
    fontWeight: '500',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientTag: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ingredientText: {
    fontSize: 12,
    color: '#2B2B2B',
  },
});