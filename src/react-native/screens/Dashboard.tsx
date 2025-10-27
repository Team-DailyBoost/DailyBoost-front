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
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Feather as Icon } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

export function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const dailyGoals = {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
    exercise: 60
  };

  const current = {
    calories: 1650,
    protein: 95,
    carbs: 180,
    fat: 52,
    exercise: 45
  };

  // Character states based on exercise completion
  const exerciseProgress = (current.exercise / dailyGoals.exercise) * 100;
  
  const getCharacterState = () => {
    if (exerciseProgress >= 100) {
      return {
        emoji: '💪',
        body: '💪😁💪',
        message: '완벽해요! 오늘의 목표를 달성했어요!',
        mood: 'excellent',
        bgColor: '#dcfce7',
        borderColor: '#86efac',
        textColor: '#16a34a'
      };
    } else if (exerciseProgress >= 75) {
      return {
        emoji: '😊',
        body: '🙋‍♂️',
        message: '조금만 더 힘내세요! 거의 다 왔어요!',
        mood: 'good',
        bgColor: '#dbeafe',
        borderColor: '#93c5fd',
        textColor: '#2563eb'
      };
    } else if (exerciseProgress >= 50) {
      return {
        emoji: '😐',
        body: '🚶‍♂️',
        message: '절반 완료! 꾸준히 이어가세요!',
        mood: 'okay',
        bgColor: '#fef3c7',
        borderColor: '#fde047',
        textColor: '#ca8a04'
      };
    } else if (exerciseProgress >= 25) {
      return {
        emoji: '😔',
        body: '🤷‍♂️',
        message: '아직 시작이에요. 조금씩 움직여보세요!',
        mood: 'low',
        bgColor: '#fed7aa',
        borderColor: '#fdba74',
        textColor: '#ea580c'
      };
    } else {
      return {
        emoji: '😴',
        body: '🛌',
        message: '오늘도 화이팅! 작은 움직임부터 시작해요!',
        mood: 'sleepy',
        bgColor: '#f3f4f6',
        borderColor: '#d1d5db',
        textColor: '#6b7280'
      };
    }
  };

  const character = getCharacterState();

  // Mock InBody data
  const inBodyData = {
    weight: 69.5,
    muscleMass: 32.8,
    bodyFatPercentage: 12.3,
    bmi: 24.1,
    lastUpdated: '2024-03-15 09:30',
    isConnected: true
  };

  const weeklyData = {
    labels: ['월', '화', '수', '목', '금', '토', '일'],
    datasets: [{
      data: [1800, 2100, 1900, 2200, 1750, 2300, 1650]
    }]
  };

  const weightData = {
    labels: ['1주', '2주', '3주', '4주'],
    datasets: [{
      data: [70.5, 70.2, 69.8, 69.5]
    }]
  };

  const achievements = [
    { title: '7일 연속 기록', achieved: true },
    { title: '주간 운동 목표 달성', achieved: true },
    { title: '체중 감량 1kg', achieved: false }
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const ProgressBar = ({ current, goal, label, unit = 'g' }: {
    current: number;
    goal: number;
    label: string;
    unit?: string;
  }) => {
    const percentage = Math.min((current / goal) * 100, 100);
    
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>
            {current}{unit} / {goal}{unit}
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  const Card = ({ children, style }: { children: React.ReactNode; style?: any }) => (
    <View style={[styles.card, style]}>{children}</View>
  );

  const CardHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <View style={styles.cardHeader}>
      <View style={styles.cardTitleContainer}>
        {icon && <Icon name={icon as any} size={20} color="#1f2937" />}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>안녕하세요! 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="settings" size={22} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>김건</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Character Section */}
      <Card style={[
        styles.characterCard,
        { backgroundColor: character.bgColor, borderColor: character.borderColor }
      ]}>
        <View style={styles.characterContent}>
          <Text style={styles.characterEmoji}>{character.body}</Text>
          <Text style={[styles.characterMessage, { color: character.textColor }]}>
            {character.message}
          </Text>
          <View style={styles.progressInfo}>
            <Icon name="activity" size={16} color="#6b7280" />
            <Text style={styles.progressText}>
              운동 진행률: {exerciseProgress.toFixed(0)}%
            </Text>
          </View>
        </View>
      </Card>

      {/* InBody Data Section */}
      <Card>
        <CardHeader title="InBody 데이터" icon="bar-chart-2" />
        <View style={styles.cardContent}>
          {inBodyData.isConnected ? (
            <View style={styles.inBodyContainer}>
              <View style={styles.inBodyRow}>
                <View style={[styles.inBodyBox, styles.inBodyBoxGray]}>
                  <Text style={styles.inBodyValue}>{inBodyData.weight}kg</Text>
                  <Text style={styles.inBodyLabel}>체중</Text>
                </View>
                <View style={[styles.inBodyBox, styles.inBodyBoxBlue]}>
                  <Text style={[styles.inBodyValue, { color: '#2563eb' }]}>
                    {inBodyData.muscleMass}kg
                  </Text>
                  <Text style={styles.inBodyLabel}>골격근량</Text>
                </View>
              </View>
              
              <View style={styles.inBodyRow}>
                <View style={[styles.inBodyBox, styles.inBodyBoxGreen]}>
                  <Text style={[styles.inBodyValue, { color: '#16a34a' }]}>
                    {inBodyData.bodyFatPercentage}%
                  </Text>
                  <Text style={styles.inBodyLabel}>체지방률</Text>
                </View>
                <View style={[styles.inBodyBox, styles.inBodyBoxOrange]}>
                  <Text style={[styles.inBodyValue, { color: '#ea580c' }]}>
                    {inBodyData.bmi}
                  </Text>
                  <Text style={styles.inBodyLabel}>BMI</Text>
                </View>
              </View>
              
              <View style={styles.updateInfo}>
                <Icon name="zap" size={12} color="#6b7280" />
                <Text style={styles.updateText}>
                  마지막 업데이트: {inBodyData.lastUpdated}
                </Text>
              </View>
              
              <View style={styles.analysisBox}>
                <Text style={styles.analysisTitle}>InBody 분석</Text>
                <Text style={styles.analysisText}>
                  근육량이 평균보다 높고 체지방률이 적절한 상태입니다.
                  현재 컨디션을 유지하며 꾸준한 운동을 권장합니다.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.inBodyConnect}>
              <Icon name="bar-chart-2" size={48} color="#9ca3af" />
              <Text style={styles.connectTitle}>InBody 앱을 연동해보세요</Text>
              <Text style={styles.connectText}>
                체중, 골격근량, 체지방률을 자동으로{'\n'}
                동기화하여 정확한 건강 관리를 해보세요
              </Text>
              <TouchableOpacity style={styles.connectButton}>
                <Text style={styles.connectButtonText}>InBody 연동하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader title="오늘의 요약" icon="calendar" />
        <View style={styles.cardContent}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryBox, { backgroundColor: '#ede9fe' }]}>
              <Text style={[styles.summaryValue, { color: '#6366f1' }]}>
                {current.calories}
              </Text>
              <Text style={styles.summaryLabel}>섭취 칼로리</Text>
            </View>
            <View style={[styles.summaryBox, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
                {dailyGoals.calories - current.calories}
              </Text>
              <Text style={styles.summaryLabel}>남은 칼로리</Text>
            </View>
          </View>
          
          <View style={styles.progressSection}>
            <ProgressBar
              current={current.calories}
              goal={dailyGoals.calories}
              label="일일 칼로리 목표"
              unit="kcal"
            />
          </View>
        </View>
      </Card>

      {/* Nutrition Breakdown */}
      <Card>
        <CardHeader title="영양소 현황" icon="target" />
        <View style={styles.cardContent}>
          <ProgressBar current={current.protein} goal={dailyGoals.protein} label="단백질" />
          <ProgressBar current={current.carbs} goal={dailyGoals.carbs} label="탄수화물" />
          <ProgressBar current={current.fat} goal={dailyGoals.fat} label="지방" />
        </View>
      </Card>

      {/* Exercise Summary */}
      <Card>
        <CardHeader title="운동 현황" icon="activity" />
        <View style={styles.cardContent}>
          <ProgressBar
            current={current.exercise}
            goal={dailyGoals.exercise}
            label="운동 시간"
            unit="분"
          />
          <View style={styles.caloriesBurned}>
            <Icon name="trending-up" size={16} color="#6b7280" />
            <Text style={styles.caloriesBurnedText}>약 320kcal 소모</Text>
          </View>
        </View>
      </Card>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader title="주간 칼로리 현황" icon="trending-up" />
        <View style={styles.cardContent}>
          <BarChart
            data={weeklyData}
            width={screenWidth - 64}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 8
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e5e7eb',
                strokeWidth: 1
              }
            }}
            style={styles.chart}
            showValuesOnTopOfBars={false}
            withInnerLines={true}
            fromZero={true}
          />
          <Text style={styles.chartCaption}>이번 주 평균: 1,957kcal</Text>
        </View>
      </Card>

      {/* Weight Trend */}
      <Card>
        <CardHeader title="체중 변화 (최근 4주)" icon="trending-down" />
        <View style={styles.cardContent}>
          <LineChart
            data={weightData}
            width={screenWidth - 64}
            height={140}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
              style: {
                borderRadius: 8
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#6366f1'
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#e5e7eb',
                strokeWidth: 1
              }
            }}
            bezier
            style={styles.chart}
          />
          <Text style={[styles.chartCaption, { color: '#16a34a' }]}>
            -1.0kg 감량!
          </Text>
        </View>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader title="최근 성취" icon="award" />
        <View style={styles.cardContent}>
          {achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementItem}>
              <Text style={styles.achievementTitle}>{achievement.title}</Text>
              <View style={[
                styles.badge,
                achievement.achieved ? styles.badgeAchieved : styles.badgeInProgress
              ]}>
                <Text style={[
                  styles.badgeText,
                  achievement.achieved ? styles.badgeTextAchieved : styles.badgeTextInProgress
                ]}>
                  {achievement.achieved ? '완료' : '진행중'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionCard}>
          <Icon name="activity" size={32} color="#6366f1" />
          <Text style={styles.quickActionText}>운동 시작</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionCard}>
          <Icon name="target" size={32} color="#6366f1" />
          <Text style={styles.quickActionText}>식단 기록</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 8,
  },
  avatar: {
    backgroundColor: '#e5e7eb',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  characterCard: {
    borderWidth: 2,
  },
  characterContent: {
    padding: 24,
    alignItems: 'center',
  },
  characterEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  characterMessage: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  cardContent: {
    padding: 16,
  },
  inBodyContainer: {
    gap: 16,
  },
  inBodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inBodyBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  inBodyBoxGray: {
    backgroundColor: '#f9fafb',
  },
  inBodyBoxBlue: {
    backgroundColor: '#eff6ff',
  },
  inBodyBoxGreen: {
    backgroundColor: '#f0fdf4',
  },
  inBodyBoxOrange: {
    backgroundColor: '#fff7ed',
  },
  inBodyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  inBodyLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  updateText: {
    fontSize: 11,
    color: '#6b7280',
  },
  analysisBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  analysisTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  inBodyConnect: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 8,
  },
  connectText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressSection: {
    marginTop: 8,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  progressValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 4,
  },
  caloriesBurned: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  caloriesBurnedText: {
    fontSize: 13,
    color: '#6b7280',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartCaption: {
    textAlign: 'center',
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontWeight: '500',
  },
  achievementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 13,
    color: '#1f2937',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAchieved: {
    backgroundColor: '#6366f1',
  },
  badgeInProgress: {
    backgroundColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  badgeTextAchieved: {
    color: '#ffffff',
  },
  badgeTextInProgress: {
    color: '#6b7280',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 13,
    color: '#1f2937',
    marginTop: 8,
  },
});
