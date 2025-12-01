import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserService } from '../../services/userService';
import { Feather as Icon } from '@expo/vector-icons';
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
  bronze: 'award',
  silver: 'award',
  gold: 'award',
  platinum: 'gem',
  diamond: 'crown',
} as const;

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
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // 화면이 포커스를 받을 때마다 사용자 데이터 로드
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      console.log('[MyPage] 사용자 정보 로드 시작');
      
      const saved = await AsyncStorage.getItem('currentUser');
      const parsed = saved ? JSON.parse(saved) : null;
      let resolvedUser = parsed || {};

      console.log('[MyPage] AsyncStorage에서 로드한 사용자 정보:', {
        hasUser: !!parsed,
        userKeys: parsed ? Object.keys(parsed) : [],
        email: parsed?.email,
        id: parsed?.id,
        age: parsed?.age,
        gender: parsed?.gender,
        healthInfo: parsed?.healthInfo,
        fullUser: parsed, // 전체 사용자 정보 로깅
      });

      // 먼저 로컬 저장소의 정보를 표시 (빠른 로딩)
      if (resolvedUser && Object.keys(resolvedUser).length > 0) {
        console.log('[MyPage] 로컬 사용자 정보 설정:', {
          name: resolvedUser.name || resolvedUser.nickname,
          email: resolvedUser.email,
          age: resolvedUser.age,
          gender: resolvedUser.gender,
          healthInfo: resolvedUser.healthInfo,
          hasHealthInfo: !!resolvedUser.healthInfo,
        });
        setCurrentUser(resolvedUser);
      } else {
        console.warn('[MyPage] 로컬에 저장된 사용자 정보가 없습니다');
        // 로컬 정보가 없어도 기본값으로 설정
        setCurrentUser({});
      }

      // JWT 토큰에서 ID 추출 시도
      let currentUserId: string | number | null = resolvedUser?.id || parsed?.id;
      
      // id가 문자열이면 숫자로 변환 시도
      if (currentUserId && typeof currentUserId === 'string') {
        const numericId = Number(currentUserId);
        if (!isNaN(numericId) && numericId > 0) {
          currentUserId = numericId;
        } else {
          currentUserId = null;
        }
      }
      
      // id가 숫자가 아니거나 0 이하면 null로 처리
      if (currentUserId && (typeof currentUserId !== 'number' || currentUserId <= 0)) {
        currentUserId = null;
      }

      if (!currentUserId) {
        try {
          const token = await AsyncStorage.getItem('@accessToken');
          if (token) {
            // JWT 토큰 디코딩
            const segments = token.split('.');
            if (segments.length >= 2) {
              try {
                const base = segments[1].replace(/-/g, '+').replace(/_/g, '/');
                const padded = base.padEnd(Math.ceil(base.length / 4) * 4, '=');
                const Buffer = (await import('buffer')).Buffer;
                const decoded = Buffer.from(padded, 'base64').toString('utf8');
                const payload = JSON.parse(decoded);
                
                console.log('[MyPage] JWT payload:', {
                  hasId: !!payload?.id,
                  hasUserId: !!payload?.userId,
                  hasSub: !!payload?.sub,
                  hasEmail: !!payload?.email,
                  sub: payload?.sub,
                });
                
                // JWT payload에서 id 추출 시도
                // 백엔드는 id를 포함하지 않을 수 있고, email만 있을 수 있음
                // email로는 userId를 찾을 수 없으므로, 현재 로그인한 사용자 정보는 로컬에 저장된 것만 사용
                // 추후 백엔드에 현재 로그인한 사용자 조회 API가 추가되면 사용 가능
              } catch (e) {
                console.warn('[MyPage] JWT 디코딩 실패:', e);
              }
            }
          }
        } catch (e) {
          console.warn('[MyPage] JWT 토큰 읽기 실패:', e);
        }
      }

      // 백엔드 프로필 조회 (userId가 숫자일 때만)
      let backendProfile = null;
      
      if (currentUserId && typeof currentUserId === 'number') {
        try {
          console.log('[MyPage] 백엔드에서 사용자 프로필 조회 시도:', currentUserId);
          backendProfile = await UserService.getProfile(currentUserId);
          
          if (backendProfile) {
            console.log('[MyPage] 백엔드 프로필 조회 성공:', {
              name: backendProfile.name,
              email: backendProfile.email,
              hasGender: !!backendProfile.gender,
            });
            
            // 백엔드 프로필과 병합하되, 로컬의 나이/헬스 정보는 절대 덮어쓰지 않음
            // 백엔드 UserResponse에는 healthInfo와 age가 포함되지 않으므로 로컬 값을 보존
            // 중요한 것: resolvedUser의 age와 healthInfo를 명시적으로 보존
            const savedAge = resolvedUser?.age;
            const savedHealthInfo = resolvedUser?.healthInfo;
            const savedGender = resolvedUser?.gender;
            
            console.log('[MyPage] 백엔드 병합 전 로컬 데이터:', {
              savedAge,
              savedHealthInfo,
              savedGender,
            });
            
            resolvedUser = { 
              ...resolvedUser, // 로컬 정보를 먼저 유지
              ...backendProfile, // 백엔드 기본 정보로 덮어쓰기 (name, email, nickname, gender 등)
              // 로컬에 저장된 나이, 헬스 정보는 절대 덮어쓰지 않음 (백엔드 UserResponse에는 없음)
              age: savedAge || null, // 명시적으로 로컬 값 보존
              healthInfo: savedHealthInfo || null, // 명시적으로 로컬 값 보존
              // 백엔드의 gender는 사용하되, 로컬 값이 있으면 우선 (백엔드가 더 정확할 수 있으므로 백엔드 우선)
              gender: backendProfile?.gender || savedGender || null,
              // name, nickname은 백엔드 우선
              name: backendProfile?.name || resolvedUser?.name || resolvedUser?.nickname,
              nickname: backendProfile?.nickname || resolvedUser?.nickname || resolvedUser?.name,
            };
            
            console.log('[MyPage] 백엔드 병합 후:', {
              age: resolvedUser.age,
              healthInfo: resolvedUser.healthInfo,
              gender: resolvedUser.gender,
            });
            
            await AsyncStorage.setItem('currentUser', JSON.stringify(resolvedUser));
            setCurrentUser(resolvedUser);
          } else {
            console.log('[MyPage] 백엔드 프로필 조회 결과: null (404 또는 에러)');
          }
        } catch (profileError: any) {
          console.warn('[MyPage] 백엔드 프로필 조회 실패:', profileError?.message || profileError);
          // 백엔드 조회 실패해도 로컬 데이터는 사용
        }
      } else {
        console.log('[MyPage] userId가 없어 백엔드 프로필 조회 스킵:', currentUserId);
      }

      // 헬스 정보가 없으면 별도로 확인 (헬스 정보 등록 후 저장되지 않았을 수 있음)
      if (!resolvedUser?.healthInfo && !resolvedUser?.age && !resolvedUser?.gender) {
        console.log('[MyPage] 헬스 정보가 없어 별도 확인 시도');
        // 헬스 정보가 별도로 저장되어 있는지 확인 (예: @healthInfo:{email})
        try {
          const healthFlagKey = `@healthInfoInitialized:${resolvedUser?.email || parsed?.email || ''}`;
          const healthFlag = await AsyncStorage.getItem(healthFlagKey);
          if (healthFlag === '1') {
            console.log('[MyPage] 헬스 정보 플래그가 있지만 currentUser에 정보가 없음 - 헬스 정보 등록 후 저장이 누락된 것으로 보임');
            // 헬스 정보가 등록되었지만 currentUser에 저장되지 않은 경우
            // 사용자에게 프로필 수정을 통해 다시 입력하도록 안내하거나
            // 백엔드에서 가져올 수 있는 방법을 찾아야 함
          }
        } catch (e) {
          console.warn('[MyPage] 헬스 정보 플래그 확인 실패:', e);
        }
      }

      // 최종 사용자 정보 설정
      const resolvedUserId =
        (resolvedUser?.email || parsed?.email || backendProfile?.email || 'user@example.com') as string;
      setUserId(resolvedUserId);
      
      console.log('[MyPage] 최종 사용자 정보:', {
        name: resolvedUser?.name || resolvedUser?.nickname,
        email: resolvedUser?.email,
        userId: resolvedUserId,
        hasHealthInfo: !!resolvedUser?.healthInfo,
        hasAge: !!resolvedUser?.age,
        hasGender: !!resolvedUser?.gender,
        healthInfo: resolvedUser?.healthInfo,
        age: resolvedUser?.age,
        gender: resolvedUser?.gender,
      });

      // 기타 데이터 로드
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
      
      console.log('[MyPage] 사용자 정보 로드 완료');
    } catch (error: any) {
      console.error('[MyPage] 사용자 정보 로드 중 에러:', error?.message || error);
      // 에러가 나도 최소한의 정보는 표시
      try {
        const saved = await AsyncStorage.getItem('currentUser');
        const parsed = saved ? JSON.parse(saved) : null;
        if (parsed && Object.keys(parsed).length > 0) {
          setCurrentUser(parsed);
          setUserId(parsed?.email || 'user@example.com');
        }
      } catch (fallbackError) {
        console.error('[MyPage] Fallback 로드도 실패:', fallbackError);
      }
    }
  };

  const uploadProfileImageToServer = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingProfile(true);
      const filePayload = {
        uri: asset.uri,
        name: asset.fileName || `profile-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };
      const response = await UserService.updateProfile({}, filePayload);
      if (!response.success) {
        throw new Error(response.error || '프로필 이미지를 업로드하지 못했습니다.');
      }
      Alert.alert('완료', response.data?.message || '프로필 사진이 업데이트되었습니다.');
    } catch (error: any) {
      Alert.alert('업로드 실패', error?.message || '프로필 이미지를 업로드하지 못했습니다.');
    } finally {
      setUploadingProfile(false);
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
      const selectedAsset = result.assets[0];
      const imageUri = selectedAsset.uri;
      setProfileImage(imageUri);
      const userId = currentUser?.email || 'user@example.com';
      
      // AsyncStorage에 저장
      await AsyncStorage.setItem(`profileImage_${userId}`, imageUri);
      
      // currentUser에도 저장
      const updatedUser = { ...currentUser, profileImage: imageUri };
      setCurrentUser(updatedUser);
      await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      await uploadProfileImageToServer(selectedAsset);
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
            try {
              const response = await UserService.deleteAccount();
              if (!response.success) {
                Alert.alert('삭제 실패', response.error || '계정 삭제 중 오류가 발생했습니다.');
                return;
              }
              await AsyncStorage.multiRemove([
                'currentUser',
                `userProgress_${currentUser?.email}`,
                `following_${currentUser?.email}`,
                `profileImage_${currentUser?.email}`,
              ]);
              Alert.alert('완료', response.data?.message || '계정이 삭제되었습니다.');
              if (onLoggedOut) onLoggedOut();
            } catch (error) {
              Alert.alert('삭제 실패', '계정 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  // healthInfo는 객체일 수도 있고, 없을 수도 있음
  const healthInfo = (currentUser?.healthInfo && typeof currentUser.healthInfo === 'object') 
    ? currentUser.healthInfo 
    : {};
  
  console.log('[MyPage] 현재 사용자 정보 추출:', {
    hasCurrentUser: !!currentUser,
    hasHealthInfo: !!currentUser?.healthInfo,
    healthInfoType: typeof currentUser?.healthInfo,
    healthInfo: currentUser?.healthInfo,
    age: currentUser?.age,
    gender: currentUser?.gender,
    heightFromHealthInfo: healthInfo?.height,
    weightFromHealthInfo: healthInfo?.weight,
    goalFromHealthInfo: healthInfo?.goal,
  });
  
  const heightValue =
    (healthInfo?.height !== undefined && healthInfo?.height !== null)
      ? Number(healthInfo.height)
      : (currentUser?.height !== undefined && currentUser?.height !== null)
        ? Number(currentUser.height)
        : null;
  const weightValue =
    (healthInfo?.weight !== undefined && healthInfo?.weight !== null)
      ? Number(healthInfo.weight)
      : (currentUser?.weight !== undefined && currentUser?.weight !== null)
        ? Number(currentUser.weight)
        : null;
  const goalLabel =
    (healthInfo?.goal && HEALTH_GOAL_LABELS[healthInfo.goal as HealthGoal])
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
  
  console.log('[MyPage] 추출된 값:', {
    heightValue,
    weightValue,
    goalLabel,
    genderLabel,
    age: currentUser?.age,
    currentUserKeys: currentUser ? Object.keys(currentUser) : [],
    currentUserAge: currentUser?.age,
    currentUserGender: currentUser?.gender,
    currentUserHealthInfo: currentUser?.healthInfo,
  });
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
              {uploadingProfile && (
                <View style={styles.avatarUploadingOverlay}>
                  <ActivityIndicator color="#fff" />
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
                    <Icon name={TIER_ICONS[userProgress.tier] as any} size={24} color="#6366f1" />
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
            <ScrollView
              contentContainerStyle={styles.modalScrollContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
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
                  style={styles.modalColumnInput}
                  placeholder="키"
                  keyboardType="numeric"
                  value={editForm.height}
                  onChangeText={text => setEditForm({ ...editForm, height: text })}
                />
              </View>
              <View style={styles.modalColumn}>
                <Text style={styles.modalLabel}>몸무게 (kg)</Text>
                <TextInput
                  style={styles.modalColumnInput}
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
              />
              <Button
                title="저장"
                loading={updatingProfile}
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
                    setUpdatingProfile(true);
                    // 백엔드에 프로필 업데이트 요청
                    const response = await UserService.updateProfile(updatePayload);
                    setUpdatingProfile(false);
                    if (!response.success) {
                      throw new Error(response.error || '프로필 수정 실패');
                    }
                    setCurrentUser(updatedUser);
                    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    Alert.alert('완료', response.data?.message || '프로필이 수정되었습니다');
                    setShowEditModal(false);
                  } catch (error) {
                    setUpdatingProfile(false);
                    // 백엔드 실패해도 로컬 저장
                    setCurrentUser(updatedUser);
                    await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    Alert.alert('알림', '서버 동기화에 실패했지만 로컬 정보는 업데이트되었습니다.');
                    setShowEditModal(false);
                  }
                }}
              />
            </View>
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
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
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
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  editButtonText: {
    fontSize: 22,
  },
  profileCard: {
    margin: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarUploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366f1',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#6366f1',
  },
  tierText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6366f1',
  },
  email: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  exp: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
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
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
    letterSpacing: -0.3,
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
    alignSelf: 'center',
  },
  modalScrollContentContainer: {
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    fontSize: 15,
    color: '#0f172a',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modalColumn: {
    flex: 1,
  },
  modalColumnInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 0,
    fontSize: 15,
    color: '#0f172a',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  genderButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  genderButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  goalButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  goalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  goalButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  goalButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  goalButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
});
