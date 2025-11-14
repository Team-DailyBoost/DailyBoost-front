import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from '../../services/userService';
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

type HealthGoal =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'STRENGTH_IMPROVEMENT'
  | 'ENDURANCE_IMPROVEMENT'
  | 'GENERAL_HEALTH_MAINTENANCE'
  | 'BODY_SHAPE_MANAGEMENT';

const HEALTH_GOAL_LABELS: Record<HealthGoal, string> = {
  WEIGHT_LOSS: '체중 감량',
  MUSCLE_GAIN: '근육 증가',
  STRENGTH_IMPROVEMENT: '근력 향상',
  ENDURANCE_IMPROVEMENT: '지구력 향상',
  GENERAL_HEALTH_MAINTENANCE: '건강 유지',
  BODY_SHAPE_MANAGEMENT: '체형 관리',
};

const PROVIDER_LABELS: Record<string, string> = {
  kakao: '카카오 로그인',
  naver: '네이버 로그인',
  google: '구글 로그인',
  local: '이메일 로그인',
};

export function MyPage({ onLoggedOut }: { onLoggedOut?: () => void }) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('user@example.com');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    age: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    height: '',
    weight: '',
    goal: 'GENERAL_HEALTH_MAINTENANCE' as HealthGoal,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const saved = await AsyncStorage.getItem('currentUser');
      const parsed = saved ? JSON.parse(saved) : null;
      let resolvedUser = parsed || {};

      // Try backend profile
      const profile = await UserService.getProfile();
      if (profile) {
        resolvedUser = { ...resolvedUser, ...profile };
        await AsyncStorage.setItem('currentUser', JSON.stringify(resolvedUser));
      }
      setCurrentUser(resolvedUser);

      const resolvedUserId =
        (resolvedUser?.email || parsed?.email || profile?.email || 'user@example.com') as string;
      setUserId(resolvedUserId);

      const progress = await AsyncStorage.getItem(`userProgress_${resolvedUserId}`);
      if (progress) {
        setUserProgress(JSON.parse(progress));
      }

      const savedFollowing = await AsyncStorage.getItem(`following_${resolvedUserId}`);
      if (savedFollowing) {
        const followingList = JSON.parse(savedFollowing);
        setFollowing(followingList.length);
      }

      setFollowers(12);

      // 프로필 사진 로드
      const savedProfileImage = await AsyncStorage.getItem(`profileImage_${resolvedUserId}`);
      if (savedProfileImage) {
        setProfileImage(savedProfileImage);
      } else if (resolvedUser?.profileImage) {
        setProfileImage(resolvedUser.profileImage);
      } else if (resolvedUser?.profileImageUrl) {
        setProfileImage(resolvedUser.profileImageUrl);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const pickProfileImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('알림', '사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setProfileImage(imageUri);
      const userId = currentUser?.email || 'user@example.com';
      
      // AsyncStorage에 저장
      await AsyncStorage.setItem(`profileImage_${userId}`, imageUri);
      
      // currentUser에도 저장
      const updatedUser = { ...currentUser, profileImage: imageUri };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      Alert.alert('완료', '프로필 사진이 설정되었습니다.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        onPress: async () => {
          try { await UserService.logout(); } catch {}
          try {
            await AsyncStorage.multiRemove([
              'currentUser',
              `userProgress_${currentUser?.email}`,
              `following_${currentUser?.email}`,
            ]);
          } catch {}
          Alert.alert('완료', '로그아웃되었습니다.');
          if (onLoggedOut) onLoggedOut();
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

  const healthInfo = currentUser?.healthInfo ?? {};
  const heightValue =
    healthInfo?.height !== undefined && healthInfo?.height !== null
      ? Number(healthInfo.height)
      : currentUser?.height !== undefined && currentUser?.height !== null
        ? Number(currentUser.height)
        : null;
  const weightValue =
    healthInfo?.weight !== undefined && healthInfo?.weight !== null
      ? Number(healthInfo.weight)
      : currentUser?.weight !== undefined && currentUser?.weight !== null
        ? Number(currentUser.weight)
        : null;
  const goalLabel =
    healthInfo?.goal && HEALTH_GOAL_LABELS[healthInfo.goal as HealthGoal]
      ? HEALTH_GOAL_LABELS[healthInfo.goal as HealthGoal]
      : '-';
  const genderLabel =
    currentUser?.gender === 'MALE'
      ? '남성'
      : currentUser?.gender === 'FEMALE'
        ? '여성'
        : currentUser?.gender === 'OTHER'
          ? '기타'
          : '-';
  const providerLabel =
    currentUser?.provider && PROVIDER_LABELS[currentUser.provider]
      ? PROVIDER_LABELS[currentUser.provider]
      : null;

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>마이페이지</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              // 프로필 수정 모달 열기
              setEditForm({
                name: currentUser.name || '',
                age: currentUser.age ? String(currentUser.age) : '',
                gender: (currentUser.gender as 'MALE' | 'FEMALE' | 'OTHER') || 'MALE',
                height: heightValue !== null ? String(heightValue) : '',
                weight: weightValue !== null ? String(weightValue) : '',
                goal: (healthInfo?.goal as HealthGoal) || 'GENERAL_HEALTH_MAINTENANCE',
              });
              setShowEditModal(true);
            }}
          >
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickProfileImage} style={styles.avatarContainer}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {currentUser.name?.charAt(0)?.toUpperCase() || '👤'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={styles.avatarEditText}>📷</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{currentUser.name || currentUser.nickname || '-'}</Text>
                {providerLabel && (
                  <Badge>{providerLabel}</Badge>
                )}
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
              <Text style={styles.email}>{currentUser.email || '-'}</Text>
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
              <Text style={styles.statValue}>
                {currentUser.age ? `${currentUser.age}세` : '-'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>성별</Text>
              <Text style={styles.statValue}>{genderLabel}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>키</Text>
              <Text style={styles.statValue}>
                {heightValue !== null && !Number.isNaN(heightValue) ? `${heightValue}cm` : '-'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>몸무게</Text>
              <Text style={styles.statValue}>
                {weightValue !== null && !Number.isNaN(weightValue) ? `${weightValue}kg` : '-'}
              </Text>
            </View>
          </View>

          <View style={styles.goalSection}>
            <Text style={styles.goalLabel}>운동 목표</Text>
            <Text style={styles.goalValue}>{goalLabel}</Text>
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

      {/* Profile Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>프로필 수정</Text>

            <Text style={styles.modalLabel}>이름</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="이름을 입력하세요"
              value={editForm.name}
              onChangeText={text => setEditForm({ ...editForm, name: text })}
            />

            <Text style={styles.modalLabel}>나이</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="나이를 입력하세요"
              keyboardType="numeric"
              value={editForm.age}
              onChangeText={text => setEditForm({ ...editForm, age: text })}
            />

            <Text style={styles.modalLabel}>성별</Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  editForm.gender === 'MALE' && styles.genderButtonActive,
                ]}
                onPress={() => setEditForm({ ...editForm, gender: 'MALE' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    editForm.gender === 'MALE' && styles.genderButtonTextActive,
                  ]}
                >
                  남성
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  editForm.gender === 'FEMALE' && styles.genderButtonActive,
                ]}
                onPress={() => setEditForm({ ...editForm, gender: 'FEMALE' })}
              >
                <Text
                  style={[
                    styles.genderButtonText,
                    editForm.gender === 'FEMALE' && styles.genderButtonTextActive,
                  ]}
                >
                  여성
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>키 (cm)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="키"
                  keyboardType="numeric"
                  value={editForm.height}
                  onChangeText={text => setEditForm({ ...editForm, height: text })}
                />
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>몸무게 (kg)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="몸무게"
                  keyboardType="numeric"
                  value={editForm.weight}
                  onChangeText={text => setEditForm({ ...editForm, weight: text })}
                />
              </View>
            </View>

            <Text style={styles.modalLabel}>운동 목표</Text>
            <View style={styles.goalButtons}>
              {Object.entries(HEALTH_GOAL_LABELS).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.goalButton,
                    editForm.goal === key && styles.goalButtonActive,
                  ]}
                  onPress={() => setEditForm({ ...editForm, goal: key as HealthGoal })}
                >
                  <Text
                    style={[
                      styles.goalButtonText,
                      editForm.goal === key && styles.goalButtonTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="취소"
                onPress={() => setShowEditModal(false)}
                variant="outline"
              />
              <Button
                title="저장"
                onPress={async () => {
                  if (!editForm.name.trim()) {
                    Alert.alert('알림', '이름을 입력해주세요');
                    return;
                  }
                  
                  const parsedAge = editForm.age.trim().length > 0 ? String(parseInt(editForm.age, 10)) : undefined;
                  const parsedHeight =
                    editForm.height.trim().length > 0 && !Number.isNaN(Number(editForm.height))
                      ? Number(editForm.height)
                      : heightValue ?? undefined;
                  const parsedWeight =
                    editForm.weight.trim().length > 0 && !Number.isNaN(Number(editForm.weight))
                      ? Number(editForm.weight)
                      : weightValue ?? undefined;

                  const updatePayload = {
                    age: parsedAge,
                    gender: editForm.gender,
                    healthInfo: {
                      height: parsedHeight,
                      weight: parsedWeight,
                      goal: editForm.goal,
                    },
                  };

                  const updatedUser = {
                    ...currentUser,
                    name: editForm.name,
                    age: parsedAge ?? currentUser.age,
                    gender: editForm.gender,
                    healthInfo: {
                      ...healthInfo,
                      height: parsedHeight,
                      weight: parsedWeight,
                      goal: editForm.goal,
                    },
                  };
                  
                  try {
                    // 백엔드에 프로필 업데이트 요청
                    await UserService.updateProfile(updatePayload);
                    setCurrentUser(updatedUser);
                    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    Alert.alert('완료', '프로필이 수정되었습니다');
                    setShowEditModal(false);
                  } catch (error) {
                    console.error('프로필 업데이트 실패:', error);
                    // 백엔드 실패해도 로컬 저장
                    setCurrentUser(updatedUser);
                    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    Alert.alert('완료', '프로필이 수정되었습니다');
                    setShowEditModal(false);
                  }
                }}
              />
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80, // 탭바 높이 + 여유 공간
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
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 32,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatarEditText: {
    fontSize: 12,
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
    width: '90%',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
    color: '#333',
  },
  modalInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 16,
    color: '#000',
    marginBottom: 4,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  modalColumn: {
    flex: 1,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  genderButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  goalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  goalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  goalButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  goalButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  goalButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
});
