import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather as Icon } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import { getChallenges, createChallenge, joinChallenge, ChallengeResponse, ChallengeRequest } from '../../api/challenges';
import { format, differenceInDays, parseISO } from 'date-fns';

interface UserProgress {
  userId: string;
  exp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lastReset: string;
}

// 백엔드 챌린지 응답을 확장한 인터페이스
interface Challenge extends ChallengeResponse {
  // 백엔드 필드
  id: number; // ChallengeResponse의 id는 number (Long)
  participantCount: number;
  
  // 프론트엔드 추가 필드 (로컬 상태)
  duration?: string; // 계산된 값: endDate - startDate
  progress?: number; // 사용자 진행률 (로컬)
  isJoined?: boolean; // 사용자 참가 여부 (로컬)
  reward?: string; // 보상 설명 (프론트엔드에서 생성)
  exp?: number; // EXP 보상 (프론트엔드에서 계산)
  exerciseType?: string; // 커스텀 챌린지용
  sets?: number;
  reps?: number;
}

// 로컬 챌린지 인터페이스 (백엔드 동기화 전용)
interface LocalChallenge {
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

// 챌린지 더미 데이터 제거됨

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
  const [isSubmittingCertification, setIsSubmittingCertification] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [localChallenges, setLocalChallenges] = useState<LocalChallenge[]>([]); // 로컬 챌린지
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [customChallenge, setCustomChallenge] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const currentUser = { email: 'user@example.com', name: '사용자' };
  const userId = currentUser.email;

  useEffect(() => {
    loadUserProgress();
    loadChallenges();
    loadLocalChallenges();
  }, []);

  // 화면이 포커스될 때마다 챌린지 목록 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadChallenges();
    }, [])
  );

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

  // 백엔드에서 챌린지 목록 로드
  const loadChallenges = async () => {
    if (!userId || !currentUser) {
      console.log('[Challenge] 사용자 정보가 없어 챌린지 로드 스킵');
      return;
    }
    
    setLoadingChallenges(true);
    try {
      console.log('[Challenge] 백엔드 챌린지 목록 로드 시작, userId:', userId);
      const backendChallenges = await getChallenges();
      console.log('[Challenge] 백엔드 챌린지 목록 응답:', backendChallenges);
      
      // 참가한 챌린지 ID 목록 가져오기 (로컬 저장소에서)
      const joinedChallenges = await getJoinedChallengeIdsAsync();
      console.log('[Challenge] 로컬 저장된 참가 챌린지 ID:', Array.from(joinedChallenges));
      
      // ChallengeResponse를 Challenge 인터페이스로 변환
      const convertedChallenges: Challenge[] = backendChallenges.map(challenge => {
        // 기간 계산
        const startDate = challenge.startDate ? new Date(challenge.startDate) : new Date();
        const endDate = challenge.endDate ? new Date(challenge.endDate) : new Date();
        const durationMs = endDate.getTime() - startDate.getTime();
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        
        // 참가 여부 확인 (로컬 저장소 기준)
        const isJoined = joinedChallenges.has(challenge.id);
        
        return {
          ...challenge,
          duration: `${durationDays}일`,
          progress: 0, // 로컬에서 관리
          isJoined,
          reward: '🏅 챌린지 완주 배지',
          exp: 100, // 기본 EXP
        };
      });
      
      setChallenges(convertedChallenges);
      console.log('[Challenge] 백엔드 챌린지 변환 완료:', convertedChallenges.length, '개');
    } catch (error: any) {
      console.error('[Challenge] 백엔드 챌린지 로드 실패:', error?.message || error);
      
      // 네트워크 오류가 아닌 경우에만 알림 표시
      if (error?.message && !error.message.includes('Network')) {
        Alert.alert('알림', '챌린지 목록을 불러오는데 실패했습니다.');
      }
      
      // 에러 발생 시 빈 배열 유지 (기존 챌린지는 유지)
    } finally {
      setLoadingChallenges(false);
    }
  };

  // 로컬 챌린지 로드 (백엔드 동기화 전용)
  const loadLocalChallenges = async () => {
    try {
      const saved = await AsyncStorage.getItem(`localChallenges_${userId}`);
      if (saved) {
        setLocalChallenges(JSON.parse(saved));
      }
    } catch (error) {
      console.log('[Challenge] 로컬 챌린지 로드 실패:', error);
    }
  };

  // 참가한 챌린지 ID 목록 가져오기 (로컬 저장) - 비동기
  const getJoinedChallengeIdsAsync = async (): Promise<Set<number>> => {
    try {
      const saved = await AsyncStorage.getItem(`joinedChallenges_${userId}`);
      if (saved) {
        const joinedIds: number[] = JSON.parse(saved);
        return new Set(joinedIds);
      }
      return new Set();
    } catch {
      return new Set();
    }
  };

  // 참가한 챌린지 ID 저장
  const saveJoinedChallengeId = async (challengeId: number) => {
    try {
      const saved = await AsyncStorage.getItem(`joinedChallenges_${userId}`);
      const joinedIds = saved ? JSON.parse(saved) : [];
      if (!joinedIds.includes(challengeId)) {
        joinedIds.push(challengeId);
        await AsyncStorage.setItem(`joinedChallenges_${userId}`, JSON.stringify(joinedIds));
      }
    } catch (error) {
      console.error('[Challenge] 참가 챌린지 ID 저장 실패:', error);
    }
  };

  // 로컬 챌린지 저장
  const saveLocalChallenges = async (challengeList: LocalChallenge[]) => {
    try {
      await AsyncStorage.setItem(`localChallenges_${userId}`, JSON.stringify(challengeList));
    } catch (error) {
      console.log('[Challenge] 로컬 챌린지 저장 실패:', error);
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

  const handleJoinChallenge = async (challenge: Challenge) => {
    try {
      console.log('[Challenge] 챌린지 참가 시도:', challenge.id);
      
      // 백엔드 API 호출
      await joinChallenge(challenge.id);
      
      // 참가한 챌린지 ID 저장
      await saveJoinedChallengeId(challenge.id);
      
      // 챌린지 목록 새로고침하여 최신 상태 반영
      await loadChallenges();
      
      Alert.alert('완료', '챌린지에 참여했습니다!');
    } catch (error: any) {
      console.error('[Challenge] 챌린지 참가 실패:', error?.message || error);
      
      // 이미 참가한 경우
      if (error?.message?.includes('already joined') || error?.message?.includes('이미') || error?.message?.includes('참여')) {
        Alert.alert('알림', '이미 참가한 챌린지입니다.');
        // 로컬 상태는 업데이트
        const updatedChallenges = challenges.map(item =>
          item.id === challenge.id 
            ? { ...item, isJoined: true }
            : item
        );
        setChallenges(updatedChallenges);
        await saveJoinedChallengeId(challenge.id);
        // 목록도 새로고침하여 동기화
        await loadChallenges();
      } else {
        Alert.alert('오류', error?.message || '챌린지 참가에 실패했습니다.');
      }
    }
  };

  const openChallengeInfo = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setChallengeInfoTab('info');
    setCertificationNote('');
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

  const createCustomChallenge = async () => {
    // 입력 검증
    if (!customChallenge.title.trim()) {
      Alert.alert('알림', '챌린지 제목을 입력해주세요!');
      return;
    }
    
    if (!customChallenge.description.trim()) {
      Alert.alert('알림', '챌린지 설명을 입력해주세요!');
      return;
    }

    if (!customChallenge.startDate || !customChallenge.endDate) {
      Alert.alert('알림', '시작일과 종료일을 설정해주세요!');
      return;
    }

    // 날짜 문자열을 직접 파싱하여 시간대 문제 방지
    // yyyy-MM-dd 형식을 yyyy-MM-ddTHH:mm:ss 형식으로 변환
    const formatLocalDateTime = (dateString: string, isEndDate: boolean = false): string => {
      // dateString이 이미 yyyy-MM-dd 형식이라고 가정
      const hours = isEndDate ? '23' : '00';
      const minutes = isEndDate ? '59' : '00';
      const seconds = isEndDate ? '59' : '00';
      return `${dateString}T${hours}:${minutes}:${seconds}`;
    };

    // 날짜 비교를 위해 Date 객체로 변환
    const startDateObj = new Date(customChallenge.startDate + 'T00:00:00');
    const endDateObj = new Date(customChallenge.endDate + 'T23:59:59');
    
    if (endDateObj <= startDateObj) {
      Alert.alert('알림', '종료일은 시작일보다 늦어야 합니다!');
      return;
    }

    // 이미 생성 중이면 중복 요청 방지
    if (isCreatingChallenge) {
      return;
    }

    setIsCreatingChallenge(true);

    try {
      console.log('[Challenge] 챌린지 생성 시도:', customChallenge);
      
      // 백엔드 API 호출 - LocalDateTime 형식 사용 (시간대 없음)
      // Spring Boot LocalDateTime은 yyyy-MM-ddTHH:mm:ss 형식을 지원
      const request: ChallengeRequest = {
        title: customChallenge.title.trim(),
        description: customChallenge.description.trim(),
        startDate: formatLocalDateTime(customChallenge.startDate, false),
        endDate: formatLocalDateTime(customChallenge.endDate, true),
      };
      
      console.log('[Challenge] 챌린지 생성 요청:', JSON.stringify(request, null, 2));
      
      const response = await createChallenge(request);
      console.log('[Challenge] 챌린지 생성 성공:', response);
      
      // 폼 초기화
      setCustomChallenge({ 
        title: '',
        description: '',
        startDate: '',
        endDate: '',
      });
      setStartDate(new Date());
      setEndDate(new Date());
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      
      // 모달 닫기
      setShowChallengeModal(false);
      
      // 성공 시 챌린지 목록 새로고침
      try {
        await loadChallenges();
      } catch (loadError) {
        console.error('[Challenge] 챌린지 목록 새로고침 실패:', loadError);
        // 목록 새로고침 실패해도 계속 진행
      }
      
      Alert.alert('완료', response?.message || '챌린지가 생성되었습니다!');
    } catch (error: any) {
      console.error('[Challenge] 챌린지 생성 실패:', error);
      
      let errorMessage = '챌린지 생성에 실패했습니다.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('오류', errorMessage);
    } finally {
      setIsCreatingChallenge(false);
    }
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

  const handleCertificationSubmit = async () => {
    if (!selectedChallenge) return;
    if (!certificationNote.trim()) {
      Alert.alert('알림', '인증 내용을 작성해주세요.');
      return;
    }

    setIsSubmittingCertification(true);
    try {
      // 인증 제출 처리
      await new Promise(resolve => setTimeout(resolve, 800));
      const currentProgress = selectedChallenge.progress || 0;
      const progressIncrement = currentProgress < 100 ? 10 : 0;
      const nextProgress = Math.min(currentProgress + progressIncrement, 100);

      const updatedChallenges = challenges.map(challenge =>
        challenge.id === selectedChallenge.id
          ? { ...challenge, progress: nextProgress }
          : challenge
      );
      setChallenges(updatedChallenges);
      
      setSelectedChallenge(prev =>
        prev ? { ...prev, progress: nextProgress } : prev
      );

      // 인증 제출 시 경험치 추가
      if (selectedChallenge.exp) {
        await addExp(selectedChallenge.exp / 5);
      }

      setCertificationNote('');
      setChallengeInfoTab('info');

      Alert.alert('완료', '챌린지 인증이 등록되었습니다!');
    } catch (error) {
      Alert.alert('오류', '인증을 저장하는 중 문제가 발생했습니다.');
    } finally {
      setIsSubmittingCertification(false);
    }
  };

  // 랭킹 더미 데이터 제거됨

  return (
    <View style={styles.container}>
      {/* Header - Fixed at Top */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Icon name="award" size={24} color="#6366f1" style={{ marginRight: 8 }} />
          <Text style={styles.title}>챌린지</Text>
        </View>
      </View>

      {/* Tabs - Fixed at Top */}
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

        {activeTab === 'weekly' && (
          <View>
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>운동 시간 랭킹</Text>
              <Text style={styles.emptyText}>랭킹 데이터가 없습니다</Text>
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
            <TouchableOpacity
              style={styles.createChallengeButton}
              onPress={() => {
                console.log('[Challenge] 챌린지 생성 모달 열기');
                setShowChallengeModal(true);
              }}
              activeOpacity={0.8}
            >
              <Icon name="plus-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.createChallengeButtonText}>
                맞춤 운동 챌린지 만들기
              </Text>
            </TouchableOpacity>

            {loadingChallenges && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>챌린지 목록을 불러오는 중...</Text>
              </View>
            )}

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>참여 중인 챌린지</Text>
              {challenges.filter(c => c.isJoined).length === 0 && localChallenges.filter(c => c.isJoined).length === 0 ? (
                <Text style={styles.emptyText}>참여 중인 챌린지가 없습니다</Text>
              ) : (
                <>
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
                      <ProgressBar progress={challenge.progress || 0} color="#007AFF" />
                      <View style={styles.challengeFooter}>
                        <View style={styles.participantRow}>
                          <Icon name="users" size={14} color="#64748b" />
                          <Text style={styles.challengeParticipants}>
                            {challenge.participantCount.toLocaleString()}명 참여
                          </Text>
                        </View>
                        <View style={styles.rewardRow}>
                          <Icon name="award" size={14} color="#f59e0b" />
                          <Text style={styles.challengeReward}>
                            {challenge.exp && `+${challenge.exp} EXP`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {localChallenges.filter(c => c.isJoined).map(challenge => (
                    <TouchableOpacity
                      key={challenge.id}
                      style={styles.challengeCard}
                      activeOpacity={0.85}
                      onPress={() => openChallengeInfo(challenge as any)}
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
                        <View style={styles.participantRow}>
                          <Icon name="users" size={14} color="#64748b" />
                          <Text style={styles.challengeParticipants}>
                            {challenge.participants.toLocaleString()}명 참여
                          </Text>
                        </View>
                        <View style={styles.rewardRow}>
                          <Icon name="award" size={14} color="#f59e0b" />
                          <Text style={styles.challengeReward}>
                            {challenge.exp && `+${challenge.exp} EXP`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.cardTitle}>새로운 챌린지</Text>
              {challenges.filter(c => !c.isJoined).length === 0 && localChallenges.filter(c => !c.isJoined).length === 0 ? (
                <Text style={styles.emptyText}>새로운 챌린지가 없습니다</Text>
              ) : (
                <>
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
                    <View style={styles.rewardRow}>
                      <Icon name="award" size={14} color="#f59e0b" />
                      <Text style={styles.challengeReward}>
                        {challenge.exp && `+${challenge.exp} EXP`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoinChallenge(challenge)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.joinButtonText}>참여하기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                  ))}
                  {localChallenges.filter(c => !c.isJoined).map(challenge => (
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
                        <View style={styles.rewardRow}>
                          <Icon name="award" size={14} color="#f59e0b" />
                          <Text style={styles.challengeReward}>
                            {challenge.exp && `+${challenge.exp} EXP`}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.joinButton}
                          onPress={() => {
                            const updatedLocal = localChallenges.map(item =>
                              item.id === challenge.id 
                                ? { ...item, isJoined: true, participants: item.participants + 1 }
                                : item
                            );
                            setLocalChallenges(updatedLocal);
                            saveLocalChallenges(updatedLocal);
                            Alert.alert('완료', '챌린지에 참여했습니다!');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.joinButtonText}>참여하기</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              )}
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Custom Challenge Modal */}
      <Modal
        visible={showChallengeModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => {
          console.log('[Challenge] 모달 닫기 요청');
          setShowChallengeModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalHeaderTitleContainer}>
                  <View style={styles.modalTitleIconContainer}>
                    <Icon name="award" size={24} color="#6366f1" />
                  </View>
                  <Text style={styles.modalTitle}>새 챌린지 만들기</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowChallengeModal(false);
                    setShowStartDatePicker(false);
                    setShowEndDatePicker(false);
                    setCustomChallenge({
                      title: '',
                      description: '',
                      startDate: '',
                      endDate: '',
                    });
                    setStartDate(new Date());
                    setEndDate(new Date());
                  }}
                  activeOpacity={0.7}
                >
                  <Icon name="x" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalSubtitle}>목표를 달성하기 위한 챌린지를 만들어보세요</Text>
            </View>
            
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              alwaysBounceVertical={false}
            >

              {/* 챌린지 제목 */}
              <View style={styles.inputSection}>
                <View style={styles.modalLabelContainer}>
                  <Icon name="edit-3" size={16} color="#6366f1" />
                  <Text style={styles.modalLabel}>
                    챌린지 제목 <Text style={styles.requiredMark}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.modalInput,
                    customChallenge.title && styles.modalInputFilled
                  ]}
                  placeholder="예: 30일 스쿼트 챌린지"
                  placeholderTextColor="#9ca3af"
                  value={customChallenge.title}
                  onChangeText={text =>
                    setCustomChallenge({ ...customChallenge, title: text })
                  }
                  maxLength={50}
                />
                {customChallenge.title && (
                  <Text style={styles.inputHelperText}>
                    {customChallenge.title.length}/50
                  </Text>
                )}
              </View>

              {/* 챌린지 설명 */}
              <View style={styles.inputSection}>
                <View style={styles.modalLabelContainer}>
                  <Icon name="file-text" size={16} color="#6366f1" />
                  <Text style={styles.modalLabel}>
                    챌린지 설명 <Text style={styles.requiredMark}>*</Text>
                  </Text>
                </View>
                <TextInput
                  style={[
                    styles.modalInput,
                    styles.modalTextArea,
                    customChallenge.description && styles.modalInputFilled
                  ]}
                  placeholder="챌린지에 대한 설명을 입력하세요&#10;예: 매일 스쿼트 100개씩 실천하는 30일 챌린지입니다"
                  placeholderTextColor="#9ca3af"
                  value={customChallenge.description}
                  onChangeText={text =>
                    setCustomChallenge({ ...customChallenge, description: text })
                  }
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={2000}
                />
                {customChallenge.description && (
                  <Text style={styles.inputHelperText}>
                    {customChallenge.description.length}/2000
                  </Text>
                )}
              </View>

              {/* 챌린지 기간 */}
              <View style={styles.inputSection}>
                <View style={styles.modalLabelContainer}>
                  <Icon name="calendar" size={16} color="#6366f1" />
                  <Text style={styles.modalLabel}>
                    챌린지 기간 <Text style={styles.requiredMark}>*</Text>
                  </Text>
                </View>
                <View style={styles.datePickerContainer}>
                  <View style={styles.datePickerItem}>
                    <Text style={styles.dateLabel}>시작일</Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        customChallenge.startDate && styles.datePickerButtonSelected
                      ]}
                      onPress={() => setShowStartDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Icon name="calendar" size={18} color={customChallenge.startDate ? "#6366f1" : "#9ca3af"} />
                      <Text style={[
                        styles.datePickerButtonText,
                        !customChallenge.startDate && styles.datePickerButtonTextPlaceholder
                      ]}>
                        {customChallenge.startDate || '날짜 선택'}
                      </Text>
                    </TouchableOpacity>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event: any, selectedDate?: Date) => {
                          setShowStartDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            setStartDate(selectedDate);
                            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                            setCustomChallenge({ ...customChallenge, startDate: formattedDate });
                            // 종료일이 시작일보다 빠르면 종료일도 업데이트
                            if (customChallenge.endDate && new Date(customChallenge.endDate) < selectedDate) {
                              const newEndDate = new Date(selectedDate);
                              newEndDate.setDate(newEndDate.getDate() + 7); // 기본 7일 추가
                              setEndDate(newEndDate);
                              setCustomChallenge({ 
                                ...customChallenge, 
                                startDate: formattedDate,
                                endDate: format(newEndDate, 'yyyy-MM-dd')
                              });
                            }
                          }
                        }}
                        minimumDate={new Date()}
                      />
                    )}
                  </View>
                  
                  <View style={styles.dateArrow}>
                    <Text style={styles.dateArrowText}>→</Text>
                  </View>
                  
                  <View style={styles.datePickerItem}>
                    <Text style={styles.dateLabel}>종료일</Text>
                    <TouchableOpacity
                      style={[
                        styles.datePickerButton,
                        customChallenge.endDate && styles.datePickerButtonSelected
                      ]}
                      onPress={() => setShowEndDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Icon name="calendar" size={18} color={customChallenge.endDate ? "#6366f1" : "#9ca3af"} />
                      <Text style={[
                        styles.datePickerButtonText,
                        !customChallenge.endDate && styles.datePickerButtonTextPlaceholder
                      ]}>
                        {customChallenge.endDate || '날짜 선택'}
                      </Text>
                    </TouchableOpacity>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(event: any, selectedDate?: Date) => {
                          setShowEndDatePicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            setEndDate(selectedDate);
                            const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                            setCustomChallenge({ ...customChallenge, endDate: formattedDate });
                          }
                        }}
                        minimumDate={startDate || new Date()}
                      />
                    )}
                  </View>
                </View>
                {customChallenge.startDate && customChallenge.endDate && (
                  <View style={styles.dateInfoBox}>
                    <View style={styles.dateInfoRow}>
                      <Icon name="bar-chart-2" size={16} color="#4338ca" />
                      <Text style={styles.dateInfoText}>
                        총 {Math.ceil((new Date(customChallenge.endDate).getTime() - new Date(customChallenge.startDate).getTime()) / (1000 * 60 * 60 * 24))}일간 진행됩니다
                      </Text>
                    </View>
                  </View>
                )}
              </View>

            </ScrollView>
            
            {/* 모달 하단 버튼 */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowChallengeModal(false);
                  setShowStartDatePicker(false);
                  setShowEndDatePicker(false);
                  setCustomChallenge({
                    title: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                  });
                  setStartDate(new Date());
                  setEndDate(new Date());
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalCreateButton,
                  (!customChallenge.title || !customChallenge.description || !customChallenge.startDate || !customChallenge.endDate || isCreatingChallenge) && styles.modalCreateButtonDisabled
                ]}
                onPress={createCustomChallenge}
                disabled={!customChallenge.title || !customChallenge.description || !customChallenge.startDate || !customChallenge.endDate || isCreatingChallenge}
                activeOpacity={0.8}
              >
                {isCreatingChallenge ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalCreateButtonText}>생성 중...</Text>
                  </>
                ) : (
                  <>
                    <Icon name="check-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.modalCreateButtonText}>생성하기</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Challenge Action Modal */}
      <Modal
        visible={showChallengeOptionsModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowChallengeOptionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.challengeOptionsModal]}>
            <View style={styles.challengeOptionsHeader}>
              <Text style={styles.challengeOptionsTitle}>무엇을 하시겠어요?</Text>
              <Text style={styles.challengeOptionsSubtitle}>
                챌린지 정보를 확인하거나 바로 인증할 수 있어요.
              </Text>
            </View>
            <View style={styles.challengeOptionsButtons}>
              <TouchableOpacity
                style={styles.challengeOptionButtonPrimary}
                onPress={() => handleChallengeOptionSelect('info')}
                activeOpacity={0.8}
              >
                <Icon name="info" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.challengeOptionButtonTextPrimary}>챌린지 정보 보기</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.challengeOptionButtonSecondary}
                onPress={() => handleChallengeOptionSelect('cert')}
                activeOpacity={0.8}
              >
                <Icon name="check-circle" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.challengeOptionButtonTextSecondary}>인증하기</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.challengeOptionButtonOutline}
              onPress={() => setShowChallengeOptionsModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.challengeOptionButtonTextOutline}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Challenge Info Modal */}
      <Modal
        visible={showChallengeInfoModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={closeChallengeInfo}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.challengeInfoModal]}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTop}>
                <View style={styles.modalHeaderTitleContainer}>
                  <View style={styles.modalTitleIconContainer}>
                    <Icon name="award" size={24} color="#6366f1" />
                  </View>
                  <Text style={styles.modalTitle}>챌린지 정보</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={closeChallengeInfo}
                  activeOpacity={0.7}
                >
                  <Icon name="x" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.challengeInfoModalScrollView}
              contentContainerStyle={styles.challengeInfoModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
            {selectedChallenge && (
              <>
                <View style={styles.challengeInfoHeader}>
                  <Text style={styles.challengeInfoTitle}>{selectedChallenge.title}</Text>
                  <View style={styles.challengeInfoMetaRow}>
                    <Badge>{selectedChallenge.duration || '진행중'}</Badge>
                    <View style={styles.participantRow}>
                      <Icon name="users" size={14} color="#64748b" />
                      <Text style={styles.challengeInfoParticipants}>
                        {selectedChallenge.participantCount.toLocaleString()}명 참여
                      </Text>
                    </View>
                  </View>
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
                    <View style={styles.challengeInfoSection}>
                      <View style={styles.sectionTitleRow}>
                        <Icon name="file-text" size={18} color="#6366f1" />
                        <Text style={styles.challengeInfoSectionTitle}>설명</Text>
                      </View>
                      <Text style={styles.challengeInfoDescription}>{selectedChallenge.description}</Text>
                    </View>

                    {/* 날짜 정보 */}
                    {selectedChallenge.startDate && selectedChallenge.endDate && (
                      <View style={styles.challengeInfoSection}>
                        <View style={styles.sectionTitleRow}>
                          <Icon name="calendar" size={18} color="#6366f1" />
                          <Text style={styles.challengeInfoSectionTitle}>기간</Text>
                        </View>
                        <View style={styles.challengeInfoDateContainer}>
                          <View style={styles.challengeInfoDateItem}>
                            <Text style={styles.challengeInfoDateLabel}>시작일</Text>
                            <Text style={styles.challengeInfoDateValue}>
                              {format(parseISO(selectedChallenge.startDate), 'yyyy년 MM월 dd일')}
                            </Text>
                          </View>
                          <View style={styles.challengeInfoDateItem}>
                            <Text style={styles.challengeInfoDateLabel}>종료일</Text>
                            <Text style={styles.challengeInfoDateValue}>
                              {format(parseISO(selectedChallenge.endDate), 'yyyy년 MM월 dd일')}
                            </Text>
                          </View>
                        </View>
                        {(() => {
                          const startDate = parseISO(selectedChallenge.startDate);
                          const endDate = parseISO(selectedChallenge.endDate);
                          const today = new Date();
                          const totalDays = differenceInDays(endDate, startDate) + 1;
                          const remainingDays = Math.max(0, differenceInDays(endDate, today) + 1);
                          const isEnded = today > endDate;
                          const isNotStarted = today < startDate;
                          
                          return (
                            <View style={styles.challengeInfoDateInfoBox}>
                              <View style={styles.dateInfoRow}>
                                {isNotStarted ? (
                                  <>
                                    <Icon name="clock" size={16} color="#4338ca" />
                                    <Text style={styles.challengeInfoDateInfoText}>
                                      {differenceInDays(startDate, today)}일 후 시작
                                    </Text>
                                  </>
                                ) : isEnded ? (
                                  <>
                                    <Icon name="check-circle" size={16} color="#10b981" />
                                    <Text style={styles.challengeInfoDateInfoText}>
                                      챌린지 종료
                                    </Text>
                                  </>
                                ) : (
                                  <>
                                    <Icon name="bar-chart-2" size={16} color="#4338ca" />
                                    <Text style={styles.challengeInfoDateInfoText}>
                                      총 {totalDays}일 중 {remainingDays}일 남음
                                    </Text>
                                  </>
                                )}
                              </View>
                            </View>
                          );
                        })()}
                      </View>
                    )}

                    {selectedChallenge.exerciseType && (
                      <View style={styles.challengeInfoSection}>
                        <View style={styles.sectionTitleRow}>
                          <Icon name="activity" size={18} color="#6366f1" />
                          <Text style={styles.challengeInfoSectionTitle}>운동 정보</Text>
                        </View>
                        <Text style={styles.challengeInfoExercise}>
                          {selectedChallenge.exerciseType} • {selectedChallenge.sets}세트 × {selectedChallenge.reps}회
                        </Text>
                      </View>
                    )}

                    <View style={styles.challengeInfoSection}>
                      <View style={styles.sectionTitleRow}>
                        <Icon name="trending-up" size={18} color="#6366f1" />
                        <Text style={styles.challengeInfoSectionTitle}>진행 현황</Text>
                      </View>
                      <View style={styles.challengeInfoProgress}>
                        <Text style={styles.challengeInfoProgressLabel}>달성률 {selectedChallenge.progress || 0}%</Text>
                        <ProgressBar progress={selectedChallenge.progress || 0} color="#6366f1" />
                      </View>
                    </View>

                    <View style={styles.challengeInfoSection}>
                      <View style={styles.sectionTitleRow}>
                        <Icon name="gift" size={18} color="#6366f1" />
                        <Text style={styles.challengeInfoSectionTitle}>보상</Text>
                      </View>
                      <View style={styles.challengeInfoReward}>
                        <View style={styles.rewardRow}>
                          <Icon name="award" size={16} color="#f59e0b" />
                          <Text style={styles.challengeInfoRewardValue}>
                            챌린지 완주 배지
                            {selectedChallenge.exp && ` • +${selectedChallenge.exp} EXP`}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.challengeInfoActionButton}
                      onPress={() => setChallengeInfoTab('cert')}
                      activeOpacity={0.8}
                    >
                      <Icon name="check-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                      <Text style={styles.challengeInfoActionButtonText}>인증하기</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.challengeInfoSection}>
                      <View style={styles.sectionTitleRow}>
                        <Icon name="edit-3" size={18} color="#6366f1" />
                        <Text style={styles.challengeInfoSectionTitle}>인증하기</Text>
                      </View>
                      <Text style={styles.certificationGuide}>
                        오늘 수행한 미션을 기록하고 인증 내용을 작성해주세요.
                      </Text>
                    </View>
                    <TextInput
                      style={styles.certificationInput}
                      placeholder="오늘 인증 내용을 작성해주세요"
                      placeholderTextColor="#9ca3af"
                      value={certificationNote}
                      onChangeText={setCertificationNote}
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                    />
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.certBackButton}
                        onPress={() => setChallengeInfoTab('info')}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.certBackButtonText}>뒤로</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.certSubmitButton,
                          isSubmittingCertification && styles.certSubmitButtonDisabled
                        ]}
                        onPress={handleCertificationSubmit}
                        disabled={isSubmittingCertification}
                        activeOpacity={0.8}
                      >
                        {isSubmittingCertification ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.certSubmitButtonText}>인증 제출</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  tierCard: {
    margin: 20,
    marginTop: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#dbeafe',
    borderRadius: 24,
    overflow: 'hidden',
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
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  card: {
    marginBottom: 24,
    borderRadius: 28,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 20,
    color: '#0f172a',
    letterSpacing: -0.5,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tierTabButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#4f46e5',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
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
    color: '#94a3b8',
    paddingVertical: 32,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  challengeCard: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e8eaf6',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  challengeDesc: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  challengeExercise: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 8,
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
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 0,
    width: '92%',
    maxWidth: 500,
    maxHeight: '95%',
    minHeight: '75%',
    overflow: 'hidden',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
    flexDirection: 'column',
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  challengeInfoModal: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '95%',
    minHeight: '75%',
    padding: 0,
    overflow: 'hidden',
  },
  challengeInfoModalScrollView: {
    flex: 1,
  },
  challengeInfoModalScrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  modalHeader: {
    paddingBottom: 20,
    paddingTop: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fafbfc',
  },
  modalHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCloseButtonText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '400',
  },
  inputSection: {
    marginBottom: 16,
  },
  modalLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  modalLabelIcon: {
    fontSize: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  requiredMark: {
    color: '#ef4444',
    fontSize: 14,
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalInputFilled: {
    borderColor: '#6366f1',
    backgroundColor: '#f8f9ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  inputHelperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'right',
  },
  datePickerButton: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  datePickerButtonIcon: {
    fontSize: 18,
  },
  datePickerButtonSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f4ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerButtonText: {
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '500',
  },
  datePickerButtonTextPlaceholder: {
    color: '#9ca3af',
    fontWeight: '400',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  datePickerItem: {
    flex: 1,
  },
  dateArrow: {
    paddingBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateArrowText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalColumn: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 8,
  },
  dateInfoBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0f4ff',
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dateInfoText: {
    fontSize: 13,
    color: '#4338ca',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#fafbfc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  modalCreateButtonDisabled: {
    opacity: 0.5,
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
  rewardNote: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  challengeInfoHeader: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  challengeInfoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  challengeInfoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  challengeInfoBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeInfoParticipants: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  challengeInfoSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  challengeInfoSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  challengeInfoDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  challengeInfoDateContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  challengeInfoDateItem: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  challengeInfoDateLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 6,
  },
  challengeInfoDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  challengeInfoDateInfoBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  challengeInfoDateInfoText: {
    fontSize: 13,
    color: '#4338ca',
    fontWeight: '500',
  },
  challengeInfoExercise: {
    fontSize: 15,
    color: '#6366f1',
    fontWeight: '600',
    padding: 12,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
  },
  challengeInfoProgress: {
    gap: 10,
    marginTop: 8,
  },
  challengeInfoProgressLabel: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  challengeInfoReward: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  challengeInfoRewardLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  challengeInfoRewardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
  },
  challengeInfoActionButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  challengeInfoActionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
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
    maxWidth: 400,
    padding: 24,
    gap: 20,
  },
  challengeOptionsHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeOptionsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  challengeOptionsSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  challengeOptionsButtons: {
    gap: 12,
    marginTop: 8,
  },
  challengeOptionButton: {
    width: '100%',
  },
  challengeOptionButtonIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  createChallengeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  createChallengeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  joinButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  challengeOptionButtonPrimary: {
    width: '100%',
    backgroundColor: '#6366f1',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  challengeOptionButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  challengeOptionButtonSecondary: {
    width: '100%',
    backgroundColor: '#10b981',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#059669',
  },
  challengeOptionButtonTextSecondary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  challengeOptionButtonOutline: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  challengeOptionButtonTextOutline: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '600',
  },
  certCloseButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCloseButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  certActionButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  certActionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  certBackButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBackButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  certSubmitButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#059669',
  },
  certSubmitButtonDisabled: {
    opacity: 0.6,
  },
  certSubmitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  certificationGuide: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    lineHeight: 20,
  },
  certificationInput: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 150,
    flexGrow: 1,
  },
  modalTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    backgroundColor: '#f1f5f9',
    padding: 4,
    borderRadius: 10,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  modeButtonTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalCancelButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  modalCreateButtonIcon: {
    fontSize: 16,
  },
  modalCreateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  // New modern styles
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#f1f5f9',
  },
});
