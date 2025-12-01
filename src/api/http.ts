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

  // 인증 헤더 준비 (JWT 토큰 우선, 세션 쿠키는 보조)
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  // Content-Type은 body가 있을 때만 설정 (FormData는 자동으로 boundary 포함)
  // Spring Boot가 @RequestBody를 받으려면 Content-Type이 application/json이어야 함
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json;charset=utf-8';
    headers['Accept'] = 'application/json';
  }

  // JWT 토큰 확인 (우선) - getAccessToken 사용하여 통일된 로직 적용
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  const token = await getAccessToken();
  
  if (token) {
    // accessToken에 'Bearer '가 포함되어 있으면 그대로, 아니면 추가
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else {
    // 세션 쿠키 확인 (보조 수단) - getSessionCookie 사용하여 통일된 로직 적용
    const cookie = await getSessionCookie();
    if (cookie) {
      let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
      if (!cookieValue.includes('JSESSIONID=')) {
        cookieValue = `JSESSIONID=${cookieValue}`;
      }
      headers['Cookie'] = cookieValue;
    }
  }

  // 토큰이 없어도 요청은 시도 (백엔드에서 401 반환할 수 있음)
  // 경고 로그는 제거 (토큰이 있을 때는 경고 불필요)

  const hasBody = typeof options.body !== 'undefined' && options.body !== null;
  const requiresWebViewFirst = method === 'GET' && hasBody;

  const callViaWebView = async (reason?: string): Promise<T> => {

    if (!WebViewManager.isAvailable()) {
      throw new Error('로그인은 되었지만 현재 WebView 프록시가 없습니다. 로그인 화면(WebView)이 떠 있는 상태에서 다시 시도해주세요.');
    }

    try {
      const isHeavy =
        path.indexOf('/api/recommend/') === 0 ||
        path.indexOf('/api/food/recommend') === 0 ||
        path.indexOf('/api/food/recipe/recommend') === 0 ||
        path.indexOf('/api/exercise/recommend') === 0;

      // 디버깅: 요청 데이터 로깅
      if (options.body) {
        console.log('[WebView] GET + body 요청:', {
          method,
          path,
          body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
          hasAuth: !!headers['Authorization'],
          contentType: headers['Content-Type'] || 'application/json;charset=utf-8',
        });
      }
      
      const viaWebView = await WebViewManager.requestApi({
        method,
        path,
        headers,
        query: options.query || {},
        body: options.body ?? null,
      });

      // WebView 응답이 에러인 경우 처리
      if (viaWebView && typeof viaWebView === 'object') {
        // status >= 400 또는 error: true인 경우
        if (viaWebView.error === true || (viaWebView.status && viaWebView.status >= 400)) {
          // 에러 응답 상세 로깅
          console.log('[WebView] GET + body 에러 응답:', {
            status: viaWebView.status,
            path,
            error: viaWebView.error,
            message: viaWebView.message,
            description: viaWebView.description,
            errorCode: viaWebView.errorCode,
            fullResponse: viaWebView,
          });
          
          const errorMessage = viaWebView.message || viaWebView.error || viaWebView.description || '요청에 실패했습니다.';
          const status = viaWebView.status || 500;
          throw new Error(`${status} ${errorMessage}`);
        }
      }

      if (typeof viaWebView === 'string') {
        try {
          const parsed = JSON.parse(viaWebView);
          if (parsed && typeof parsed === 'object' && 'error' in parsed) {
            throw new Error(parsed.message || parsed.error || '요청에 실패했습니다.');
          }
          if (parsed && typeof parsed === 'object' && 'value' in parsed) {
            return parsed.value as T;
          }
          return parsed as T;
        } catch (parseError) {
          // JSON 파싱 실패 시 문자열 그대로 반환
          return viaWebView as T;
        }
      }

      // 객체인 경우 value 추출
      if (viaWebView && typeof viaWebView === 'object') {
        if ('value' in viaWebView) {
          return (viaWebView as ApiResponse<T>).value;
        }
        // data 필드가 있으면 data 반환
        if ('data' in viaWebView) {
          return viaWebView.data as T;
        }
        // status가 200-399이고 error가 없으면 그대로 반환
        if (viaWebView.status && viaWebView.status >= 200 && viaWebView.status < 400 && !viaWebView.error) {
          return viaWebView as T;
        }
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
      // 500 에러나 404 에러는 상세 정보 포함
      let errorMessage = `${res.status}`;
      try {
        const errorData = JSON.parse(text);
        if (errorData?.error || errorData?.description || errorData?.message) {
          errorMessage += ` ${errorData.error || errorData.description || errorData.message}`;
        }
        if (errorData?.errorCode) {
          errorMessage += ` (errorCode:${errorData.errorCode})`;
        }
      } catch {
        const snippet = String(text || '').substring(0, 200);
        errorMessage += ` ${snippet}`;
      }
      throw new Error(errorMessage);
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
    const message = String(error?.message || error || '').toLowerCase();
    
    // GET + body 조합은 WebView로 처리
    if (hasBody && method === 'GET' && message.includes('body not allowed')) {
      return callViaWebView('RN fetch가 GET+body 조합을 차단합니다.');
    }

    // 네트워크 오류나 타임아웃은 WebView로 재시도
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch') ||
      message.includes('network request failed')
    ) {
      try {
        return await callViaWebView('네트워크 오류로 WebView로 재시도합니다.');
      } catch (webViewError) {
        throw error; // WebView도 실패하면 원래 에러 throw
      }
    }

    throw error;
  }
}

