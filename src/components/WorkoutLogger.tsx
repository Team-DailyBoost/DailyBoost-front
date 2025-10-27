import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dumbbell, Clock, Flame, Plus, Trash2, Play, Target, AlertTriangle, RefreshCw, Pause, StopCircle, FileText } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  isCardio: boolean;
  calories: number;
  cautions: string[];
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface WorkoutEntry {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  weight: number;
  duration?: number; // For cardio
  memo: string;
  time: string;
}

export function WorkoutLogger() {
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutEntry[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [recommendationSeed, setRecommendationSeed] = useState(Date.now());
  const [workoutTime, setWorkoutTime] = useState<number>(30); // minutes
  const [condition, setCondition] = useState<'good' | 'normal' | 'tired'>('normal');
  
  // Stopwatch state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(0);

  // Exercise database with new properties
  const exerciseDatabase: Exercise[] = [
    // 가슴
    { id: 'pushup', name: '푸시업', bodyPart: 'chest', isCardio: false, calories: 7, cautions: ['손목 통증 주의', '허리가 꺾이지 않게', '팔꿈치를 너무 벌리지 말 것'], description: '가슴, 어깨, 삼두근 강화', difficulty: 'beginner' },
    { id: 'bench_press', name: '벤치프레스', bodyPart: 'chest', isCardio: false, calories: 8, cautions: ['보조자 필수', '어깨 부상 주의', '무게 조절 필수'], description: '가슴 전체 발달', difficulty: 'intermediate' },
    { id: 'dips', name: '딥스', bodyPart: 'chest', isCardio: false, calories: 7, cautions: ['어깨 부상 위험', '몸을 앞으로 기울일 것', '천천히 수행'], description: '가슴 하부 집중', difficulty: 'intermediate' },
    { id: 'chest_fly', name: '체스트 플라이', bodyPart: 'chest', isCardio: false, calories: 6, cautions: ['팔꿈치 과도한 신전 금지', '가벼운 무게로 시작', '스트레칭 느끼며 수행'], description: '가슴 내측 발달', difficulty: 'beginner' },
    { id: 'incline_pushup', name: '인클라인 푸시업', bodyPart: 'chest', isCardio: false, calories: 6, cautions: ['벤치 고정 확인', '가슴까지 내릴 것', '등 곧게 유지'], description: '가슴 상부 강화', difficulty: 'beginner' },
    { id: 'dumbbell_pullover', name: '덤벨 풀오버', bodyPart: 'chest', isCardio: false, calories: 7, cautions: ['팔을 너무 굽히지 말 것', '허리 주의', '가슴 스트레칭 집중'], description: '가슴과 등 동시 자극', difficulty: 'intermediate' },
    { id: 'pec_deck_fly', name: '팩덱 플라이', bodyPart: 'chest', isCardio: false, calories: 6, cautions: ['등받이 조절', '어깨 아래로', '천천히 수행'], description: '가슴 고립 운동', difficulty: 'beginner' },
    { id: 'chest_press_machine', name: '체스트프레스 머신', bodyPart: 'chest', isCardio: false, calories: 7, cautions: ['시트 높이 조절', '등 밀착', '그립 너비 주의'], description: '안전한 가슴 운동', difficulty: 'beginner' },
    { id: 'knee_pushup', name: '니 푸시업', bodyPart: 'chest', isCardio: false, calories: 5, cautions: ['무릎 보호 패드 사용', '상체는 정자세 유지', '점진적 강도 증가'], description: '초보자용 푸시업', difficulty: 'beginner' },

    // 등
    { id: 'pullup', name: '풀업', bodyPart: 'back', isCardio: false, calories: 9, cautions: ['어깨 부상 주의', '완전한 가동범위', '보조밴드 사용 권장'], description: '등 전체 강화', difficulty: 'advanced' },
    { id: 'lat_pulldown', name: '랫 풀다운', bodyPart: 'back', isCardio: false, calories: 7, cautions: ['허리 곧게', '가슴까지 당기기', '반동 사용 금지'], description: '광배근 발달', difficulty: 'beginner' },
    { id: 'bent_over_row', name: '벤트오버 로우', bodyPart: 'back', isCardio: false, calories: 8, cautions: ['허리 부상 주의', '코어 긴장 유지', '무게 조절'], description: '등 중부 강화', difficulty: 'intermediate' },
    { id: 'superman', name: '슈퍼맨', bodyPart: 'back', isCardio: false, calories: 5, cautions: ['목 과신전 주의', '천천히 수행', '매트 사용'], description: '척추기립근 강화', difficulty: 'beginner' },
    { id: 'deadlift', name: '데드리프트', bodyPart: 'back', isCardio: false, calories: 10, cautions: ['허리 부상 위험 높음', '자세가 최우선', '가벼운 무게부터'], description: '전신 근력 운동', difficulty: 'advanced' },
    { id: 'back_extension', name: '백 익스텐션', bodyPart: 'back', isCardio: false, calories: 6, cautions: ['과도한 신전 금지', '허리 통증 시 중단', '천천히 수행'], description: '허리 강화', difficulty: 'beginner' },
    { id: 'one_arm_dumbbell_row', name: '원암 덤벨 로우', bodyPart: 'back', isCardio: false, calories: 7, cautions: ['벤치에 한 손 지지', '허리 중립 유지', '팔꿈치를 몸쪽으로'], description: '등 편측 강화', difficulty: 'intermediate' },
    { id: 'tbar_row', name: '티바 로우', bodyPart: 'back', isCardio: false, calories: 8, cautions: ['무릎 살짝 구부림', '허리 곧게', '가슴으로 당기기'], description: '등 두께 증가', difficulty: 'intermediate' },
    { id: 'arm_pulldown', name: '암 풀다운', bodyPart: 'back', isCardio: false, calories: 6, cautions: ['팔 완전히 펴기', '광배근 수축 집중', '상체 고정'], description: '광배근 고립', difficulty: 'beginner' },
    { id: 'good_morning', name: '굿모닝', bodyPart: 'back', isCardio: false, calories: 7, cautions: ['허리 부상 주의', '가벼운 무게', '햄스트링 스트레칭'], description: '후면 사슬 강화', difficulty: 'intermediate' },

    // 어깨
    { id: 'shoulder_press', name: '숄더 프레스', bodyPart: 'shoulder', isCardio: false, calories: 7, cautions: ['목 긴장 주의', '허리 과신전 금지', '팔꿈치 각도'], description: '어깨 전체 발달', difficulty: 'beginner' },
    { id: 'lateral_raise', name: '래터럴 레이즈', bodyPart: 'shoulder', isCardio: false, calories: 6, cautions: ['가벼운 무게', '어깨 으쓱이지 말 것', '천천히 내리기'], description: '측면 삼각근', difficulty: 'beginner' },
    { id: 'front_raise', name: '프론트 레이즈', bodyPart: 'shoulder', isCardio: false, calories: 6, cautions: ['반동 사용 금지', '어깨 높이까지', '목 긴장 주의'], description: '전면 삼각근', difficulty: 'beginner' },
    { id: 'rear_delt_fly', name: '리어 델트 플라이', bodyPart: 'shoulder', isCardio: false, calories: 6, cautions: ['등 곧게', '팔꿈치 살짝 굽힘', '자세 교정 효과'], description: '후면 삼각근', difficulty: 'beginner' },
    { id: 'pike_pushup', name: '파이크 푸시업', bodyPart: 'shoulder', isCardio: false, calories: 7, cautions: ['손목 부담', '머리 보호', '점진적 강도 증가'], description: '맨몸 어깨 운동', difficulty: 'intermediate' },
    { id: 'overhead_press', name: '오버헤드 프레스', bodyPart: 'shoulder', isCardio: false, calories: 8, cautions: ['허리 보호', '코어 긴장', '완전한 가동범위'], description: '어깨 전체 강화', difficulty: 'intermediate' },
    { id: 'face_pull', name: '페이스 풀', bodyPart: 'shoulder', isCardio: false, calories: 5, cautions: ['얼굴 쪽으로 당기기', '어깨 후면 집중', '가벼운 무게'], description: '자세 교정', difficulty: 'beginner' },
    { id: 'barbell_shrug', name: '바벨 슈러그', bodyPart: 'shoulder', isCardio: false, calories: 6, cautions: ['목 긴장 주의', '승모근만 사용', '어깨 회전 금지'], description: '승모근 발달', difficulty: 'beginner' },
    { id: 'barbell_upright_row', name: '바벨 업라이트 로우', bodyPart: 'shoulder', isCardio: false, calories: 7, cautions: ['어깨 충돌 주의', '팔꿈치 높이 주의', '좁은 그립 피하기'], description: '측면 삼각근 강화', difficulty: 'intermediate' },
    { id: 'reverse_cable_fly', name: '리버스 케이블 플라이', bodyPart: 'shoulder', isCardio: false, calories: 6, cautions: ['팔 고정', '후면 삼각근 집중', '천천히 수행'], description: '후면 어깨 고립', difficulty: 'beginner' },

    // 하체
    { id: 'squat', name: '스쿼트', bodyPart: 'legs', isCardio: false, calories: 8, cautions: ['무릎 방향 주의', '허리 곧게', '깊이 조절'], description: '하체 기본 운동', difficulty: 'beginner' },
    { id: 'lunge', name: '런지', bodyPart: 'legs', isCardio: false, calories: 7, cautions: ['무릎이 발끝 넘지 않게', '균형 유지', '양쪽 균등하게'], description: '다리 균형 발달', difficulty: 'beginner' },
    { id: 'calf_raise', name: '카프 레이즈', bodyPart: 'legs', isCardio: false, calories: 5, cautions: ['발목 부상 주의', '완전한 가동범위', '천천히 수행'], description: '종아리 강화', difficulty: 'beginner' },
    { id: 'wall_sit', name: '월 싯', bodyPart: 'legs', isCardio: false, calories: 6, cautions: ['무릎 90도 유지', '허리 밀착', '호흡 유지'], description: '허벅지 지구력', difficulty: 'beginner' },
    { id: 'bulgarian_split_squat', name: '불가리안 스플릿 스쿼트', bodyPart: 'legs', isCardio: false, calories: 8, cautions: ['균형 잡기', '앞무릎 각도', '뒷다리 스트레칭'], description: '단측 하체 강화', difficulty: 'intermediate' },
    { id: 'leg_curl', name: '레그 컬', bodyPart: 'legs', isCardio: false, calories: 6, cautions: ['햄스트링 경련 주의', '발목 고정', '천천히 내리기'], description: '햄스트링 강화', difficulty: 'beginner' },
    { id: 'leg_extension', name: '레그 익스텐션', bodyPart: 'legs', isCardio: false, calories: 6, cautions: ['무릎 부담 주의', '완전 신전 주의', '조절된 동작'], description: '대퇴사두근 고립', difficulty: 'beginner' },
    { id: 'stiff_leg_deadlift', name: '바벨 스티프 레그 데드리프트', bodyPart: 'legs', isCardio: false, calories: 9, cautions: ['허리 부상 위험', '햄스트링 스트레칭', '무릎 살짝만 구부림'], description: '후면 사슬 강화', difficulty: 'advanced' },
    { id: 'hack_squat', name: '핵 스쿼트', bodyPart: 'legs', isCardio: false, calories: 8, cautions: ['기계 조절', '허리 밀착', '무릎 각도'], description: '하체 머신 운동', difficulty: 'intermediate' },
    { id: 'calf_raise_machine', name: '카프 레이즈', bodyPart: 'legs', isCardio: false, calories: 5, cautions: ['발목 각도', '완전한 수축', '천천히'], description: '종아리 발달', difficulty: 'beginner' },
    { id: 'hip_adduction', name: '힙 어덕션', bodyPart: 'legs', isCardio: false, calories: 5, cautions: ['내전근 경련 주의', '천천히 수행', '과도한 무게 금지'], description: '내전근 강화', difficulty: 'beginner' },
    { id: 'hip_abduction', name: '힙 어브덕션', bodyPart: 'legs', isCardio: false, calories: 5, cautions: ['골반 안정성', '중둔근 집중', '천천히'], description: '중둔근 강화', difficulty: 'beginner' },
    { id: 'barbell_hip_thrust', name: '바벨 힙 쓰러스트', bodyPart: 'legs', isCardio: false, calories: 8, cautions: ['허리 과신전 주의', '둔근 수축 집중', '바 패드 사용'], description: '둔근 강화', difficulty: 'intermediate' },

    // 이두
    { id: 'bicep_curl', name: '바이셉 컬', bodyPart: 'biceps', isCardio: false, calories: 5, cautions: ['팔꿈치 고정', '반동 사용 금지', '천천히 내리기'], description: '이두근 기본', difficulty: 'beginner' },
    { id: 'hammer_curl', name: '해머 컬', bodyPart: 'biceps', isCardio: false, calories: 5, cautions: ['중립 그립 유지', '팔꿈치 고정', '전완근도 자극'], description: '이두근 두께', difficulty: 'beginner' },
    { id: 'concentration_curl', name: '컨센트레이션 컬', bodyPart: 'biceps', isCardio: false, calories: 5, cautions: ['팔꿈치 허벅지 고정', '집중력 유지', '피크 수축'], description: '이두근 피크', difficulty: 'intermediate' },
    { id: 'chinup', name: '친업', bodyPart: 'biceps', isCardio: false, calories: 8, cautions: ['어깨 부상 주의', '이두근 집중', '천천히 내려오기'], description: '이두 복합 운동', difficulty: 'advanced' },
    { id: 'reverse_curl', name: '리버스 컬', bodyPart: 'biceps', isCardio: false, calories: 5, cautions: ['손목 부담', '전완근 집중', '가벼운 무게'], description: '전완근 강화', difficulty: 'beginner' },

    // 삼두
    { id: 'tricep_dips', name: '트라이셉 딥스', bodyPart: 'triceps', isCardio: false, calories: 7, cautions: ['어깨 부상 주의', '팔꿈치 각도', '천천히 내려가기'], description: '삼두근 기본', difficulty: 'beginner' },
    { id: 'overhead_extension', name: '오버헤드 익스텐션', bodyPart: 'triceps', isCardio: false, calories: 6, cautions: ['팔꿈치 고정', '목 긴장 주의', '머리 뒤로'], description: '삼두근 장두', difficulty: 'intermediate' },
    { id: 'close_grip_pushup', name: '클로즈 그립 푸시업', bodyPart: 'triceps', isCardio: false, calories: 6, cautions: ['손목 부담', '팔꿈치 몸쪽', '천천히'], description: '맨몸 삼두 운동', difficulty: 'intermediate' },
    { id: 'tricep_kickback', name: '트라이셉 킥백', bodyPart: 'triceps', isCardio: false, calories: 5, cautions: ['팔꿈치 고정', '상체 안정', '수축 느끼기'], description: '삼두근 분리', difficulty: 'beginner' },
    { id: 'diamond_pushup', name: '다이아몬드 푸시업', bodyPart: 'triceps', isCardio: false, calories: 7, cautions: ['손목 보호', '팔꿈치 각도', '천천히'], description: '고강도 삼두', difficulty: 'advanced' },
    { id: 'close_grip_bench', name: '클로즈그립 벤치프레스', bodyPart: 'triceps', isCardio: false, calories: 8, cautions: ['어깨 너비보다 좁게', '팔꿈치 몸쪽', '보조자 필요'], description: '삼두근 파워', difficulty: 'intermediate' },

    // 유산소
    { id: 'running', name: '러닝', bodyPart: 'cardio', isCardio: true, calories: 10, cautions: ['무릎 충격 주의', '적절한 신발 착용', '스트레칭 필수'], description: '기본 유산소', difficulty: 'beginner' },
    { id: 'hiit', name: 'HIIT', bodyPart: 'cardio', isCardio: true, calories: 15, cautions: ['심박수 모니터링', '충분한 휴식', '초보자 주의'], description: '고강도 인터벌', difficulty: 'advanced' },
    { id: 'jumping_jack', name: '점핑 잭', bodyPart: 'cardio', isCardio: true, calories: 8, cautions: ['무릎 충격 주의', '착지 시 충격 흡수', '리듬 유지'], description: '전신 유산소', difficulty: 'beginner' },
    { id: 'mountain_climbers', name: '마운틴 클라이머', bodyPart: 'cardio', isCardio: true, calories: 10, cautions: ['손목 부담', '코어 긴장', '등 일직선'], description: '코어+유산소', difficulty: 'intermediate' },
    { id: 'burpees', name: '버피', bodyPart: 'cardio', isCardio: true, calories: 12, cautions: ['관절 부담', '심박수 급상승 주의', '충분한 워밍업'], description: '최고 강도 운동', difficulty: 'advanced' },
    { id: 'elliptical', name: '엘립티컬 머신', bodyPart: 'cardio', isCardio: true, calories: 8, cautions: ['자세 바르게', '저항 조절', '무릎 부담 적음'], description: '저충격 유산소', difficulty: 'beginner' },
    { id: 'step_mill', name: '스텝밀', bodyPart: 'cardio', isCardio: true, calories: 9, cautions: ['난간 잡지 말 것', '자세 유지', '속도 조절'], description: '계단 오르기', difficulty: 'intermediate' },
  ];

  // Get today's recommended workouts (5 exercises based on day)
  const getTodaysRecommendations = (): Exercise[] => {
    const day = new Date().getDay();
    const recommendations: Record<number, string[]> = {
      0: ['pushup', 'squat', 'pullup', 'shoulder_press', 'running'], // 일요일
      1: ['bench_press', 'squat', 'lat_pulldown', 'bicep_curl', 'hiit'], // 월요일
      2: ['deadlift', 'lunge', 'shoulder_press', 'tricep_dips', 'elliptical'], // 화요일
      3: ['pushup', 'bulgarian_split_squat', 'bent_over_row', 'lateral_raise', 'jumping_jack'], // 수요일
      4: ['dips', 'leg_extension', 'chinup', 'overhead_extension', 'step_mill'], // 목요일
      5: ['chest_fly', 'wall_sit', 'pullup', 'hammer_curl', 'burpees'], // 금요일
      6: ['incline_pushup', 'calf_raise', 'superman', 'front_raise', 'mountain_climbers'], // 토요일
    };

    const todayIds = recommendations[day] || recommendations[0];
    return todayIds.map(id => exerciseDatabase.find(e => e.id === id)!).filter(Boolean);
  };

  // Get recommendations by body part (5 random)
  const getBodyPartRecommendations = (bodyPart: string): Exercise[] => {
    const filtered = exerciseDatabase.filter(e => e.bodyPart === bodyPart);
    const shuffled = [...filtered].sort(() => Math.sin(recommendationSeed + filtered.length) - 0.5);
    return shuffled.slice(0, 5);
  };

  const bodyParts = [
    { id: 'chest', name: '가슴', icon: '💪' },
    { id: 'back', name: '등', icon: '🏋️' },
    { id: 'shoulder', name: '어깨', icon: '🤲' },
    { id: 'legs', name: '하체', icon: '🦵' },
    { id: 'biceps', name: '이두', icon: '💪' },
    { id: 'triceps', name: '삼두', icon: '🔥' },
    { id: 'cardio', name: '유산소', icon: '❤️' },
  ];

  const addWorkout = (exercise: Exercise) => {
    // Check for duplicates
    const exists = todaysWorkouts.some(w => w.exercise.id === exercise.id);
    if (exists) {
      toast.error('이미 추가된 운동입니다!');
      return;
    }

    const suggestedSets = getSuggestedSets();
    const suggestedReps = getSuggestedReps(exercise.difficulty);

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
    toast.success(`${exercise.name}이(가) 추가되었습니다!`);
  };

  const removeWorkout = (id: string) => {
    setTodaysWorkouts(prev => prev.filter(entry => entry.id !== id));
    toast.success('운동이 삭제되었습니다');
  };

  const updateWorkout = (id: string, field: keyof WorkoutEntry, value: any) => {
    setTodaysWorkouts(prev =>
      prev.map(entry =>
        entry.id === id ? { ...entry, [field]: value } : entry
      )
    );
  };

  const getSuggestedSets = (): number => {
    if (condition === 'tired') return 2;
    if (condition === 'normal') return 3;
    return 4;
  };

  const getSuggestedReps = (difficulty: string): number => {
    if (difficulty === 'beginner') return 12;
    if (difficulty === 'intermediate') return 10;
    return 8;
  };

  const refreshRecommendations = () => {
    setRecommendationSeed(Date.now());
    toast.success('새로운 운동을 추천했습니다!');
  };

  const totalCalories = todaysWorkouts.reduce((sum, entry) => {
    if (entry.exercise.isCardio && entry.duration) {
      return sum + (entry.exercise.calories * entry.duration);
    }
    return sum + (entry.exercise.calories * entry.sets);
  }, 0);

  const totalWorkouts = todaysWorkouts.length;

  // Stopwatch functionality
  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (targetSeconds > 0 && prev >= targetSeconds) {
            setTimerRunning(false);
            toast.success('운동 시간이 종료되었습니다!');
            return targetSeconds;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, targetSeconds]);

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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const todaysRecommendations = getTodaysRecommendations();
  const bodyPartRecommendations = selectedBodyPart ? getBodyPartRecommendations(selectedBodyPart) : [];

  const ExerciseCard = ({ exercise }: { exercise: Exercise }) => (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium">{exercise.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{exercise.description}</p>
            </div>
            <Badge variant={exercise.difficulty === 'beginner' ? 'secondary' : 
                          exercise.difficulty === 'intermediate' ? 'default' : 'destructive'}
                   className="ml-2">
              {exercise.difficulty === 'beginner' ? '초급' :
               exercise.difficulty === 'intermediate' ? '중급' : '고급'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>{exercise.calories}kcal {exercise.isCardio ? '/분' : '/세트'}</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">주의사항</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              {exercise.cautions.map((caution, idx) => (
                <li key={idx}>• {caution}</li>
              ))}
            </ul>
          </div>

          <Button 
            size="sm" 
            className="w-full"
            onClick={() => addWorkout(exercise)}
          >
            <Plus className="h-4 w-4 mr-1" />
            추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold">운동 💪</h1>
        <p className="text-muted-foreground">오늘의 운동을 기록하세요</p>
      </div>

      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommendations">운동 추천</TabsTrigger>
          <TabsTrigger value="logger">운동 기록</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {/* Workout Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                운동 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">운동 시간 (분)</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(time => (
                    <Button
                      key={time}
                      variant={workoutTime === time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setWorkoutTime(time)}
                      className="flex-1"
                    >
                      {time}분
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">오늘 컨디션</label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={condition === 'tired' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCondition('tired')}
                  >
                    피곤😴
                  </Button>
                  <Button
                    variant={condition === 'normal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCondition('normal')}
                  >
                    보통😊
                  </Button>
                  <Button
                    variant={condition === 'good' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCondition('good')}
                  >
                    좋음💪
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                추천 세트: {getSuggestedSets()}세트 | 초급 운동: {getSuggestedReps('beginner')}회
              </div>
            </CardContent>
          </Card>

          {/* Today's Recommendations (5 exercises) */}
          <Card className="border-2 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  오늘의 추천 운동 ⭐
                </CardTitle>
                <Badge variant="secondary">{todaysRecommendations.length}개</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {todaysRecommendations.map((exercise, idx) => (
                    <div key={exercise.id} className="relative">
                      <div className="absolute -left-2 top-4 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm z-10">
                        {idx + 1}
                      </div>
                      <div className="pl-8">
                        <ExerciseCard exercise={exercise} />
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Body Part Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  부위별 운동
                </CardTitle>
                {selectedBodyPart && (
                  <Button variant="outline" size="sm" onClick={refreshRecommendations}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    새로고침
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {bodyParts.map(part => (
                  <Button
                    key={part.id}
                    variant={selectedBodyPart === part.id ? 'default' : 'outline'}
                    className="h-16 flex flex-col gap-1 text-xs"
                    onClick={() => setSelectedBodyPart(part.id)}
                  >
                    <span className="text-lg">{part.icon}</span>
                    {part.name}
                  </Button>
                ))}
              </div>

              {selectedBodyPart && (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {bodyPartRecommendations.map((exercise, idx) => (
                      <div key={`${exercise.id}-${recommendationSeed}`} className="relative">
                        <div className="absolute -left-2 top-4 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold text-sm z-10">
                          {idx + 1}
                        </div>
                        <div className="pl-8">
                          <ExerciseCard exercise={exercise} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logger" className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">{totalWorkouts}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Dumbbell className="h-4 w-4" />
                  운동 개수
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-destructive">{Math.round(totalCalories)}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Flame className="h-4 w-4" />
                  소모 칼로리
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stopwatch */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                스톱워치
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold font-mono">
                  {formatTime(timerSeconds)}
                </div>
                {targetSeconds > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    목표: {formatTime(targetSeconds)}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={startTimer}
                  disabled={timerRunning}
                  className="flex-1"
                  variant="default"
                >
                  <Play className="h-4 w-4 mr-1" />
                  시작
                </Button>
                <Button
                  onClick={pauseTimer}
                  disabled={!timerRunning}
                  className="flex-1"
                  variant="secondary"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  멈춤
                </Button>
                <Button
                  onClick={stopTimer}
                  className="flex-1"
                  variant="destructive"
                >
                  <StopCircle className="h-4 w-4 mr-1" />
                  종료
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workout List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>오늘의 운동 기록</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {todaysWorkouts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>운동을 추가해보세요!</p>
                    </div>
                  ) : (
                    todaysWorkouts.map(entry => (
                      <Card key={entry.id} className="border-2">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{entry.exercise.name}</h4>
                              <p className="text-xs text-muted-foreground">{entry.time}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeWorkout(entry.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          {!entry.exercise.isCardio ? (
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">세트</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.sets}
                                  onChange={(e) => updateWorkout(entry.id, 'sets', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">횟수</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.reps}
                                  onChange={(e) => updateWorkout(entry.id, 'reps', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">무게(kg)</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={entry.weight}
                                  onChange={(e) => updateWorkout(entry.id, 'weight', parseFloat(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">시간(분)</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.duration || 0}
                                  onChange={(e) => updateWorkout(entry.id, 'duration', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">횟수</label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={entry.reps}
                                  onChange={(e) => updateWorkout(entry.id, 'reps', parseInt(e.target.value) || 0)}
                                  className="h-8"
                                />
                              </div>
                            </div>
                          )}

                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              메모
                            </label>
                            <Textarea
                              placeholder="운동 메모를 남겨보세요..."
                              value={entry.memo}
                              onChange={(e) => updateWorkout(entry.id, 'memo', e.target.value)}
                              className="h-16 text-sm"
                            />
                          </div>

                          <div className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                            <div className="flex items-center gap-1 mb-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span className="font-medium">주의사항</span>
                            </div>
                            <ul className="space-y-0.5">
                              {entry.exercise.cautions.map((caution, idx) => (
                                <li key={idx}>• {caution}</li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
