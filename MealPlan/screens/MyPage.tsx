import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Card, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import type { UserInfo } from '../types';

export function MyPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const userInfo: UserInfo = {
    name: '김건강',
    email: 'kim.health@example.com',
    joinDate: '2024년 1월 15일',
    level: '골드',
    totalWorkouts: 127,
    totalDays: 89,
    achievements: 12,
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => {
          // 로그아웃 로직
          Alert.alert('알림', '로그아웃 되었습니다.');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 삭제',
      '정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            Alert.alert('알림', '계정이 삭제되었습니다.');
          },
        },
      ]
    );
  };

  interface MenuItemProps {
    icon: string;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    rightElement,
    destructive = false,
  }: MenuItemProps) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Icon
          name={icon}
          size={20}
          color={destructive ? '#ef4444' : '#6b7280'}
        />
        <View style={styles.menuTextContainer}>
          <Text style={[styles.menuTitle, destructive && styles.menuTitleDestructive]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {rightElement || (showArrow && <Icon name="chevron-right" size={20} color="#9ca3af" />)}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* 프로필 카드 */}
        <Card style={styles.card}>
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Icon name="user" size={40} color="#6b7280" />
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{userInfo.name}</Text>
                <Badge>{userInfo.level}</Badge>
              </View>
              <Text style={styles.userEmail}>{userInfo.email}</Text>
              <Text style={styles.joinDate}>가입일: {userInfo.joinDate}</Text>
            </View>
          </View>

          {/* 통계 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userInfo.totalWorkouts}</Text>
              <Text style={styles.statLabel}>운동 횟수</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userInfo.totalDays}</Text>
              <Text style={styles.statLabel}>연속 일수</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userInfo.achievements}</Text>
              <Text style={styles.statLabel}>달성 배지</Text>
            </View>
          </View>
        </Card>

        {/* 계정 설정 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>계정</Text>
        </View>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="user"
            title="프로필 수정"
            onPress={() => Alert.alert('알림', '프로필 수정 화면')}
          />
          <MenuItem
            icon="mail"
            title="이메일 변경"
            subtitle={userInfo.email}
            onPress={() => Alert.alert('알림', '이메일 변경 화면')}
          />
          <MenuItem
            icon="lock"
            title="비밀번호 변경"
            onPress={() => Alert.alert('알림', '비밀번호 변경 화면')}
          />
        </Card>

        {/* 앱 설정 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>설정</Text>
        </View>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="bell"
            title="알림 설정"
            subtitle="운동 리마인더 및 알림"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={notificationsEnabled ? '#6366f1' : '#f3f4f6'}
              />
            }
          />
          <MenuItem
            icon="moon"
            title="다크 모드"
            onPress={() => {}}
            showArrow={false}
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#e5e7eb', true: '#93c5fd' }}
                thumbColor={darkModeEnabled ? '#6366f1' : '#f3f4f6'}
              />
            }
          />
          <MenuItem
            icon="target"
            title="목표 설정"
            subtitle="일일 목표 칼로리 및 영양소"
            onPress={() => Alert.alert('알림', '목표 설정 화면')}
          />
        </Card>

        {/* 데이터 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>데이터</Text>
        </View>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="download"
            title="데이터 내보내기"
            subtitle="운동 및 식단 기록 다운로드"
            onPress={() => Alert.alert('알림', '데이터 내보내기 기능')}
          />
          <MenuItem
            icon="upload"
            title="데이터 가져오기"
            onPress={() => Alert.alert('알림', '데이터 가져오기 기능')}
          />
          <MenuItem
            icon="refresh-cw"
            title="InBody 연동"
            subtitle="InBody 기기와 연동"
            onPress={() => Alert.alert('알림', 'InBody 연동 화면')}
          />
        </Card>

        {/* 지원 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>지원</Text>
        </View>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="help-circle"
            title="도움말 및 FAQ"
            onPress={() => Alert.alert('알림', '도움말 화면')}
          />
          <MenuItem
            icon="message-circle"
            title="문의하기"
            onPress={() => Alert.alert('알림', '문의하기 화면')}
          />
          <MenuItem
            icon="info"
            title="앱 정보"
            subtitle="버전 1.0.0"
            onPress={() => Alert.alert('앱 정보', '피트니스 앱 v1.0.0')}
          />
        </Card>

        {/* 계정 관리 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
        </View>
        <Card style={styles.menuCard}>
          <MenuItem
            icon="log-out"
            title="로그아웃"
            onPress={handleLogout}
            showArrow={false}
          />
          <MenuItem
            icon="trash-2"
            title="계정 삭제"
            subtitle="모든 데이터가 영구적으로 삭제됩니다"
            onPress={handleDeleteAccount}
            showArrow={false}
            destructive
          />
        </Card>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
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
  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  menuCard: {
    marginHorizontal: 16,
    paddingVertical: 0,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginRight: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    color: '#1f2937',
  },
  menuTitleDestructive: {
    color: '#ef4444',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  bottomSpacer: {
    height: 32,
  },
});
