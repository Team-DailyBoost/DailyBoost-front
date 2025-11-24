import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { WorkoutService } from '../../services/workoutService';

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  isCardio: boolean;
  calories: number;
  cautions: string[];
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration?: number;
  part?: string;
  partLabel?: string;
  levelLabel?: string;
  youtubeLink?: string;
  source?: 'AI' | 'LOCAL';
}

interface WorkoutEntry {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
  duration?: number;
  memo: string;
  time: string;
}

export function WorkoutLogger() {
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutEntry[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [recommendationSeed, setRecommendationSeed] = useState(Date.now());
  const [workoutTime, setWorkoutTime] = useState<number>(30);
  
  // 중복 호출 방지 플래그
  const requestingRecommendationsRef = useRef(false);
  const requestingBodyPartRef = useRef(false);
  const [condition, setCondition] = useState<'good' | 'normal' | 'tired'>('normal');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'logger'>('recommendations');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(0);
  const [todaysRecommendations, setTodaysRecommendations] = useState<Exercise[]>([]); // 오늘의 추천 운동 (전신)
  const [bodyPartRecommendations, setBodyPartRecommendations] = useState<Exercise[]>([]); // 부위별 운동 추천
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingBodyPartRecommendations, setLoadingBodyPartRecommendations] = useState(false);

  const openYoutubeLink = (url: string) => {
    if (!url) return;
    const safeUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(safeUrl).catch(() => {
      Alert.alert('오류', '영상을 열 수 없습니다. 네트워크 상태를 확인해주세요.');
    });
  };

  // Exercise database
  const exerciseDatabase: Exercise[] = [
    // 가슴
    { id: 'pushup', name: '푸시업', bodyPart: 'chest', isCardio: false, calories: 7, cautions: ['손목 통증 주의', '허리가 꺾이지 않게', '팔꿈치를 너무 벌리지 말 것'], description: '가슴, 어깨, 삼두근 강화', difficulty: 'beginner' },
    { id: 'bench_press', name: '벤치프레스', bodyPart: 'chest', isCardio: false, calories: 8, cautions: ['보조자 필수', '어깨 부상 주의', '무게 조절 필수'], description: '가슴 전체 발달', difficulty: 'intermediate' },
    { id: 'dips', name: '딥스', bodyPart: 'chest', isCardio: false, calories: 7, cautions: ['어깨 부상 위험', '몸을 앞으로 기울일 것', '천천히 수행'], description: '가슴 하부 집중', difficulty: 'intermediate' },
    // 등
    { id: 'pullup', name: '풀업', bodyPart: 'back', isCardio: false, calories: 9, cautions: ['어깨 부상 주의', '완전한 가동범위', '보조밴드 사용 권장'], description: '등 전체 강화', difficulty: 'advanced' },
    { id: 'lat_pulldown', name: '랫 풀다운', bodyPart: 'back', isCardio: false, calories: 7, cautions: ['허리 곧게', '가슴까지 당기기', '반동 사용 금지'], description: '광배근 발달', difficulty: 'beginner' },
    // 어깨
    { id: 'shoulder_press', name: '숄더 프레스', bodyPart: 'shoulder', isCardio: false, calories: 7, cautions: ['목 긴장 주의', '허리 과신전 금지', '팔꿈치 각도'], description: '어깨 전체 발달', difficulty: 'beginner' },
    { id: 'lateral_raise', name: '래터럴 레이즈', bodyPart: 'shoulder', isCardio: false, calories: 6, cautions: ['가벼운 무게', '어깨 으쓱이지 말 것', '천천히 내리기'], description: '측면 삼각근', difficulty: 'beginner' },
    // 하체
    { id: 'squat', name: '스쿼트', bodyPart: 'legs', isCardio: false, calories: 8, cautions: ['무릎 방향 주의', '허리 곧게', '깊이 조절'], description: '하체 기본 운동', difficulty: 'beginner' },
    { id: 'lunge', name: '런지', bodyPart: 'legs', isCardio: false, calories: 7, cautions: ['무릎이 발끝 넘지 않게', '균형 유지', '양쪽 균등하게'], description: '다리 균형 발달', difficulty: 'beginner' },
    // 유산소
    { id: 'running', name: '러닝', bodyPart: 'cardio', isCardio: true, calories: 10, cautions: ['무릎 충격 주의', '적절한 신발 착용', '스트레칭 필수'], description: '기본 유산소', difficulty: 'beginner' },
    { id: 'hiit', name: 'HIIT', bodyPart: 'cardio', isCardio: true, calories: 15, cautions: ['심박수 모니터링', '충분한 휴식', '초보자 주의'], description: '고강도 인터벌', difficulty: 'advanced' },
  ];

  const bodyParts = [
    { id: 'chest', name: '가슴', icon: '💪' },
    { id: 'back', name: '등', icon: '🏋️' },
    { id: 'shoulder', name: '어깨', icon: '🤲' },
    { id: 'legs', name: '하체', icon: '🦵' },
    { id: 'biceps', name: '이두', icon: '💪' },
    { id: 'triceps', name: '삼두', icon: '🔥' },
    { id: 'cardio', name: '유산소', icon: '❤️' },
  ];

const BODY_PART_LABELS: Record<string, string> = bodyParts.reduce((acc, part) => {
  acc[part.id] = part.name;
  return acc;
}, {} as Record<string, string>);

const DEFAULT_CAUTION = '운동 전 충분히 준비운동을 진행하세요.';

const EXERCISE_PART_META: Record<
  'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING',
  { bodyPart: string; label: string; isCardio?: boolean; cautions: string[] }
> = {
  CHEST: {
    bodyPart: 'chest',
    label: '가슴',
    cautions: ['어깨 힘을 빼고 가슴에 집중하세요.', '허리를 과도하게 꺾지 마세요.'],
  },
  BACK: {
    bodyPart: 'back',
    label: '등',
    cautions: ['허리를 곧게 유지하세요.', '팔 힘보다 등 근육을 사용하세요.'],
  },
  SHOULDER: {
    bodyPart: 'shoulder',
    label: '어깨',
    cautions: ['목에 힘이 들어가지 않도록 주의하세요.', '무게보다 정확한 자세에 집중하세요.'],
  },
  LOWER_BODY: {
    bodyPart: 'legs',
    label: '하체',
    cautions: ['무릎이 안쪽으로 모이지 않도록 주의하세요.', '무게 중심을 발 전체에 고르게 두세요.'],
  },
  BICEPS: {
    bodyPart: 'biceps',
    label: '이두',
    cautions: ['팔꿈치를 고정하고 반동을 줄이세요.', '손목에 무리가 가지 않도록 주의하세요.'],
  },
  TRICEPS: {
    bodyPart: 'triceps',
    label: '삼두',
    cautions: ['팔꿈치를 몸 가까이 유지하세요.', '무게보다 자세를 우선하세요.'],
  },
  CARDIO: {
    bodyPart: 'cardio',
    label: '유산소',
    isCardio: true,
    cautions: ['호흡을 일정하게 유지하세요.', '충분한 수분을 섭취하세요.', '과도한 무리는 피하세요.'],
  },
  HOME_TRAINING: {
    bodyPart: 'all',
    label: '홈트레이닝',
    cautions: ['주변 공간을 확보하고 진행하세요.', DEFAULT_CAUTION],
  },
};

const DEFAULT_EXERCISE_META = {
  bodyPart: 'all',
  label: '전신',
  isCardio: false,
  cautions: [DEFAULT_CAUTION],
};

const DIFFICULTY_LABELS: Record<Exercise['difficulty'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

const normalizeDifficulty = (level?: string): Exercise['difficulty'] => {
  const normalized = (level || 'BEGINNER').toString().toLowerCase();
  if (normalized === 'advanced') return 'advanced';
  if (normalized === 'intermediate') return 'intermediate';
  return 'beginner';
};

const decorateExercise = (exercise: Exercise): Exercise => {
  const difficulty = exercise.difficulty ?? 'beginner';
  const partLabel =
    exercise.partLabel ??
    (exercise.part
      ? EXERCISE_PART_META[exercise.part as keyof typeof EXERCISE_PART_META]?.label
      : BODY_PART_LABELS[exercise.bodyPart] ?? '전신');
  const levelLabel = exercise.levelLabel ?? DIFFICULTY_LABELS[difficulty] ?? difficulty;
  const cautions = exercise.cautions && exercise.cautions.length > 0 ? exercise.cautions : [DEFAULT_CAUTION];

  return {
    ...exercise,
    difficulty,
    partLabel,
    levelLabel,
    cautions,
  };
};

const convertRecommendationToExercise = (item: any, index: number): Exercise => {
  const partKey = typeof item?.part === 'string' ? (item.part as keyof typeof EXERCISE_PART_META) : 'HOME_TRAINING';
  const meta = EXERCISE_PART_META[partKey] ?? DEFAULT_EXERCISE_META;
  const difficulty = normalizeDifficulty(item?.level);
  const rawYoutubeLink =
    typeof item?.youtubeLink === 'string'
      ? item.youtubeLink
      : typeof item?.youtubeLinks === 'string'
      ? item.youtubeLinks
      : undefined;
  const youtubeLink =
    rawYoutubeLink && rawYoutubeLink.trim().length > 0 ? rawYoutubeLink.trim() : undefined;

  return decorateExercise({
    id: `ai_${Date.now()}_${index}`,
    name: item?.name || `추천 운동 ${index + 1}`,
    bodyPart: meta.bodyPart,
    isCardio: Boolean(meta.isCardio),
    calories: item?.duration ? Math.max(4, Math.round(item.duration * 6)) : 8,
    cautions: meta.cautions,
    description: item?.description || 'AI 추천 운동',
    difficulty,
    duration: item?.duration,
    youtubeLink,
    part: partKey,
    source: 'AI',
  });
};

const getDifficultyLabel = (difficulty: Exercise['difficulty']) => DIFFICULTY_LABELS[difficulty] ?? difficulty;

const getPartLabel = (exercise: Exercise) =>
  exercise.partLabel ??
  (exercise.part
    ? EXERCISE_PART_META[exercise.part as keyof typeof EXERCISE_PART_META]?.label
    : BODY_PART_LABELS[exercise.bodyPart] ?? '전신');
  // 오늘의 추천 운동 API 호출 (전신/HOME_TRAINING, 부위 선택 무시)
  const loadTodaysRecommendations = async () => {
    // 이미 요청 중이면 건너뜀
    if (requestingRecommendationsRef.current) {
      return;
    }

    requestingRecommendationsRef.current = true;
    setLoadingRecommendations(true);
    
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) {
        Alert.alert('알림', '로그인이 필요합니다.');
        return;
      }

      const level = condition === 'good' ? 'ADVANCED' : condition === 'normal' ? 'INTERMEDIATE' : 'BEGINNER';
      const userInput = '집에서 할 수 있는 전신 운동을 추천해줘.';
      
      const response = await WorkoutService.getExerciseRecommendation(userInput, level, 'HOME_TRAINING');

      if (response.success && response.data) {
        const raw = response.data as any;
        const normalizedList: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.exerciseInfoDto)
          ? raw.exerciseInfoDto
          : [];

        if (normalizedList.length > 0) {
          const exercises = normalizedList.map((item, index) => convertRecommendationToExercise(item, index));
          setTodaysRecommendations(exercises);
          return;
        }
      }

      if (response.meta?.usedFallback && Array.isArray(response.data)) {
        const exercises = (response.data as any[]).map((item, index) => convertRecommendationToExercise(item, index));
        setTodaysRecommendations(exercises);
        return;
      }

      throw new Error(response.error || '운동 추천 실패');
    } catch (error: any) {
      console.log('[WorkoutLogger] 오늘의 추천 운동 실패:', error.message || error);
      // fallback 데이터 사용
      const { getRandomExerciseRecommendations } = await import('../../constants/fallbacks');
      const fallbackExercises = getRandomExerciseRecommendations(5, 'HOME_TRAINING');
      const exercises = fallbackExercises.map((item, index) => convertRecommendationToExercise(item, index));
      setTodaysRecommendations(exercises);
    } finally {
      setLoadingRecommendations(false);
      requestingRecommendationsRef.current = false;
    }
  };

  // 부위별 운동 추천 API 호출
  const loadBodyPartRecommendations = async (bodyPartId: string) => {
    if (!bodyPartId || requestingBodyPartRef.current) {
      return;
    }

    requestingBodyPartRef.current = true;
    setLoadingBodyPartRecommendations(true);
    
    try {
      const userStr = await AsyncStorage.getItem('currentUser');
      if (!userStr) {
        return;
      }

      const partMap: Record<string, 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING'> = {
        'chest': 'CHEST',
        'back': 'BACK',
        'shoulder': 'SHOULDER',
        'legs': 'LOWER_BODY',
        'biceps': 'BICEPS',
        'triceps': 'TRICEPS',
        'cardio': 'CARDIO',
      };
      const part = partMap[bodyPartId] || 'HOME_TRAINING';
      const partLabel = bodyParts.find(p => p.id === bodyPartId)?.name || '전신';
      const level = condition === 'good' ? 'ADVANCED' : condition === 'normal' ? 'INTERMEDIATE' : 'BEGINNER';
      const userInput = `${partLabel} 운동을 추천해줘.`;
      
      const response = await WorkoutService.getExerciseRecommendation(userInput, level, part);

      if (response.success && response.data) {
        const raw = response.data as any;
        const normalizedList: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.exerciseInfoDto)
          ? raw.exerciseInfoDto
          : [];

        if (normalizedList.length > 0) {
          const exercises = normalizedList.map((item, index) => convertRecommendationToExercise(item, index));
          setBodyPartRecommendations(exercises);
          return;
        }
      }

      if (response.meta?.usedFallback && Array.isArray(response.data)) {
        const exercises = (response.data as any[]).map((item, index) => convertRecommendationToExercise(item, index));
        setBodyPartRecommendations(exercises);
        return;
      }

      throw new Error(response.error || '운동 추천 실패');
    } catch (error: any) {
      console.log('[WorkoutLogger] 부위별 운동 추천 실패:', error.message || error);
      // fallback 데이터 사용
      const { getRandomExerciseRecommendations } = await import('../../constants/fallbacks');
      const partMap: Record<string, 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING'> = {
        'chest': 'CHEST',
        'back': 'BACK',
        'shoulder': 'SHOULDER',
        'legs': 'LOWER_BODY',
        'biceps': 'BICEPS',
        'triceps': 'TRICEPS',
        'cardio': 'CARDIO',
      };
      const part = partMap[bodyPartId] || 'HOME_TRAINING';
      const fallbackExercises = getRandomExerciseRecommendations(5, part);
      const exercises = fallbackExercises.map((item, index) => convertRecommendationToExercise(item, index));
      setBodyPartRecommendations(exercises);
    } finally {
      setLoadingBodyPartRecommendations(false);
      requestingBodyPartRef.current = false;
    }
  };

  const getTodaysRecommendations = (): Exercise[] => {
    return todaysRecommendations;
  };

  const getBodyPartRecommendations = (bodyPart: string): Exercise[] => {
    // 부위별 추천이 있으면 반환, 없으면 로컬 데이터베이스 사용
    if (bodyPart && bodyPartRecommendations.length > 0) {
      return bodyPartRecommendations;
    }
    const filtered = exerciseDatabase.filter((e) => e.bodyPart === bodyPart);
    return filtered.slice(0, 5).map((exercise) => decorateExercise({ ...exercise, source: 'LOCAL' }));
  };

  const addWorkout = async (exercise: Exercise) => {
    const exists = todaysWorkouts.some(w => w.exercise.id === exercise.id);
    if (exists) {
      Alert.alert('알림', '이미 추가된 운동입니다!');
      return;
    }

    // 백엔드에 운동 등록 시도 (exerciseId가 있는 경우)
    if (exercise.id && exercise.id.startsWith('ai_')) {
      try {
        // AI 추천 운동의 경우 백엔드에 등록된 exerciseId를 찾아야 함
        // 일단 로컬에만 저장하고 나중에 백엔드와 동기화
      } catch (error) {
        // 백엔드 등록 실패해도 로컬에 저장
      }
    }

    const suggestedSets = condition === 'tired' ? 2 : condition === 'normal' ? 3 : 4;
    const suggestedReps = exercise.difficulty === 'beginner' ? 12 : exercise.difficulty === 'intermediate' ? 10 : 8;

    const newWorkout: WorkoutEntry = {
      id: Date.now().toString(),
      exercise,
      sets: suggestedSets,
      reps: suggestedReps,
      weight: 0,
      duration: exercise.isCardio ? workoutTime : undefined,
      memo: '',
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setTodaysWorkouts(prev => [...prev, newWorkout]);
    
    // 추천 목록에서 해당 운동 제거
    setTodaysRecommendations(prev => 
      prev.filter(rec => rec.id !== exercise.id && rec.name !== exercise.name)
    );
    
    // 로컬 저장
    try {
      const saved = await AsyncStorage.getItem('todaysWorkouts');
      const workouts = saved ? JSON.parse(saved) : [];
      workouts.push(newWorkout);
      await AsyncStorage.setItem('todaysWorkouts', JSON.stringify(workouts));
    } catch (error) {
      // 저장 실패 시 무시
    }
  };

  const removeWorkout = (id: string) => {
    setTodaysWorkouts(prev => prev.filter(entry => entry.id !== id));
  };

  const updateWorkout = (id: string, field: keyof WorkoutEntry, value: any) => {
    setTodaysWorkouts(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const totalCalories = todaysWorkouts.reduce((sum, entry) => {
    if (entry.exercise.isCardio && entry.duration) {
      return sum + (entry.exercise.calories * entry.duration);
    }
    return sum + (entry.exercise.calories * entry.sets);
  }, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const newSeconds = targetSeconds > 0 && prev >= targetSeconds 
            ? targetSeconds 
            : prev + 1;
          // AsyncStorage에 저장
          AsyncStorage.setItem('workoutTimerSeconds', String(newSeconds));
          if (targetSeconds > 0 && prev >= targetSeconds) {
            setTimerRunning(false);
          }
          return newSeconds;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, targetSeconds]);

  useEffect(() => {
    // 초기값 로드
    AsyncStorage.getItem('workoutTimerSeconds').then(saved => {
      if (saved) {
        setTimerSeconds(parseInt(saved) || 0);
      }
    });
  }, []);

  const startTimer = () => {
    if (workoutTime > 0) {
      setTargetSeconds(workoutTime * 60);
    }
    setTimerRunning(true);
  };

  const pauseTimer = () => {
    setTimerRunning(false);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerSeconds(0);
    setTargetSeconds(0);
    AsyncStorage.setItem('workoutTimerSeconds', '0');
  };

  // 초기 로드 - 오늘의 추천 운동 자동 로드
  useEffect(() => {
    loadTodaysRecommendations();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>운동 💪</Text>
          <Text style={styles.subtitle}>오늘의 운동을 기록하세요</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recommendations' && styles.tabActive]}
            onPress={() => setActiveTab('recommendations')}
          >
            <Text style={[styles.tabText, activeTab === 'recommendations' && styles.tabTextActive]}>
              운동 추천
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'logger' && styles.tabActive]}
            onPress={() => setActiveTab('logger')}
          >
            <Text style={[styles.tabText, activeTab === 'logger' && styles.tabTextActive]}>
              운동 기록
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'recommendations' ? (
          <View style={styles.content}>
            {/* Workout Settings */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>운동 설정</Text>
              
              <Text style={styles.label}>운동 시간 (분)</Text>
              <View style={styles.timeButtons}>
                {[15, 30, 45, 60].map(time => (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeButton, workoutTime === time && styles.timeButtonActive]}
                    onPress={() => setWorkoutTime(time)}
                  >
                    <Text style={[styles.timeButtonText, workoutTime === time && styles.timeButtonTextActive]}>
                      {time}분
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>오늘 컨디션</Text>
              <View style={styles.conditionButtons}>
                {[
                  { value: 'tired', label: '피곤😴' },
                  { value: 'normal', label: '보통😊' },
                  { value: 'good', label: '좋음💪' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.value}
                    style={[styles.conditionButton, condition === item.value && styles.conditionButtonActive]}
                    onPress={() => {
                      setCondition(item.value as any);
                      // 컨디션 변경 시 오늘의 추천 운동만 다시 로드
                      setTimeout(() => loadTodaysRecommendations(), 100);
                      // 부위별 추천이 있으면 다시 로드
                      if (selectedBodyPart) {
                        setTimeout(() => loadBodyPartRecommendations(selectedBodyPart), 200);
                      }
                    }}
                  >
                    <Text style={[
                      styles.conditionButtonText,
                      condition === item.value && styles.conditionButtonTextActive
                    ]}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                style={styles.reloadButton}
                onPress={loadTodaysRecommendations}
                disabled={loadingRecommendations}
              >
                {loadingRecommendations ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.reloadButtonText}>운동 추천 받기</Text>
                )}
              </TouchableOpacity>
            </Card>

            {/* Today's Recommendations */}
            <Card style={styles.card}>
              <View style={styles.cardHeaderWithRefresh}>
                <Text style={styles.cardTitle}>오늘의 추천 운동 ⭐</Text>
                <TouchableOpacity 
                  onPress={loadTodaysRecommendations}
                  disabled={loadingRecommendations}
                  style={styles.refreshButton}
                >
                  {loadingRecommendations ? (
                    <ActivityIndicator size="small" color="#6366f1" />
                  ) : (
                    <Text style={styles.refreshIcon}>🔄</Text>
                  )}
                </TouchableOpacity>
              </View>
              {(getTodaysRecommendations().length === 0 && loadingRecommendations) ? (
                <ActivityIndicator size="large" color="#6366f1" style={{ padding: 20 }} />
              ) : (
                getTodaysRecommendations().map((exercise, idx) => (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.exerciseContent}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {getPartLabel(exercise)} · {getDifficultyLabel(exercise.difficulty)}
                      </Text>
                      <Text style={styles.exerciseDesc}>{exercise.description}</Text>
                      {exercise.youtubeLink ? (
                        <TouchableOpacity
                          style={styles.exerciseLinkWrapper}
                          onPress={() => exercise.youtubeLink && openYoutubeLink(exercise.youtubeLink)}
                        >
                          <Text style={styles.exerciseLink}>🎬 시연 영상 보기</Text>
                        </TouchableOpacity>
                      ) : null}
                      <Button title="추가" onPress={() => addWorkout(exercise)} />
                    </View>
                  </View>
                ))
              )}
            </Card>

            {/* Body Part Selection */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>부위별 운동</Text>
              <View style={styles.bodyParts}>
                {bodyParts.map(part => (
                  <TouchableOpacity
                    key={part.id}
                    style={[styles.bodyPart, selectedBodyPart === part.id && styles.bodyPartActive]}
                    onPress={() => {
                      const newSelected = selectedBodyPart === part.id ? '' : part.id;
                      setSelectedBodyPart(newSelected);
                      // 부위 선택 시 부위별 추천 로드
                      if (newSelected) {
                        setTimeout(() => loadBodyPartRecommendations(newSelected), 100);
                      } else {
                        // 부위 선택 해제 시 부위별 추천 초기화
                        setBodyPartRecommendations([]);
                      }
                    }}
                  >
                    <Text style={styles.bodyPartIcon}>{part.icon}</Text>
                    <Text style={styles.bodyPartText}>{part.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedBodyPart && (
                <View style={styles.bodyPartRecommendationsHeader}>
                  <Text style={styles.bodyPartRecommendationsTitle}>
                    {bodyParts.find(p => p.id === selectedBodyPart)?.name} 운동 추천
                  </Text>
                  {loadingBodyPartRecommendations && (
                    <ActivityIndicator size="small" color="#6366f1" />
                  )}
                </View>
              )}

              {selectedBodyPart && (
                <>
                  {loadingBodyPartRecommendations ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#6366f1" />
                      <Text style={styles.loadingText}>운동 추천을 불러오는 중...</Text>
                    </View>
                  ) : bodyPartRecommendations.length > 0 ? (
                    bodyPartRecommendations.map((exercise, idx) => (
                      <View key={exercise.id} style={styles.exerciseCard}>
                        <View style={[styles.exerciseNumber, styles.exerciseNumberSecondary]}>
                          <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                        </View>
                        <View style={styles.exerciseContent}>
                          <Text style={styles.exerciseName}>{exercise.name}</Text>
                          <Text style={styles.exerciseMeta}>
                            {getPartLabel(exercise)} · {getDifficultyLabel(exercise.difficulty)}
                          </Text>
                          <Text style={styles.exerciseDesc}>{exercise.description}</Text>
                          {exercise.youtubeLink ? (
                            <TouchableOpacity
                              style={styles.exerciseLinkWrapper}
                              onPress={() => exercise.youtubeLink && openYoutubeLink(exercise.youtubeLink)}
                            >
                              <Text style={styles.exerciseLink}>🎬 시연 영상 보기</Text>
                            </TouchableOpacity>
                          ) : null}
                          <Button title="추가" onPress={() => addWorkout(exercise)} />
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>추천 운동이 없습니다</Text>
                      <TouchableOpacity
                        style={styles.reloadButtonSmall}
                        onPress={() => loadBodyPartRecommendations(selectedBodyPart)}
                      >
                        <Text style={styles.reloadButtonTextSmall}>다시 시도</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </Card>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Summary */}
            <View style={styles.summaryRow}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{todaysWorkouts.length}</Text>
                <Text style={styles.summaryLabel}>운동 개수</Text>
              </Card>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{Math.round(totalCalories)}</Text>
                <Text style={styles.summaryLabel}>소모 칼로리</Text>
              </Card>
            </View>

            {/* Stopwatch */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>스톱워치</Text>
              <Text style={styles.timerDisplay}>{formatTime(timerSeconds)}</Text>
              {targetSeconds > 0 && (
                <Text style={styles.timerTarget}>목표: {formatTime(targetSeconds)}</Text>
              )}
              <View style={styles.timerButtons}>
                <Button title="시작" onPress={startTimer} disabled={timerRunning} />
                <Button title="멈춤" onPress={pauseTimer} disabled={!timerRunning} />
                <Button title="종료" onPress={stopTimer} />
              </View>
            </Card>

            {/* Workout List */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>오늘의 운동 기록</Text>
              {todaysWorkouts.length === 0 ? (
                <Text style={styles.emptyText}>운동을 추가해보세요!</Text>
              ) : (
                todaysWorkouts.map(entry => (
                  <View key={entry.id} style={styles.workoutEntry}>
                    <View style={styles.workoutHeader}>
                      <Text style={styles.workoutName}>{entry.exercise.name}</Text>
                      <TouchableOpacity onPress={() => removeWorkout(entry.id)}>
                        <Text style={styles.deleteButton}>삭제</Text>
                      </TouchableOpacity>
                    </View>

                    {!entry.exercise.isCardio ? (
                      <View style={styles.workoutInputs}>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>세트</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(entry.sets)}
                            onChangeText={(text) => updateWorkout(entry.id, 'sets', parseInt(text) || 0)}
                          />
                        </View>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>횟수</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(entry.reps)}
                            onChangeText={(text) => updateWorkout(entry.id, 'reps', parseInt(text) || 0)}
                          />
                        </View>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>무게(kg)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(entry.weight)}
                            onChangeText={(text) => updateWorkout(entry.id, 'weight', parseFloat(text) || 0)}
                          />
                        </View>
                      </View>
                    ) : (
                      <View style={styles.workoutInputs}>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>시간(분)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(entry.duration || 0)}
                            onChangeText={(text) => updateWorkout(entry.id, 'duration', parseInt(text) || 0)}
                          />
                        </View>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>횟수</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(entry.reps)}
                            onChangeText={(text) => updateWorkout(entry.id, 'reps', parseInt(text) || 0)}
                          />
                        </View>
                      </View>
                    )}

                    <Text style={styles.inputLabel}>메모</Text>
                    <TextInput
                      style={[styles.input, styles.memoInput]}
                      placeholder="운동 메모를 남겨보세요..."
                      value={entry.memo}
                      onChangeText={(text) => updateWorkout(entry.id, 'memo', text)}
                      multiline
                    />

                    <View style={styles.cautions}>
                      <Text style={styles.cautionsTitle}>⚠️ 주의사항</Text>
                      {entry.exercise.cautions.map((caution, idx) => (
                        <Text key={idx} style={styles.cautionText}>• {caution}</Text>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 6,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  card: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  cardHeaderWithRefresh: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    fontSize: 20,
  },
  reloadButton: {
    backgroundColor: '#6366f1',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  reloadButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  timeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  timeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  timeButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  timeButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  conditionButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  conditionButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  conditionButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  exerciseCard: {
    flexDirection: 'row',
    marginBottom: 14,
    padding: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  exerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  exerciseNumberSecondary: {
    backgroundColor: '#64748b',
  },
  exerciseNumberText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseMeta: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  exerciseLinkWrapper: {
    marginBottom: 8,
  },
  exerciseLink: {
    fontSize: 12,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  exerciseCalories: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  bodyParts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bodyPart: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyPartActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  bodyPartIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  bodyPartText: {
    fontSize: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  timerTarget: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  workoutEntry: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    color: '#FF3B30',
  },
  workoutInputs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  workoutInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
  },
  memoInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  cautions: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
  },
  cautionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  cautionText: {
    fontSize: 11,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 32,
  },
  bodyPartRecommendationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },
  bodyPartRecommendationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadButtonSmall: {
    marginTop: 16,
    backgroundColor: '#6366f1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  reloadButtonTextSmall: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
