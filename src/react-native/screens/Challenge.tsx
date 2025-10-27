import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';

interface UserProgress {
  userId: string;
  exp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lastReset: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  participants: number;
  reward: string;
  progress: number;
  isJoined: boolean;
  type: 'weekly' | 'monthly' | 'daily' | 'competition' | 'exercise';
  exp?: number;
  exerciseType?: string;
  sets?: number;
  reps?: number;
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 3000,
  platinum: 6000,
  diamond: 10000,
};

const TIER_NAMES = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
  diamond: '다이아',
};

export function Challenge() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'tier' | 'challenges'>('weekly');
  const [tierTab, setTierTab] = useState<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'>('diamond');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [customChallenge, setCustomChallenge] = useState({
    exerciseType: '',
    sets: 3,
    reps: 10,
  });

  const currentUser = { email: 'user@example.com', name: '사용자' };
  const userId = currentUser.email;

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      const saved = await AsyncStorage.getItem(`userProgress_${userId}`);
      if (saved) {
        setUserProgress(JSON.parse(saved));
      } else {
        const initial: UserProgress = {
          userId,
          exp: 0,
          tier: 'bronze',
          lastReset: new Date().toISOString(),
        };
        setUserProgress(initial);
        await AsyncStorage.setItem(`userProgress_${userId}`, JSON.stringify(initial));
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const addExp = async (amount: number) => {
    if (!userProgress) return;

    const newExp = userProgress.exp + amount;
    let newTier = userProgress.tier;

    if (newExp >= TIER_THRESHOLDS.diamond) newTier = 'diamond';
    else if (newExp >= TIER_THRESHOLDS.platinum) newTier = 'platinum';
    else if (newExp >= TIER_THRESHOLDS.gold) newTier = 'gold';
    else if (newExp >= TIER_THRESHOLDS.silver) newTier = 'silver';
    else newTier = 'bronze';

    const updated: UserProgress = {
      ...userProgress,
      exp: newExp,
      tier: newTier,
    };

    setUserProgress(updated);
    await AsyncStorage.setItem(`userProgress_${userId}`, JSON.stringify(updated));
  };

  const joinChallenge = (exp: number) => {
    addExp(exp);
  };

  const createCustomChallenge = () => {
    if (!customChallenge.exerciseType) {
      alert('운동 종류를 입력해주세요!');
      return;
    }

    const exp = customChallenge.sets * customChallenge.reps * 2;
    addExp(exp);
    setShowChallengeModal(false);
    setCustomChallenge({ exerciseType: '', sets: 3, reps: 10 });
  };

  const getNextTierExp = () => {
    if (!userProgress) return 0;
    const tiers = Object.keys(TIER_THRESHOLDS) as Array<keyof typeof TIER_THRESHOLDS>;
    const currentIndex = tiers.indexOf(userProgress.tier);
    if (currentIndex === tiers.length - 1) return TIER_THRESHOLDS.diamond;
    return TIER_THRESHOLDS[tiers[currentIndex + 1]];
  };

  const nextTierExp = getNextTierExp();
  const expProgress = userProgress ? (userProgress.exp / nextTierExp) * 100 : 0;

  const challenges: Challenge[] = [
    {
      id: '1',
      title: '7일 연속 운동 챌린지',
      description: '일주일간 매일 30분 이상 운동하기',
      duration: '7일',
      participants: 1247,
      reward: '🏆 골드 배지',
      progress: 57,
      isJoined: true,
      type: 'weekly',
      exp: 500,
    },
    {
      id: '2',
      title: '만보 걷기 챌린지',
      description: '하루 10,000보 걷기를 한 달간 도전',
      duration: '30일',
      participants: 3521,
      reward: '🥇 워킹 마스터',
      progress: 23,
      isJoined: false,
      type: 'monthly',
      exp: 1000,
    },
    {
      id: '3',
      title: '스쿼트 100개 챌린지',
      description: '매일 스쿼트 100개 달성',
      duration: '14일',
      participants: 1203,
      reward: '🦵 레그 마스터',
      progress: 0,
      isJoined: false,
      type: 'exercise',
      exp: 600,
      exerciseType: '스쿼트',
      sets: 5,
      reps: 20,
    },
  ];

  const weeklyRanking = [
    { id: '1', name: '박헬스', score: 420, unit: '분', rank: 1 },
    { id: '2', name: '김런닝', score: 380, unit: '분', rank: 2 },
    { id: '3', name: '이웨이트', score: 350, unit: '분', rank: 3 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>챌린지 🏆</Text>
        <Text style={styles.subtitle}>친구들과 함께 건강한 경쟁을 즐겨보세요</Text>
      </View>

      {/* User Tier */}
      {userProgress && (
        <Card style={styles.tierCard}>
          <View style={styles.tierHeader}>
            <View>
              <Text style={styles.tierName}>{TIER_NAMES[userProgress.tier]}</Text>
              <Text style={styles.tierExp}>{userProgress.exp.toLocaleString()} EXP</Text>
            </View>
            <View style={styles.tierNextInfo}>
              <Text style={styles.tierNextLabel}>다음 등급까지</Text>
              <Text style={styles.tierNextExp}>
                {(nextTierExp - userProgress.exp).toLocaleString()} EXP
              </Text>
            </View>
          </View>
          <ProgressBar progress={expProgress} color="#007AFF" />
          <Text style={styles.tierNote}>매달 1일 등급이 초기화됩니다</Text>
        </Card>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weekly' && styles.tabActive]}
          onPress={() => setActiveTab('weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'weekly' && styles.tabTextActive]}>
            이번 주
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tier' && styles.tabActive]}
          onPress={() => setActiveTab('tier')}
        >
          <Text style={[styles.tabText, activeTab === 'tier' && styles.tabTextActive]}>
            등급별
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'challenges' && styles.tabActive]}
          onPress={() => setActiveTab('challenges')}
        >
          <Text style={[styles.tabText, activeTab === 'challenges' && styles.tabTextActive]}>
            도전과제
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'weekly' && (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>운동 시간 랭킹</Text>
              {weeklyRanking.map(user => (
                <View key={user.id} style={styles.rankItem}>
                  <Text style={styles.rankNumber}>{user.rank}</Text>
                  <Text style={styles.rankName}>{user.name}</Text>
                  <Text style={styles.rankScore}>
                    {user.score.toLocaleString()}{user.unit}
                  </Text>
                </View>
              ))}
            </Card>
          </View>
        )}

        {activeTab === 'tier' && (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>등급별 순위</Text>
              <View style={styles.tierTabs}>
                {(['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const).map(tier => (
                  <TouchableOpacity
                    key={tier}
                    style={[
                      styles.tierTabButton,
                      tierTab === tier && styles.tierTabButtonActive,
                    ]}
                    onPress={() => setTierTab(tier)}
                  >
                    <Text style={styles.tierTabText}>{TIER_NAMES[tier]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.emptyText}>랭킹 데이터가 없습니다</Text>
            </Card>
          </View>
        )}

        {activeTab === 'challenges' && (
          <View>
            <Button
              title="맞춤 운동 챌린지 만들기"
              onPress={() => setShowChallengeModal(true)}
            />

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>참여 중인 챌린지</Text>
              {challenges.filter(c => c.isJoined).map(challenge => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Badge text={challenge.duration} />
                  </View>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  {challenge.exerciseType && (
                    <Text style={styles.challengeExercise}>
                      {challenge.sets}세트 × {challenge.reps}회
                    </Text>
                  )}
                  <ProgressBar progress={challenge.progress} color="#007AFF" />
                  <View style={styles.challengeFooter}>
                    <Text style={styles.challengeParticipants}>
                      👥 {challenge.participants.toLocaleString()}명 참여
                    </Text>
                    <Text style={styles.challengeReward}>
                      {challenge.reward} {challenge.exp && `+${challenge.exp} EXP`}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>새로운 챌린지</Text>
              {challenges.filter(c => !c.isJoined).map(challenge => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Badge text={challenge.duration} />
                  </View>
                  <Text style={styles.challengeDesc}>{challenge.description}</Text>
                  {challenge.exerciseType && (
                    <Text style={styles.challengeExercise}>
                      매일 {challenge.exerciseType}: {challenge.sets}세트 × {challenge.reps}회
                    </Text>
                  )}
                  <View style={styles.challengeFooter}>
                    <Text style={styles.challengeReward}>
                      {challenge.reward} {challenge.exp && `+${challenge.exp} EXP`}
                    </Text>
                    <Button
                      title="참여하기"
                      onPress={() => challenge.exp && joinChallenge(challenge.exp)}
                    />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Custom Challenge Modal */}
      <Modal
        visible={showChallengeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChallengeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>맞춤 운동 챌린지 만들기</Text>

            <Text style={styles.modalLabel}>운동 종류</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="예: 스쿼트, 푸시업, 플랭크..."
              value={customChallenge.exerciseType}
              onChangeText={text =>
                setCustomChallenge({ ...customChallenge, exerciseType: text })
              }
            />

            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>세트 수</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={String(customChallenge.sets)}
                  onChangeText={text =>
                    setCustomChallenge({
                      ...customChallenge,
                      sets: parseInt(text) || 1,
                    })
                  }
                />
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>횟수</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={String(customChallenge.reps)}
                  onChangeText={text =>
                    setCustomChallenge({
                      ...customChallenge,
                      reps: parseInt(text) || 1,
                    })
                  }
                />
              </View>
            </View>

            <View style={styles.rewardBox}>
              <Text style={styles.rewardLabel}>예상 보상</Text>
              <Text style={styles.rewardValue}>
                +{customChallenge.sets * customChallenge.reps * 2} EXP
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <Button title="취소" onPress={() => setShowChallengeModal(false)} />
              <Button title="생성하기" onPress={createCustomChallenge} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
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
  tierCard: {
    margin: 16,
    backgroundColor: '#f0f9ff',
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  tierExp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  tierNextInfo: {
    alignItems: 'flex-end',
  },
  tierNextLabel: {
    fontSize: 12,
    color: '#666',
  },
  tierNextExp: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  tierNote: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
  rankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  rankName: {
    flex: 1,
    fontSize: 14,
  },
  rankScore: {
    fontSize: 14,
    color: '#666',
  },
  tierTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tierTabButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tierTabButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tierTabText: {
    fontSize: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 24,
  },
  challengeCard: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  challengeDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  challengeExercise: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  challengeParticipants: {
    fontSize: 12,
    color: '#666',
  },
  challengeReward: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalColumn: {
    flex: 1,
  },
  rewardBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  rewardLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  rewardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
});
