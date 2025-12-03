import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { Feather as Icon } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { WorkoutService } from '../../services/workoutService';

interface Exercise {
  id: string;
  exerciseId?: number; // 백엔드에서 받은 운동 ID (register API 호출 시 사용)
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
  date?: string; // 운동 기록 날짜 (YYYY-MM-DD 형식)
  source?: 'backend' | 'local';
}

const LOCAL_WORKOUT_ENTRIES_KEY = '@workoutLogger:localEntries';

async function readLocalWorkoutEntries(): Promise<WorkoutEntry[]> {
  try {
    const stored = await AsyncStorage.getItem(LOCAL_WORKOUT_ENTRIES_KEY);
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

async function persistLocalWorkoutEntries(entries: WorkoutEntry[]) {
  try {
    await AsyncStorage.setItem(LOCAL_WORKOUT_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('[WorkoutLogger] 운동 기록 저장 실패:', error);
  }
}

export function WorkoutLogger() {
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutEntry[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [recommendationSeed, setRecommendationSeed] = useState(Date.now());
  const [workoutTime] = useState<number>(30); // 고정값 30분 (UI에서 숨김)
  
  // 중복 호출 방지 플래그
  const requestingRecommendationsRef = useRef(false);
  const requestingBodyPartRef = useRef(false);
  // 사용된 운동 ID 추적 (중복 방지)
  const usedExerciseIdsRef = useRef<Set<number>>(new Set());
  const [condition, setCondition] = useState<'good' | 'normal' | 'tired'>('normal');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'logger'>('recommendations');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(0);
  const [todaysRecommendations, setTodaysRecommendations] = useState<Exercise[]>([]); // 오늘의 추천 운동 (전신)
  const [bodyPartRecommendations, setBodyPartRecommendations] = useState<Exercise[]>([]); // 부위별 운동 추천
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [loadingBodyPartRecommendations, setLoadingBodyPartRecommendations] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');

  // 화면이 포커스될 때만 사용자 정보 및 운동 기록 로드
  useFocusEffect(
    useCallback(() => {
      loadUserInfo();
      loadTodaysWorkouts();
    }, [])
  );

  // 오늘의 운동 기록 로드 (로컬 + 백엔드)
  const loadTodaysWorkouts = async () => {
    try {
      // 로컬 저장된 운동 기록 로드
      const localEntries = await readLocalWorkoutEntries();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // 오늘 날짜의 로컬 기록만 필터링
      const todayLocalEntries = localEntries.filter(entry => entry.date === today);
      
      // 백엔드에서 오늘의 운동 목록 가져오기 시도
      try {
        const { getTodayExercises } = await import('../../api/exercises');
        const backendExercises = await getTodayExercises();
        
        console.log('[WorkoutLogger] 백엔드 운동 목록:', backendExercises);
        
        // 백엔드 운동을 WorkoutEntry로 변환
        const backendEntries: WorkoutEntry[] = backendExercises.map((ex, index) => {
          const partKey = ex.part || 'HOME_TRAINING';
          const meta = EXERCISE_PART_META[partKey as keyof typeof EXERCISE_PART_META] ?? DEFAULT_EXERCISE_META;
          const difficulty = normalizeDifficulty(ex.level);
          
          const exercise: Exercise = decorateExercise({
            id: `backend_${ex.id}_${index}`,
            exerciseId: ex.id,
            name: ex.name,
            bodyPart: meta.bodyPart,
            isCardio: Boolean(meta.isCardio),
            calories: 8,
            cautions: meta.cautions,
            description: ex.description || '',
            difficulty,
            duration: undefined,
            part: partKey,
            youtubeLink: ex.youtubeLink,
            source: 'AI',
          });
          
          // 백엔드에서 받은 sets, reps, weight 값을 확인
          console.log('[WorkoutLogger] 백엔드 운동 데이터:', {
            id: ex.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weight: ex.weight,
            level: ex.level,
          });
          
          // 백엔드에서 받은 sets, reps, weight 값을 숫자로 변환
          const backendSets = typeof ex.sets === 'number' ? ex.sets : (ex.sets ? Number(ex.sets) : 0);
          const backendReps = typeof ex.reps === 'number' ? ex.reps : (ex.reps ? Number(ex.reps) : 0);
          const backendWeight = typeof ex.weight === 'number' ? ex.weight : (ex.weight ? Number(ex.weight) : 0);
          
          console.log('[WorkoutLogger] 백엔드 값 변환:', {
            원본_sets: ex.sets,
            원본_reps: ex.reps,
            원본_weight: ex.weight,
            변환_sets: backendSets,
            변환_reps: backendReps,
            변환_weight: backendWeight,
          });
          
          // 백엔드에서 받은 sets, reps, weight 값을 그대로 사용
          // 0이거나 없으면 난이도에 따른 기본값 적용
          const getDefaultSets = () => {
            if (backendSets && backendSets > 0) {
              console.log('[WorkoutLogger] 백엔드 sets 값 사용:', backendSets);
              return backendSets;
            }
            // 난이도에 따른 기본값
            const defaultSets = difficulty === 'beginner' ? 3 : difficulty === 'intermediate' ? 4 : 5;
            console.log('[WorkoutLogger] sets 기본값 적용:', defaultSets);
            return defaultSets;
          };
          
          const getDefaultReps = () => {
            if (backendReps && backendReps > 0) {
              console.log('[WorkoutLogger] 백엔드 reps 값 사용:', backendReps);
              return backendReps;
            }
            // 난이도에 따른 기본값
            const defaultReps = difficulty === 'beginner' ? 12 : difficulty === 'intermediate' ? 10 : 8;
            console.log('[WorkoutLogger] reps 기본값 적용:', defaultReps);
            return defaultReps;
          };
          
          const finalSets = getDefaultSets();
          const finalReps = getDefaultReps();
          const finalWeight = backendWeight;
          
          console.log('[WorkoutLogger] 최종 적용 값:', {
            name: ex.name,
            exerciseId: ex.id,
            finalSets,
            finalReps,
            finalWeight,
            backendSets_원본: ex.sets,
            backendReps_원본: ex.reps,
          });
          
          const workoutEntry: WorkoutEntry = {
            id: `backend_${ex.id}_${Date.now()}_${index}`,
            exercise,
            sets: finalSets,
            reps: finalReps,
            weight: finalWeight, // weight는 0일 수 있으므로 그대로 사용
            duration: undefined,
            memo: '',
            time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
            date: today,
            source: 'backend',
          };
          
          // 반환되는 객체의 실제 값 확인
          console.log('[WorkoutLogger] WorkoutEntry 객체 생성:', {
            name: workoutEntry.exercise.name,
            sets: workoutEntry.sets,
            reps: workoutEntry.reps,
            weight: workoutEntry.weight,
          });
          
          return workoutEntry;
        });
        
        // 로컬과 백엔드 기록 병합 (백엔드 데이터가 로컬 데이터를 완전히 덮어씀)
        const allEntries: WorkoutEntry[] = [];
        
        // 먼저 백엔드 항목들을 추가 (백엔드가 최신 데이터이므로 우선)
        backendEntries.forEach(backendEntry => {
          console.log('[WorkoutLogger] 백엔드 항목 추가:', {
            name: backendEntry.exercise.name,
            exerciseId: backendEntry.exercise.exerciseId,
            sets: backendEntry.sets,
            reps: backendEntry.reps,
            weight: backendEntry.weight,
            source: backendEntry.source,
          });
          allEntries.push(backendEntry);
        });
        
        // 백엔드에 없는 로컬 항목들만 추가 (백엔드가 우선순위)
        todayLocalEntries.forEach(localEntry => {
          const existsInBackend = backendEntries.some(
            entry => entry.exercise.exerciseId === localEntry.exercise.exerciseId
          );
          if (!existsInBackend) {
            console.log('[WorkoutLogger] 로컬 항목 추가 (백엔드에 없음):', {
              name: localEntry.exercise.name,
              exerciseId: localEntry.exercise.exerciseId,
            });
            allEntries.push(localEntry);
          } else {
            console.log('[WorkoutLogger] 로컬 항목 건너뜀 (백엔드 데이터로 대체됨):', {
              name: localEntry.exercise.name,
              exerciseId: localEntry.exercise.exerciseId,
            });
          }
        });
        
        // 최종 상태 업데이트 전 값 검증
        console.log('[WorkoutLogger] 상태 업데이트 전 최종 검증:', {
          totalCount: allEntries.length,
          entries: allEntries.map((entry, idx) => ({
            index: idx,
            name: entry.exercise.name,
            exerciseId: entry.exercise.exerciseId,
            sets: entry.sets,
            reps: entry.reps,
            weight: entry.weight,
            source: entry.source,
            sets_type: typeof entry.sets,
            reps_type: typeof entry.reps,
          })),
        });
        
        console.log('[WorkoutLogger] 운동 기록 로드 완료:', {
          local: todayLocalEntries.length,
          backend: backendEntries.length,
          total: allEntries.length,
        });
        
        setTodaysWorkouts(allEntries);
      } catch (error: any) {
        console.log('[WorkoutLogger] 백엔드 운동 로드 실패, 로컬만 사용:', error?.message || error);
        // 백엔드 로드 실패 시 로컬 기록만 사용
        setTodaysWorkouts(todayLocalEntries);
      }
    } catch (error) {
      console.error('[WorkoutLogger] 운동 기록 로드 실패:', error);
    }
  };

  const loadUserInfo = async () => {
    try {
      const saved = await AsyncStorage.getItem('currentUser');
      const parsed = saved ? JSON.parse(saved) : null;
      
      if (parsed && Object.keys(parsed).length > 0) {
        setCurrentUser(parsed);
        const userIdentifier = parsed.email || parsed.id || '';
        setUserId(String(userIdentifier));
        console.log('[WorkoutLogger] 사용자 정보 로드:', {
          email: parsed.email,
          id: parsed.id,
          userId: userIdentifier,
        });
      } else {
        console.warn('[WorkoutLogger] 사용자 정보가 없습니다.');
        setCurrentUser(null);
        setUserId('');
      }
    } catch (error) {
      console.error('[WorkoutLogger] 사용자 정보 로드 실패:', error);
      setCurrentUser(null);
      setUserId('');
    }
  };

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
    { id: 'chest', name: '가슴', icon: 'heart' },
    { id: 'back', name: '등', icon: 'layers' },
    { id: 'shoulder', name: '어깨', icon: 'target' },
    { id: 'legs', name: '하체', icon: 'activity' },
    { id: 'biceps', name: '이두', icon: 'zap' },
    { id: 'triceps', name: '삼두', icon: 'flame' },
    { id: 'cardio', name: '유산소', icon: 'trending-up' },
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

  // 백엔드에서 받은 운동 ID 확인 (id 필드 또는 exerciseId 필드)
  const exerciseId = typeof item?.id === 'number' ? item.id : 
                    typeof item?.exerciseId === 'number' ? item.exerciseId : 
                    undefined;
  
  console.log('[WorkoutLogger] convertRecommendationToExercise:', {
    itemName: item?.name,
    itemId: item?.id,
    itemExerciseId: item?.exerciseId,
    extractedExerciseId: exerciseId,
    fullItem: item,
  });

  return decorateExercise({
    id: `ai_${Date.now()}_${index}`,
    exerciseId: exerciseId, // 백엔드에서 받은 운동 ID
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
      // 사용자 정보 확인 및 로드
      if (!currentUser || !userId) {
        const userStr = await AsyncStorage.getItem('currentUser');
        if (!userStr) {
          Alert.alert('알림', '로그인이 필요합니다.');
          return;
        }
        await loadUserInfo();
      }

      const level = condition === 'good' ? 'ADVANCED' : condition === 'normal' ? 'INTERMEDIATE' : 'BEGINNER';
      const userInput = '집에서 할 수 있는 전신 운동을 추천해줘.';
      
      const response = await WorkoutService.getPartExerciseRecommendation(userInput, level, 'HOME_TRAINING');

      if (response.success && response.data) {
        const raw = response.data as any;
        const normalizedList: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.exerciseInfoDto)
          ? raw.exerciseInfoDto
          : [];

        if (normalizedList.length > 0) {
          console.log('[WorkoutLogger] 백엔드 추천 응답 (정규화 전):', normalizedList);
          const exercises = normalizedList.map((item, index) => convertRecommendationToExercise(item, index));
          console.log('[WorkoutLogger] 백엔드 추천 응답 (정규화 후):', exercises.map(ex => ({ name: ex.name, exerciseId: ex.exerciseId })));
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
      
      const response = await WorkoutService.getPartExerciseRecommendation(userInput, level, part);

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

  // 백엔드에서 저장된 운동을 이름으로 찾아서 ID 반환
  // 백엔드가 추천 시 UNREGISTERED 상태로 Exercise를 저장하므로
  // 이름과 part로 검색하여 ID를 찾습니다 (FoodLogger의 resolveFoodIdForRecommendation 참고)
  // 
  // 주의: 현재 백엔드에는 UNREGISTERED 상태의 운동을 이름으로 검색하는 API가 없습니다.
  // getTodayExercises는 REGISTERED 상태만 반환하므로 UNREGISTERED 운동은 찾을 수 없습니다.
  // 백엔드가 추천 응답에 ID를 포함시키면 자동으로 동작합니다.
  const resolveExerciseIdForRecommendation = useCallback(async (exerciseName: string, exercisePart?: string): Promise<number | null> => {
    try {
      // 오늘의 운동 목록에서 이름으로 찾기 시도 (REGISTERED만 반환되므로 제한적)
      // 백엔드가 추천 응답에 ID를 포함시키면 이 함수는 사용되지 않을 수 있습니다.
      const { getTodayExercises } = await import('../../api/exercises');
      const todayExercises = await getTodayExercises();
      
      console.log('[WorkoutLogger] 오늘의 운동 목록 조회 결과:', {
        exerciseName,
        exercisePart,
        todayExercisesCount: todayExercises?.length || 0,
        todayExercises: todayExercises,
      });
      
      if (Array.isArray(todayExercises)) {
        // 1. 정확한 매칭: 이름과 part가 일치하고, 아직 사용되지 않은 것
        const exactMatch = todayExercises.find(
          ex => 
            ex.name === exerciseName && 
            (exercisePart ? ex.part === exercisePart : true) &&
            ex.id !== null &&
            !usedExerciseIdsRef.current.has(ex.id)
        );
        
        if (exactMatch?.id) {
          usedExerciseIdsRef.current.add(exactMatch.id);
          console.log('[WorkoutLogger] 운동 ID 발견 (정확한 매칭):', {
            exerciseName,
            exercisePart,
            exerciseId: exactMatch.id,
          });
          return exactMatch.id;
        }
        
        // 2. 이름만 일치하고 아직 사용되지 않은 것
        const nameMatch = todayExercises.find(
          ex => 
            ex.name === exerciseName && 
            ex.id !== null &&
            !usedExerciseIdsRef.current.has(ex.id)
        );
        
        if (nameMatch?.id) {
          usedExerciseIdsRef.current.add(nameMatch.id);
          console.log('[WorkoutLogger] 운동 ID 발견 (이름 매칭):', {
            exerciseName,
            exerciseId: nameMatch.id,
          });
          return nameMatch.id;
        }
      }
      
      console.log('[WorkoutLogger] 운동 ID를 찾지 못함 (UNREGISTERED 상태는 조회 불가):', {
        exerciseName,
        exercisePart,
        note: '백엔드가 추천 응답에 ID를 포함시키면 자동으로 동작합니다.',
      });
      return null;
    } catch (error: any) {
      // 검색 실패 시 null 반환 (로컬 저장으로 대체)
      console.warn('[WorkoutLogger] 운동 ID 검색 실패:', error?.message || error);
      return null;
    }
  }, []);

  const addWorkout = async (exercise: Exercise) => {
    console.log('[WorkoutLogger] addWorkout 호출:', {
      exerciseName: exercise.name,
      exerciseId: exercise.exerciseId,
      exercise: exercise,
    });

    const exists = todaysWorkouts.some(w => w.exercise.id === exercise.id);
    if (exists) {
      Alert.alert('알림', '이미 추가된 운동입니다!');
      return;
    }

    // 백엔드에 운동 등록 시도
    // exerciseId가 없으면 이름으로 ID를 찾아봅니다 (FoodLogger 패턴)
    let finalExerciseId = exercise.exerciseId;
    let registerSuccess = false;
    let registerMessage = '';
    
    // exerciseId가 없으면 이름으로 찾기 시도
    if (!finalExerciseId && exercise.name) {
      console.log('[WorkoutLogger] exerciseId가 없어 이름으로 ID 찾기 시도:', exercise.name);
      const foundId = await resolveExerciseIdForRecommendation(exercise.name, exercise.part);
      if (foundId) {
        finalExerciseId = foundId;
        // exercise 객체의 exerciseId 업데이트
        exercise.exerciseId = foundId;
        console.log('[WorkoutLogger] 이름으로 운동 ID 찾기 성공:', {
          exerciseName: exercise.name,
          exerciseId: foundId,
        });
      }
    }
    
    if (finalExerciseId) {
      console.log('[WorkoutLogger] 백엔드에 운동 등록 시도:', {
        exerciseId: finalExerciseId,
        exerciseName: exercise.name,
      });
      
      try {
        const result = await WorkoutService.registerExercise(finalExerciseId);
        console.log('[WorkoutLogger] registerExercise 응답:', result);
        
        if (result.success) {
          registerSuccess = true;
          registerMessage = result.data?.message || '운동이 등록되었습니다.';
          console.log('[WorkoutLogger] 운동 등록 성공:', finalExerciseId, registerMessage);
        } else {
          registerMessage = result.error || '운동 등록에 실패했습니다.';
          console.log('[WorkoutLogger] 운동 등록 실패:', result.error);
        }
      } catch (error: any) {
        registerMessage = error?.message || '운동 등록 중 오류가 발생했습니다.';
        console.error('[WorkoutLogger] 운동 등록 예외 발생:', error?.message || error);
        console.error('[WorkoutLogger] 운동 등록 예외 상세:', error);
        // 백엔드 등록 실패해도 로컬에 저장
      }
    } else {
      console.warn('[WorkoutLogger] exerciseId를 찾지 못해 백엔드 등록을 건너뜁니다:', {
        exerciseName: exercise.name,
        exercise: exercise,
      });
    }

    const suggestedSets = condition === 'tired' ? 2 : condition === 'normal' ? 3 : 4;
    const suggestedReps = exercise.difficulty === 'beginner' ? 12 : exercise.difficulty === 'intermediate' ? 10 : 8;

    const newWorkout: WorkoutEntry & { userId?: string; userName?: string } = {
      id: Date.now().toString(),
      exercise,
      sets: suggestedSets,
      reps: suggestedReps,
      weight: 0,
      duration: exercise.isCardio ? workoutTime : undefined,
      memo: '',
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식으로 날짜 저장
      source: 'local',
      userId: userId,
      userName: currentUser?.nickname || currentUser?.name || '사용자',
    };
    setTodaysWorkouts(prev => {
      const updated = [...prev, newWorkout];
      // 로컬 저장
      persistLocalWorkoutEntries(updated.filter(entry => entry.source === 'local'));
      return updated;
    });
    
    // 추천 목록에서 해당 운동 제거
    setTodaysRecommendations(prev => 
      prev.filter(rec => rec.id !== exercise.id && rec.name !== exercise.name)
    );
    
    // 운동 추가 후 기록 탭으로 자동 전환
    setActiveTab('logger');
    
    // 백엔드 등록 결과 피드백 표시 (성공 시에만 알림, 실패는 조용히 처리)
    if (finalExerciseId && registerSuccess) {
      console.log('[WorkoutLogger] 운동 등록 성공:', registerMessage);
      // 성공 메시지는 조용히 처리 (사용자 경험 개선)
    } else if (finalExerciseId && registerMessage && !registerSuccess) {
      console.warn('[WorkoutLogger] 운동 등록 실패:', registerMessage);
      // 실패해도 로컬 저장은 완료되었으므로 조용히 처리
    }
  };

  const removeWorkout = async (id: string) => {
    const workout = todaysWorkouts.find(entry => entry.id === id);
    
    // 백엔드에서 운동 등록 해제 시도 (exerciseId가 있는 경우)
    let unregisterSuccess = false;
    let unregisterMessage = '';
    if (workout?.exercise.exerciseId) {
      try {
        const result = await WorkoutService.unregisterExercise(workout.exercise.exerciseId);
        if (result.success) {
          unregisterSuccess = true;
          unregisterMessage = result.data?.message || '운동이 등록 해제되었습니다.';
          console.log('[WorkoutLogger] 운동 등록 해제 성공:', workout.exercise.exerciseId, unregisterMessage);
        } else {
          unregisterMessage = result.error || '운동 등록 해제에 실패했습니다.';
          console.log('[WorkoutLogger] 운동 등록 해제 실패:', result.error);
        }
      } catch (error: any) {
        unregisterMessage = error?.message || '운동 등록 해제 중 오류가 발생했습니다.';
        console.error('[WorkoutLogger] 운동 등록 해제 예외 발생:', error?.message || error);
        // 백엔드 등록 해제 실패해도 로컬에서 제거
      }
    }
    
    // 로컬 상태에서 제거
    setTodaysWorkouts(prev => {
      const updated = prev.filter(entry => entry.id !== id);
      // 로컬 저장
      persistLocalWorkoutEntries(updated.filter(entry => entry.source === 'local'));
      return updated;
    });
    
    // 백엔드 등록 해제 결과 피드백 표시 (선택적)
    if (workout?.exercise.exerciseId && unregisterMessage && !unregisterSuccess) {
      Alert.alert('알림', `로컬에서만 제거되었습니다.\n${unregisterMessage}`, [{ text: '확인' }]);
    }
  };

  const updateWorkout = (id: string, field: keyof WorkoutEntry, value: any) => {
    setTodaysWorkouts(prev => {
      const updated = prev.map(entry =>
        entry.id === id ? { ...entry, [field]: value, source: 'local' as const } : entry
      );
      // 로컬 저장
      persistLocalWorkoutEntries(updated.filter(entry => entry.source === 'local'));
      return updated;
    });
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

  // 운동 기록 탭 활성화 시 운동 기록 새로고침
  useEffect(() => {
    if (activeTab === 'logger') {
      loadTodaysWorkouts();
    }
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {/* Header - Fixed at Top */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="activity" size={24} color="#6366f1" style={{ marginRight: 8 }} />
          <Text style={styles.title}>운동</Text>
        </View>
      </View>

      {/* Tabs - Fixed at Top */}
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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >

        {activeTab === 'recommendations' ? (
          <View style={styles.content}>
            {/* Workout Settings */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>운동 설정</Text>
              
              <Text style={styles.label}>오늘 컨디션</Text>
              <View style={styles.conditionButtons}>
                {[
                  { value: 'tired', label: '피곤', icon: 'moon' },
                  { value: 'normal', label: '보통', icon: 'smile' },
                  { value: 'good', label: '좋음', icon: 'zap' }
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
                    <Icon 
                      name={item.icon as any} 
                      size={20} 
                      color={condition === item.value ? '#ffffff' : '#64748b'} 
                      style={{ marginRight: 8 }}
                    />
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
                <View style={styles.cardTitleContainer}>
                  <Icon name="star" size={20} color="#6366f1" style={{ marginRight: 6 }} />
                  <Text style={styles.cardTitle}>오늘의 추천 운동</Text>
                </View>
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
                    <Icon name={part.icon as any} size={24} color={selectedBodyPart === part.id ? '#6366f1' : '#64748b'} />
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
              <View style={styles.cardHeaderWithRefresh}>
                <Text style={styles.cardTitle}>오늘의 운동 기록</Text>
                <TouchableOpacity 
                  onPress={loadTodaysWorkouts}
                  style={styles.refreshButton}
                >
                  <Text style={styles.refreshIcon}>🔄</Text>
                </TouchableOpacity>
              </View>
              {todaysWorkouts.length === 0 ? (
                <Text style={styles.emptyText}>운동을 추가해보세요!</Text>
              ) : (
                todaysWorkouts.map((entry, idx) => {
                  // 디버깅: UI 렌더링 시 실제 값 확인
                  if (idx === 0) {
                    console.log('[WorkoutLogger] UI 렌더링 - 첫 번째 항목:', {
                      name: entry.exercise.name,
                      sets: entry.sets,
                      reps: entry.reps,
                      weight: entry.weight,
                      source: entry.source,
                    });
                  }
                  
                  return (
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
                            value={entry.sets != null && entry.sets > 0 ? String(entry.sets) : ''}
                            placeholder="3"
                            placeholderTextColor="#9ca3af"
                            onChangeText={(text) => {
                              const value = text.trim() === '' ? 0 : parseInt(text) || 0;
                              updateWorkout(entry.id, 'sets', value);
                            }}
                          />
                        </View>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>횟수</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={entry.reps != null && entry.reps > 0 ? String(entry.reps) : ''}
                            placeholder="10"
                            placeholderTextColor="#9ca3af"
                            onChangeText={(text) => {
                              const value = text.trim() === '' ? 0 : parseInt(text) || 0;
                              updateWorkout(entry.id, 'reps', value);
                            }}
                          />
                        </View>
                        <View style={styles.workoutInput}>
                          <Text style={styles.inputLabel}>무게(kg)</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="decimal-pad"
                            value={entry.weight != null && entry.weight > 0 ? String(entry.weight) : ''}
                            placeholder="0"
                            placeholderTextColor="#9ca3af"
                            onChangeText={(text) => {
                              const value = text.trim() === '' ? 0 : parseFloat(text) || 0;
                              updateWorkout(entry.id, 'weight', value);
                            }}
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
                            value={entry.reps && entry.reps > 0 ? String(entry.reps) : ''}
                            placeholder="10"
                            placeholderTextColor="#9ca3af"
                            onChangeText={(text) => {
                              const value = text.trim() === '' ? 0 : parseInt(text) || 0;
                              updateWorkout(entry.id, 'reps', value);
                            }}
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
                      <View style={styles.cautionsTitleRow}>
                        <Icon name="alert-triangle" size={16} color="#f59e0b" />
                        <Text style={styles.cautionsTitle}>주의사항</Text>
                      </View>
                      {entry.exercise.cautions.map((caution, idx) => (
                        <Text key={idx} style={styles.cautionText}>• {caution}</Text>
                      ))}
                    </View>
                  </View>
                  );
                })
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
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
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
  tabs: {
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
    marginBottom: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
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
    gap: 12,
    marginBottom: 4,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.02 }],
  },
  conditionButtonText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  conditionButtonTextActive: {
    color: '#ffffff',
    fontWeight: '800',
    letterSpacing: 0.3,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cautionsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
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
