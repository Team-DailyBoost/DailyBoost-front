import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Feather as Icon } from '@expo/vector-icons';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { ProgressBar } from '../components/ProgressBar';
import { Badge } from '../components/Badge';
import { useAsyncStorage } from '../hooks/useAsyncStorage';
import { StorageKeys } from '../utils/storage';
import type { DailyGoals, CurrentNutrition, InBodyData } from '../types';

const screenWidth = Dimensions.get('window').width;

export function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  
  // AsyncStorage로 데이터 관리
  const [dailyGoals] = useAsyncStorage<DailyGoals>(StorageKeys.DAILY_GOALS, {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
    exercise: 60,
  });

  const [current] = useAsyncStorage<CurrentNutrition>('currentNutrition', {
    calories: 1650,
    protein: 95,
    carbs: 180,
    fat: 52,
    exercise: 45,
  });

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // InBody 데이터
  const inBodyData: InBodyData = {
    weight: 69.5,
    muscleMass: 32.8,
    bodyFatPercentage: 12.3,
    bmi: 24.1,
    lastUpdated: '2024-03-15 09:30',
    isConnected: true,
  };

  // 주간 데이터
  const weeklyData = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [
      {
        data: [30, 45, 60, 40, 55, 30, 45],
      },
    ],
  };

  // 운동 진행도 계산
  const exerciseProgress = (current.exercise / dailyGoals.exercise) * 100;

  // 캐릭터 상태
  const getCharacterState = () => {
    if (exerciseProgress >= 100) {
      return {
        emoji: '💪',
        message: '완벽해요! 오늘의 목표를 달성했어요!',
        color: '#10b981',
      };
    } else if (exerciseProgress >= 75) {
      return {
        emoji: '😊',
        message: '조금만 더 힘내세요! 거의 다 왔어요!',
        color: '#3b82f6',
      };
    } else if (exerciseProgress >= 50) {
      return {
        emoji: '😐',
        message: '절반 완료! 꾸준히 이어가세요!',
        color: '#f59e0b',
      };
    } else if (exerciseProgress >= 25) {
      return {
        emoji: '😔',
        message: '아직 시작이에요. 조금씩 움직여보세요!',
        color: '#ef4444',
      };
    } else {
      return {
        emoji: '😴',
        message: '오늘도 화이팅! 작은 움직임부터 시작해요!',
        color: '#6b7280',
      };
    }
  };

  const character = getCharacterState();

  const onRefresh = () => {
    setRefreshing(true);
    // 데이터 새로고침 로직
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요, 김건강님!</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Icon name="settings" size={24} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* 캐릭터 카드 */}
      <Card style={styles.cardMargin}>
        <View style={styles.characterContainer}>
          <Text style={styles.characterEmoji}>{character.emoji}</Text>
          <Text style={[styles.characterMessage, { color: character.color }]}>
            {character.message}
          </Text>
        </View>
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>오늘의 운동</Text>
          <ProgressBar
            value={current.exercise}
            max={dailyGoals.exercise}
            height={12}
          />
          <Text style={styles.progressText}>
            {current.exercise} / {dailyGoals.exercise}분
          </Text>
        </View>
      </Card>

      {/* 영양소 통계 그리드 */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <Icon name="zap" size={24} color="#ef4444" />
            <Text style={styles.statValue}>
              {current.calories}
              <Text style={styles.statUnit}>/{dailyGoals.calories}</Text>
            </Text>
            <Text style={styles.statLabel}>칼로리</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <Icon name="droplet" size={24} color="#3b82f6" />
            <Text style={styles.statValue}>
              {current.protein}
              <Text style={styles.statUnit}>/{dailyGoals.protein}g</Text>
            </Text>
            <Text style={styles.statLabel}>단백질</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <Icon name="sun" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>
              {current.carbs}
              <Text style={styles.statUnit}>/{dailyGoals.carbs}g</Text>
            </Text>
            <Text style={styles.statLabel}>탄수화물</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statCardInner}>
            <Icon name="circle" size={24} color="#10b981" />
            <Text style={styles.statValue}>
              {current.fat}
              <Text style={styles.statUnit}>/{dailyGoals.fat}g</Text>
            </Text>
            <Text style={styles.statLabel}>지방</Text>
          </View>
        </View>
      </View>

      {/* InBody 데이터 */}
      <Card style={styles.cardMargin}>
        <CardHeader>
          <View style={styles.cardHeaderRow}>
            <CardTitle>InBody 데이터</CardTitle>
            {inBodyData.isConnected && (
              <Badge variant="secondary">
                <Text style={styles.badgeText}>연결됨</Text>
              </Badge>
            )}
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.inBodyGrid}>
            <View style={styles.inBodyItem}>
              <Text style={styles.inBodyLabel}>체중</Text>
              <Text style={styles.inBodyValue}>{inBodyData.weight}kg</Text>
            </View>
            <View style={styles.inBodyItem}>
              <Text style={styles.inBodyLabel}>골격근량</Text>
              <Text style={styles.inBodyValue}>{inBodyData.muscleMass}kg</Text>
            </View>
            <View style={styles.inBodyItem}>
              <Text style={styles.inBodyLabel}>체지방률</Text>
              <Text style={styles.inBodyValue}>
                {inBodyData.bodyFatPercentage}%
              </Text>
            </View>
            <View style={styles.inBodyItem}>
              <Text style={styles.inBodyLabel}>BMI</Text>
              <Text style={styles.inBodyValue}>{inBodyData.bmi}</Text>
            </View>
          </View>
          <Text style={styles.lastUpdated}>
            마지막 측정: {inBodyData.lastUpdated}
          </Text>
        </CardContent>
      </Card>

      {/* 주간 차트 */}
      <Card style={styles.cardMargin}>
        <CardTitle>주간 운동 시간</CardTitle>
        <View style={styles.chartContainer}>
          <BarChart
            data={weeklyData}
            width={screenWidth - 64}
            height={220}
            yAxisSuffix="분"
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontSize: 12,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </View>
      </Card>

      {/* 달성 배지 */}
      <Card style={[styles.cardMargin, styles.lastCard]}>
        <CardTitle>달성 배지</CardTitle>
        <View style={styles.badgeContainer}>
          <View style={styles.achievementBadge}>
            <Icon name="award" size={32} color="#f59e0b" />
            <Text style={styles.achievementText}>7일 연속</Text>
          </View>
          <View style={styles.achievementBadge}>
            <Icon name="target" size={32} color="#10b981" />
            <Text style={styles.achievementText}>목표 달성</Text>
          </View>
          <View style={styles.achievementBadge}>
            <Icon name="trending-up" size={32} color="#3b82f6" />
            <Text style={styles.achievementText}>꾸준함</Text>
          </View>
        </View>
      </Card>
    </ScrollView>
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
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  cardMargin: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  lastCard: {
    marginBottom: 16,
  },
  characterContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  characterEmoji: {
    fontSize: 64,
  },
  characterMessage: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  progressContainer: {
    marginTop: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginTop: 16,
  },
  statCard: {
    width: '50%',
    padding: 8,
  },
  statCardInner: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 8,
  },
  statUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6b7280',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
  },
  inBodyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  inBodyItem: {
    width: '50%',
    paddingVertical: 8,
  },
  inBodyLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  inBodyValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 12,
  },
  chartContainer: {
    marginTop: 12,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  achievementBadge: {
    alignItems: 'center',
  },
  achievementText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
});
