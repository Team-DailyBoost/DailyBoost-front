import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { ProgressBar } from '../components/ProgressBar';
import type { RankingUser, Challenge as ChallengeType } from '../types';

export function Challenge() {
  const [activeTab, setActiveTab] = useState<'exercise' | 'calorie' | 'steps'>('exercise');

  // 주간 운동 시간 랭킹
  const weeklyExerciseRanking: RankingUser[] = [
    { id: '1', name: '박헬스', score: 420, unit: '분', rank: 1 },
    { id: '2', name: '김런닝', score: 380, unit: '분', rank: 2 },
    { id: '3', name: '이웨이트', score: 350, unit: '분', rank: 3 },
    { id: '4', name: '최요가', score: 320, unit: '분', rank: 4 },
    { id: '5', name: '정스쿼트', score: 290, unit: '분', rank: 5 },
    { id: '6', name: '나 (김건강)', score: 275, unit: '분', rank: 6 },
  ];

  // 주간 칼로리 소모 랭킹
  const weeklyCalorieRanking: RankingUser[] = [
    { id: '1', name: '이다이어트', score: 3500, unit: 'kcal', rank: 1 },
    { id: '2', name: '박번업', score: 3200, unit: 'kcal', rank: 2 },
    { id: '3', name: '김러닝', score: 2980, unit: 'kcal', rank: 3 },
    { id: '4', name: '나 (김건강)', score: 2850, unit: 'kcal', rank: 4 },
    { id: '5', name: '최컷팅', score: 2700, unit: 'kcal', rank: 5 },
    { id: '6', name: '정헬시', score: 2650, unit: 'kcal', rank: 6 },
  ];

  // 걸음수 랭킹
  const stepRanking: RankingUser[] = [
    { id: '1', name: '박만보', score: 85000, unit: '걸음', rank: 1 },
    { id: '2', name: '김걸음', score: 78000, unit: '걸음', rank: 2 },
    { id: '3', name: '이산책', score: 72000, unit: '걸음', rank: 3 },
    { id: '4', name: '나 (김건강)', score: 68000, unit: '걸음', rank: 4 },
    { id: '5', name: '정조깅', score: 65000, unit: '걸음', rank: 5 },
    { id: '6', name: '최러닝', score: 62000, unit: '걸음', rank: 6 },
  ];

  // 챌린지 목록
  const challenges: ChallengeType[] = [
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
    },
    {
      id: '3',
      title: '물 마시기 챌린지',
      description: '하루 8잔 이상의 물 마시기',
      duration: '오늘',
      participants: 892,
      reward: '💧 하이드레이션',
      progress: 75,
      isJoined: true,
      type: 'daily',
    },
  ];

  const getRankingData = () => {
    switch (activeTab) {
      case 'exercise':
        return weeklyExerciseRanking;
      case 'calorie':
        return weeklyCalorieRanking;
      case 'steps':
        return stepRanking;
      default:
        return weeklyExerciseRanking;
    }
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#f59e0b'; // 금
      case 2:
        return '#9ca3af'; // 은
      case 3:
        return '#d97706'; // 동
      default:
        return '#6b7280';
    }
  };

  const renderRankingItem = ({ item }: { item: RankingUser }) => {
    const isMe = item.name.includes('나 (');

    return (
      <View style={[styles.rankingItem, isMe && styles.rankingItemMe]}>
        <View style={styles.rankingLeft}>
          {item.rank <= 3 ? (
            <Icon
              name="award"
              size={24}
              color={getMedalColor(item.rank)}
            />
          ) : (
            <Text style={styles.rankNumber}>{item.rank}</Text>
          )}
          <Text style={[styles.rankName, isMe && styles.rankNameMe]}>
            {item.name}
          </Text>
        </View>
        <Text style={[styles.rankScore, isMe && styles.rankScoreMe]}>
          {item.score.toLocaleString()} {item.unit}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>챌린지</Text>
      </View>

      {/* 탭 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'exercise' && styles.activeTab]}
          onPress={() => setActiveTab('exercise')}
        >
          <Icon
            name="activity"
            size={20}
            color={activeTab === 'exercise' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'exercise' && styles.activeTabText,
            ]}
          >
            운동시간
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calorie' && styles.activeTab]}
          onPress={() => setActiveTab('calorie')}
        >
          <Icon
            name="zap"
            size={20}
            color={activeTab === 'calorie' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'calorie' && styles.activeTabText,
            ]}
          >
            칼로리
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'steps' && styles.activeTab]}
          onPress={() => setActiveTab('steps')}
        >
          <Icon
            name="navigation"
            size={20}
            color={activeTab === 'steps' ? '#6366f1' : '#6b7280'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'steps' && styles.activeTabText,
            ]}
          >
            걸음수
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* 랭킹 카드 */}
        <Card style={styles.card}>
          <CardTitle>주간 랭킹</CardTitle>
          <FlatList
            data={getRankingData()}
            renderItem={renderRankingItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </Card>

        {/* 챌린지 목록 */}
        <View style={styles.challengesHeader}>
          <Text style={styles.sectionTitle}>진행 중인 챌린지</Text>
        </View>

        {challenges.map((challenge) => (
          <Card key={challenge.id} style={styles.card}>
            <View style={styles.challengeHeader}>
              <View style={styles.challengeTitleContainer}>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                {challenge.isJoined && (
                  <Badge variant="secondary" style={styles.joinedBadge}>
                    참여중
                  </Badge>
                )}
              </View>
            </View>
            <Text style={styles.challengeDescription}>
              {challenge.description}
            </Text>
            <View style={styles.challengeInfo}>
              <View style={styles.challengeInfoItem}>
                <Icon name="clock" size={16} color="#6b7280" />
                <Text style={styles.challengeInfoText}>{challenge.duration}</Text>
              </View>
              <View style={styles.challengeInfoItem}>
                <Icon name="users" size={16} color="#6b7280" />
                <Text style={styles.challengeInfoText}>
                  {challenge.participants.toLocaleString()}명
                </Text>
              </View>
              <View style={styles.challengeInfoItem}>
                <Icon name="gift" size={16} color="#6b7280" />
                <Text style={styles.challengeInfoText}>{challenge.reward}</Text>
              </View>
            </View>
            {challenge.isJoined && (
              <View style={styles.progressSection}>
                <Text style={styles.progressLabel}>진행률</Text>
                <ProgressBar
                  value={challenge.progress}
                  max={100}
                  color="#6366f1"
                  height={8}
                />
                <Text style={styles.progressText}>{challenge.progress}%</Text>
              </View>
            )}
          </Card>
        ))}
      </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
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
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  rankingItemMe: {
    backgroundColor: '#eff6ff',
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  rankingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    width: 24,
    textAlign: 'center',
  },
  rankName: {
    fontSize: 16,
    color: '#1f2937',
  },
  rankNameMe: {
    fontWeight: '600',
    color: '#6366f1',
  },
  rankScore: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  rankScoreMe: {
    color: '#6366f1',
  },
  challengesHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  challengeHeader: {
    marginBottom: 8,
  },
  challengeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  joinedBadge: {
    marginLeft: 8,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  challengeInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  challengeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  challengeInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
});
