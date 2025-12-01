import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Feather as Icon } from '@expo/vector-icons';
import { FoodService } from '../../services/foodService';
import { WorkoutService } from '../../services/workoutService';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  aggregateDailyTotals,
  aggregateWeeklyCalories,
  cacheTodayTotals,
  cacheWeeklyCalories,
  normalizeFoodApiItem,
  readCachedTodayTotals,
  readCachedWeeklyCalories,
} from '../../utils/foodStats';

const screenWidth = Dimensions.get('window').width;

interface ExerciseRecommendation {
  id: string;
  name: string;
  description: string;
  level: string;
  partLabel: string;
  youtubeLink?: string;
  duration?: number;
}

interface DietRecommendation {
  id: string;
  name: string;
  foodKind: string;
  calory: number;
  protein: number;
  carbohydrate: number;
  fat: number;
}

const EXERCISE_PART_LABELS: Record<string, string> = {
  CHEST: '가슴',
  BACK: '등',
  SHOULDER: '어깨',
  LOWER_BODY: '하체',
  BICEPS: '이두',
  TRICEPS: '삼두',
  CARDIO: '유산소',
  HOME_TRAINING: '홈트레이닝',
};

const EXERCISE_LEVEL_LABELS: Record<string, string> = {
  BEGINNER: '초급',
  INTERMEDIATE: '중급',
  ADVANCED: '고급',
};

export function Dashboard() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState<number>(0);
  const [exerciseRecommendations, setExerciseRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [dietRecommendations, setDietRecommendations] = useState<DietRecommendation[]>([]);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingDiet, setLoadingDiet] = useState(false);
  const [foodTotals, setFoodTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [weeklyCaloriesData, setWeeklyCaloriesData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyLabels, setWeeklyLabels] = useState<string[]>(['월', '화', '수', '목', '금', '토', '일']);
  const [weeklyAverageCalories, setWeeklyAverageCalories] = useState(0);
  const [loadingFoodStats, setLoadingFoodStats] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({});
  
  // 중복 호출 방지 플래그
  const requestingExerciseRef = useRef(false);
  const fallbackExerciseNoticeShown = useRef(false);
  const fallbackDietNoticeShown = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('currentUser');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        }
      } catch {}
    })();
  }, []);
  
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
    exercise: 60
  };

  const openExerciseVideo = (url?: string) => {
    if (!url) return;
    const safeUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(safeUrl).catch(() => {
      Alert.alert('오류', '영상을 열 수 없습니다. 네트워크 상태를 확인해주세요.');
    });
  };

  // Character states based on exercise completion
  const exerciseMinutes = Math.max(Math.floor(workoutTimer / 60), 0);
  const exerciseProgress = (exerciseMinutes / dailyGoals.exercise) * 100;
  
  const getCharacterState = () => {
    if (exerciseProgress >= 100) {
      return {
        icon: 'award' as const,
        message: '완벽해요! 오늘의 목표를 달성했어요!',
        mood: 'excellent',
        bgColor: '#dcfce7',
        borderColor: '#86efac',
        textColor: '#16a34a',
        iconColor: '#16a34a'
      };
    } else if (exerciseProgress >= 75) {
      return {
        icon: 'trending-up' as const,
        message: '조금만 더 힘내세요! 거의 다 왔어요!',
        mood: 'good',
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
        textColor: '#2563eb',
        iconColor: '#2563eb'
      };
    } else if (exerciseProgress >= 50) {
      return {
        icon: 'activity' as const,
        message: '절반 완료! 꾸준히 이어가세요!',
        mood: 'okay',
        bgColor: '#fef3c7',
        borderColor: '#fde047',
        textColor: '#ca8a04',
        iconColor: '#ca8a04'
      };
    } else if (exerciseProgress >= 25) {
      return {
        icon: 'target' as const,
        message: '아직 시작이에요. 조금씩 움직여보세요!',
        mood: 'low',
        bgColor: '#fed7aa',
        borderColor: '#fdba74',
        textColor: '#ea580c',
        iconColor: '#ea580c'
      };
    } else {
      return {
        icon: 'zap' as const,
        message: '오늘도 화이팅! 작은 움직임부터 시작해요!',
        mood: 'sleepy',
        bgColor: '#f3f4f6',
        borderColor: '#d1d5db',
        textColor: '#6b7280',
        iconColor: '#6b7280'
      };
    }
  };

  const character = getCharacterState();

  const weeklyChartData = useMemo(
    () => ({
      labels: weeklyLabels,
      datasets: [
        {
          data: weeklyCaloriesData,
        },
      ],
    }),
    [weeklyCaloriesData, weeklyLabels]
  );

  const hasWeeklyData = useMemo(
    () => weeklyCaloriesData.some((value) => value > 0),
    [weeklyCaloriesData]
  );

  const inBodyData = {
    weight: 69.5,
    muscleMass: 32.8,
    bodyFatPercentage: 12.3,
    bmi: 24.1,
    lastUpdated: '2024-03-15 09:30',
    isConnected: true
  };

  const weightData = {
    labels: ['1주', '2주', '3주', '4주'],
    datasets: [{
      data: [70.5, 70.2, 69.8, 69.5]
    }]
  };

  const achievements = [
    { title: '7일 연속 기록', achieved: true },
    { title: '주간 운동 목표 달성', achieved: true },
    { title: '체중 감량 1kg', achieved: false }
  ];

  useEffect(() => {
    loadWorkoutTimer();
    const interval = setInterval(() => {
      loadWorkoutTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 초기 로드 시 캐시된 데이터를 먼저 표시하고, 그 다음 최신 데이터를 가져옴
  useEffect(() => {
    (async () => {
      try {
        const cachedToday = await readCachedTodayTotals();
        if (cachedToday) {
          setFoodTotals({
            calories: Math.round(cachedToday.calories),
            protein: Math.round(cachedToday.protein),
            carbs: Math.round(cachedToday.carbs),
            fat: Math.round(cachedToday.fat),
          });
        }

        const cachedWeekly = await readCachedWeeklyCalories();
        if (cachedWeekly) {
          setWeeklyLabels(cachedWeekly.labels);
          setWeeklyCaloriesData(cachedWeekly.data);
          setWeeklyAverageCalories(cachedWeekly.average);
        }
        
        // 캐시된 데이터 표시 후 최신 데이터 로드
        loadFoodStats();
      } catch {}
    })();
  }, [loadFoodStats]);

  const loadWorkoutTimer = async () => {
    try {
      const saved = await AsyncStorage.getItem('workoutTimerSeconds');
      if (saved) {
        setWorkoutTimer(parseInt(saved) || 0);
      }
    } catch (error) {
      // 운동 타이머 로드 실패 시 무시
    }
  };

  const loadFoodStats = useCallback(async () => {
    setLoadingFoodStats(true);
    try {
      const [todayRes, weeklyRes] = await Promise.all([
        FoodService.getTodayFoodLogs(),
        FoodService.getWeeklyFoodLogs(),
      ]);

      // 오늘 식단 데이터 처리
      if (todayRes.success && Array.isArray(todayRes.data)) {
        const normalizedToday = todayRes.data.map((item: any) => normalizeFoodApiItem(item));
        const totals = aggregateDailyTotals(normalizedToday);
        setFoodTotals({
          calories: Math.round(totals.calories),
          protein: Math.round(totals.protein),
          carbs: Math.round(totals.carbs),
          fat: Math.round(totals.fat),
        });
        await cacheTodayTotals(totals);
      } else if (!todayRes.success) {
        // API 실패 시 캐시된 데이터 사용
        const cachedToday = await readCachedTodayTotals();
        if (cachedToday) {
          setFoodTotals({
            calories: Math.round(cachedToday.calories),
            protein: Math.round(cachedToday.protein),
            carbs: Math.round(cachedToday.carbs),
            fat: Math.round(cachedToday.fat),
          });
        }
      }

      // 주간 식단 데이터 처리
      if (weeklyRes.success && Array.isArray(weeklyRes.data)) {
        const normalizedWeekly = weeklyRes.data.map((item: any) => normalizeFoodApiItem(item));
        const summary = aggregateWeeklyCalories(normalizedWeekly);
        setWeeklyLabels(summary.labels);
        setWeeklyCaloriesData(summary.data);
        setWeeklyAverageCalories(summary.average);
        await cacheWeeklyCalories(summary);
      } else if (!weeklyRes.success) {
        // API 실패 시 캐시된 데이터 사용
        const cachedWeekly = await readCachedWeeklyCalories();
        if (cachedWeekly) {
          setWeeklyLabels(cachedWeekly.labels);
          setWeeklyCaloriesData(cachedWeekly.data);
          setWeeklyAverageCalories(cachedWeekly.average);
        }
      }
    } catch (error) {
      // 식단 통계 로드 실패 시 캐시된 데이터 사용
      try {
        const cachedToday = await readCachedTodayTotals();
        if (cachedToday) {
          setFoodTotals({
            calories: Math.round(cachedToday.calories),
            protein: Math.round(cachedToday.protein),
            carbs: Math.round(cachedToday.carbs),
            fat: Math.round(cachedToday.fat),
          });
        }
        const cachedWeekly = await readCachedWeeklyCalories();
        if (cachedWeekly) {
          setWeeklyLabels(cachedWeekly.labels);
          setWeeklyCaloriesData(cachedWeekly.data);
          setWeeklyAverageCalories(cachedWeekly.average);
        }
      } catch {}
    } finally {
      setLoadingFoodStats(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFoodStats();
    }, [loadFoodStats])
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 운동 추천 API 호출 (중복 호출 방지)
  const loadExerciseRecommendations = async () => {
    // 이미 요청 중이면 건너뜀
    if (requestingExerciseRef.current) {
      return;
    }

    requestingExerciseRef.current = true;
    setLoadingExercise(true);
    
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }

      // 운동 추천 API 호출 (운동 시간과 컨디션 기반)
      const exerciseTime = 30; // 30분
      const condition = 'NORMAL'; // 컨디션 상태
      
      const response = await WorkoutService.getExerciseRecommendation(exerciseTime, condition);

      if (response.meta?.usedFallback && !fallbackExerciseNoticeShown.current) {
        fallbackExerciseNoticeShown.current = true;
        console.log('[Dashboard] AI 운동 추천 서버가 잠시 응답하지 않아 기본 루틴을 사용합니다.');
      }

      if (response.success && response.data) {
        const raw = response.data as any;
        const normalized = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.exerciseInfoDto)
          ? raw.exerciseInfoDto
          : [];

        if (normalized.length > 0) {
          const exercises: ExerciseRecommendation[] = normalized.map((item: any, index: number) => {
            const partKey =
              typeof item?.part === 'string' && EXERCISE_PART_LABELS[item.part]
                ? item.part
                : 'HOME_TRAINING';
            const levelKey =
              typeof item?.level === 'string' && EXERCISE_LEVEL_LABELS[item.level]
                ? item.level
                : 'BEGINNER';
            return {
              id: `exercise_${index}`,
              name: item?.name || `추천 운동 ${index + 1}`,
              description: item?.description || 'AI 추천 운동',
              level: EXERCISE_LEVEL_LABELS[levelKey] ?? levelKey,
              partLabel: EXERCISE_PART_LABELS[partKey] ?? '전신',
              youtubeLink:
                typeof item?.youtubeLink === 'string'
                  ? item.youtubeLink
                  : typeof item?.youtubeLinks === 'string'
                  ? item.youtubeLinks
                  : undefined,
              duration: typeof item?.duration === 'number' ? item.duration : undefined,
            };
          });
          setExerciseRecommendations(exercises);
        } else {
          setExerciseRecommendations([]);
        }
      } else {
        setExerciseRecommendations([]);
        if (response.error) {
          console.log('[Dashboard] 운동 추천 실패:', response.error);
        }
      }
    } catch (error: any) {
      setExerciseRecommendations([]);
    } finally {
      setLoadingExercise(false);
      requestingExerciseRef.current = false;
    }
  };

  const loadDietRecommendations = async () => {
    setLoadingDiet(true);
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }
      
      const user = JSON.parse(userStr);
      const response = await FoodService.getFoodRecommendations();

      if (response.meta?.usedFallback && !fallbackDietNoticeShown.current) {
        fallbackDietNoticeShown.current = true;
        console.log('[Dashboard] AI 식단 추천 서버가 잠시 응답하지 않아 기본 식단을 사용합니다.');
      }
      
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        const meals: DietRecommendation[] = response.data.map((item: any, index: number) => ({
          id: item.id || `diet_${index}`,
          name: item.name || '추천 식단',
          foodKind: item.foodKind || 'LUNCH',
          calory: parseInt(String(item.calory || item.calories || 0)) || 0,
          protein: parseInt(String(item.protein || 0)) || 0,
          carbohydrate: parseInt(String(item.carbohydrate || item.carbs || 0)) || 0,
          fat: parseInt(String(item.fat || 0)) || 0,
        }));
        setDietRecommendations(meals);
      } else {
        setDietRecommendations([]);
        if (response.error || response.meta?.reason) {
          console.log('[Dashboard] 식단 추천 실패:', response.error || response.meta?.reason || '식단 추천에 실패했습니다.');
        }
      }
    } catch (error: any) {
      setDietRecommendations([]);
    } finally {
      setLoadingDiet(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    loadWorkoutTimer();
    // 새로고침 시 추천 데이터도 함께 로드
    await Promise.all([
      loadExerciseRecommendations(),
      loadDietRecommendations(),
    ]);
    setRefreshing(false);
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
            {current}{unit} / {goal}{unit}
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

  const CardHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        {icon && <Icon name={icon as any} size={20} color="#1f2937" />}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.greetingContainer}>
            <Icon name="sun" size={20} color="#6366f1" style={{ marginRight: 8 }} />
            <Text style={styles.greeting}>안녕하세요!</Text>
          </View>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              navigation.navigate('마이' as never);
            }}
          >
            <Icon name="settings" size={22} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => {
              navigation.navigate('마이' as never);
            }}
          >
            {currentUser?.profileImage ? (
              <Image source={{ uri: currentUser.profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {currentUser?.name?.charAt(0)?.toUpperCase() || currentUser?.nickname?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Character Section */}
      <Card style={[
        styles.characterCard,
        { backgroundColor: character.bgColor, borderColor: character.borderColor }
      ]}>
        <View style={styles.characterContent}>
          <View style={[styles.characterIconContainer, { backgroundColor: character.bgColor }]}>
            <Icon name={character.icon} size={56} color={character.iconColor} />
          </View>
          <Text style={[styles.characterMessage, { color: character.textColor }]}>
            {character.message}
          </Text>
          <View style={styles.progressInfo}>
            <Icon name="activity" size={16} color="#6b7280" />
            <Text style={styles.progressText}>
              운동 진행률: {exerciseProgress.toFixed(0)}%
            </Text>
          </View>
          {workoutTimer > 0 && (
            <View style={styles.timerInfo}>
              <Icon name="clock" size={16} color="#6b7280" />
              <Text style={styles.timerText}>
                운동 시간: {formatTime(workoutTimer)}
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* InBody Data Section */}
      <Card>
        <CardHeader title="InBody 데이터" icon="bar-chart-2" />
        <View style={styles.cardContent}>
          {inBodyData.isConnected ? (
            <View style={styles.inBodyContainer}>
              <View style={styles.inBodyRow}>
                <View style={[styles.inBodyBox, styles.inBodyBoxGray]}>
                  <Text style={styles.inBodyValue}>{inBodyData.weight}kg</Text>
                  <Text style={styles.inBodyLabel}>체중</Text>
                </View>
                <View style={[styles.inBodyBox, styles.inBodyBoxBlue]}>
                  <Text style={[styles.inBodyValue, { color: '#2563eb' }]}>
                    {inBodyData.muscleMass}kg
                  </Text>
                  <Text style={styles.inBodyLabel}>골격근량</Text>
                </View>
              </View>
              
              <View style={styles.inBodyRow}>
                <View style={[styles.inBodyBox, styles.inBodyBoxGreen]}>
                  <Text style={[styles.inBodyValue, { color: '#16a34a' }]}>
                    {inBodyData.bodyFatPercentage}%
                  </Text>
                  <Text style={styles.inBodyLabel}>체지방률</Text>
                </View>
                <View style={[styles.inBodyBox, styles.inBodyBoxOrange]}>
                  <Text style={[styles.inBodyValue, { color: '#ea580c' }]}>
                    {inBodyData.bmi}
                  </Text>
                  <Text style={styles.inBodyLabel}>BMI</Text>
                </View>
              </View>
              
              <View style={styles.updateInfo}>
                <Icon name="zap" size={12} color="#6b7280" />
                <Text style={styles.updateText}>
                  마지막 업데이트: {inBodyData.lastUpdated}
                </Text>
              </View>
              
              <View style={styles.analysisBox}>
                <Text style={styles.analysisTitle}>InBody 분석</Text>
                <Text style={styles.analysisText}>
                  근육량이 평균보다 높고 체지방률이 적절한 상태입니다.
                  현재 컨디션을 유지하며 꾸준한 운동을 권장합니다.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.inBodyConnect}>
              <Icon name="bar-chart-2" size={48} color="#9ca3af" />
              <Text style={styles.connectTitle}>InBody 앱을 연동해보세요</Text>
              <Text style={styles.connectText}>
                체중, 골격근량, 체지방률을 자동으로{'\n'}
                동기화하여 정확한 건강 관리를 해보세요
              </Text>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>InBody 연동하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader title="오늘의 요약" icon="calendar" />
        <View style={styles.cardContent}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={[styles.summaryValue, { color: '#6366f1' }]}>
                {foodTotals.calories}
              </Text>
              <Text style={styles.summaryLabel}>섭취 칼로리</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                {dailyGoals.calories - foodTotals.calories}
              </Text>
              <Text style={styles.summaryLabel}>남은 칼로리</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <ProgressBar
              current={foodTotals.calories}
              goal={dailyGoals.calories}
              label="일일 칼로리 목표"
              unit="kcal"
            />
          </View>
        </View>
      </Card>

      {/* Nutrition Breakdown */}
      <Card>
        <CardHeader title="영양소 현황" icon="target" />
        <View style={styles.cardContent}>
          <ProgressBar current={foodTotals.protein} goal={dailyGoals.protein} label="단백질" />
          <ProgressBar current={foodTotals.carbs} goal={dailyGoals.carbs} label="탄수화물" />
          <ProgressBar current={foodTotals.fat} goal={dailyGoals.fat} label="지방" />
        </View>
      </Card>

      {/* Exercise Summary */}
      <Card>
        <CardHeader title="운동 현황" icon="activity" />
        <View style={styles.cardContent}>
          <ProgressBar
            current={exerciseMinutes}
            goal={dailyGoals.exercise}
            label="운동 시간"
            unit="분"
          />
          <View style={styles.caloriesBurned}>
            <Icon name="trending-up" size={16} color="#6b7280" />
            <Text style={styles.caloriesBurnedText}>약 320kcal 소모</Text>
          </View>
        </View>
      </Card>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader title="주간 칼로리 현황" icon="trending-up" />
        <View style={styles.cardContent}>
          {hasWeeklyData ? (
            <>
              <View style={styles.chartContainer}>
                <BarChart
                  data={weeklyChartData}
                  width={screenWidth - 120}
                  height={180}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                    style: {
                      borderRadius: 8,
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: '#e5e7eb',
                      strokeWidth: 1,
                    },
                  }}
                  style={styles.chart}
                  showValuesOnTopOfBars={false}
                  withInnerLines={true}
                  fromZero={true}
                />
              </View>
              <Text style={styles.chartCaption}>
                이번 주 평균: {weeklyAverageCalories.toLocaleString()}kcal
              </Text>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="bar-chart-2" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>이번 주 데이터가 없습니다</Text>
              <Text style={styles.emptySubtext}>식단을 기록하면 차트가 업데이트돼요</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Weight Trend */}
      <Card>
        <CardHeader title="체중 변화 (최근 4주)" icon="trending-down" />
        <View style={styles.cardContent}>
          <LineChart
            data={weightData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 8
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6366f1'
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e5e7eb',
                strokeWidth: 1
              }
            }}
            bezier
            style={styles.chart}
          />
          <Text style={[styles.chartCaption, { color: '#16a34a' }]}>
            -1.0kg 감량!
          </Text>
        </View>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader title="최근 성취" icon="award" />
        <View style={styles.cardContent}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <View style={[
                styles.badge,
                achievement.achieved ? styles.badgeAchieved : styles.badgeInProgress
              ]}>
                <Text style={[
                  styles.badgeText,
                  achievement.achieved ? styles.badgeTextAchieved : styles.badgeTextInProgress
                ]}>
                  {achievement.achieved ? '완료' : '진행중'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Exercise Recommendations */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Icon name="activity" size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>운동 추천</Text>
          </View>
          <TouchableOpacity
            onPress={loadExerciseRecommendations}
            disabled={loadingExercise}
            style={styles.refreshButton}
          >
            <Icon 
              name="refresh-cw" 
              size={18} 
              color={loadingExercise ? "#9ca3af" : "#6366f1"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          {loadingExercise ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>추천 운동을 불러오는 중...</Text>
            </View>
          ) : exerciseRecommendations.length > 0 ? (
            exerciseRecommendations.map((exercise) => (
              <View key={exercise.id} style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationTitle}>{exercise.name}</Text>
                  <View style={[styles.levelBadge, styles.levelBadgeIntermediate]}>
                    <Text style={styles.levelBadgeText}>{exercise.level}</Text>
                  </View>
                </View>
                <View style={styles.recommendationMeta}>
                  <Icon name="map-pin" size={14} color="#6b7280" />
                  <Text style={styles.recommendationMetaText}>{exercise.partLabel}</Text>
                </View>
                <Text style={styles.recommendationDescription}>{exercise.description}</Text>
                {exercise.duration && (
                  <View style={styles.recommendationMeta}>
                    <Icon name="clock" size={14} color="#6b7280" />
                    <Text style={styles.recommendationMetaText}>{exercise.duration}분</Text>
                  </View>
                )}
                {exercise.youtubeLink ? (
                  <TouchableOpacity 
                    style={styles.videoLinkButton}
                    onPress={() => openExerciseVideo(exercise.youtubeLink)}
                  >
                    <Icon name="play-circle" size={16} color="#6366f1" />
                    <Text style={styles.recommendationLink}>시연 영상 보기</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="activity" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>추천 운동이 없습니다</Text>
              <Text style={styles.emptySubtext}>새로고침 버튼을 눌러 추천을 받아보세요</Text>
            </View>
          )}
        </View>
      </Card>

      {/* Diet Recommendations */}
      <Card>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Icon name="coffee" size={20} color="#1f2937" />
            <Text style={styles.cardTitle}>식단 추천</Text>
          </View>
          <TouchableOpacity
            onPress={loadDietRecommendations}
            disabled={loadingDiet}
            style={styles.refreshButton}
          >
            <Icon 
              name="refresh-cw" 
              size={18} 
              color={loadingDiet ? "#9ca3af" : "#6366f1"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.cardContent}>
          {loadingDiet ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>추천 식단을 불러오는 중...</Text>
            </View>
          ) : dietRecommendations.length > 0 ? (
            dietRecommendations.map((meal) => {
              const mealTypeIcon = meal.foodKind === 'BREAKFAST' ? 'sunrise' : 
                                   meal.foodKind === 'LUNCH' ? 'sun' : 'moon';
              const mealTypeName = meal.foodKind === 'BREAKFAST' ? '아침' : 
                                  meal.foodKind === 'LUNCH' ? '점심' : '저녁';
              
              return (
                <View key={meal.id} style={styles.recommendationItem}>
                  <View style={styles.recommendationHeader}>
                    <View style={styles.mealTypeIconContainer}>
                      <Icon name={mealTypeIcon as any} size={18} color="#6366f1" />
                    </View>
                    <Text style={styles.recommendationTitle}>
                      {meal.name}
                    </Text>
                    <Text style={styles.mealTypeText}>{mealTypeName}</Text>
                  </View>
                  <View style={styles.nutritionInfo}>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>칼로리</Text>
                      <Text style={styles.nutritionValue}>{meal.calory}kcal</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>단백질</Text>
                      <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>탄수화물</Text>
                      <Text style={styles.nutritionValue}>{meal.carbohydrate}g</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionLabel}>지방</Text>
                      <Text style={styles.nutritionValue}>{meal.fat}g</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="coffee" size={32} color="#d1d5db" />
              <Text style={styles.emptyText}>추천 식단이 없습니다</Text>
              <Text style={styles.emptySubtext}>새로고침 버튼을 눌러 추천을 받아보세요</Text>
            </View>
          )}
        </View>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 60,
    paddingHorizontal: 4,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.8,
  },
  date: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
  },
  avatar: {
    backgroundColor: '#e2e8f0',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    marginBottom: 24,
    padding: 24,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  characterCard: {
    borderWidth: 3,
    padding: 0,
    overflow: 'hidden',
    borderRadius: 28,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  characterContent: {
    padding: 32,
    alignItems: 'center',
  },
  characterIconContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  characterMessage: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  timerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  timerText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  cardHeader: {
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  cardContent: {
    padding: 20,
  },
  inBodyContainer: {
    gap: 16,
  },
  inBodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inBodyBox: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  inBodyBoxGray: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  inBodyBoxBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  inBodyBoxGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  inBodyBoxOrange: {
    backgroundColor: '#fff7ed',
    borderColor: '#fed7aa',
  },
  inBodyValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  inBodyLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  updateText: {
    fontSize: 11,
    color: '#6b7280',
  },
  analysisBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  analysisTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  inBodyConnect: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  connectText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
    color: '#0f172a',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 16,
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
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  caloriesBurned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  caloriesBurnedText: {
    fontSize: 13,
    color: '#6b7280',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 8,
  },
  chartCaption: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  achievementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 13,
    color: '#1f2937',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAchieved: {
    backgroundColor: '#6366f1',
  },
  badgeInProgress: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeTextAchieved: {
    color: '#ffffff',
  },
  badgeTextInProgress: {
    color: '#6b7280',
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  recommendationItem: {
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  recommendationMetaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  levelBadgeIntermediate: {
    backgroundColor: '#dbeafe',
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#2563eb',
  },
  recommendationLink: {
    marginTop: 4,
    fontSize: 12,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  mealTypeText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 8,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 12,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
});
