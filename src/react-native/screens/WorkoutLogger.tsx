import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

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
  duration?: number;
  memo: string;
  time: string;
}

export function WorkoutLogger() {
  const [todaysWorkouts, setTodaysWorkouts] = useState<WorkoutEntry[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>('');
  const [recommendationSeed, setRecommendationSeed] = useState(Date.now());
  const [workoutTime, setWorkoutTime] = useState<number>(30);
  const [condition, setCondition] = useState<'good' | 'normal' | 'tired'>('normal');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'logger'>('recommendations');
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(0);

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

  const getTodaysRecommendations = (): Exercise[] => {
    const day = new Date().getDay();
    const recommendations: Record<number, string[]> = {
      0: ['pushup', 'squat', 'pullup', 'shoulder_press', 'running'],
      1: ['bench_press', 'squat', 'lat_pulldown', 'running'],
      2: ['pushup', 'lunge', 'shoulder_press', 'hiit'],
      3: ['dips', 'squat', 'pullup', 'running'],
      4: ['pushup', 'lunge', 'lat_pulldown', 'hiit'],
      5: ['bench_press', 'squat', 'shoulder_press', 'running'],
      6: ['pushup', 'lunge', 'pullup', 'hiit'],
    };

    const todayIds = recommendations[day] || recommendations[0];
    return todayIds.map(id => exerciseDatabase.find(e => e.id === id)!).filter(Boolean);
  };

  const getBodyPartRecommendations = (bodyPart: string): Exercise[] => {
    const filtered = exerciseDatabase.filter(e => e.bodyPart === bodyPart);
    return filtered.slice(0, 5);
  };

  const addWorkout = (exercise: Exercise) => {
    const exists = todaysWorkouts.some(w => w.exercise.id === exercise.id);
    if (exists) {
      alert('이미 추가된 운동입니다!');
      return;
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
          if (targetSeconds > 0 && prev >= targetSeconds) {
            setTimerRunning(false);
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

  const todaysRecommendations = getTodaysRecommendations();
  const bodyPartRecommendations = selectedBodyPart ? getBodyPartRecommendations(selectedBodyPart) : [];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
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
                    onPress={() => setCondition(item.value as any)}
                  >
                    <Text style={styles.conditionButtonText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Today's Recommendations */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>오늘의 추천 운동 ⭐</Text>
              {todaysRecommendations.map((exercise, idx) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={styles.exerciseNumber}>
                    <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDesc}>{exercise.description}</Text>
                    <Text style={styles.exerciseCalories}>
                      🔥 {exercise.calories}kcal {exercise.isCardio ? '/분' : '/세트'}
                    </Text>
                    <Button title="추가" onPress={() => addWorkout(exercise)} />
                  </View>
                </View>
              ))}
            </Card>

            {/* Body Part Selection */}
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>부위별 운동</Text>
              <View style={styles.bodyParts}>
                {bodyParts.map(part => (
                  <TouchableOpacity
                    key={part.id}
                    style={[styles.bodyPart, selectedBodyPart === part.id && styles.bodyPartActive]}
                    onPress={() => setSelectedBodyPart(part.id)}
                  >
                    <Text style={styles.bodyPartIcon}>{part.icon}</Text>
                    <Text style={styles.bodyPartText}>{part.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedBodyPart && bodyPartRecommendations.map((exercise, idx) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  <View style={[styles.exerciseNumber, styles.exerciseNumberSecondary]}>
                    <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    <Text style={styles.exerciseDesc}>{exercise.description}</Text>
                    <Button title="추가" onPress={() => addWorkout(exercise)} />
                  </View>
                </View>
              ))}
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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  timeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
  conditionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  conditionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  conditionButtonText: {
    fontSize: 14,
  },
  exerciseCard: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberSecondary: {
    backgroundColor: '#666',
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
  exerciseDesc: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
});
