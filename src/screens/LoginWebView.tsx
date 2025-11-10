/**
 * Login WebView Screen
 * 
 * 네이버 OAuth2 로그인을 처리하는 WebView 컴포넌트입니다.
 * 
 * 실행 로그 분석:
 * - 네이버 OAuth2 페이지는 정상적으로 로드됨
 * - 로그인 성공 후 백엔드 콜백 URL 도착: http://112.165.239.133:8080/login/oauth2/code/naver?code=...&state=...
 * - 이후 WebView가 콜백 URL을 그대로 화면에 띄우려다가 내용이 없어서 흰 화면으로 보임
 * - "CookieManager 사용 불가 - AsyncStorage 사용" 메시지: WebView와 RN이 쿠키를 공유하지 않음
 * 
 * 해결 방법:
 * 1. onShouldStartLoadWithRequest에서 콜백 URL을 감지하고 즉시 차단 (return false)
 *    - 이 부분은 콜백 URL 감지해서 WebView를 닫는 부분입니다.
 * 2. injectedJavaScript로 document.cookie를 지속적으로 RN으로 전송
 *    - 이 부분은 쿠키를 RN으로 보내는 부분입니다.
 * 3. onMessage에서 쿠키를 AsyncStorage에 저장
 *    - 이 부분은 받은 쿠키를 AsyncStorage에 넣는 부분입니다.
 * 4. 콜백 URL 감지 시 WebView를 숨기고 메인 화면으로 이동
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const BACKEND_URL = 'http://112.165.239.133:8080';

/**
 * WebView에 주입할 JavaScript
 * 
 * 이 부분은 쿠키를 RN으로 보내는 부분입니다.
 * 
 * 문제: document.cookie는 HttpOnly 쿠키(JSESSIONID)를 읽을 수 없습니다.
 * 해결: 콜백 URL에 도달했을 때 XHR 요청을 보내서 응답 헤더에서 Set-Cookie를 확인합니다.
 * 
 * 실행 로그에서 "CookieManager 사용 불가" 메시지가 나오는 이유는
 * WebView와 React Native가 쿠키를 공유하지 않기 때문입니다.
 * 따라서 XHR 응답 헤더에서 쿠키를 추출하여 postMessage로 RN으로 전송하고,
 * RN에서는 AsyncStorage에 저장한 후 axios 요청 시 헤더에 추가합니다.
 */
const injectedJS = `
  (function() {
    let cookieExtracted = false;
    
    function sendCookieData() {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          const href = window.location.href;
          const isCallbackUrl = href.includes('/login/oauth2/code/');
          
          // 콜백 URL에 도달했을 때만 XHR로 쿠키 추출 시도
          if (isCallbackUrl && !cookieExtracted) {
            cookieExtracted = true;
            
            // 백엔드에 인증 확인 요청을 보내서 응답 헤더에서 Set-Cookie 확인
            const xhr = new XMLHttpRequest();
            xhr.open('GET', '${BACKEND_URL}/api/food/today', true);
            xhr.withCredentials = true; // 쿠키 포함
            
            xhr.onload = function() {
              try {
                // 응답 헤더에서 Set-Cookie 확인
                const setCookieHeader = xhr.getResponseHeader('Set-Cookie') || '';
                const allHeaders = xhr.getAllResponseHeaders();
                
                // Set-Cookie 헤더에서 JSESSIONID 추출
                let jsessionId = '';
                if (setCookieHeader) {
                  const match = setCookieHeader.match(/JSESSIONID=([^;]+)/);
                  if (match) {
                    jsessionId = 'JSESSIONID=' + match[1];
                  }
                }
                
                // 모든 헤더에서도 확인 (대소문자 구분 없이)
                if (!jsessionId && allHeaders) {
                  const headerMatch = allHeaders.match(/[Ss]et-[Cc]ookie[^\\n]*JSESSIONID=([^;\\n]+)/);
                  if (headerMatch) {
                    jsessionId = 'JSESSIONID=' + headerMatch[1].trim();
                  }
                }
                
                // RN으로 전송
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'COOKIE_DUMP',
                  cookie: document.cookie || '',
                  href: href,
                  setCookieHeader: setCookieHeader,
                  jsessionId: jsessionId,
                  status: xhr.status,
                  allHeaders: allHeaders
                }));
              } catch (e) {
                console.error('XHR onload error:', e);
              }
            };
            
            xhr.onerror = function() {
              // XHR 실패해도 document.cookie는 시도
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'COOKIE_DUMP',
                cookie: document.cookie || '',
                href: href,
                setCookieHeader: '',
                jsessionId: '',
                status: 0
              }));
            };
            
            xhr.send();
          } else {
            // 일반 페이지에서는 document.cookie만 전송
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'COOKIE_DUMP',
              cookie: document.cookie || '',
              href: href
            }));
          }
        }
      } catch (error) {
        console.error('Cookie send error:', error);
      }
    }
    
    // 페이지 로드 직후 한 번
    sendCookieData();
    
    // 페이지가 내부에서 바뀔 수 있으므로 1초마다 한 번씩 보냄
    setInterval(sendCookieData, 1000);
    
    true; // injectedJavaScript는 true를 반환해야 함
  })();
`;

interface LoginWebViewProps {
  provider?: 'naver' | 'kakao';
  onLoginSuccess?: () => void;
  onClose?: () => void;
}

function LoginWebView({ provider = 'naver', onLoginSuccess, onClose }: LoginWebViewProps) {
  const navigation = useNavigation();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [loginCompleted, setLoginCompleted] = useState(false);

  // Provider별 URL 구성
  const LOGIN_URL = `${BACKEND_URL}/oauth2/authorization/${provider}`;
  const CALLBACK_PREFIX = `${BACKEND_URL}/login/oauth2/code/${provider}`;

  /**
   * WebView에서 메시지 수신
   * 
   * 이 부분은 받은 쿠키를 AsyncStorage에 넣는 부분입니다.
   * 
   * injectedJavaScript에서 postMessage로 전달된 쿠키를
   * AsyncStorage에 저장합니다.
   * 
   * 실행 로그를 보면 콜백 URL까지는 도착했으므로,
   * 이 시점에서 쿠키가 WebView에 설정되어 있을 것입니다.
   */
  const handleMessage = useCallback(async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'COOKIE_DUMP') {
        // XHR에서 추출한 JSESSIONID 우선 사용
        let sessionCookie = '';
        
        if (data.jsessionId && data.jsessionId.trim() !== '') {
          sessionCookie = data.jsessionId;
          console.log('✅ XHR에서 JSESSIONID 추출:', sessionCookie.substring(0, 50) + '...');
        } else if (data.setCookieHeader) {
          // Set-Cookie 헤더에서 JSESSIONID 추출
          const jsessionMatch = data.setCookieHeader.match(/JSESSIONID=([^;]+)/);
          if (jsessionMatch) {
            sessionCookie = `JSESSIONID=${jsessionMatch[1]}`;
            console.log('✅ Set-Cookie 헤더에서 JSESSIONID 추출:', sessionCookie.substring(0, 50) + '...');
          }
        }
        
        // Set-Cookie 헤더에서 찾지 못했으면 document.cookie 시도
        if (!sessionCookie && data.cookie && data.cookie.trim() !== '') {
          // document.cookie에서 JSESSIONID 추출 시도
          if (data.cookie.includes('JSESSIONID')) {
            sessionCookie = data.cookie.split(';').find((c: string) => c.trim().startsWith('JSESSIONID=')) || data.cookie;
            console.log('✅ document.cookie에서 JSESSIONID 추출:', sessionCookie.substring(0, 50) + '...');
          } else {
            console.log('⚠️ document.cookie에 JSESSIONID가 없습니다. 내용:', data.cookie);
          }
        }
        
        // 쿠키를 찾았으면 저장
        if (sessionCookie) {
          await AsyncStorage.setItem('@sessionCookie', sessionCookie);
          console.log('📦 세션 쿠키 저장 완료:', sessionCookie.substring(0, 50) + '...');
        } else {
          // 콜백 URL인 경우에만 경고 (일반 페이지는 정상)
          if (data.href && data.href.includes('/login/oauth2/code/')) {
            console.log('⚠️ 콜백 URL에서 JSESSIONID 쿠키를 찾을 수 없습니다.');
            console.log('  - href:', data.href);
            console.log('  - document.cookie:', data.cookie);
            console.log('  - Set-Cookie 헤더:', data.setCookieHeader);
            console.log('  - XHR jsessionId:', data.jsessionId);
            console.log('  - XHR status:', data.status);
          }
        }
      }
    } catch (err) {
      console.error('WebView 메시지 처리 오류:', err);
    }
  }, []);

  /**
   * WebView에서 새로운 요청 시작 여부 결정
   * 
   * 이 부분은 콜백 URL 감지해서 WebView를 닫는 부분입니다.
   * 
   * 실행 로그를 보면:
   * - "WebView Navigation: http://112.165.239.133:8080/login/oauth2/code/naver?code=...&state=..."
   * - "WebView onLoadEnd: http://112.165.239.133:8080/login/oauth2/code/naver?code=...&state=..."
   * - 이후 같은 콜백 URL을 또 로드하려고 하고, 결국 흰 화면에서 멈춤
   * 
   * 문제: WebView가 콜백 URL을 그대로 화면에 띄우려다가 내용이 없어서 흰 화면으로 보임
   * 
   * 해결: 콜백 URL이 로드되려는 순간 WebView 로딩을 막고 RN 네이티브 화면으로 이동
   * 
   * 이 함수가 false를 반환하면 WebView는 해당 URL을 로드하지 않습니다.
   * 따라서 하얀 화면 문제를 방지할 수 있습니다.
   */
  const handleShouldStartLoadWithRequest = useCallback(
    (req: any) => {
      const url: string = req.url || '';
      
      // 콜백 URL 감지
      // 실행 로그에서 보이는 콜백 URL: http://112.165.239.133:8080/login/oauth2/code/naver?code=...&state=...
      if (url.startsWith(CALLBACK_PREFIX)) {
        console.log('✅ 로그인 성공 콜백 URL 감지:', url);
        
        // 이미 처리했으면 다시 처리하지 않음
        if (loginCompleted) {
          return false;
        }
        
        setLoginCompleted(true);
        
        // WebView 로딩 중지
        // 이렇게 하면 콜백 URL이 WebView에서 열리지 않아서 흰 화면이 나타나지 않습니다.
        if (webViewRef.current) {
          webViewRef.current.stopLoading();
        }
        
        // 사용자 정보 저장 (임시)
        // 실제로는 백엔드에서 사용자 정보를 가져와야 하지만, 여기서는 임시로 저장
        AsyncStorage.setItem('currentUser', JSON.stringify({
          email: `${provider}@oauth.com`,
          name: `${provider === 'kakao' ? '카카오' : '네이버'}유저`,
          provider,
        })).then(() => {
          console.log('✅ 로그인 완료 - 메인 화면으로 이동');
          
          // 로그인 성공 콜백 호출 또는 메인 화면으로 이동
          // 실행 로그를 보면 콜백 URL까지는 도착했으므로, 여기서 로그인 성공으로 간주
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            // 네이티브 네비게이션으로 메인 화면으로 이동
            // @ts-ignore
            navigation.replace('Home');
          }
        });
        
        // 이 URL은 WebView에서 로드하지 않음 (하얀 화면 방지)
        // return false를 하면 WebView는 이 URL을 로드하지 않습니다.
        return false;
      }
      
      // 다른 URL은 정상적으로 로드
      return true;
    },
    [navigation, onLoginSuccess, loginCompleted],
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
          javaScriptEnabled={true}
          sharedCookiesEnabled={true}
          thirdPartyCookiesEnabled={true}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
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
