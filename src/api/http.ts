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
  const qs =
    options.query && Object.keys(options.query).length
      ? '?' +
        Object.entries(options.query)
          .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(String(v)))
          .join('&')
      : '';

  const url = BASE_URL + path + qs;

  // 인증 헤더 준비 (JWT 토큰 또는 세션 쿠키)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // JWT 토큰 확인 (우선)
  let token = await AsyncStorage.getItem('@accessToken');
  if (!token) {
    const authToken = await AsyncStorage.getItem('authToken');
    if (authToken) token = authToken.replace(/^Bearer\s+/, '');
  }
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else {
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

  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const requiresWebViewFirst = method === 'GET' && hasBody;

  const callViaWebView = async (reason?: string): Promise<T> => {
    if (reason) {
      console.log('⚠️ RN 직접 호출 건너뛰고 WebView 폴백 시도:', path, '-', reason);
    } else {
      console.log('⚠️ RN 요청이 HTML 로그인 페이지 반환 → WebView로 폴백 시도:', path);
    }

    if (!WebViewManager.isAvailable()) {
      throw new Error('로그인은 되었지만 현재 WebView 프록시가 없습니다. 로그인 화면(WebView)이 떠 있는 상태에서 다시 시도해주세요.');
    }

    try {
      const isHeavy =
        path.indexOf('/api/recommend/') === 0 ||
        path.indexOf('/api/food/recommend') === 0 ||
        path.indexOf('/api/food/recipe/recommend') === 0 ||
        path.indexOf('/api/exercise/recommend') === 0;

      const viaWebView = await WebViewManager.requestApi({
        method,
        path,
        headers,
        query: options.query || {},
        body: options.body ?? null,
        timeoutMs: isHeavy ? 8000 : undefined,
      });

      console.log('✅ WebView 폴백 성공:', path);

      if (viaWebView && typeof viaWebView === 'object' && 'error' in viaWebView) {
        throw new Error(viaWebView.message || 'WebView 프록시 호출에 실패했습니다.');
      }

      if (typeof viaWebView === 'string') {
        try {
          const parsed = JSON.parse(viaWebView);
          if (parsed && typeof parsed === 'object' && 'value' in parsed) {
            return parsed.value as T;
          }
          return parsed as T;
        } catch {
          return viaWebView as T;
        }
      }

      if (viaWebView && typeof viaWebView === 'object' && 'value' in viaWebView) {
        return (viaWebView as ApiResponse<T>).value;
      }

      return viaWebView as T;
    } catch (e: any) {
      throw new Error(e?.message || 'WebView 프록시 호출에 실패했습니다.');
    }
  };

  if (requiresWebViewFirst) {
    return callViaWebView('RN fetch는 GET 요청에 body를 포함할 수 없습니다.');
  }

  try {
    const bodyPayload = hasBody ? JSON.stringify(options.body) : undefined;

    const res = await fetch(url, {
      method,
      headers,
      body: bodyPayload,
    });

    const contentType = res.headers.get('content-type');
    const text = await res.text();

    if (isHtmlLoginResponse(text, contentType)) {
      return callViaWebView();
    }

    if (!res.ok) {
      const snippet = String(text || '').substring(0, 200);
      throw new Error(`${res.status} ${snippet}`);
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && 'value' in parsed) {
        return parsed.value as T;
      }
      return parsed as T;
    } catch {
      return text as T;
    }
  } catch (error: any) {
    console.error('❌ RN 요청 실패:', error);

    const message = String(error?.message || error || '').toLowerCase();
    if (hasBody && method === 'GET' && message.includes('body not allowed')) {
      return callViaWebView('RN fetch가 GET+body 조합을 차단합니다.');
    }

    throw error;
  }
}

