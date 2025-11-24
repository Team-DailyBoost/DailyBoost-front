import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
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

const INITIAL_CHALLENGES: Challenge[] = [
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

export function Challenge() {
  const [activeTab, setActiveTab] = useState<'weekly' | 'tier' | 'challenges'>('weekly');
  const [tierTab, setTierTab] = useState<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'>('diamond');
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showChallengeInfoModal, setShowChallengeInfoModal] = useState(false);
  const [showChallengeOptionsModal, setShowChallengeOptionsModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [challengeInfoTab, setChallengeInfoTab] = useState<'info' | 'cert'>('info');
  const [certificationNote, setCertificationNote] = useState('');
  const [certificationImage, setCertificationImage] = useState<string | null>(null);
  const [isSubmittingCertification, setIsSubmittingCertification] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
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

  const joinChallenge = (challenge: Challenge) => {
    if (challenge.exp) {
      addExp(challenge.exp);
    }
    setChallenges(prev =>
      prev.map(item =>
        item.id === challenge.id ? { ...item, isJoined: true } : item
      )
    );
  };

  const openChallengeInfo = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setChallengeInfoTab('info');
    setCertificationNote('');
    setCertificationImage(null);
    setShowChallengeOptionsModal(true);
  };

  const closeChallengeInfo = () => {
    setShowChallengeInfoModal(false);
    setShowChallengeOptionsModal(false);
    setSelectedChallenge(null);
  };

  const handleChallengeOptionSelect = (tab: 'info' | 'cert') => {
    setChallengeInfoTab(tab);
    setShowChallengeOptionsModal(false);
    setShowChallengeInfoModal(true);
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

  const handlePickCertificationImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('권한 필요', '인증 이미지를 업로드하려면 사진 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setCertificationImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('오류', '이미지를 선택하는 중 문제가 발생했습니다.');
    }
  };

  const handleCertificationSubmit = async () => {
    if (!selectedChallenge) return;
    if (!certificationImage) {
      Alert.alert('알림', '인증 사진을 업로드해주세요.');
      return;
    }

    setIsSubmittingCertification(true);
    try {
      // TODO: 백엔드 연동 (인증 업로드 API)가 준비되면 이 부분에서 호출
      await new Promise(resolve => setTimeout(resolve, 800));
      const progressIncrement = selectedChallenge.progress < 100 ? 10 : 0;
      const nextProgress = Math.min(selectedChallenge.progress + progressIncrement, 100);

      setChallenges(prev =>
        prev.map(challenge =>
          challenge.id === selectedChallenge.id
            ? { ...challenge, progress: nextProgress }
            : challenge
        )
      );
      setSelectedChallenge(prev =>
        prev ? { ...prev, progress: nextProgress } : prev
      );

      setCertificationNote('');
      setCertificationImage(null);
      setChallengeInfoTab('info');

      Alert.alert('완료', '챌린지 인증이 등록되었습니다!');
      if (selectedChallenge.exp) {
        await addExp(selectedChallenge.exp / 5);
      }
    } catch (error) {
      Alert.alert('오류', '인증을 저장하는 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingCertification(false);
    }
  };

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

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollViewContent}
      >
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
                    <Text style={[
                      styles.tierTabText,
                      tierTab === tier && styles.tierTabTextActive
                    ]}>{TIER_NAMES[tier]}</Text>
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
                <TouchableOpacity
                  key={challenge.id}
                  style={styles.challengeCard}
                  activeOpacity={0.85}
                  onPress={() => openChallengeInfo(challenge)}
                >
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Badge>{challenge.duration}</Badge>
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
                </TouchableOpacity>
              ))}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>새로운 챌린지</Text>
              {challenges.filter(c => !c.isJoined).map(challenge => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>{challenge.title}</Text>
                    <Badge>{challenge.duration}</Badge>
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
                      onPress={() => joinChallenge(challenge)}
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

      {/* Challenge Action Modal */}
      <Modal
        visible={showChallengeOptionsModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowChallengeOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.challengeOptionsModal]}>
            <Text style={styles.modalTitle}>무엇을 하시겠어요?</Text>
            <Text style={styles.challengeOptionsSubtitle}>
              챌린지 정보를 확인하거나 바로 인증할 수 있어요.
            </Text>
            <View style={styles.challengeOptionsButtons}>
              <Button
                title="챌린지 정보 보기"
                style={styles.challengeOptionButton}
                onPress={() => handleChallengeOptionSelect('info')}
              />
              <Button
                title="인증하기"
                style={styles.challengeOptionButton}
                onPress={() => handleChallengeOptionSelect('cert')}
              />
            </View>
            <Button
              title="닫기"
              variant="outline"
              style={styles.challengeOptionButton}
              onPress={() => setShowChallengeOptionsModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Challenge Info Modal */}
      <Modal
        visible={showChallengeInfoModal}
        animationType="fade"
        transparent
        onRequestClose={closeChallengeInfo}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.challengeInfoModal]}>
            {selectedChallenge && (
              <>
                <Text style={styles.modalTitle}>{selectedChallenge.title}</Text>
                <View style={styles.challengeInfoBadgeRow}>
                  <Badge>{selectedChallenge.duration}</Badge>
                  <Text style={styles.challengeInfoParticipants}>
                    👥 {selectedChallenge.participants.toLocaleString()}명
                  </Text>
                </View>

                <View style={styles.challengeInfoTabs}>
                  {(['info', 'cert'] as const).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.challengeInfoTabButton,
                        challengeInfoTab === tab && styles.challengeInfoTabButtonActive,
                      ]}
                      onPress={() => setChallengeInfoTab(tab)}
                    >
                      <Text
                        style={[
                          styles.challengeInfoTabText,
                          challengeInfoTab === tab && styles.challengeInfoTabTextActive,
                        ]}
                      >
                        {tab === 'info' ? '챌린지 정보' : '인증하기'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {challengeInfoTab === 'info' ? (
                  <>
                    <Text style={styles.challengeInfoDescription}>{selectedChallenge.description}</Text>
                    {selectedChallenge.exerciseType && (
                      <Text style={styles.challengeInfoExercise}>
                        {selectedChallenge.exerciseType} • {selectedChallenge.sets}세트 × {selectedChallenge.reps}회
                      </Text>
                    )}
                    <View style={styles.challengeInfoProgress}>
                      <Text style={styles.challengeInfoProgressLabel}>달성률 {selectedChallenge.progress}%</Text>
                      <ProgressBar progress={selectedChallenge.progress} color="#007AFF" />
                    </View>
                    <View style={styles.challengeInfoReward}>
                      <Text style={styles.challengeInfoRewardLabel}>보상</Text>
                      <Text style={styles.challengeInfoRewardValue}>
                        {selectedChallenge.reward}
                        {selectedChallenge.exp ? ` • +${selectedChallenge.exp} EXP` : ''}
                      </Text>
                    </View>
                    <View style={styles.modalButtons}>
                      <Button title="닫기" onPress={closeChallengeInfo} />
                      <Button
                        title="인증하기"
                        onPress={() => setChallengeInfoTab('cert')}
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.certificationGuide}>
                      오늘 수행한 미션을 기록하고 인증 사진을 업로드해주세요.
                    </Text>
                    <TextInput
                      style={styles.certificationInput}
                      placeholder="오늘 인증 내용을 작성해주세요"
                      value={certificationNote}
                      onChangeText={setCertificationNote}
                      multiline
                      numberOfLines={4}
                    />
                    <TouchableOpacity
                      style={styles.certificationImagePicker}
                      onPress={handlePickCertificationImage}
                    >
                      <Text style={styles.certificationImagePickerText}>
                        {certificationImage ? '다른 사진 선택하기' : '인증 사진 업로드'}
                      </Text>
                    </TouchableOpacity>
                    {certificationImage && (
                      <Image
                        source={{ uri: certificationImage }}
                        style={styles.certificationPreview}
                      />
                    )}
                    <View style={styles.modalButtons}>
                      <Button
                        title="뒤로"
                        variant="outline"
                        onPress={() => setChallengeInfoTab('info')}
                      />
                      <Button
                        title="인증 제출"
                        onPress={handleCertificationSubmit}
                        loading={isSubmittingCertification}
                        disabled={isSubmittingCertification}
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
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
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 80, // 탭바 높이 + 여유 공간
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tierTabButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tierTabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  tierTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    paddingVertical: 24,
  },
  challengeCard: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  challengeInfoModal: {
    width: '88%',
    maxWidth: 420,
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
    marginTop: 16,
  },
  challengeInfoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeInfoParticipants: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  challengeInfoDescription: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    lineHeight: 20,
  },
  challengeInfoExercise: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 12,
  },
  challengeInfoProgress: {
    gap: 8,
    marginBottom: 16,
  },
  challengeInfoProgressLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  challengeInfoReward: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 12,
  },
  challengeInfoRewardLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  challengeInfoRewardValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  challengeInfoTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  challengeInfoTabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  challengeInfoTabButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  challengeInfoTabText: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  challengeInfoTabTextActive: {
    color: '#fff',
  },
  challengeOptionsModal: {
    width: '85%',
    maxWidth: 380,
    gap: 16,
  },
  challengeOptionsSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  challengeOptionsButtons: {
    gap: 12,
  },
  challengeOptionButton: {
    width: '100%',
  },
  certificationGuide: {
    fontSize: 13,
    color: '#555',
    marginBottom: 12,
    lineHeight: 18,
  },
  certificationInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  certificationImagePicker: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    marginBottom: 12,
  },
  certificationImagePickerText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  certificationPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
});
