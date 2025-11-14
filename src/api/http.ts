/**
 * HTTP 요청 유틸리티
 * 
 * RN에서 직접 백엔드를 호출할 때 HTML 로그인 페이지가 오면
 * WebView를 통해 다시 시도하는 폴백 레이어를 제공합니다.
 * 
 * 이렇게 하면 WebView에서만 세션이 살아있는 구조를 유지하면서
 * RN에서 호출하는 API도 WebView를 "프록시"로 사용할 수 있습니다.
 */
import { WebViewManager } from '../utils/webViewManager';
import { ApiResponse } from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://dailyboost.duckdns.org';

/**
 * HTML 로그인 페이지 응답인지 확인
 */
function isHtmlLoginResponse(text: string, contentType?: string | null): boolean {
  if (!text) return false;
  if (contentType && contentType.includes('text/html')) return true;
  return (
    text.includes('Please sign in') ||
    text.includes('<title>Please sign in</title>') ||
    text.includes('<!DOCTYPE html>') ||
    text.includes('<html')
  );
}

/**
 * WebView 폴백을 포함한 HTTP 요청 함수
 * 
 * 1. 먼저 RN에서 직접 fetch로 시도
 * 2. HTML 로그인 페이지가 오면 WebView를 통해 다시 시도
 * 3. WebView에서도 실패하거나 WebView가 없으면 에러 반환
 * 
 * @param method HTTP 메서드
 * @param path API 경로 (예: '/api/food/today')
 * @param options 요청 옵션
 * @returns API 응답 데이터
 */
export async function requestWithWebViewFallback<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options: {
    headers?: Record<string, string>;
    query?: Record<string, string | number>;
    body?: any;
  } = {}
): Promise<T> {
  // 1) RN에서 먼저 시도
  const qs =
    options.query && Object.keys(options.query).length
      ? '?' +
        Object.entries(options.query)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v)))
          .join('&')
      : '';

  const url = BASE_URL + path + qs;

  try {
    // 인증 헤더 준비 (JWT 토큰 또는 세션 쿠키)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    };

    // JWT 토큰 확인 (우선)
    let token = await AsyncStorage.getItem('@accessToken');
    if (!token) {
      // api.setAuthToken()로 저장된 키도 확인
      const authToken = await AsyncStorage.getItem('authToken');
      if (authToken) token = authToken.replace(/^Bearer\s+/, '');
    }
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    } else {
      // JWT 토큰이 없으면 세션 쿠키 확인 (두 키 모두 확인)
      let cookie = (await AsyncStorage.getItem('@sessionCookie')) || '';
      if (!cookie) {
        const jsessOnly = await AsyncStorage.getItem('backend:session-cookie');
        if (jsessOnly) cookie = `JSESSIONID=${jsessOnly}`;
      }
      if (cookie) {
        let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
        if (!cookieValue.includes('JSESSIONID=')) {
          cookieValue = `JSESSIONID=${cookieValue}`;
        }
        headers['Cookie'] = cookieValue;
      }
    }

    const res = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' && options.body ? JSON.stringify(options.body) : undefined,
    });

    const contentType = res.headers.get('content-type');
    const text = await res.text();

    // 2) 세션 없어서 HTML이 온 경우(상태코드 무관) → WebView로 폴백
    if (isHtmlLoginResponse(text, contentType)) {
      console.log('⚠️ RN 요청이 HTML 로그인 페이지 반환 → WebView로 폴백 시도:', path);

      // WebView 없으면 바로 사람 말로 된 에러 던짐
      if (!WebViewManager.isAvailable()) {
        throw new Error('로그인은 되었지만 현재 WebView 프록시가 없습니다. 로그인 화면(WebView)이 떠 있는 상태에서 다시 시도해주세요.');
      }

      try {
        const isHeavy = path.indexOf('/api/recommend/') === 0 || path.indexOf('/api/food/recommend') === 0 || path.indexOf('/api/food/recipe/recommend') === 0;
        const viaWebView = await WebViewManager.requestApi({
          method,
          path,
          // RN에서 사용한 동일 인증 헤더(Authorization/Cookie)를 WebView에도 전달
          headers,
          query: options.query || {},
          body: options.body || null,
          // 타임아웃 단축: 무거운 요청 8초
          timeoutMs: isHeavy ? 8000 : undefined,
        });

        console.log('✅ WebView 폴백 성공:', path);

        // WebView 응답 처리
        // handleGenericApiResponse에서 data.data를 resolve하므로, viaWebView는 직접 응답 데이터입니다
        if (viaWebView && typeof viaWebView === 'object' && 'error' in viaWebView) {
          // 에러 응답인 경우
          throw new Error(viaWebView.message || 'WebView 프록시 호출에 실패했습니다.');
        }

        // 문자열인 경우 JSON 파싱 시도
        if (typeof viaWebView === 'string') {
          try {
            const parsed = JSON.parse(viaWebView);
            // ApiResponse<T> 형식인 경우 value 추출
            if (parsed && typeof parsed === 'object' && 'value' in parsed) {
              return parsed.value as T;
            }
            return parsed as T;
          } catch {
            return viaWebView as T;
          }
        }

        // 이미 객체인 경우
        if (viaWebView && typeof viaWebView === 'object' && 'value' in viaWebView) {
          return (viaWebView as ApiResponse<T>).value;
        }

        return viaWebView as T;
      } catch (e: any) {
        throw new Error(e?.message || 'WebView 프록시 호출에 실패했습니다.');
      }
    }

    // 3) 상태코드 확인: 2xx가 아니면 에러로 던짐 (상위에서 대체 전략 수행 가능)
    if (!res.ok) {
      // 가능한 경우 서버 메시지를 포함
      const snippet = String(text || '').substring(0, 200);
      throw new Error(`${res.status} ${snippet}`);
    }

    // 4) JSON이면 파싱해서 돌려준다
    try {
      const parsed = JSON.parse(text);
      // ApiResponse<T> 형식인 경우 value 추출
      if (parsed && typeof parsed === 'object' && 'value' in parsed) {
        return parsed.value as T;
      }
      return parsed as T;
    } catch {
      // JSON 파싱 실패 시 텍스트 그대로 반환
      return text as T;
    }
  } catch (error: any) {
    // fetch 자체가 실패한 경우 (네트워크 에러 등)
    console.error('❌ RN 요청 실패:', error);
    throw error;
  }
}

