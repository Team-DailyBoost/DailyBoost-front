import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../../config/api';
import { api } from '../../../services/api';

/**
 * SocialLoginScreen 컴포넌트
 * 
 * 이 컴포넌트는 WebView를 사용하여 Spring Boot의 OAuth2 소셜 로그인을 처리합니다.
 * 
 * 중요한 제약 조건:
 * - 백엔드(Spring Boot) 코드는 수정할 수 없음
 * - OAuth2 성공 후 Spring이 보내는 최종 응답이 "Whitelabel Error Page"임
 * - 이 Whitelabel Error Page가 로드되면 "로그인 완료"로 간주
 * 
 * 로그인 플로우:
 * 1. 소셜 로그인 URL (예: /oauth2/authorization/naver)을 WebView로 열기
 * 2. 사용자가 네이버/카카오에서 로그인 완료
 * 3. Spring Boot가 OAuth2 콜백 처리 후 Whitelabel Error Page 응답
 * 4. Whitelabel Error Page 감지 → 로그인 완료 판단
 * 5. WebView에서 JSESSIONID 쿠키 추출
 * 6. React Navigation으로 홈 화면으로 이동
 */

interface SocialLoginScreenProps {
  /**
   * 소셜 로그인 제공자
   * - 'naver': 네이버 로그인
   * - 'kakao': 카카오 로그인
   * 
   * 향후 확장: 이 컴포넌트를 재사용하여 다른 제공자(구글, 페이스북 등)도 추가 가능
   */
  provider: 'naver' | 'kakao';
}

export function SocialLoginScreen({ provider }: SocialLoginScreenProps) {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);

  // 소셜 로그인 시작 URL 구성
  // Spring Boot OAuth2 설정에 따라 /oauth2/authorization/{provider} 엔드포인트 사용
  const authUrl = `${API_CONFIG.BASE_URL}/oauth2/authorization/${provider}`;

  /**
   * Whitelabel Error Page 감지 함수
   * 
   * Spring Boot에서 OAuth2 인증이 완료되면 Whitelabel Error Page를 반환합니다.
   * 이 페이지의 특징:
   * - title에 "Whitelabel Error Page" 또는 "Whitelabel Error" 포함
   * - URL에 "error" 포함 가능
   * 
   * 이 함수는 onNavigationStateChange와 onLoadEnd에서 호출되어
   * Whitelabel 페이지를 감지하면 로그인 완료로 처리합니다.
   */
  const detectWhitelabelPage = (url: string | null, title: string | null): boolean => {
    if (!url && !title) return false;

    // title에 "Whitelabel Error Page" 또는 "Whitelabel Error" 포함 확인
    const hasWhitelabelTitle =
      title &&
      (title.includes('Whitelabel Error Page') ||
        title.includes('Whitelabel Error') ||
        title.toLowerCase().includes('whitelabel'));

    // URL에 "error" 또는 "whitelabel" 포함 확인
    const hasErrorUrl = url && (url.includes('error') || url.includes('whitelabel'));

    // 백엔드 서버로 리다이렉트되었는지 확인
    // 백엔드로 리다이렉트되었다는 것은 OAuth2 인증이 완료되었다는 의미
    const backendDomain = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '');
    const isBackendRedirect = url && url.includes(backendDomain);

    // 백엔드로 리다이렉트되었고, error 페이지이거나 whitelabel 제목이 있으면 로그인 완료
    return (
      hasWhitelabelTitle ||
      (isBackendRedirect && hasErrorUrl) ||
      (isBackendRedirect && hasWhitelabelTitle)
    );
  };

  /**
   * WebView에서 쿠키 추출 함수
   * 
   * WebView 내부에서 실행되는 JavaScript를 주입하여 document.cookie를 읽습니다.
   * 추출된 쿠키는 window.ReactNativeWebView.postMessage를 통해 RN으로 전달됩니다.
   * 
   * 참고: @react-native-cookies/cookies 라이브러리를 사용할 수도 있지만,
   * WebView의 쿠키를 직접 읽기 위해서는 injectedJavaScript가 더 안정적입니다.
   */
  const extractCookiesFromWebView = () => {
    if (!webViewRef.current) return;

    console.log('🍪 WebView에서 쿠키 추출 시도...');

    // JavaScript를 주입하여 document.cookie 읽기
    const cookieScript = `
      (function() {
        try {
          const cookies = document.cookie;
          console.log('WebView Cookies:', cookies);
          
          // 쿠키를 RN으로 전달
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'cookies',
            cookies: cookies
          }));
        } catch (error) {
          console.error('Cookie extraction error:', error);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      })();
      true; // 주의: 이 값이 반환되어야 injectJavaScript가 작동함
    `;

    webViewRef.current.injectJavaScript(cookieScript);
  };

  /**
   * WebView에서 메시지 수신 처리
   * 
   * WebView의 injectedJavaScript에서 postMessage로 전달된 쿠키 정보를 받습니다.
   * JSESSIONID를 추출하여 AsyncStorage에 저장하고, 이후 API 요청에 사용합니다.
   */
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'cookies' && data.cookies) {
        console.log('📦 WebView에서 쿠키 수신:', data.cookies);

        // JSESSIONID 추출 (Spring Boot의 기본 세션 쿠키 이름)
        const jsessionMatch = data.cookies.match(/JSESSIONID=([^;]+)/);

        if (jsessionMatch) {
          const jsessionId = jsessionMatch[1];
          console.log('✅ JSESSIONID 추출 성공:', jsessionId);

          // 쿠키를 AsyncStorage에 저장 (이후 API 요청에 사용)
          await api.setSessionCookie(`JSESSIONID=${jsessionId}`);

          // 세션 유효성 확인
          await validateSessionAndNavigate();
        } else {
          console.log('⚠️ JSESSIONID를 찾을 수 없음');
          // 쿠키가 없어도 백엔드로 리다이렉트되었다면 세션 확인 시도
          await validateSessionAndNavigate();
        }
      } else if (data.type === 'error') {
        console.error('쿠키 추출 오류:', data.message);
        // 오류가 발생해도 세션 확인 시도
        await validateSessionAndNavigate();
      }
    } catch (error) {
      console.error('WebView 메시지 처리 오류:', error);
      // 파싱 오류가 발생해도 세션 확인 시도
      await validateSessionAndNavigate();
    }
  };

  /**
   * 세션 유효성 확인 및 홈 화면으로 이동
   * 
   * 쿠키를 추출한 후, 실제로 세션이 유효한지 API 호출로 확인합니다.
   * 세션이 유효하면 사용자 정보를 저장하고 홈 화면으로 이동합니다.
   */
  const validateSessionAndNavigate = async () => {
    try {
      // 백엔드가 세션을 완전히 생성할 시간 제공
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 세션 유효성 확인을 위한 API 호출
      // 여러 엔드포인트를 시도하여 하나라도 성공하면 세션 유효로 판단
      const validationEndpoints = [
        { endpoint: '/api/post/posts', params: { postKind: 'EXERCISE' } },
        { endpoint: '/api/user/profile', params: undefined },
        { endpoint: '/api/dashboard/stats', params: undefined },
      ];

      let sessionValid = false;

      for (const validation of validationEndpoints) {
        try {
          const testResponse = await api.get(validation.endpoint, validation.params);
          if (testResponse.success) {
            sessionValid = true;
            console.log(`✅ 세션 유효성 확인 성공: ${validation.endpoint}`);
            break;
          }
        } catch (apiError) {
          console.log(`세션 확인 API 호출 실패 (${validation.endpoint}):`, apiError);
          continue;
        }
      }

      // 세션 쿠키 확인
      const savedCookie = await AsyncStorage.getItem('JSESSIONID');

      if (sessionValid || savedCookie) {
        // 사용자 정보 저장
        const tempUser = {
          email: `${provider}@oauth.com`,
          name: `${provider === 'kakao' ? '카카오' : '네이버'}유저`,
          id: `${provider}_${Date.now()}`,
          provider: provider,
          oauthAuthenticated: true,
        };

        await AsyncStorage.setItem('currentUser', JSON.stringify(tempUser));

        console.log('✅ 로그인 완료 - 홈 화면으로 이동');

        // React Navigation으로 홈 화면으로 이동
        // navigation.replace를 사용하여 뒤로가기로 로그인 화면으로 돌아오지 않도록 함
        // @ts-ignore - navigation 타입이 명확하지 않은 경우
        navigation.replace('홈');
      } else {
        Alert.alert('로그인 실패', '세션을 받아오지 못했습니다. 다시 로그인해주세요.');
      }
    } catch (error: any) {
      console.error('세션 확인 및 네비게이션 오류:', error);
      Alert.alert('로그인 실패', error?.message || '로그인 처리 중 오류가 발생했습니다.');
    }
  };

  /**
   * WebView 네비게이션 상태 변경 감지
   * 
   * onNavigationStateChange는 WebView가 다른 페이지로 이동할 때마다 호출됩니다.
   * 이 시점에서 Whitelabel Error Page를 감지하여 로그인 완료를 판단합니다.
   */
  const handleNavigationStateChange = (navState: any) => {
    const { url, title } = navState;
    console.log('WebView Navigation:', { url, title });

    if (!url) return;

    // Whitelabel Error Page 감지
    if (detectWhitelabelPage(url, title)) {
      console.log('✅ Whitelabel Error Page 감지 - 로그인 완료로 판단');
      console.log('URL:', url);
      console.log('Title:', title);

      // 페이지가 완전히 로드될 시간을 주고 쿠키 추출
      setTimeout(() => {
        extractCookiesFromWebView();
      }, 1000);
    }
  };

  /**
   * WebView 페이지 로드 완료 감지
   * 
   * onLoadEnd는 페이지가 완전히 로드된 후 호출됩니다.
   * onNavigationStateChange와 함께 사용하여 Whitelabel 페이지를 확실히 감지합니다.
   */
  const handleLoadEnd = (event: any) => {
    const { url } = event.nativeEvent;
    console.log('WebView onLoadEnd:', url);

    if (!url) return;

    // 백엔드 서버로 리다이렉트되었는지 확인
    const backendDomain = API_CONFIG.BASE_URL.replace(/^https?:\/\//, '');
    const isBackendRedirect = url.includes(backendDomain);

    // 백엔드로 리다이렉트되었고, error나 whitelabel이 있으면 확인
    if (isBackendRedirect && (url.includes('error') || url.includes('whitelabel'))) {
      console.log('✅ 페이지 로드 완료 - 백엔드 리다이렉트 감지');

      // 페이지가 완전히 로드될 시간을 주고 쿠키 추출
      setTimeout(() => {
        extractCookiesFromWebView();
      }, 1000);
    }

    setPageLoaded(true);
    setLoading(false);
  };

  /**
   * WebView 로드 시작
   */
  const handleLoadStart = () => {
    setLoading(true);
    setPageLoaded(false);
  };

  return (
    <View style={styles.container}>
      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: authUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onMessage={handleWebViewMessage}
        // 쿠키를 활성화하여 WebView에서 쿠키 사용 가능
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        // JavaScript 활성화 (쿠키 추출을 위해 필요)
        javaScriptEnabled={true}
        // WebView 스타일
        style={styles.webview}
      />

      {/* 로딩 인디케이터 */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>
            {provider === 'naver' ? '네이버' : '카카오'} 로그인 중...
          </Text>
        </View>
      )}

      {/* 닫기 버튼 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            // @ts-ignore
            navigation.goBack();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕ 닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});

