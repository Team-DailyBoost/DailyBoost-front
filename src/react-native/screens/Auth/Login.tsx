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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
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
  const [healthAge, setHealthAge] = useState('');
  const [healthGender, setHealthGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [healthHeight, setHealthHeight] = useState('');
  const [healthWeight, setHealthWeight] = useState('');
  const [healthGoal, setHealthGoal] = useState<GoalType>('GENERAL_HEALTH_MAINTENANCE');
  const [submittingHealth, setSubmittingHealth] = useState(false);
  const [healthFlagKey, setHealthFlagKey] = useState<string>(() => HEALTH_INFO_FLAG_PREFIX);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'email' | 'code' | 'done'>('email');
  const [sendingRecoveryEmail, setSendingRecoveryEmail] = useState(false);
  const [verifyingRecoveryCode, setVerifyingRecoveryCode] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const webViewRef = useRef<WebView | null>(null);
  const currentProviderRef = useRef<'kakao' | 'naver' | null>(null);
  const handledAuthRef = useRef(false);
  const postMessageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthModalShownRef = useRef(false);
  const webViewLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const resetRecoveryFlow = useCallback(() => {
    setRecoveryEmail('');
    setRecoveryCode('');
    setRecoveryStep('email');
    setResendCountdown(0);
    setSendingRecoveryEmail(false);
    setVerifyingRecoveryCode(false);
  }, []);

  const closeRecoveryModal = useCallback(() => {
    setShowRecoveryModal(false);
    resetRecoveryFlow();
  }, [resetRecoveryFlow]);

  const openRecoveryModal = useCallback(() => {
    resetRecoveryFlow();
    setShowRecoveryModal(true);
  }, [resetRecoveryFlow]);

  const ensureHealthInfoFlow = useCallback(
    async (overrideKey?: string) => {
    const keyToCheck = overrideKey ?? healthFlagKey;
    try {
        console.log('[Login] 헬스 정보 플래그 확인:', keyToCheck);
      const initialized = await AsyncStorage.getItem(keyToCheck);
        console.log('[Login] 헬스 정보 초기화 여부:', initialized);
      
      // 플래그가 있더라도 실제 헬스 정보 데이터가 완전한지 확인
      let hasCompleteHealthInfo = false;
      if (initialized === '1') {
          console.log('[Login] 헬스 정보 플래그 존재, 실제 데이터 확인 중...');
          
          try {
            const currentUserRaw = await AsyncStorage.getItem('currentUser');
            if (currentUserRaw) {
              const currentUser = JSON.parse(currentUserRaw);
              
              // 헬스 정보가 완전한지 확인 (age, gender, height, weight, goal 모두 필요)
              const hasAge = !!currentUser?.age && Number(currentUser.age) > 0;
              const hasGender = !!currentUser?.gender;
              const healthInfo = currentUser?.healthInfo;
              const hasHeight = !!(healthInfo?.height && Number(healthInfo.height) > 0);
              const hasWeight = !!(healthInfo?.weight && Number(healthInfo.weight) > 0);
              const hasGoal = !!healthInfo?.goal;
              
              hasCompleteHealthInfo = hasAge && hasGender && hasHeight && hasWeight && hasGoal;
              
              console.log('[Login] currentUser 헬스 정보 확인:', {
                hasAge,
                hasGender,
                hasHeight,
                hasWeight,
                hasGoal,
                hasCompleteHealthInfo,
              });
              
              if (!hasCompleteHealthInfo) {
                console.warn('[Login] 헬스 정보가 불완전함 - 헬스 정보 입력 모달 표시');
              }
            } else {
              console.warn('[Login] currentUser가 없음 - 헬스 정보 입력 모달 표시');
            }
          } catch (e) {
            console.warn('[Login] currentUser 헬스 정보 확인 실패:', e);
          }
      }
      
      // 플래그가 없거나 헬스 정보가 불완전하면 모달 표시
      if (initialized !== '1' || !hasCompleteHealthInfo) {
        console.log('[Login] 헬스 정보 미초기화 또는 불완전, 모달 표시');
        healthModalShownRef.current = true;
        setShowHealthModal(true);
        return;
      }
      
      // 헬스 정보가 완전하면 모달 표시 플래그 리셋
      healthModalShownRef.current = false;
      
      // 헬스 정보가 완전하면 로그인 진행
      console.log('[Login] 헬스 정보 완전, 로그인 진행');
      console.log('[Login] onLoggedIn 호출');
      console.log('[Login] onLoggedIn 함수 존재:', typeof onLoggedIn);
      onLoggedIn();
      console.log('[Login] onLoggedIn 호출 완료');
    } catch (error) {
        console.error('[Login] 헬스 정보 초기화 여부 확인 실패:', error);
        // 에러 발생 시에도 로그인 완료 처리
        console.log('[Login] 에러 발생으로 인한 onLoggedIn 호출');
        console.log('[Login] onLoggedIn 함수 존재:', typeof onLoggedIn);
      onLoggedIn();
        console.log('[Login] onLoggedIn 호출 완료 (에러 케이스)');
    }
    },
    [healthFlagKey, onLoggedIn],
  );

  const handleAuthSuccess = useCallback(
    async (accessToken: string, refreshToken: string | null) => {
      if (handledAuthRef.current) {
        console.log('[Login] 이미 처리된 로그인 요청, 무시');
        return;
      }
      handledAuthRef.current = true;

      try {
        console.log('[Login] ========== handleAuthSuccess 시작 ==========');
        console.log('[Login] accessToken 존재:', !!accessToken);
        console.log('[Login] refreshToken 존재:', !!refreshToken);

        setShowWebView(false);
        setWebViewLoading(false);
        setLoading(false);

        if (!accessToken || accessToken.trim().length === 0) {
          throw new Error('액세스 토큰이 없습니다');
        }

        const cleanToken = accessToken.replace(/^Bearer\s+/i, '');
        const bearerToken = `Bearer ${cleanToken}`;

        console.log('[Login] 토큰 저장 시작');
        await api.setAuthToken(bearerToken);
        await AsyncStorage.setItem('@accessToken', cleanToken);
        console.log('[Login] accessToken 저장 완료');

        if (refreshToken) {
          await AsyncStorage.setItem('@refreshToken', refreshToken);
          await AsyncStorage.setItem('refreshToken', refreshToken);
          console.log('[Login] refreshToken 저장 완료');
        }

        console.log('[Login] JWT 디코딩 시작');
        const payload = decodeJwtPayload(cleanToken);
        console.log('[Login] JWT payload:', payload);

        const emailFromToken = payload?.email ?? null;
        const nameFromToken =
          payload?.nickname ??
          payload?.name ??
          (emailFromToken ? emailFromToken.split('@')[0] : null);

        const provider = currentProviderRef.current;
        
        // 기존 currentUser에서 헬스 정보 보존
        let existingUser = null;
        try {
          const existingUserRaw = await AsyncStorage.getItem('currentUser');
          if (existingUserRaw) {
            existingUser = JSON.parse(existingUserRaw);
            console.log('[Login] 기존 currentUser 발견:', {
              hasAge: !!existingUser?.age,
              hasGender: !!existingUser?.gender,
              hasHealthInfo: !!existingUser?.healthInfo,
            });
          }
        } catch (e) {
          console.warn('[Login] 기존 currentUser 읽기 실패:', e);
        }
        
        const userSnapshot = {
          email: emailFromToken,
          name: nameFromToken,
          nickname: payload?.nickname ?? nameFromToken,
          provider,
          role: payload?.role ?? null,
          loginAt: Date.now(),
          // 기존 헬스 정보 보존 (있으면)
          age: existingUser?.age || null,
          gender: existingUser?.gender || null,
          healthInfo: existingUser?.healthInfo || null,
        };

        console.log('[Login] currentUser 저장:', {
          ...userSnapshot,
          hasAge: !!userSnapshot.age,
          hasGender: !!userSnapshot.gender,
          hasHealthInfo: !!userSnapshot.healthInfo,
        });
        await AsyncStorage.setItem('currentUser', JSON.stringify(userSnapshot));
        console.log('[Login] currentUser 저장 완료');

        const healthKey = makeHealthFlagKey(emailFromToken);
        setHealthFlagKey(healthKey);
        currentProviderRef.current = null;

        // 식단 추천은 비동기로 처리
        const foodPromise = (async () => {
          try {
            console.log('[Login] 식단 추천 요청 시작');
            const recommendations = await getFoodRecommendations();
            const normalized = normalizeFoodRecommendations(recommendations);
            await AsyncStorage.setItem('@foodRecommendations', JSON.stringify(normalized));
            console.log('[Login] 식단 추천 저장 완료');
          } catch (foodError) {
            console.error('[Login] 식단 추천 요청 실패:', foodError);
            // 식단 추천 실패해도 로그인은 계속 진행
          }
        })();

        // 헬스 정보 확인 먼저 처리 (헬스 정보가 없으면 로그인 완료하지 않음)
        console.log('[Login] 헬스 정보 확인 시작');
        try {
          await ensureHealthInfoFlow(healthKey);
          // 헬스 정보가 완전하면 ensureHealthInfoFlow 내부에서 onLoggedIn() 호출됨
          // 헬스 정보가 없으면 모달이 표시되고 여기서는 onLoggedIn() 호출하지 않음
        } catch (healthError) {
          console.error('[Login] 헬스 정보 플로우 실패:', healthError);
          // 에러 발생 시에도 로그인은 진행 (기존 동작 유지)
          onLoggedIn();
        }
        
        // 식단 추천은 백그라운드에서 계속 진행
        foodPromise.catch(() => {});

        console.log('[Login] ========== handleAuthSuccess 완료 ==========');
      } catch (error) {
        console.error('[Login] ========== handleAuthSuccess 실패 ==========');
        console.error('[Login] 에러:', error);
        handledAuthRef.current = false;
        setShowWebView(false);
        setWebViewLoading(false);
        setLoading(false);
        Alert.alert(
          '로그인 실패',
          `로그인 처리 중 오류가 발생했습니다: ${
            error instanceof Error ? error.message : '알 수 없는 오류'
          }`,
        );
      }
    },
    [onLoggedIn],
  );

  const handleSocialLogin = (provider: 'kakao' | 'naver') => {
    console.log('[Login] 소셜 로그인 시작:', provider);
    handledAuthRef.current = false;
    
    // 이전 타임아웃 정리
    if (postMessageTimeoutRef.current) {
      clearTimeout(postMessageTimeoutRef.current);
      postMessageTimeoutRef.current = null;
    }
    if (webViewLoadTimeoutRef.current) {
      clearTimeout(webViewLoadTimeoutRef.current);
      webViewLoadTimeoutRef.current = null;
    }
    
    setCurrentProvider(provider);
    currentProviderRef.current = provider;
    setLoading(true);
    setWebViewUrl(`${API_CONFIG.BASE_URL}/oauth2/authorization/${provider}`);
    setShowWebView(true);
    setWebViewLoading(true);
    
    // 30초 타임아웃 설정
    webViewLoadTimeoutRef.current = setTimeout(() => {
      if (!handledAuthRef.current) {
        console.warn('[Login] WebView 로딩 타임아웃');
        setWebViewLoading(false);
        setLoading(false);
        Alert.alert(
          '타임아웃',
          '페이지 로딩 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.',
          [
            {
              text: '다시 시도',
              onPress: () => {
                if (webViewRef.current && webViewUrl) {
                  setWebViewLoading(true);
                  setLoading(true);
                  webViewRef.current.reload();
                  // 타임아웃 재설정
                  webViewLoadTimeoutRef.current = setTimeout(() => {
                    if (!handledAuthRef.current) {
                      setWebViewLoading(false);
                      setLoading(false);
                      Alert.alert('타임아웃', '페이지 로딩 시간이 초과되었습니다.');
                    }
                  }, 30000);
                }
              },
            },
            {
              text: '닫기',
              style: 'cancel',
              onPress: () => {
                setShowWebView(false);
                setCurrentProvider(null);
                handledAuthRef.current = false;
              },
            },
          ]
        );
      }
    }, 30000);
  };

  const handleWebViewMessage = useCallback(
    async (event: any) => {
      try {
        const rawData = event.nativeEvent.data;
        console.log('[Login] ========== WebView 메시지 수신 ==========');
        console.log('[Login] rawData:', rawData);
        console.log('[Login] rawData 타입:', typeof rawData);

        if (!rawData || typeof rawData !== 'string') {
          console.log('[Login] rawData가 문자열이 아님, 무시');
          return;
        }

        let data: any;
        try {
          data = JSON.parse(rawData);
          console.log('[Login] 파싱 성공');
        } catch (parseError) {
          console.warn('[Login] JSON 파싱 실패:', parseError);
          console.warn('[Login] rawData 내용:', rawData.substring(0, 200));
          return;
        }

        console.log('[Login] 파싱된 데이터:', JSON.stringify(data, null, 2));
        console.log('[Login] data.type:', data.type);

        // 백엔드가 보내는 토큰 메시지 처리
        // 백엔드: { type: 'token', jwtToken: access, refreshToken: refresh }
        if (data.type === 'token') {
          // 타임아웃 제거
          if (postMessageTimeoutRef.current) {
            clearTimeout(postMessageTimeoutRef.current);
            postMessageTimeoutRef.current = null;
          }

          const accessToken = data.jwtToken ? String(data.jwtToken).trim() : null;
          const refreshToken = data.refreshToken ? String(data.refreshToken).trim() : null;

          if (!accessToken) {
            console.error('[Login] jwtToken이 없습니다. data:', data);
            Alert.alert('로그인 오류', '토큰을 받지 못했습니다.');
            return;
          }

          console.log('[Login] ========== 토큰 수신 성공 ==========');
          console.log('[Login] accessToken 길이:', accessToken.length);
          console.log('[Login] accessToken 앞 20자:', accessToken.substring(0, 20));
          console.log('[Login] refreshToken:', refreshToken ? '있음' : '없음');

          await handleAuthSuccess(accessToken, refreshToken);
          return;
        }

        console.log('[Login] 처리할 수 없는 메시지 타입:', data.type);
        console.log('[Login] 전체 데이터:', JSON.stringify(data, null, 2));
      } catch (error) {
        console.error('[Login] ========== WebView 메시지 처리 실패 ==========');
        console.error('[Login] 에러:', error);
        Alert.alert('오류', `로그인 메시지 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    },
    [handleAuthSuccess],
  );

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
    const ageValue = healthAge.trim();
    const heightValue = Number(healthHeight);
    const weightValue = Number(healthWeight);

    if (!ageValue) {
      Alert.alert('입력 오류', '나이를 입력해주세요.');
      return;
    }

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
      const initResult = await UserService.initUserInfo({
        healthInfo: {
          height: heightValue,
          weight: weightValue,
          goal: healthGoal,
        },
      });

      if (!initResult.success) {
        Alert.alert('등록 실패', initResult.error || '헬스 정보 등록에 실패했습니다.');
        setSubmittingHealth(false);
        return;
      }

      const updateResult = await UserService.updateProfile({
        age: ageValue,
        gender: healthGender,
        healthInfo: {
          height: heightValue,
          weight: weightValue,
          goal: healthGoal,
        },
      });

      if (!updateResult.success) {
        console.warn('나이/성별 업데이트 실패:', updateResult.error);
      }

      try {
        const recommendations = await getFoodRecommendations();
        const normalized = normalizeFoodRecommendations(recommendations);
        await AsyncStorage.setItem('@foodRecommendations', JSON.stringify(normalized));
      } catch (foodError) {
        console.error('식단 추천 요청 실패:', foodError);
      }

      // currentUser 업데이트 - 여러 번 시도하여 확실히 저장
      let updateSuccess = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const currentUserRaw = await AsyncStorage.getItem('currentUser');
          if (currentUserRaw) {
            const parsed = JSON.parse(currentUserRaw);
            const updatedUser = {
              ...parsed,
              age: ageValue,
              gender: healthGender,
              healthInfo: {
                height: heightValue,
                weight: weightValue,
                goal: healthGoal,
              },
            };
            console.log(`[Login] 헬스 정보로 currentUser 업데이트 시도 ${attempt + 1}/3:`, {
              before: { age: parsed?.age, gender: parsed?.gender, hasHealthInfo: !!parsed?.healthInfo },
              after: { age: updatedUser.age, gender: updatedUser.gender, healthInfo: updatedUser.healthInfo },
            });
            await AsyncStorage.setItem('currentUser', JSON.stringify(updatedUser));
            
            // 저장 확인
            const verifyRaw = await AsyncStorage.getItem('currentUser');
            const verify = verifyRaw ? JSON.parse(verifyRaw) : null;
            if (verify?.age === ageValue && verify?.gender === healthGender && verify?.healthInfo?.height === heightValue) {
              console.log('[Login] currentUser 업데이트 확인 성공');
              updateSuccess = true;
              break;
            } else {
              console.warn(`[Login] currentUser 업데이트 확인 실패 (시도 ${attempt + 1}/3)`);
              await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기 후 재시도
            }
          } else {
            console.warn('[Login] currentUser가 없어 헬스 정보를 저장할 수 없습니다');
            break;
          }
        } catch (userUpdateError) {
          console.error(`[Login] 헬스 정보 사용자 저장 실패 (시도 ${attempt + 1}/3):`, userUpdateError);
          if (attempt < 2) {
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기 후 재시도
          }
        }
      }
      
      if (!updateSuccess) {
        console.error('[Login] currentUser 업데이트 최종 실패 - 사용자에게 프로필 수정을 안내해야 함');
      }

      await AsyncStorage.setItem(healthFlagKey, '1');
      healthModalShownRef.current = false;
      setShowHealthModal(false);
      setSubmittingHealth(false);
      console.log('[Login] 헬스 정보 제출 완료, onLoggedIn 호출');
      console.log('[Login] onLoggedIn 함수 존재:', typeof onLoggedIn);
      onLoggedIn();
      console.log('[Login] onLoggedIn 호출 완료 (헬스 정보 제출)');
    } catch (error) {
      console.error('헬스 정보 등록 실패:', error);
      Alert.alert('등록 실패', '헬스 정보를 저장하는 중 오류가 발생했습니다.');
      setSubmittingHealth(false);
    }
  };

  const handleSendRecoveryEmail = useCallback(async () => {
    const trimmedEmail = recoveryEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('알림', '유효한 이메일 주소를 입력하세요.');
      return;
    }

    try {
      setSendingRecoveryEmail(true);
      const response = await UserService.sendRecoveryEmail(trimmedEmail);
      setSendingRecoveryEmail(false);
      if (!response.success) {
        Alert.alert('전송 실패', response.error || '이메일 전송에 실패했습니다.');
        return;
      }
      Alert.alert(
        '이메일 전송',
        '입력한 이메일로 인증 코드를 전송했습니다. 5분 이내에 코드를 입력해주세요.',
      );
      setRecoveryStep('code');
      setResendCountdown(30);
    } catch (error) {
      setSendingRecoveryEmail(false);
      Alert.alert('전송 실패', '이메일 전송 중 오류가 발생했습니다.');
    }
  }, [recoveryEmail]);

  const handleVerifyRecoveryCode = useCallback(async () => {
    const trimmedEmail = recoveryEmail.trim();
    if (!trimmedEmail) {
      Alert.alert('알림', '계정 이메일을 입력하세요.');
      return;
    }
    const trimmedCode = recoveryCode.trim();
    if (!trimmedCode) {
      Alert.alert('알림', '이메일로 전송된 인증 코드를 입력하세요.');
      return;
    }

    try {
      setVerifyingRecoveryCode(true);
      const response = await UserService.recoverAccount({
        email: trimmedEmail,
        inputCode: trimmedCode,
      });
      setVerifyingRecoveryCode(false);
      if (!response.success) {
        Alert.alert('복구 실패', response.error || '인증 코드가 일치하지 않거나 만료되었습니다.');
        return;
      }
      Alert.alert(
        '복구 완료',
        response.data?.message || '계정이 복구되었습니다. 다시 로그인해주세요.',
        [
        {
          text: '확인',
          onPress: () => {
            closeRecoveryModal();
          },
        },
        ],
      );
    } catch (error) {
      setVerifyingRecoveryCode(false);
      Alert.alert('복구 실패', '계정 복구 중 오류가 발생했습니다.');
    }
  }, [recoveryEmail, recoveryCode, closeRecoveryModal]);

  const handleResendRecoveryEmail = useCallback(() => {
    if (resendCountdown > 0 || sendingRecoveryEmail) return;
    handleSendRecoveryEmail();
  }, [handleSendRecoveryEmail, resendCountdown, sendingRecoveryEmail]);

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
        role: null,
        loginAt: Date.now(),
      };
      
      // 로컬 로그인용 더미 토큰 생성 (실제 인증은 아니지만 앱 내부에서 사용)
      const tokenPayload = JSON.stringify({ email, provider: 'local', iat: Date.now() });
      const encodedPayload = Buffer.from(tokenPayload).toString('base64');
      const dummyToken = `local.${encodedPayload}.dummy`;
      
      await AsyncStorage.setItem('currentUser', JSON.stringify(mockUser));
      await AsyncStorage.setItem('@accessToken', dummyToken);
      await api.setAuthToken(`Bearer ${dummyToken}`);
      await AsyncStorage.removeItem('@refreshToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('@sessionCookie');
      await AsyncStorage.removeItem('backend:session-cookie');
      
      // 헬스 정보 플래그 키 설정
      const healthKey = makeHealthFlagKey(email);
      setHealthFlagKey(healthKey);
      
      console.log('[Login] 로컬 로그인 완료, 헬스 정보 확인 시작');
      // 헬스 정보 확인 후 로그인 완료 처리
      await ensureHealthInfoFlow(healthKey);
    } catch (error) {
      console.error('로컬 로그인 실패:', error);
      Alert.alert('로그인 실패', '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleHealthModalClose = () => {
    // 모달이 닫히지 않도록 방지 (헬스 정보 입력 필수)
    Alert.alert(
      '알림', 
      '헬스 정보를 입력해야 다음 단계로 진행할 수 있습니다.',
      [{ text: '확인' }]
    );
    // 모달을 닫지 않음 (setShowHealthModal(false) 호출하지 않음)
  };

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

          <TouchableOpacity style={styles.recoveryLinkWrapper} onPress={openRecoveryModal}>
            <Text style={styles.recoveryLinkText}>계정을 복구하고 싶으신가요?</Text>
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
        visible={showRecoveryModal}
        transparent
        animationType="fade"
        onRequestClose={closeRecoveryModal}
      >
        <View style={styles.recoveryModalOverlay}>
          <View style={styles.recoveryModalContent}>
            <Text style={styles.recoveryModalTitle}>계정 복구</Text>
            <Text style={styles.recoveryModalSubtitle}>
              삭제되었거나 휴면 처리된 계정을 다시 활성화하려면 이메일 인증이 필요합니다.
            </Text>

            <Text style={styles.recoveryLabel}>계정 이메일</Text>
            <TextInput
              style={styles.recoveryInput}
              placeholder="example@dailyboost.app"
              keyboardType="email-address"
              autoCapitalize="none"
              value={recoveryEmail}
              onChangeText={setRecoveryEmail}
              editable={!sendingRecoveryEmail && recoveryStep === 'email'}
            />

            {recoveryStep === 'email' && (
              <TouchableOpacity
                style={[
                  styles.recoveryPrimaryButton,
                  (sendingRecoveryEmail || !recoveryEmail.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleSendRecoveryEmail}
                disabled={sendingRecoveryEmail}
              >
                {sendingRecoveryEmail ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.recoveryPrimaryButtonText}>인증 코드 보내기</Text>
                )}
              </TouchableOpacity>
            )}

            {recoveryStep !== 'email' && (
              <>
                <Text style={styles.recoveryInfoText}>
                  이메일로 받은 4자리 코드를 입력하면 계정 상태가 복구됩니다.
                </Text>
                <TextInput
                  style={styles.recoveryInput}
                  placeholder="1234"
                  keyboardType="number-pad"
                  value={recoveryCode}
                  onChangeText={setRecoveryCode}
                  maxLength={4}
                />
                <TouchableOpacity
                  style={[
                    styles.recoveryPrimaryButton,
                    (verifyingRecoveryCode || recoveryCode.trim().length < 4) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyRecoveryCode}
                  disabled={verifyingRecoveryCode}
                >
                  {verifyingRecoveryCode ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.recoveryPrimaryButtonText}>코드 확인</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.recoverySecondaryButton,
                    (resendCountdown > 0 || sendingRecoveryEmail) && styles.buttonDisabled,
                  ]}
                  onPress={handleResendRecoveryEmail}
                  disabled={resendCountdown > 0 || sendingRecoveryEmail}
                >
                  <Text style={styles.recoverySecondaryButtonText}>
                    인증 코드 재전송{resendCountdown > 0 ? ` (${resendCountdown}s)` : ''}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.recoveryCloseButton} onPress={closeRecoveryModal}>
              <Text style={styles.recoveryCloseButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              식단 추천을 위해 나이, 성별, 키, 몸무게, 목표를 입력해주세요.
            </Text>

            <Text style={styles.healthLabel}>나이</Text>
            <TextInput
              style={styles.healthInput}
              placeholder="예: 25"
              keyboardType="numeric"
              value={healthAge}
              onChangeText={setHealthAge}
              editable={!submittingHealth}
              maxLength={3}
            />

            <Text style={styles.healthLabel}>성별</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  healthGender === 'MALE' && styles.genderButtonSelected,
                ]}
                onPress={() => setHealthGender('MALE')}
                disabled={submittingHealth}
              >
                <Text
                  style={
                    healthGender === 'MALE'
                      ? styles.genderButtonTextSelected
                      : styles.genderButtonText
                  }
                >
                  남성
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  healthGender === 'FEMALE' && styles.genderButtonSelected,
                ]}
                onPress={() => setHealthGender('FEMALE')}
                disabled={submittingHealth}
              >
                <Text
                  style={
                    healthGender === 'FEMALE'
                      ? styles.genderButtonTextSelected
                      : styles.genderButtonText
                  }
                >
                  여성
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  healthGender === 'OTHER' && styles.genderButtonSelected,
                ]}
                onPress={() => setHealthGender('OTHER')}
                disabled={submittingHealth}
              >
                <Text
                  style={
                    healthGender === 'OTHER'
                      ? styles.genderButtonTextSelected
                      : styles.genderButtonText
                  }
                >
                  기타
                </Text>
              </TouchableOpacity>
            </View>

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
          if (postMessageTimeoutRef.current) {
            clearTimeout(postMessageTimeoutRef.current);
            postMessageTimeoutRef.current = null;
          }
          if (webViewLoadTimeoutRef.current) {
            clearTimeout(webViewLoadTimeoutRef.current);
            webViewLoadTimeoutRef.current = null;
          }
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
                if (postMessageTimeoutRef.current) {
                  clearTimeout(postMessageTimeoutRef.current);
                  postMessageTimeoutRef.current = null;
                }
                if (webViewLoadTimeoutRef.current) {
                  clearTimeout(webViewLoadTimeoutRef.current);
                  webViewLoadTimeoutRef.current = null;
                }
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
            onShouldStartLoadWithRequest={(request: any) => {
              const url = request?.url || '';
              
              // 딥링크는 WebView에서 차단
              if (url.startsWith('dailyboost://')) {
                return false;
              }
              
              // OAuth 콜백 URL 감지 시 즉시 HTML 읽기 시도
              if (url.includes('/login/oauth2/code/') && !handledAuthRef.current && webViewRef.current) {
                setTimeout(() => {
                  if (!handledAuthRef.current && webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                      (function() {
                        try {
                          var html = document.documentElement.innerHTML;
                          var scripts = document.getElementsByTagName('script');
                          
                          for (var i = 0; i < scripts.length; i++) {
                            var scriptContent = scripts[i].innerHTML || scripts[i].textContent || '';
                            var accessMatch = scriptContent.match(/var\\s+access\\s*=\\s*['"]([^'"]+)['"]/);
                            var refreshMatch = scriptContent.match(/var\\s+refresh\\s*=\\s*['"]([^'"]+)['"]/);
                            
                            if (accessMatch && accessMatch[1]) {
                              var access = accessMatch[1];
                              var refresh = refreshMatch && refreshMatch[1] ? refreshMatch[1] : null;
                              
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'token',
                                  jwtToken: access,
                                  refreshToken: refresh
                                }));
                                return true;
                              }
                            }
                          }
                          
                          var htmlAccessMatch = html.match(/var\\s+access\\s*=\\s*['"]([^'"]+)['"]/);
                          var htmlRefreshMatch = html.match(/var\\s+refresh\\s*=\\s*['"]([^'"]+)['"]/);
                          
                          if (htmlAccessMatch && htmlAccessMatch[1]) {
                            var access = htmlAccessMatch[1];
                            var refresh = htmlRefreshMatch && htmlRefreshMatch[1] ? htmlRefreshMatch[1] : null;
                            
                            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'token',
                                jwtToken: access,
                                refreshToken: refresh
                              }));
                              return true;
                            }
                          }
                          
                          return false;
                        } catch (e) {
                          return false;
                        }
                      })();
                      true;
                    `);
                  }
                }, 100);
              }
              
              return true;
            }}
            onMessage={handleWebViewMessage}
            onLoadStart={() => {
              setWebViewLoading(true);
              
              // 타임아웃 재설정 (새 페이지 로드 시)
              if (webViewLoadTimeoutRef.current) {
                clearTimeout(webViewLoadTimeoutRef.current);
              }
              webViewLoadTimeoutRef.current = setTimeout(() => {
                if (!handledAuthRef.current && webViewLoading) {
                  console.warn('[Login] WebView 로딩 타임아웃 (onLoadStart)');
                  setWebViewLoading(false);
                  setLoading(false);
                  Alert.alert(
                    '타임아웃',
                    '페이지 로딩 시간이 초과되었습니다. 네트워크 연결을 확인하고 다시 시도해주세요.',
                    [
                      {
                        text: '다시 시도',
                        onPress: () => {
                          if (webViewRef.current && webViewUrl) {
                            setWebViewLoading(true);
                            webViewRef.current.reload();
                          }
                        },
                      },
                      {
                        text: '닫기',
                        style: 'cancel',
                        onPress: () => {
                          setShowWebView(false);
                          setCurrentProvider(null);
                          handledAuthRef.current = false;
                        },
                      },
                    ]
                  );
                }
              }, 30000);
            }}
            onLoadEnd={(event) => {
              const url = event.nativeEvent.url;
              setWebViewLoading(false);
              
              // 로드 완료 시 타임아웃 정리
              if (webViewLoadTimeoutRef.current) {
                clearTimeout(webViewLoadTimeoutRef.current);
                webViewLoadTimeoutRef.current = null;
              }
              
              // 백엔드 도메인인 경우에만 토큰 추출 시도
              const backendDomain = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '');
              if (url && url.includes(backendDomain) && !handledAuthRef.current) {
                // HTML 읽기 (백엔드 페이지가 로드되었을 때)
                if (webViewRef.current) {
                  setTimeout(() => {
                    if (!handledAuthRef.current && webViewRef.current) {
                      webViewRef.current.injectJavaScript(`
                        (function() {
                          try {
                            var html = document.documentElement.innerHTML;
                            var scripts = document.getElementsByTagName('script');
                            
                            for (var i = 0; i < scripts.length; i++) {
                              var scriptContent = scripts[i].innerHTML || scripts[i].textContent || '';
                              var accessMatch = scriptContent.match(/var\\s+access\\s*=\\s*['"]([^'"]+)['"]/);
                              var refreshMatch = scriptContent.match(/var\\s+refresh\\s*=\\s*['"]([^'"]+)['"]/);
                              
                              if (accessMatch && accessMatch[1]) {
                                var access = accessMatch[1];
                                var refresh = refreshMatch && refreshMatch[1] ? refreshMatch[1] : null;
                                
                                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                  window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'token',
                                    jwtToken: access,
                                    refreshToken: refresh
                                  }));
                                  return true;
                                }
                              }
                            }
                            
                            var htmlAccessMatch = html.match(/var\\s+access\\s*=\\s*['"]([^'"]+)['"]/);
                            var htmlRefreshMatch = html.match(/var\\s+refresh\\s*=\\s*['"]([^'"]+)['"]/);
                            
                            if (htmlAccessMatch && htmlAccessMatch[1]) {
                              var access = htmlAccessMatch[1];
                              var refresh = htmlRefreshMatch && htmlRefreshMatch[1] ? htmlRefreshMatch[1] : null;
                              
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'token',
                                  jwtToken: access,
                                  refreshToken: refresh
                                }));
                                return true;
                              }
                            }
                            
                            return false;
                          } catch (e) {
                            return false;
                          }
                        })();
                        true;
                      `);
                    }
                  }, 200);
                }
              }
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[Login] WebView 에러:', nativeEvent);
              
              if (postMessageTimeoutRef.current) {
                clearTimeout(postMessageTimeoutRef.current);
                postMessageTimeoutRef.current = null;
              }
              if (webViewLoadTimeoutRef.current) {
                clearTimeout(webViewLoadTimeoutRef.current);
                webViewLoadTimeoutRef.current = null;
              }
              
              setWebViewLoading(false);
              setLoading(false);
              
              // 에러 타입에 따른 메시지 구분
              const errorCode = nativeEvent?.code;
              const errorDescription = nativeEvent?.description || '';
              
              let errorMessage = '페이지를 불러오는 중 오류가 발생했습니다.';
              
              if (errorCode === -1009 || errorDescription.includes('network') || errorDescription.includes('internet')) {
                errorMessage = '인터넷 연결을 확인해주세요. 네트워크 연결이 필요합니다.';
              } else if (errorCode === -1001 || errorDescription.includes('timeout')) {
                errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
              } else if (errorCode === -1003 || errorDescription.includes('host')) {
                errorMessage = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
              } else if (errorCode === -1004 || errorDescription.includes('connect')) {
                errorMessage = '서버 연결에 실패했습니다. 네트워크 상태를 확인해주세요.';
              } else if (errorDescription.includes('SSL') || errorDescription.includes('certificate')) {
                errorMessage = '보안 연결에 실패했습니다.';
              }
              
              Alert.alert(
                '오류',
                errorMessage,
                [
                  {
                    text: '다시 시도',
                    onPress: () => {
                      // WebView 다시 로드
                      if (webViewRef.current && webViewUrl) {
                        setWebViewLoading(true);
                        webViewRef.current.reload();
                      }
                    },
                  },
                  {
                    text: '닫기',
                    style: 'cancel',
                    onPress: () => {
                      setShowWebView(false);
                      setCurrentProvider(null);
                      handledAuthRef.current = false;
                    },
                  },
                ]
              );
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('[Login] WebView HTTP 에러:', nativeEvent);
              
              const statusCode = nativeEvent?.statusCode;
              let errorMessage = '서버 오류가 발생했습니다.';
              
              if (statusCode === 404) {
                errorMessage = '페이지를 찾을 수 없습니다.';
              } else if (statusCode === 500) {
                errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
              } else if (statusCode === 503) {
                errorMessage = '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
              } else if (statusCode >= 400 && statusCode < 500) {
                errorMessage = `요청 오류가 발생했습니다. (${statusCode})`;
              } else if (statusCode >= 500) {
                errorMessage = `서버 오류가 발생했습니다. (${statusCode})`;
              }
              
              setWebViewLoading(false);
              setLoading(false);
              
              Alert.alert(
                'HTTP 오류',
                errorMessage,
                [
                  {
                    text: '다시 시도',
                    onPress: () => {
                      if (webViewRef.current && webViewUrl) {
                        setWebViewLoading(true);
                        webViewRef.current.reload();
                      }
                    },
                  },
                  {
                    text: '닫기',
                    style: 'cancel',
                    onPress: () => {
                      setShowWebView(false);
                      setCurrentProvider(null);
                      handledAuthRef.current = false;
                    },
                  },
                ]
              );
            }}
            injectedJavaScript={`
              (function() {
                if (!window.ReactNativeWebView || !window.ReactNativeWebView.postMessage) {
                  return;
                }
                
                var tokenSent = false;
                
                function extractAndSendToken() {
                  if (tokenSent) return true;
                  
                  try {
                    var html = document.documentElement.innerHTML;
                    var scripts = document.getElementsByTagName('script');
                    
                    // 1. 스크립트 태그에서 토큰 찾기
                    for (var i = 0; i < scripts.length; i++) {
                      var scriptContent = scripts[i].innerHTML || scripts[i].textContent || '';
                      var accessMatch = scriptContent.match(/var\\s+access\\s*=\\s*['"]([^'"]+)['"]/);
                      var refreshMatch = scriptContent.match(/var\\s+refresh\\s*=\\s*['"]([^'"]+)['"]/);
                      
                      if (accessMatch && accessMatch[1]) {
                        var access = accessMatch[1];
                        var refresh = refreshMatch && refreshMatch[1] ? refreshMatch[1] : null;
                        
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'token',
                          jwtToken: access,
                          refreshToken: refresh
                        }));
                        tokenSent = true;
                        return true;
                      }
                      
                      // postMessage 스크립트 재실행
                      if (scriptContent.includes('postMessage') && scriptContent.includes('jwtToken')) {
                        try {
                          eval(scriptContent);
                        } catch (e) {}
                      }
                    }
                    
                    // 2. HTML 전체에서 토큰 찾기
                    var htmlAccessMatch = html.match(/var\\s+access\\s*=\\s*['"]([^'"]+)['"]/);
                    var htmlRefreshMatch = html.match(/var\\s+refresh\\s*=\\s*['"]([^'"]+)['"]/);
                    
                    if (htmlAccessMatch && htmlAccessMatch[1]) {
                      var access = htmlAccessMatch[1];
                      var refresh = htmlRefreshMatch && htmlRefreshMatch[1] ? htmlRefreshMatch[1] : null;
                      
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'token',
                        jwtToken: access,
                        refreshToken: refresh
                      }));
                      tokenSent = true;
                      return true;
                    }
                    
                    // 3. 전역 변수 확인
                    if (typeof window.oauthAccessToken !== 'undefined' && window.oauthAccessToken) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'token',
                        jwtToken: window.oauthAccessToken,
                        refreshToken: window.oauthRefreshToken || null
                      }));
                      tokenSent = true;
                      return true;
                    }
                    
                    return false;
                  } catch (e) {
                    return false;
                  }
                }
                
                // 즉시 시도
                extractAndSendToken();
                
                // DOMContentLoaded 후 시도
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(extractAndSendToken, 100);
                  });
                } else {
                  setTimeout(extractAndSendToken, 100);
                }
                
                // 추가 시도
                setTimeout(extractAndSendToken, 300);
                setTimeout(extractAndSendToken, 600);
                setTimeout(extractAndSendToken, 1000);
              })();
              true;
            `}
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
    padding: 28,
    backgroundColor: '#f1f5f9',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 32,
    textAlign: 'center',
    color: '#0f172a',
    letterSpacing: -1,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  genderButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
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
  recoveryLinkWrapper: {
    marginTop: 12,
    alignItems: 'center',
  },
  recoveryLinkText: {
    fontSize: 14,
    color: '#2563eb',
    textDecorationLine: 'underline',
  },
  recoveryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  recoveryModalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  recoveryModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },
  recoveryModalSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  recoveryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
    marginBottom: 6,
  },
  recoveryInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    marginBottom: 12,
  },
  recoveryPrimaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  recoveryPrimaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  recoverySecondaryButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  recoverySecondaryButtonText: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '500',
  },
  recoveryInfoText: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  recoveryCloseButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  recoveryCloseButtonText: {
    color: '#6b7280',
    fontSize: 15,
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
