import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Buffer } from 'buffer';
import { API_CONFIG } from '../../../config/api';
import { api } from '../../../services/api';
import { UserService } from '../../../services/userService';
import { getFoodRecommendations } from '../../../api/foods';
import { normalizeFoodRecommendations } from '../../../utils/foodRecommendation';

type GoalType =
  | 'WEIGHT_LOSS'
  | 'MUSCLE_GAIN'
  | 'STRENGTH_IMPROVEMENT'
  | 'ENDURANCE_IMPROVEMENT'
  | 'GENERAL_HEALTH_MAINTENANCE'
  | 'BODY_SHAPE_MANAGEMENT';

const GOAL_OPTIONS: Array<{ label: string; value: GoalType }> = [
  { label: '체중 감량', value: 'WEIGHT_LOSS' },
  { label: '근육 증가', value: 'MUSCLE_GAIN' },
  { label: '근력 향상', value: 'STRENGTH_IMPROVEMENT' },
  { label: '지구력 향상', value: 'ENDURANCE_IMPROVEMENT' },
  { label: '건강 유지', value: 'GENERAL_HEALTH_MAINTENANCE' },
  { label: '체형 관리', value: 'BODY_SHAPE_MANAGEMENT' },
];

const HEALTH_INFO_FLAG_PREFIX = '@healthInfoInitialized';
const SOCIAL_PROVIDERS: Array<'kakao' | 'naver'> = ['kakao', 'naver'];

function decodeJwtPayload(token: string | null | undefined): Record<string, any> | null {
  if (!token || typeof token !== 'string') {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const base = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base.padEnd(Math.ceil(base.length / 4) * 4, '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('JWT 디코딩 실패:', error);
    return null;
  }
}

interface LoginProps {
  onLoggedIn: () => void;
}

function makeHealthFlagKey(email?: string | null): string {
  if (email && typeof email === 'string' && email.length > 0) {
    return `${HEALTH_INFO_FLAG_PREFIX}:${email}`;
  }
  return HEALTH_INFO_FLAG_PREFIX;
}

export function LoginScreen({ onLoggedIn }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<'kakao' | 'naver' | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [webViewLoading, setWebViewLoading] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthHeight, setHealthHeight] = useState('');
  const [healthWeight, setHealthWeight] = useState('');
  const [healthGoal, setHealthGoal] = useState<GoalType>('GENERAL_HEALTH_MAINTENANCE');
  const [submittingHealth, setSubmittingHealth] = useState(false);
  const [healthFlagKey, setHealthFlagKey] = useState<string>(() => HEALTH_INFO_FLAG_PREFIX);
  const webViewRef = useRef<WebView | null>(null);
  const currentProviderRef = useRef<'kakao' | 'naver' | null>(null);
  const handledAuthRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('currentUser');
        if (!raw) {
          setHealthFlagKey(HEALTH_INFO_FLAG_PREFIX);
          return;
        }
        const parsed = JSON.parse(raw);
        const key = makeHealthFlagKey(parsed?.email);
        setHealthFlagKey(key);
      } catch (error) {
        console.error('헬스 정보 플래그 키 결정 실패:', error);
        setHealthFlagKey(HEALTH_INFO_FLAG_PREFIX);
      }
    })();
  }, []);

  const ensureHealthInfoFlow = useCallback(async (overrideKey?: string) => {
    const keyToCheck = overrideKey ?? healthFlagKey;
    try {
      const initialized = await AsyncStorage.getItem(keyToCheck);
      if (initialized === '1') {
        onLoggedIn();
        return;
      }
      setShowHealthModal(true);
    } catch (error) {
      console.error('헬스 정보 초기화 여부 확인 실패:', error);
      onLoggedIn();
    }
  }, [healthFlagKey, onLoggedIn]);

  const handleAuthSuccess = useCallback(
    async (accessToken: string | null, refreshToken: string | null) => {
      if (handledAuthRef.current) {
        return;
      }
      handledAuthRef.current = true;

      try {
        setShowWebView(false);
        setWebViewLoading(false);
        setCurrentProvider(null);
        setLoading(false);

        let normalizedAccess: string | null = null;

        if (accessToken) {
          normalizedAccess = accessToken.startsWith('Bearer ') ? accessToken : `Bearer ${accessToken}`;
          await api.setAuthToken(normalizedAccess);
          await AsyncStorage.setItem('@accessToken', normalizedAccess.replace(/^Bearer\s+/i, ''));
        }
        if (refreshToken) {
          await AsyncStorage.setItem('@refreshToken', refreshToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
        }

        const existingUserRaw = await AsyncStorage.getItem('currentUser');
        const existingUser = existingUserRaw ? JSON.parse(existingUserRaw) : {};

        const payload = decodeJwtPayload(accessToken);
        const emailFromToken =
          payload?.email ??
          existingUser?.email ??
          null;
        const nameFromToken =
          payload?.nickname ??
          payload?.name ??
          existingUser?.name ??
          (emailFromToken ? emailFromToken.split('@')[0] : null);

        const provider = currentProviderRef.current;
        const userSnapshot = {
          ...existingUser,
          email: emailFromToken,
          name: nameFromToken,
          nickname: payload?.nickname ?? existingUser?.nickname ?? nameFromToken,
          provider,
          role: payload?.role ?? existingUser?.role ?? null,
          loginAt: Date.now(),
        };

        await AsyncStorage.setItem('currentUser', JSON.stringify(userSnapshot));

        const healthKey = makeHealthFlagKey(emailFromToken);
        setHealthFlagKey(healthKey);
        currentProviderRef.current = null;

        try {
          const recommendations = await getFoodRecommendations();
          const normalized = normalizeFoodRecommendations(recommendations);
          await AsyncStorage.setItem('@foodRecommendations', JSON.stringify(normalized));
        } catch (foodError) {
          console.error('식단 추천 요청 실패:', foodError);
          Alert.alert(
            '식단 추천 준비 중',
            '헬스 정보는 저장되었지만 식단 추천 생성에 실패했습니다. 잠시 후 다시 시도하거나 개발팀에 문의해주세요.',
          );
        }

        await ensureHealthInfoFlow(healthKey);
      } catch (error) {
        handledAuthRef.current = false;
        throw error;
      }
    },
    [ensureHealthInfoFlow],
  );

  const handleDeepLinkUrl = useCallback(
    (incomingUrl: string | null | undefined) => {
      if (!incomingUrl || typeof incomingUrl !== 'string') {
        return false;
      }

      if (!incomingUrl.startsWith('dailyboost://')) {
        return false;
      }

      try {
        const [, queryString = ''] = incomingUrl.split('?');
        if (!queryString) {
          return false;
        }

        const params = queryString.split('&').reduce<Record<string, string>>((acc, part) => {
          const [rawKey, rawValue] = part.split('=');
          if (!rawKey) {
            return acc;
          }
          const key = decodeURIComponent(rawKey);
          const value = decodeURIComponent(rawValue ?? '');
          acc[key] = value;
          return acc;
        }, {});

        const access = params.access ?? null;
        const refresh = params.refresh ?? null;

        if (!access && !refresh) {
          return false;
        }

        handleAuthSuccess(access, refresh).catch((error) => {
          console.error('딥링크 인증 처리 실패:', error);
        });
        return true;
      } catch (error) {
        console.error('딥링크 URL 파싱 실패:', error);
        return false;
      }
    },
    [handleAuthSuccess],
  );

  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLinkUrl(url);
    });

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (initialUrl) {
          handleDeepLinkUrl(initialUrl);
        }
      })
      .catch((error) => {
        console.error('초기 URL 처리 실패:', error);
      });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLinkUrl]);

  const goalButtons = useMemo(
    () =>
      GOAL_OPTIONS.map((option) => {
        const selected = option.value === healthGoal;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.goalButton, selected && styles.goalButtonSelected]}
            onPress={() => setHealthGoal(option.value)}
          >
            <Text style={selected ? styles.goalButtonTextSelected : styles.goalButtonText}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      }),
    [healthGoal],
  );

  const handleHealthSubmit = async () => {
    const heightValue = Number(healthHeight);
    const weightValue = Number(healthWeight);

    if (Number.isNaN(heightValue) || heightValue <= 0) {
      Alert.alert('입력 오류', '키를 올바르게 입력해주세요.');
      return;
    }

    if (Number.isNaN(weightValue) || weightValue <= 0) {
      Alert.alert('입력 오류', '몸무게를 올바르게 입력해주세요.');
      return;
    }

    try {
      setSubmittingHealth(true);
      const result = await UserService.initUserInfo({
        healthInfo: {
          height: heightValue,
          weight: weightValue,
          goal: healthGoal,
        },
      });

      if (!result.success) {
        Alert.alert('등록 실패', result.error || '헬스 정보 등록에 실패했습니다.');
        setSubmittingHealth(false);
        return;
      }

      try {
        const recommendations = await getFoodRecommendations();
        const normalized = normalizeFoodRecommendations(recommendations);
        await AsyncStorage.setItem('@foodRecommendations', JSON.stringify(normalized));
      } catch (foodError) {
        console.error('식단 추천 요청 실패:', foodError);
      }

      try {
        const currentUserRaw = await AsyncStorage.getItem('currentUser');
        if (currentUserRaw) {
          const parsed = JSON.parse(currentUserRaw);
          const updatedUser = {
            ...parsed,
            healthInfo: {
              height: heightValue,
              weight: weightValue,
              goal: healthGoal,
            },
          };
          await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      } catch (userUpdateError) {
        console.error('헬스 정보 사용자 저장 실패:', userUpdateError);
      }

      await AsyncStorage.setItem(healthFlagKey, '1');
      setShowHealthModal(false);
      setSubmittingHealth(false);
      onLoggedIn();
    } catch (error) {
      console.error('헬스 정보 등록 실패:', error);
      Alert.alert('등록 실패', '헬스 정보를 저장하는 중 오류가 발생했습니다.');
      setSubmittingHealth(false);
    }
  };

  const handleSocialLogin = (provider: 'kakao' | 'naver') => {
    handledAuthRef.current = false;
    setCurrentProvider(provider);
    currentProviderRef.current = provider;
    setWebViewUrl(`${API_CONFIG.BASE_URL}/oauth2/authorization/${provider}`);
    setShowWebView(true);
    setWebViewLoading(true);
  };

  const handleLocalLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력하세요.');
      return;
    }

    try {
      setLoading(true);
      const mockUser = {
        email,
        name: email.split('@')[0],
        id: `local_${Date.now()}`,
        provider: 'local',
      };
      await AsyncStorage.setItem('currentUser', JSON.stringify(mockUser));
      await AsyncStorage.removeItem('@accessToken');
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('@sessionCookie');
      await AsyncStorage.removeItem('backend:session-cookie');
      await AsyncStorage.setItem(makeHealthFlagKey(email), '1');
      onLoggedIn();
    } catch (error) {
      console.error('로컬 로그인 실패:', error);
      Alert.alert('로그인 실패', '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthModalClose = () => {
    Alert.alert('알림', '헬스 정보를 입력해야 다음 단계로 진행할 수 있습니다.');
  };

  const handleWebViewMessage = useCallback(
    async (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data || '{}');
        const msgType = typeof data.type === 'string' ? data.type.toLowerCase() : undefined;

        if (msgType === 'token' || typeof data.jwtToken === 'string') {
          const access = typeof data.jwtToken === 'string' ? data.jwtToken.trim() : null;
          const refresh = typeof data.refreshToken === 'string' ? data.refreshToken.trim() : null;
          await handleAuthSuccess(access, refresh);
          return;
        }
      } catch (error) {
        console.error('WebView 메시지 처리 실패:', error);
      }
    },
    [handleAuthSuccess],
  );

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>로그인</Text>

          <TextInput
            style={styles.input}
            placeholder="이메일"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="비밀번호"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLocalLogin}
          />
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLocalLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>이메일로 로그인</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 16 }} />

          <Text style={styles.sectionLabel}>소셜 로그인</Text>
          {SOCIAL_PROVIDERS.map((provider) => (
            <TouchableOpacity
              key={provider}
              style={[
                styles.socialBtn,
                provider === 'kakao' ? styles.kakaoButton : styles.naverButton,
                loading && currentProvider === provider && styles.buttonDisabled,
              ]}
              onPress={() => handleSocialLogin(provider)}
              disabled={loading}
            >
              {loading && currentProvider === provider ? (
                <ActivityIndicator color={provider === 'kakao' ? '#3C1E1E' : '#fff'} />
              ) : (
                <Text
                  style={[
                    styles.socialText,
                    provider === 'kakao' ? styles.kakaoText : styles.naverText,
                  ]}
                >
                  {provider === 'kakao' ? '카카오로 로그인' : '네이버로 로그인'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showHealthModal}
        transparent
        animationType="fade"
        onRequestClose={handleHealthModalClose}
      >
        <View style={styles.healthModalOverlay}>
          <View style={styles.healthModalContainer}>
            <Text style={styles.healthModalTitle}>헬스 정보 입력</Text>
            <Text style={styles.healthModalSubtitle}>
              식단 추천을 위해 키, 몸무게, 목표를 입력해주세요.
            </Text>

            <Text style={styles.healthLabel}>키 (cm)</Text>
            <TextInput
              style={styles.healthInput}
              placeholder="예: 170"
              keyboardType="numeric"
              value={healthHeight}
              onChangeText={setHealthHeight}
              editable={!submittingHealth}
            />

            <Text style={styles.healthLabel}>몸무게 (kg)</Text>
            <TextInput
              style={styles.healthInput}
              placeholder="예: 65"
              keyboardType="numeric"
              value={healthWeight}
              onChangeText={setHealthWeight}
              editable={!submittingHealth}
            />

            <Text style={styles.healthLabel}>운동 목표</Text>
            <View style={styles.goalContainer}>{goalButtons}</View>

            <TouchableOpacity
              style={[
                styles.healthSubmitButton,
                submittingHealth && styles.healthSubmitButtonDisabled,
              ]}
              onPress={handleHealthSubmit}
              disabled={submittingHealth}
            >
              {submittingHealth ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.healthSubmitButtonText}>저장하고 계속하기</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowWebView(false);
          setCurrentProvider(null);
          setWebViewLoading(false);
          setLoading(false);
          handledAuthRef.current = false;
        }}
      >
        <View style={styles.webViewWrapper}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowWebView(false);
                setCurrentProvider(null);
                setWebViewLoading(false);
                setLoading(false);
                handledAuthRef.current = false;
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>

          <WebView
            ref={webViewRef}
            source={{ uri: webViewUrl }}
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            javaScriptEnabled
            onShouldStartLoadWithRequest={(request) => {
              if (handleDeepLinkUrl(request?.url)) {
                return false;
              }
              return true;
            }}
            onMessage={handleWebViewMessage}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onNavigationStateChange={(navState: WebViewNavigation) => {
              console.log('WebView Navigation:', navState.url);
            }}
          />

          {webViewLoading && (
            <View style={styles.webViewLoadingOverlay}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.webViewLoadingText}>
                {currentProvider === 'naver' ? '네이버' : '카카오'} 로그인 중...
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 12,
  },
  socialBtn: {
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 12,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  naverButton: {
    backgroundColor: '#03C75A',
  },
  socialText: {
    fontWeight: '600',
    fontSize: 15,
  },
  kakaoText: {
    color: '#3C1E1E',
  },
  naverText: {
    color: '#fff',
  },
  healthModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  healthModalContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  healthModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  healthModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  healthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 6,
  },
  healthInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  goalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  goalButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  goalButtonText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
  goalButtonTextSelected: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  healthSubmitButton: {
    marginTop: 24,
    backgroundColor: '#6366f1',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthSubmitButtonDisabled: {
    opacity: 0.7,
  },
  healthSubmitButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webViewHeader: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  webViewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});


