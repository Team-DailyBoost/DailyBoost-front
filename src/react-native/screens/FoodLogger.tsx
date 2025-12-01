import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import { ProgressBar } from '../components/ProgressBar';
import { FoodService } from '../../services/foodService';
import { normalizeFoodRecommendations, NormalizedFoodRecommendation } from '../../utils/foodRecommendation';
import {
  aggregateDailyTotals,
  aggregateWeeklyCalories,
  buildMealTimeLabel,
  cacheTodayTotals,
  cacheWeeklyCalories,
  normalizeFoodApiItem,
  NormalizedFoodLog,
} from '../../utils/foodStats';

// Types
interface Food {
  id: string;
  apiId: number | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  foodKind?: string | null;
  registeredAt?: string | null;
}

interface FoodEntry {
  id: string;
  food: Food;
  quantity: number;
  time: string;
  source?: 'backend' | 'local';
}

const LOCAL_FOOD_ENTRIES_KEY = '@foodLogger:localEntries';

async function readLocalFoodEntries(): Promise<FoodEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_FOOD_ENTRIES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item) => ({
      ...item,
      source: 'local' as const,
    }));
  } catch {
    return [];
  }
}

async function persistLocalFoodEntries(entries: FoodEntry[]) {
  try {
    const locals = entries
      .filter((entry) => entry.source === 'local')
      .map((entry) => ({
        id: entry.id,
        food: entry.food,
        quantity: entry.quantity,
        time: entry.time,
        source: 'local' as const,
      }));
    await AsyncStorage.setItem(LOCAL_FOOD_ENTRIES_KEY, JSON.stringify(locals));
  } catch (error) {
    console.error('로컬 식단 저장 실패:', error);
  }
}

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  calories: number;
  time: number;
  difficulty: string;
}

type RecommendedMeal = NormalizedFoodRecommendation;

type TabType = 'record' | 'track' | 'recommend' | 'ai';

const DAILY_GOAL = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 67,
};


export function FoodLogger() {
  const [activeTab, setActiveTab] = useState<TabType>('recommend');
  const [todaysFoods, setTodaysFoods] = useState<FoodEntry[]>([]);
  const [loadingTodayFoods, setLoadingTodayFoods] = useState(false);
  const [processingMealId, setProcessingMealId] = useState<string | null>(null);
  const [recipeInput, setRecipeInput] = useState('');
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [recommendedMeals, setRecommendedMeals] = useState<RecommendedMeal[]>([]);
  const [isFallbackRecommendations, setIsFallbackRecommendations] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [processingRecommendIds, setProcessingRecommendIds] = useState<Record<string, boolean>>({});
  const processingRecommendIdsRef = useRef<Record<string, boolean>>({});
  const recipeInputRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const fallbackFoodNoticeShown = useRef(false);
  const loadTodayFoodsQueueRef = useRef<Promise<void> | null>(null);
  const loadTodayFoodsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 레시피 입력 핸들러 메모이제이션 (커서 해제 방지)
  // 한글/영어 입력 시 커서가 해제되지 않도록 즉시 상태 업데이트
  const handleRecipeInputChange = useCallback((text: string) => {
    // 상태 업데이트를 즉시 실행하여 입력 시 커서 유지
    setRecipeInput(text);
  }, []);

  // TextInput 포커스 시 스크롤 처리
  const handleRecipeInputFocus = useCallback(() => {
    // 키보드가 올라올 때까지 약간의 지연 후 스크롤
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, Platform.OS === 'ios' ? 250 : 100);
  }, []);

  // 키보드 이벤트 리스너 (커서 유지 및 스크롤 개선)
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // 키보드가 올라올 때 TextInput이 보이도록 스크롤
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
    };
  }, []);

  const removeMealFromRecommendations = useCallback((meal: RecommendedMeal) => {
    setRecommendedMeals(prev =>
      prev.filter(item => (item.id || item.name) !== (meal.id || meal.name))
    );
  }, []);

  const markRecommendProcessing = useCallback((key: string) => {
    processingRecommendIdsRef.current[key] = true;
    setProcessingRecommendIds(prev => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const unmarkRecommendProcessing = useCallback((key: string) => {
    delete processingRecommendIdsRef.current[key];
    setProcessingRecommendIds(prev => {
      if (!(key in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem('@foodRecommendations');
        if (cached) {
          const parsed = JSON.parse(cached);
          const normalized = normalizeFoodRecommendations(parsed);
          if (normalized.length > 0) {
            setRecommendedMeals(normalized);
          }
        }
      } catch (error) {
      }
    })();
  }, []);

  const convertFoodLogToEntry = useCallback((log: NormalizedFoodLog): FoodEntry => {
    const fallbackId = `${log.id ?? Date.now()}`;
    const food: Food = {
      id: String(log.id ?? fallbackId),
      apiId: log.id,
      name: log.name,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      serving: '1식',
      foodKind: log.foodKind,
      registeredAt: log.registeredAt,
    };

    return {
      id: `entry_${food.id}_${log.registeredAt ?? 'today'}`,
      food,
      quantity: 1,
      time: buildMealTimeLabel(log.foodKind, log.registeredAt),
      source: 'backend',
    };
  }, []);

  const refreshWeeklyCalories = useCallback(async () => {
    try {
      const res = await FoodService.getWeeklyFoodLogs();
      if (res.success && Array.isArray(res.data)) {
        const normalized = res.data.map((item: any) => normalizeFoodApiItem(item));
        const summary = aggregateWeeklyCalories(normalized);
        await cacheWeeklyCalories(summary);
      }
    } catch (error) {
    }
  }, []);

  const loadTodayFoods = useCallback(
    async ({ syncWeekly = false }: { syncWeekly?: boolean } = {}) => {
      // If there's already a load in progress, wait for it to complete
      if (loadTodayFoodsQueueRef.current) {
        try {
          await loadTodayFoodsQueueRef.current;
        } catch (error) {
          // 이전 요청이 실패해도 계속 진행
        }
        // 이전 요청이 완료되었으므로 새로 시작
      }

      const loadPromise = (async () => {
        setLoadingTodayFoods(true);
        try {
          const res = await FoodService.getTodayFoodLogs() as any;
          
          if (res && res.success && Array.isArray(res.data)) {
            const normalized = res.data.map((item: any) => normalizeFoodApiItem(item));
            const entries = normalized.map(convertFoodLogToEntry);
            const localEntries = await readLocalFoodEntries();
            const combined = [...localEntries, ...entries];
            setTodaysFoods(combined);
            cacheTotalsForEntries(combined);
          } else {
            // 응답이 없거나 실패한 경우
            if (res && !res.success) {
              // 로그인 필요 오류는 조용히 처리 (사용자가 로그인하지 않은 상태일 수 있음)
              if (res.error && res.error.includes('로그인이 필요')) {
                console.warn('식단 조회: 로그인이 필요합니다.');
              } else {
                console.warn('식단 조회 실패:', res.error || '알 수 없는 오류');
              }
            } else if (res && res.data && !Array.isArray(res.data)) {
              console.warn('식단 조회 응답 형식 오류:', typeof res.data, res.data);
            }
            const fallbackLocal = await readLocalFoodEntries();
            if (fallbackLocal.length > 0) {
              setTodaysFoods(fallbackLocal);
              cacheTotalsForEntries(fallbackLocal);
            } else {
              setTodaysFoods([]);
            }
          }

          if (syncWeekly) {
            try {
              await refreshWeeklyCalories();
            } catch (weeklyError) {
              // 주간 동기화 실패해도 계속 진행
            }
          }
        } catch (error: any) {
          console.error('식단 로드 중 오류:', error?.message || error);
          const fallbackLocal = await readLocalFoodEntries();
          if (fallbackLocal.length > 0) {
            setTodaysFoods(fallbackLocal);
            cacheTotalsForEntries(fallbackLocal);
          } else {
            setTodaysFoods([]);
          }
        } finally {
          setLoadingTodayFoods(false);
          loadTodayFoodsQueueRef.current = null;
        }
      })();

      loadTodayFoodsQueueRef.current = loadPromise;
      await loadPromise;
    },
    [convertFoodLogToEntry, refreshWeeklyCalories]
  );

  // 화면이 포커스를 받을 때마다 최신 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadTodayFoods({ syncWeekly: true });
    }, [loadTodayFoods])
  );

  const computeTotals = useCallback((entries: FoodEntry[]) => {
    return entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.food.calories * entry.quantity,
        protein: acc.protein + entry.food.protein * entry.quantity,
        carbs: acc.carbs + entry.food.carbs * entry.quantity,
        fat: acc.fat + entry.food.fat * entry.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, []);

  const cacheTotalsForEntries = useCallback(
    (entries: FoodEntry[]) => {
      const totals = computeTotals(entries);
      cacheTodayTotals(totals);
      return totals;
    },
    [computeTotals]
  );

  const currentTotals = useMemo(
    () => computeTotals(todaysFoods),
    [computeTotals, todaysFoods]
  );

  const mealTypeToFoodKind = (mealType: RecommendedMeal['mealType']): 'BREAKFAST' | 'LUNCH' | 'DINNER' => {
    switch (mealType) {
      case 'breakfast':
        return 'BREAKFAST';
      case 'lunch':
        return 'LUNCH';
      default:
        return 'DINNER';
    }
  };

  const createLocalEntryFromRecommendation = (meal: RecommendedMeal): FoodEntry => {
    const foodKind = mealTypeToFoodKind(meal.mealType);
    const localId = `${Date.now()}_${meal.id}`;

    const food: Food = {
      id: localId,
      apiId: null,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      serving: '1식',
      foodKind,
      registeredAt: new Date().toISOString(),
    };

    return {
      id: `local_${localId}`,
      food,
      quantity: 1,
      time: buildMealTimeLabel(foodKind, food.registeredAt),
      source: 'local',
    };
  };

  // 이미 사용된 foodId를 추적하여 중복 사용 방지
  const usedFoodIdsRef = useRef<Set<number>>(new Set());

  const resolveFoodIdForRecommendation = useCallback(async (meal: RecommendedMeal): Promise<number | null> => {
    // 백엔드가 추천을 받으면 UNREGISTERED 상태로 Food를 저장하므로
    // 이름과 foodKind로 검색하여 ID를 찾습니다
    // 중요: 각 추천 식단마다 정확한 매칭을 위해 이름과 foodKind를 모두 확인합니다
    try {
      const desiredKind = mealTypeToFoodKind(meal.mealType);
      const res = await FoodService.searchFood(meal.name);
      
      if (res.success && Array.isArray(res.data)) {
        const normalized = res.data.map((item: any) => normalizeFoodApiItem(item));
        
        // 1. 정확한 매칭: 이름과 foodKind가 일치하고, 아직 사용되지 않은 것
        const exactMatch = normalized.find(
          log => 
            log.name === meal.name && 
            (log.foodKind ?? '').toUpperCase() === desiredKind &&
            log.id !== null &&
            !usedFoodIdsRef.current.has(log.id)
        );
        
        if (exactMatch?.id) {
          usedFoodIdsRef.current.add(exactMatch.id);
          return exactMatch.id;
        }
        
        // 2. 이름만 일치하고 아직 사용되지 않은 것
        const nameMatch = normalized.find(
          log => 
            log.name === meal.name && 
            log.id !== null &&
            !usedFoodIdsRef.current.has(log.id)
        );
        
        if (nameMatch?.id) {
          usedFoodIdsRef.current.add(nameMatch.id);
          return nameMatch.id;
        }
        
        // 3. 사용되지 않은 첫 번째 결과 사용
        const unusedMatch = normalized.find(
          log => log.id !== null && !usedFoodIdsRef.current.has(log.id)
        );
        
        if (unusedMatch?.id) {
          usedFoodIdsRef.current.add(unusedMatch.id);
          return unusedMatch.id;
        }
      }
    } catch (error) {
      // 검색 실패 시 null 반환 (로컬 저장으로 대체)
      console.warn('식단 ID 검색 실패:', error);
    }

    return null;
  }, []);

  const handleAddRecommendedMeal = useCallback(
    async (meal: RecommendedMeal) => {
      const processingKey = meal.id || meal.name;
      
      // Use ref for synchronous check to prevent race conditions
      if (processingRecommendIdsRef.current[processingKey]) {
        return;
      }
      
      markRecommendProcessing(processingKey);

      try {
        if (isFallbackRecommendations) {
          const entry = createLocalEntryFromRecommendation(meal);
          setTodaysFoods(prev => {
            const next = [entry, ...prev];
            cacheTotalsForEntries(next);
            persistLocalFoodEntries(next);
            return next;
          });
          removeMealFromRecommendations(meal);
          unmarkRecommendProcessing(processingKey);
          return;
        }

        // 백엔드에서 추천 시 저장된 Food를 이름과 foodKind로 찾기
        const resolvedId = await resolveFoodIdForRecommendation(meal);

        if (resolvedId) {
          // 백엔드: POST /api/food/register/{foodId}
          const res = await FoodService.registerFood(resolvedId) as any;
          
          if (!res || !res.success) {
            throw new Error(res?.error || '식단을 등록하지 못했습니다.');
          }

          // 백엔드에 저장 완료 후 즉시 오늘 식단 다시 로드
          removeMealFromRecommendations(meal);
          
          // 각 식단 등록 후 즉시 로드 (debounce 제거, 각각 즉시 반영)
          await loadTodayFoods({ syncWeekly: true });
        } else {
          // ID를 찾지 못한 경우 로컬에만 저장
          const entry = createLocalEntryFromRecommendation(meal);
          setTodaysFoods(prev => {
            const next = [entry, ...prev];
            cacheTotalsForEntries(next);
            persistLocalFoodEntries(next);
            return next;
          });
          removeMealFromRecommendations(meal);
        }
      } catch (error: any) {
        // 에러 발생 시에도 로컬에 저장
        const entry = createLocalEntryFromRecommendation(meal);
        setTodaysFoods(prev => {
          const next = [entry, ...prev];
          cacheTotalsForEntries(next);
          persistLocalFoodEntries(next);
          return next;
        });
        removeMealFromRecommendations(meal);
        console.log('[FoodLogger] 식단 등록 실패:', error?.message || '식단을 등록하지 못했습니다.');
        // 에러는 로그에만 기록하고 사용자에게는 표시하지 않음
      } finally {
        unmarkRecommendProcessing(processingKey);
      }
    },
    [
      cacheTotalsForEntries,
      isFallbackRecommendations,
      loadTodayFoods,
      markRecommendProcessing,
      removeMealFromRecommendations,
      resolveFoodIdForRecommendation,
      unmarkRecommendProcessing,
    ]
  );

  const removeFoodEntry = useCallback(
    async (entry: FoodEntry) => {
      if (processingMealId) {
        return;
      }

      setProcessingMealId(entry.id);
      try {
        if (entry.food.apiId) {
          // 백엔드: POST /api/food/unregister/{foodId}
          const res = await FoodService.unregisterFood(entry.food.apiId);
          if (!res || !res.success) {
            throw new Error(res?.error || '식단을 삭제하지 못했습니다.');
          }
          
          // 삭제 후 오늘 식단 다시 로드
          await loadTodayFoods({ syncWeekly: true });
        } else {
          // 로컬 데이터만 있는 경우
          setTodaysFoods(prev => {
            const next = prev.filter(item => item.id !== entry.id);
            cacheTotalsForEntries(next);
            persistLocalFoodEntries(next);
            return next;
          });
        }
      } catch (error: any) {
        // 에러 발생 시에도 로컬에서 제거
        setTodaysFoods(prev => {
          const next = prev.filter(item => item.id !== entry.id);
          cacheTotalsForEntries(next);
          return next;
        });
        
        Alert.alert(
          '오류',
          error?.message
            ? `${error.message}\n로컬 데이터에서만 제거했습니다.`
            : '식단을 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.'
        );
      } finally {
        setProcessingMealId(null);
      }
    },
    [cacheTotalsForEntries, loadTodayFoods, processingMealId]
  );

  const searchRecipes = useCallback(async () => {
    if (!recipeInput.trim()) {
      Alert.alert('알림', '재료를 입력해주세요.');
      return;
    }
    
    setLoadingRecommendations(true);
    try {
      const response = await FoodService.getRecipeRecommendation(recipeInput.trim());
      
      if (response.success && response.data) {
        const recipe = response.data;
        
        // 백엔드 응답이 null인 경우 (레시피와 관련 없는 질문)
        if (!recipe.name) {
          Alert.alert('알림', '레시피와 관련 없는 질문입니다. 재료나 요리 방법에 대해 질문해주세요.');
          return;
        }
        
        // description을 재료/조리법으로 파싱
        const descriptionLines = recipe.description 
          ? recipe.description.split('\n').filter(line => line.trim().length > 0)
          : [];
        
        const newRecipe: Recipe = {
          id: Date.now().toString(),
          name: recipe.name,
          ingredients: descriptionLines.length > 0 ? descriptionLines : ['레시피 정보가 없습니다.'],
          calories: recipe.calory ? Number(recipe.calory) : 0,
          time: 30, // 기본값 (백엔드에서 제공하지 않음)
          difficulty: '중간', // 기본값 (백엔드에서 제공하지 않음)
        };
        
        setRecommendedRecipes([newRecipe]);
        // 성공 시 사용자에게 표시하지 않음 (자동으로 표시됨)
      } else {
        console.log('[FoodLogger] 레시피 추천 실패:', response.error || '레시피 추천에 실패했습니다.');
      }
    } catch (error: any) {
      console.log('[FoodLogger] 레시피 추천 중 오류:', error.message || error);
    } finally {
      setLoadingRecommendations(false);
      setRecipeInput('');
    }
  }, [recipeInput]);

  const loadFoodRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      const accessToken = await AsyncStorage.getItem('@accessToken');
      const sessionCookie = await AsyncStorage.getItem('@sessionCookie');
      const hasAuthSession = Boolean(accessToken?.trim() || sessionCookie?.trim());

      if (!userStr && !hasAuthSession) {
        Alert.alert('알림', '로그인이 필요합니다.');
        setLoadingRecommendations(false);
        return;
      }

      const response = await FoodService.getFoodRecommendations();
      
      if (!response.success) {
        console.log('[FoodLogger] 식단 추천 실패:', response.error || '식단 추천에 실패했습니다.');
        return;
      }

      const rawData = Array.isArray(response.data) ? response.data : [];
      const normalized = normalizeFoodRecommendations(rawData);

      setIsFallbackRecommendations(Boolean(response.meta?.usedFallback));

      if (response.meta?.usedFallback && !fallbackFoodNoticeShown.current) {
        fallbackFoodNoticeShown.current = true;
        console.log('[FoodLogger] AI 식단 추천 서버가 잠시 응답하지 않아 기본 추천을 사용합니다.');
      }

      setRecommendedMeals(normalized);
      await AsyncStorage.setItem('@foodRecommendations', JSON.stringify(normalized));
      
      // 새로운 추천을 받았으므로 사용된 ID 추적 초기화
      usedFoodIdsRef.current.clear();

      if (normalized.length === 0) {
        console.log('[FoodLogger] 추천할 식단이 없습니다.');
      }
    } catch (error: any) {
      console.log('[FoodLogger] 식단 추천 중 오류:', error.message || error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Record Tab Render Function (컴포넌트 아님)
  const renderRecordTab = () => (
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
            <Text style={styles.totalCalorieGoal}>/ {DAILY_GOAL.calories}kcal</Text>
          </View>
          <ProgressBar
            progress={Math.min((currentTotals.calories / DAILY_GOAL.calories) * 100, 100)}
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
          {loadingTodayFoods ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.loadingText}>식단을 불러오는 중입니다...</Text>
            </View>
          ) : todaysFoods.length === 0 ? (
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
                <TouchableOpacity
                  onPress={() => removeFoodEntry(entry)}
                  disabled={processingMealId === entry.id}
                >
                  {processingMealId === entry.id ? (
                    <ActivityIndicator size="small" color="#2B2B2B" />
                  ) : (
                    <Icon name="trash-2" size={18} color="#2B2B2B" />
                  )}
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>
    </>
  );

  // Track Tab Render Function (컴포넌트 아님)
  const renderTrackTab = () => {
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
            <Text style={styles.calorieGoal}>/ {DAILY_GOAL.calories}kcal</Text>
          </View>
          <ProgressBar
            progress={Math.min((currentTotals.calories / DAILY_GOAL.calories) * 100, 100)}
          />

          {/* Macro Nutrients */}
          <View style={styles.macroSection}>
            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.macroLabel}>단백질</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(currentTotals.protein)}g / {DAILY_GOAL.protein}g
              </Text>
              <ProgressBar
                progress={Math.min((currentTotals.protein / DAILY_GOAL.protein) * 100, 100)}
                color="#4CAF50"
              />
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#2196F3' }]} />
                <Text style={styles.macroLabel}>탄수화물</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(currentTotals.carbs)}g / {DAILY_GOAL.carbs}g
              </Text>
              <ProgressBar
                progress={Math.min((currentTotals.carbs / DAILY_GOAL.carbs) * 100, 100)}
                color="#2196F3"
              />
            </View>

            <View style={styles.macroItem}>
              <View style={styles.macroHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.macroLabel}>지방</Text>
              </View>
              <Text style={styles.macroValue}>
                {Math.round(currentTotals.fat)}g / {DAILY_GOAL.fat}g
              </Text>
              <ProgressBar
                progress={Math.min((currentTotals.fat / DAILY_GOAL.fat) * 100, 100)}
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

  // Recommend Tab Render Function (컴포넌트 아님)
  const renderRecommendTab = () => (
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
            {recommendedMeals.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="clipboard" size={32} color="#D1D5DB" />
                <Text style={styles.emptyText}>아직 추천된 식단이 없습니다</Text>
                <Text style={styles.emptySubtext}>오른쪽 상단의 새로고침 버튼을 눌러 식단을 받아보세요</Text>
              </View>
            ) : (() => {
              // 아침/점심/저녁별로 그룹화
              const mealsByType = {
                breakfast: recommendedMeals.filter(m => m.mealType === 'breakfast'),
                lunch: recommendedMeals.filter(m => m.mealType === 'lunch'),
                dinner: recommendedMeals.filter(m => m.mealType === 'dinner'),
              };

              const mealTypeLabels = {
                breakfast: { label: '아침', icon: 'sunrise', color: '#FF9800' },
                lunch: { label: '점심', icon: 'sun', color: '#2196F3' },
                dinner: { label: '저녁', icon: 'moon', color: '#9C27B0' },
              };

              return (
                <View style={styles.mealPlan}>
                  {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
                    const meals = mealsByType[mealType];
                    if (meals.length === 0) return null;

                    const typeInfo = mealTypeLabels[mealType];

                    return (
                      <View key={mealType} style={styles.mealTypeGroup}>
                        <View style={styles.mealTypeHeader}>
                          <View style={styles.mealTypeLabelContainer}>
                            <Icon name={typeInfo.icon as any} size={20} color={typeInfo.color} style={{ marginRight: 8 }} />
                            <Text style={[styles.mealTypeLabel, { color: typeInfo.color }]}>
                              {typeInfo.label}
                            </Text>
                          </View>
                        </View>
                        {meals.map((meal) => (
                          <View key={meal.id} style={styles.mealSection}>
                            <Text style={styles.mealTitle}>{meal.name}</Text>
                            <Text style={styles.mealFood}>{meal.description}</Text>
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
                              onPress={() => handleAddRecommendedMeal(meal)}
                              disabled={Boolean(processingRecommendIds[meal.id || meal.name])}
                            >
                              {processingRecommendIds[meal.id || meal.name] ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text style={styles.addMealButtonText}>+ 추가하기</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    );
                  })}
                </View>
              );
            })()}
          </View>
        </View>
      </View>
    </>
  );

  // 레시피를 식단에 추가하는 핸들러 (컴포넌트 외부로 이동하여 안정성 확보)
  const handleAddRecipeToMeals = useCallback(async (recipe: Recipe) => {
    // 레시피를 식단에 추가하는 로직
    const foodRecommendation = {
      name: recipe.name,
      calory: recipe.calories,
      carbohydrate: Math.floor(recipe.calories * 0.5 / 4),
      protein: Math.floor(recipe.calories * 0.3 / 4),
      fat: Math.floor(recipe.calories * 0.2 / 9),
      foodKind: 'RECIPE' as const,
      description: recipe.ingredients.join('\n'),
    };
    
    // 레시피를 직접 추가
    await handleAddRecommendedMeal({
      id: recipe.id,
      mealType: 'dinner', // 레시피는 기본적으로 저녁으로 분류
      name: recipe.name,
      description: recipe.ingredients.join('\n'),
      calories: recipe.calories,
      protein: foodRecommendation.protein,
      carbs: foodRecommendation.carbohydrate,
      fat: foodRecommendation.fat,
    });
  }, [handleAddRecommendedMeal]);

  // AI Recipe Tab Render Function (컴포넌트 아님)
  const renderAIRecipeTab = () => (
    <>
        {/* 입력 섹션 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.aiHeader}>
              <View style={styles.aiIconContainer}>
                <Text style={styles.aiIcon}>🧑‍🍳</Text>
              </View>
              <View style={styles.aiHeaderText}>
                <Text style={styles.cardTitle}>AI 레시피 추천</Text>
                <Text style={styles.aiSubtitle}>재료만 알려주세요, 레시피를 추천해드립니다</Text>
              </View>
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.recipeInputContainer}>
              <TextInput
                key="recipe-input-stable"
                ref={recipeInputRef}
                style={styles.recipeInput}
                placeholder="예: 닭가슴살, 토마토, 양파, 올리브오일"
                placeholderTextColor="#9E9E9E"
                value={recipeInput}
                onChangeText={handleRecipeInputChange}
                onFocus={handleRecipeInputFocus}
                multiline
                blurOnSubmit={false}
                returnKeyType="default"
                keyboardType="default"
                textContentType="none"
                autoCorrect={false}
                autoCapitalize="none"
                selectTextOnFocus={false}
                importantForAutofill="no"
                underlineColorAndroid="transparent"
                textBreakStrategy="simple"
              />
              <TouchableOpacity 
                style={[
                  styles.searchButton,
                  (!recipeInput.trim() || loadingRecommendations) && styles.searchButtonDisabled
                ]} 
                onPress={searchRecipes}
                disabled={!recipeInput.trim() || loadingRecommendations}
              >
                {loadingRecommendations ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Icon name="search" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
            {loadingRecommendations && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#6366f1" />
                <Text style={styles.loadingText}>AI가 레시피를 추천하고 있습니다...</Text>
              </View>
            )}
          </View>
        </View>

        {/* 추천 레시피 섹션 */}
        {recommendedRecipes.length > 0 ? (
          recommendedRecipes.map((recipe) => (
            <View key={recipe.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.recipeHeader}>
                  <View style={styles.recipeHeaderLeft}>
                    <Text style={styles.recipeTitle}>{recipe.name}</Text>
                    <View style={styles.recipeBadges}>
                      <View style={styles.recipeBadge}>
                        <Icon name="clock" size={12} color="#6366f1" />
                        <Text style={styles.recipeBadgeText}>{recipe.time}분</Text>
                      </View>
                      <View style={styles.recipeBadge}>
                        <Icon name="star" size={12} color="#FFB800" />
                        <Text style={styles.recipeBadgeText}>{recipe.difficulty}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.cardContent}>
                {/* 영양 정보 */}
                <View style={styles.recipeNutritionCard}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.calories}</Text>
                    <Text style={styles.nutritionLabel}>kcal</Text>
                  </View>
                  <View style={styles.nutritionDivider} />
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.floor(recipe.calories * 0.3 / 4)}
                    </Text>
                    <Text style={styles.nutritionLabel}>단백질</Text>
                  </View>
                  <View style={styles.nutritionDivider} />
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.floor(recipe.calories * 0.5 / 4)}
                    </Text>
                    <Text style={styles.nutritionLabel}>탄수화물</Text>
                  </View>
                  <View style={styles.nutritionDivider} />
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>
                      {Math.floor(recipe.calories * 0.2 / 9)}
                    </Text>
                    <Text style={styles.nutritionLabel}>지방</Text>
                  </View>
                </View>

                {/* 재료 및 조리법 */}
                <View style={styles.recipeSection}>
                  <View style={styles.recipeSectionHeader}>
                    <Icon name="list" size={16} color="#6366f1" />
                    <Text style={styles.recipeSectionTitle}>재료 및 조리법</Text>
                  </View>
                  <View style={styles.recipeSteps}>
                    {recipe.ingredients.map((step, idx) => (
                      <View key={idx} style={styles.recipeStep}>
                        <View style={styles.stepNumber}>
                          <Text style={styles.stepNumberText}>{idx + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* 추가 버튼 */}
                <TouchableOpacity
                  style={styles.addRecipeButton}
                  onPress={() => handleAddRecipeToMeals(recipe)}
                  disabled={Boolean(processingRecommendIds[recipe.id])}
                >
                  {processingRecommendIds[recipe.id] ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Icon name="plus-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.addRecipeButtonText}>식단에 추가하기</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          !loadingRecommendations && (
            <View style={styles.card}>
              <View style={styles.emptyRecipeState}>
                <Text style={styles.emptyRecipeIcon}>🍳</Text>
                <Text style={styles.emptyRecipeText}>레시피를 추천받아보세요</Text>
                <Text style={styles.emptyRecipeSubtext}>
                  가지고 있는 재료를 입력하면{'\n'}
                  AI가 맞춤 레시피를 추천해드립니다
                </Text>
              </View>
            </View>
          )
        )}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header - Fixed at Top */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="coffee" size={24} color="#6366f1" style={{ marginRight: 8 }} />
          <Text style={styles.title}>식단</Text>
        </View>
      </View>

      {/* Tab Navigation - Fixed at Top */}
      <View style={styles.tabContainer}>
        {(['식단추천', '추적', '기록', 'AI레시피'] as const).map((tab, index) => {
          const tabKeys: TabType[] = ['recommend', 'track', 'record', 'ai'];
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

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="none"
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >

          {activeTab === 'record' && renderRecordTab()}
          {activeTab === 'track' && renderTrackTab()}
          {activeTab === 'recommend' && renderRecommendTab()}
          {activeTab === 'ai' && renderAIRecipeTab()}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 4,
    zIndex: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    zIndex: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#6366f1',
    fontWeight: '700',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
  },
  refreshButton: {
    padding: 10,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  cardContent: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  foodServing: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
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
  loadingState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
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
    gap: 20,
    marginBottom: 20,
  },
  mealTypeGroup: {
    marginBottom: 16,
  },
  mealTypeHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#E0E0E0',
  },
  mealTypeLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  mealSection: {
    padding: 20,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
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
    alignItems: 'flex-start',
    gap: 12,
  },
  aiIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiIcon: {
    fontSize: 24,
  },
  aiHeaderText: {
    flex: 1,
  },
  aiSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 4,
  },
  recipeInputContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
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
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
  },
  searchButton: {
    backgroundColor: '#6366f1',
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6366f1',
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recipeHeaderLeft: {
    flex: 1,
  },
  recipeBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  recipeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recipeBadgeText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600',
  },
  recipeNutritionCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  nutritionItem: {
    alignItems: 'center',
    flex: 1,
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2B2B2B',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  nutritionDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  recipeSection: {
    marginBottom: 20,
  },
  recipeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recipeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2B2B2B',
  },
  recipeSteps: {
    gap: 12,
  },
  recipeStep: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2B2B2B',
    lineHeight: 20,
  },
  addRecipeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addRecipeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyRecipeState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyRecipeIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyRecipeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2B2B2B',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyRecipeSubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    lineHeight: 20,
  },
});