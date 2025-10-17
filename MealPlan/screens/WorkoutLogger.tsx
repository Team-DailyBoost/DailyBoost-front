import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Alert,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { StorageKeys } from '../utils/storage';
import type { Exercise, WorkoutEntry, RecommendedExercise } from '../types';

export function WorkoutLogger() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'recommended'>('tracking');
  const [workoutEntries, setWorkoutEntries] = useAsyncStorage<WorkoutEntry[]>(
    StorageKeys.WORKOUT_ENTRIES,
    []
  );
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState('chest');

  // 운동 데이터베이스
  const exercises: Exercise[] = [
    {
      id: 'running',
      name: '러닝',
      category: 'cardio',
      caloriesPerMinute: 10,
      description: '유산소 운동',
    },
    {
      id: 'walking',
      name: '걷기',
      category: 'cardio',
      caloriesPerMinute: 4,
      description: '가벼운 유산소',
    },
    {
      id: 'cycling',
      name: '자전거',
      category: 'cardio',
      caloriesPerMinute: 8,
      description: '유산소 운동',
    },
    {
      id: 'pushup',
      name: '푸시업',
      category: 'strength',
      caloriesPerMinute: 7,
      description: '가슴, 어깨, 삼두근',
    },
    {
      id: 'squat',
      name: '스쿼트',
      category: 'strength',
      caloriesPerMinute: 6,
      description: '하체 근력',
    },
    {
      id: 'pullup',
      name: '풀업',
      category: 'strength',
      caloriesPerMinute: 8,
      description: '등, 이두근',
    },
    {
      id: 'plank',
      name: '플랭크',
      category: 'strength',
      caloriesPerMinute: 5,
      description: '코어 강화',
    },
    {
      id: 'yoga',
      name: '요가',
      category: 'flexibility',
      caloriesPerMinute: 3,
      description: '유연성, 균형',
    },
  ];

  // 부위별 운동 추천
  const workoutRecommendations: Record<string, RecommendedExercise[]> = {
    chest: [
      {
        id: 'pushup',
        name: '푸시업',
        targetMuscle: '가슴',
        description: '가슴, 어깨, 삼두근을 동시에 강화하는 기본 운동',
        difficulty: 'beginner',
        youtubeUrl: 'https://youtube.com/watch?v=IODxDxX7oi4',
        tips: ['무릎을 바닥에 대고 시작', '팔꿈치를 몸에 붙여서', '천천히 내려가기'],
      },
      {
        id: 'bench_press',
        name: '벤치프레스',
        targetMuscle: '가슴',
        description: '가슴 근육 발달에 가장 효과적인 운동',
        difficulty: 'intermediate',
        youtubeUrl: 'https://youtube.com/watch?v=rT7DgCr-3pg',
        tips: ['어깨날개 모으기', '가슴까지 완전히 내리기', '안전을 위해 보조자 필요'],
      },
    ],
    back: [
      {
        id: 'pullup',
        name: '풀업',
        targetMuscle: '등',
        description: '등 전체를 자극하는 복합 운동',
        difficulty: 'intermediate',
        youtubeUrl: 'https://youtube.com/watch?v=eGo4IYlbE5g',
        tips: ['어깨를 아래로', '가슴을 바에 붙이기', '천천히 내려오기'],
      },
      {
        id: 'deadlift',
        name: '데드리프트',
        targetMuscle: '등, 하체',
        description: '전신 근력 강화',
        difficulty: 'advanced',
        youtubeUrl: 'https://youtube.com/watch?v=XxWcirHIwVo',
        tips: ['허리를 곧게', '무릎은 살짝 굽히기', '바를 몸에 붙여서'],
      },
    ],
    legs: [
      {
        id: 'squat',
        name: '스쿼트',
        targetMuscle: '하체',
        description: '하체 전체를 강화하는 기본 운동',
        difficulty: 'beginner',
        youtubeUrl: 'https://youtube.com/watch?v=ultWZbUMPL8',
        tips: ['무릎이 발끝을 넘지 않게', '엉덩이를 뒤로', '허리는 곧게'],
      },
    ],
    cardio: [
      {
        id: 'running',
        name: '러닝',
        targetMuscle: '유산소',
        description: '심폐지구력 향상',
        difficulty: 'beginner',
        youtubeUrl: 'https://youtube.com/watch?v=brFHyOtTwH',
        tips: ['천천히 시작', '호흡 조절', '적절한 신발 착용'],
      },
    ],
  };

  // 오늘 소모한 칼로리 계산
  const totalCaloriesBurned = workoutEntries.reduce(
    (sum, entry) => sum + entry.exercise.caloriesPerMinute * entry.duration,
    0
  );

  const totalDuration = workoutEntries.reduce(
    (sum, entry) => sum + entry.duration,
    0
  );

  // 운동 추가
  const addWorkout = async (exercise: Exercise, duration: number) => {
    const newEntry: WorkoutEntry = {
      id: Date.now().toString(),
      exercise,
      duration,
      time: new Date().toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    await setWorkoutEntries([...workoutEntries, newEntry]);
    setAddModalVisible(false);
  };

  // 운동 삭제
  const removeWorkout = async (id: string) => {
    Alert.alert('삭제 확인', '이 운동 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          await setWorkoutEntries(workoutEntries.filter((entry) => entry.id !== id));
        },
      },
    ]);
  };

  // 유튜브 링크 열기
  const openYouTube = (url: string) => {
    Linking.openURL(url).catch((err) => {
      Alert.alert('오류', '링크를 열 수 없습니다.');
    });
  };

  // 부위 목록
  const bodyParts = [
    { id: 'chest', name: '가슴', icon: 'zap' },
    { id: 'back', name: '등', icon: 'shield' },
    { id: 'legs', name: '하체', icon: 'trending-up' },
    { id: 'cardio', name: '유산소', icon: 'activity' },
  ];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>운동 기록</Text>
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
            오늘의 운동
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
            운동 추천
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'tracking' && (
          <>
            {/* 통계 */}
            <Card style={styles.card}>
              <CardTitle>오늘의 운동 통계</CardTitle>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Icon name="clock" size={24} color="#3b82f6" />
                  <Text style={styles.statValue}>{totalDuration}</Text>
                  <Text style={styles.statLabel}>분</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="zap" size={24} color="#ef4444" />
                  <Text style={styles.statValue}>{Math.round(totalCaloriesBurned)}</Text>
                  <Text style={styles.statLabel}>kcal</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="activity" size={24} color="#10b981" />
                  <Text style={styles.statValue}>{workoutEntries.length}</Text>
                  <Text style={styles.statLabel}>종목</Text>
                </View>
              </View>
            </Card>

            {/* 운동 기록 목록 */}
            <Card style={[styles.card, styles.lastCard]}>
              <CardTitle>운동 기록</CardTitle>
              {workoutEntries.length === 0 ? (
                <Text style={styles.emptyText}>아직 기록된 운동이 없습니다.</Text>
              ) : (
                workoutEntries.map((entry) => (
                  <View key={entry.id} style={styles.workoutEntry}>
                    <View style={styles.workoutInfo}>
                      <Text style={styles.workoutName}>{entry.exercise.name}</Text>
                      <Text style={styles.workoutDetails}>
                        {entry.duration}분 |{' '}
                        {Math.round(entry.exercise.caloriesPerMinute * entry.duration)}
                        kcal
                      </Text>
                      <Text style={styles.workoutTime}>{entry.time}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeWorkout(entry.id)}>
                      <Icon name="trash-2" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </Card>
          </>
        )}

        {activeTab === 'recommended' && (
          <>
            {/* 부위 선택 */}
            <View style={styles.bodyPartsContainer}>
              {bodyParts.map((part) => (
                <TouchableOpacity
                  key={part.id}
                  style={[
                    styles.bodyPartButton,
                    selectedBodyPart === part.id && styles.bodyPartButtonActive,
                  ]}
                  onPress={() => setSelectedBodyPart(part.id)}
                >
                  <Icon
                    name={part.icon}
                    size={24}
                    color={selectedBodyPart === part.id ? '#fff' : '#6366f1'}
                  />
                  <Text
                    style={[
                      styles.bodyPartText,
                      selectedBodyPart === part.id && styles.bodyPartTextActive,
                    ]}
                  >
                    {part.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 운동 추천 목록 */}
            {workoutRecommendations[selectedBodyPart]?.map((workout) => (
              <Card key={workout.id} style={styles.card}>
                <View style={styles.recommendedHeader}>
                  <Text style={styles.recommendedName}>{workout.name}</Text>
                  <Badge
                    variant={
                      workout.difficulty === 'beginner'
                        ? 'secondary'
                        : workout.difficulty === 'intermediate'
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {workout.difficulty === 'beginner'
                      ? '초급'
                      : workout.difficulty === 'intermediate'
                      ? '중급'
                      : '고급'}
                  </Badge>
                </View>
                <Text style={styles.recommendedDescription}>
                  {workout.description}
                </Text>
                <View style={styles.tipsContainer}>
                  <Text style={styles.tipsTitle}>팁:</Text>
                  {workout.tips.map((tip, index) => (
                    <Text key={index} style={styles.tipText}>
                      • {tip}
                    </Text>
                  ))}
                </View>
                <Button
                  variant="outline"
                  onPress={() => openYouTube(workout.youtubeUrl)}
                  style={styles.youtubeButton}
                >
                  <Icon name="play" size={16} color="#6366f1" /> 자세 설명 보기
                </Button>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      {/* 운동 추가 모달 */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>운동 추가</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Icon name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItem}
                  onPress={() => {
                    Alert.prompt(
                      '운동 시간',
                      '몇 분 운동하셨나요?',
                      [
                        { text: '취소', style: 'cancel' },
                        {
                          text: '추가',
                          onPress: (duration) => {
                            const durationNum = parseInt(duration || '0');
                            if (durationNum > 0) {
                              addWorkout(item, durationNum);
                            }
                          },
                        },
                      ],
                      'plain-text',
                      '',
                      'numeric'
                    );
                  }}
                >
                  <View>
                    <Text style={styles.exerciseName}>{item.name}</Text>
                    <Text style={styles.exerciseDetails}>
                      {item.description} | {item.caloriesPerMinute}kcal/분
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
    marginHorizontal: 16,
    marginTop: 16,
  },
  lastCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    paddingVertical: 20,
  },
  workoutEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  workoutDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  workoutTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  bodyPartsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    marginTop: 8,
  },
  bodyPartButton: {
    width: '50%',
    padding: 8,
  },
  bodyPartButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  bodyPartButtonActive: {
    backgroundColor: '#6366f1',
  },
  bodyPartText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  bodyPartTextActive: {
    color: '#fff',
  },
  recommendedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendedName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  recommendedDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  tipsContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    height: '70%',
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
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  exerciseDetails: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
});
