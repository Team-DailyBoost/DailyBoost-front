/**
 * Login WebView Screen
 * 
 * OAuth2 소셜 로그인을 처리하는 WebView 컴포넌트입니다.
 * 
 * 로그인 흐름:
 * 1. WebView로 /oauth2/authorization/{provider} 접근
 * 2. 소셜 로그인 완료 후 백엔드 콜백 URL 도착
 * 3. 백엔드 HTML 페이지가 로드되면서 postMessage로 JWT 토큰 전송 (type: 'token')
 * 4. handleMessage에서 토큰 저장 및 로그인 완료 처리
 * 5. WebView 숨김 및 메인 화면으로 이동
 */
import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { saveTokens, saveSessionCookie } from '../utils/storage';

const BACKEND_URL = 'https://dailyboost.duckdns.org';

interface LoginWebViewProps {
  provider?: 'naver' | 'kakao';
  onLoginSuccess?: () => void;
  onClose?: () => void;
}

function LoginWebView({ provider = 'naver', onLoginSuccess, onClose }: LoginWebViewProps) {
  console.log('[LoginWebView] 🔥 component mounted (render)', { provider, onLoginSuccess: !!onLoginSuccess, onClose: !!onClose });
  
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [loginCompleted, setLoginCompleted] = useState(false);

  const LOGIN_URL = `${BACKEND_URL}/oauth2/authorization/${provider}`;
  // 참고용 (더 이상 막지 않음)
  const CALLBACK_PREFIX = `${BACKEND_URL}/login/oauth2/code/${provider}`;
  
  console.log('[LoginWebView] LOGIN_URL =', LOGIN_URL);

  /**
   * WebView에 주입할 JavaScript
   * 
   * 쿠키 정보를 주기적으로 전송합니다 (보조 수단).
   */
  const injectedJS = `
    (function() {
      function sendCookieData() {
        try {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'COOKIE_DUMP',
              href: window.location.href,
              cookie: document.cookie || ''
            }));
          }
        } catch (e) {}
      }
      sendCookieData();
      setInterval(sendCookieData, 1000);
      true;
    })();
  `;

  /**
   * WebView에서 메시지 수신
   * 
   * 백엔드 HTML 페이지에서 보내는 메시지를 처리합니다.
   * 
   * 1. type: 'token' - JWT 토큰 (핵심)
   * 2. type: 'COOKIE_DUMP' - 세션 쿠키 (보조 수단)
   */
  const handleMessage = useCallback(async (event: any) => {
    console.log('[LoginWebView] 📨 onMessage called, raw data =', event.nativeEvent?.data);
    
    try {
      const data = JSON.parse(event.nativeEvent.data || '{}');

      console.log('[LoginWebView] 📨 onMessage data =', data);

      // 1) 백엔드 HTML의 토큰 메시지 (핵심)
      if (data.type === 'token') {
        const rawAccess = data.jwtToken;
        const rawRefresh = data.refreshToken;

        if (rawAccess) {
          // accessToken에 'Bearer '가 포함되어 있으면 그대로, 아니면 추가
          const accessToken =
            typeof rawAccess === 'string' && rawAccess.startsWith('Bearer ')
              ? rawAccess
              : rawAccess.trim();

          console.log('[LoginWebView] Save tokens', accessToken ? 'Bearer ...' : 'null');

          // 토큰 저장
          await saveTokens(accessToken, rawRefresh);

          // 로그인 완료 처리
          setLoginCompleted(true);

          // 약간의 지연 후 화면 전환 (WebView가 완전히 닫힌 후)
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess();
            } else {
              // @ts-ignore
              navigation.replace('Home');
            }
          }, 100);
        }

        return;
      }

      // 2) 쿠키 덤프 처리 (선택적 보조 수단)
      if (data.type === 'COOKIE_DUMP') {
        const isCallbackUrl = data.href && data.href.includes('/login/oauth2/code/');
        
        if (isCallbackUrl && data.cookie && data.cookie.includes('JSESSIONID')) {
          let sessionCookie = '';
          
          if (data.cookie.includes('JSESSIONID')) {
            sessionCookie = data.cookie
              .split(';')
              .find((c: string) => c.trim().startsWith('JSESSIONID=')) || data.cookie;
          }

          if (sessionCookie) {
            await saveSessionCookie(sessionCookie);
            console.log('[LoginWebView] Session cookie saved');
          }
        }
      }
    } catch (err) {
      console.warn('[LoginWebView] handleMessage parse error', err);
    }
  }, [navigation, onLoginSuccess]);

  /**
   * WebView에서 새로운 요청 시작 여부 결정
   * 
   * ⚠️ 핵심: 콜백 URL은 막지 말고 통과시켜야 HTML이 로드되면서 postMessage가 실행됨
   * 딥링크(dailyboost://)만 처리합니다.
   */
  const handleShouldStartLoadWithRequest = useCallback(
    (req: any) => {
      const url: string = req.url || '';
      console.log('[LoginWebView] 🚦 shouldStart url =', url);

      // dailyboost:// 딥링크는 RN이 처리
      if (url.startsWith('dailyboost://')) {
        console.log('[LoginWebView] 🚦 Deep link detected, opening with Linking');
        Linking.openURL(url).catch((err) =>
          console.warn('[LoginWebView] Failed to open deep link', err),
        );
        return false; // WebView는 이 URL 로드 안 함
      }

      // ⚠️ 콜백 URL은 막지 말고 통과시켜야 HTML이 로드되면서 postMessage가 실행됨
      if (url.startsWith(CALLBACK_PREFIX)) {
        console.log('[LoginWebView] 🚦 Callback URL detected, allowing HTML to load');
      }

      return true; // 모든 URL 통과 (콜백 URL 포함)
    },
    [CALLBACK_PREFIX],
  );

  return (
    <View style={styles.container}>
      {/* 로그인 완료 후 WebView 숨김 */}
      {!loginCompleted && (
        <WebView
          ref={webViewRef}
          source={{ uri: LOGIN_URL }}
          injectedJavaScript={injectedJS}
          onMessage={handleMessage}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onNavigationStateChange={(navState) => {
            console.log('[LoginWebView] 🌐 navState url =', navState.url);
          }}
          onLoadStart={(e) => {
            const url = e.nativeEvent?.url || '';
            console.log('[LoginWebView] ⏳ onLoadStart url =', url);
            setLoading(true);
          }}
          onLoadEnd={(e) => {
            const url = e.nativeEvent?.url || '';
            console.log('[LoginWebView] ✅ onLoadEnd url =', url);
            setLoading(false);
          }}
          onError={(e) => {
            console.log('[LoginWebView] ❌ onError', e.nativeEvent);
          }}
          onHttpError={(e) => {
            console.log('[LoginWebView] ❌ onHttpError', e.nativeEvent);
          }}
          javaScriptEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          style={styles.webview}
        />
      )}

      {loading && !loginCompleted && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>
            {provider === 'kakao' ? '카카오' : '네이버'} 로그인 중...
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (onClose) {
              onClose();
            } else {
              // @ts-ignore
              navigation.goBack();
            }
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕ 닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default LoginWebView;
export { LoginWebView };

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
