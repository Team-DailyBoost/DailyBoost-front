import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface UserProgress {
  userId: string;
  exp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lastReset: string;
}

const TIER_NAMES = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
  diamond: '다이아',
};

const TIER_ICONS = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  diamond: '👑',
};

export function MyPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  const currentUser = {
    name: '사용자',
    email: 'user@example.com',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 70,
    goal: 'weightLoss',
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userId = currentUser.email;
      const progress = await AsyncStorage.getItem(`userProgress_${userId}`);
      if (progress) {
        setUserProgress(JSON.parse(progress));
      }

      const savedFollowing = await AsyncStorage.getItem(`following_${userId}`);
      if (savedFollowing) {
        const followingList = JSON.parse(savedFollowing);
        setFollowing(followingList.length);
      }

      // Mock followers count
      setFollowers(12);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: async () => {
          await AsyncStorage.removeItem('currentUser');
          // Navigate to login screen
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '계정을 삭제하시겠습니까? 이 작업은 30일 이내에 복구할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            // Handle account deletion
          },
        },
      ]
    );
  };

  const goalLabels: Record<string, string> = {
    weightLoss: '체중 감량',
    muscleGain: '근육 증가',
    maintenance: '체중 유지',
    fitness: '체력 향상',
    health: '건강 관리',
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>마이페이지</Text>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{currentUser.name}</Text>
                {userProgress && (
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierIcon}>
                      {TIER_ICONS[userProgress.tier]}
                    </Text>
                    <Text style={styles.tierText}>
                      {TIER_NAMES[userProgress.tier]}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.email}>{currentUser.email}</Text>
              {userProgress && (
                <Text style={styles.exp}>
                  {userProgress.exp.toLocaleString()} EXP
                </Text>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>나이</Text>
              <Text style={styles.statValue}>{currentUser.age}세</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>성별</Text>
              <Text style={styles.statValue}>
                {currentUser.gender === 'male' ? '남성' : '여성'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>키</Text>
              <Text style={styles.statValue}>{currentUser.height}cm</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>몸무게</Text>
              <Text style={styles.statValue}>{currentUser.weight}kg</Text>
            </View>
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.goalLabel}>운동 목표</Text>
            <Text style={styles.goalValue}>
              {goalLabels[currentUser.goal] || '-'}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.activityStats}>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>45</Text>
              <Text style={styles.activityLabel}>운동일</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>7</Text>
              <Text style={styles.activityLabel}>연속일</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{followers}</Text>
              <Text style={styles.activityLabel}>팔로워</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityValue}>{following}</Text>
              <Text style={styles.activityLabel}>팔로잉</Text>
            </View>
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.settingsCard}>
          <Text style={styles.cardTitle}>설정</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <Text style={styles.settingText}>알림</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌙</Text>
              <Text style={styles.settingText}>다크 모드</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🌐</Text>
              <Text style={styles.settingText}>언어</Text>
            </View>
            <Text style={styles.settingRight}>한국어 ›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🛡️</Text>
              <Text style={styles.settingText}>개인정보 보호</Text>
            </View>
            <Text style={styles.settingRight}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>❓</Text>
              <Text style={styles.settingText}>도움말</Text>
            </View>
            <Text style={styles.settingRight}>›</Text>
          </TouchableOpacity>
        </Card>

        {/* Account Actions */}
        <View style={styles.actions}>
          <Button title="로그아웃" onPress={handleLogout} />
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteButtonText}>계정 삭제</Text>
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 20,
  },
  profileCard: {
    margin: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tierIcon: {
    fontSize: 14,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  email: {
    fontSize: 14,
    color: '#666',
  },
  exp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: '45%',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalSection: {
    marginTop: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  activityItem: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  settingsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIcon: {
    fontSize: 24,
  },
  settingText: {
    fontSize: 16,
  },
  settingRight: {
    fontSize: 16,
    color: '#666',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  deleteButton: {
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
