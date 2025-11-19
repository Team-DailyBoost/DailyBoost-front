/**
 * API Client (Axios)
 * 
 * 백엔드 API 호출을 위한 axios 인스턴스입니다.
 * baseURL: https://dailyboost.duckdns.org
 * 
 * 실행 로그 분석:
 * - "CookieManager 사용 불가 - AsyncStorage 사용" 메시지가 나오는 이유:
 *   WebView와 React Native가 쿠키를 공유하지 않기 때문입니다.
 *   따라서 WebView에서 받은 세션 쿠키를 RN axios 요청에 직접 사용할 수 없습니다.
 * 
 * 해결 방법:
 * 1. WebView에서 document.cookie를 읽어서 AsyncStorage에 저장
 * 2. 이 인터셉터에서 AsyncStorage의 쿠키를 읽어서 요청 헤더에 자동 추가
 * 
 * 이렇게 하면 WebView에서 받은 쿠키를 axios 요청에 사용할 수 있습니다.
 */
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  getSessionCookie,
  clearAllAuth,
} from '../utils/storage';

const BASE_URL = 'https://dailyboost.duckdns.org';

/**
 * Axios 인스턴스 생성
 */
const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * 요청 인터셉터
 * 
 * 이 부분은 쿠키 우회용입니다.
 * 
 * AsyncStorage에서 저장된 인증 정보(토큰 또는 쿠키)를 가져와서
 * 요청 헤더에 자동으로 추가합니다.
 * 
 * 우선순위: JWT 토큰 > 세션 쿠키
 * 
 * 실행 로그에서 "CookieManager 사용 불가" 메시지가 나오는 이유는
 * WebView와 React Native가 쿠키를 공유하지 않기 때문입니다.
 * 따라서 WebView에서 document.cookie를 읽어서 AsyncStorage에 저장하고,
 * 이 인터셉터에서 그 쿠키를 헤더에 추가하는 방식으로 우회합니다.
 */
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // FormData를 사용하는 경우 Content-Type을 제거하여 axios가 자동으로 설정하도록 함
      // React Native에서 FormData 사용 시 boundary를 포함한 올바른 Content-Type이 필요함
      if (config.data instanceof FormData) {
        // Content-Type을 undefined로 설정하여 axios가 자동으로 boundary를 포함한 Content-Type을 설정하도록 함
        if (config.headers) {
          delete config.headers['Content-Type'];
          delete config.headers['content-type'];
        }
      }

      // JWT 토큰 확인 (우선)
      const token = await getAccessToken();
      
      if (token) {
        // JWT 토큰이 있으면 Authorization 헤더에 추가
        config.headers = {
          ...config.headers,
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        };
        console.log('🔑 JWT 토큰 사용');
      } else {
        // JWT 토큰이 없으면 세션 쿠키 확인
        // WebView에서 추출한 쿠키를 여기서 사용합니다.
        const cookie = await getSessionCookie();
        
        if (cookie) {
          // 쿠키가 있으면 Cookie 헤더에 추가
          // 쿠키 형식: "JSESSIONID=xxx" 또는 "JSESSIONID=xxx; Path=/"
          // Cookie 헤더에는 값만 포함 (Path= 등은 제거)
          let cookieValue = cookie.includes(';') 
            ? cookie.split(';')[0] 
            : cookie;
          
          // JSESSIONID= 접두사가 없으면 추가
          if (!cookieValue.includes('JSESSIONID=')) {
            cookieValue = `JSESSIONID=${cookieValue}`;
          }
          
          // 헤더 객체가 없을 수도 있으므로 보장
          config.headers = {
            ...config.headers,
            Cookie: cookieValue,
          };
          console.log('🍪 세션 쿠키 사용:', cookieValue.substring(0, 50) + '...');
        } else {
          console.log('⚠️ 세션 쿠키 없음 - 인증 실패 가능');
        }
      }
    } catch (error) {
      console.error('요청 인터셉터 오류:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터
 * 
 * - 401/403 응답 시 자동으로 인증 정보 삭제
 * - 응답 헤더에서 JWT 토큰 자동 추출 및 저장 (있는 경우)
 * - HTML 로그인 페이지 응답 감지 및 에러 변환
 */
client.interceptors.response.use(
  async (response: AxiosResponse) => {
    // HTML 로그인 페이지 감지
    // 백엔드가 인증되지 않은 요청에 대해 200 OK와 함께 HTML 로그인 페이지를 반환할 수 있음
    const contentType = response.headers['content-type'] || response.headers['Content-Type'] || '';
    const responseData = response.data;
    
    // 응답이 HTML인지 확인
    const isHtml = typeof responseData === 'string' && (
      responseData.includes('<!DOCTYPE html>') ||
      responseData.includes('<html') ||
      responseData.includes('Please sign in') ||
      responseData.includes('Login with OAuth 2.0')
    ) || contentType.includes('text/html');
    
    if (isHtml) {
      console.log('⚠️ HTML 로그인 페이지 응답 감지 - 인증 실패로 처리');
      
      // 인증 정보 삭제
      await clearAllAuth();
      
      // 에러로 변환
      const error: any = new Error('인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.');
      error.response = {
        ...response,
        status: 401,
        statusText: 'Unauthorized',
        data: { message: '인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.' }
      };
      return Promise.reject(error);
    }
    
    // 응답 헤더에서 JWT 토큰 확인
    const authHeader = response.headers['authorization'] || response.headers['Authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      if (token) {
        await setAccessToken(token);
        console.log('✅ 응답에서 JWT 토큰 수신 및 저장');
      }
    }

    // 응답 헤더에서 Refresh Token 확인
    const refreshHeader = response.headers['x-refresh-token'] || response.headers['X-Refresh-Token'];
    if (refreshHeader) {
      const refreshToken = refreshHeader.replace('Bearer ', '').trim();
      if (refreshToken) {
        await setRefreshToken(refreshToken);
        console.log('✅ 응답에서 Refresh Token 수신 및 저장');
      }
    }

    return response;
  },
  async (error) => {
    // 401 Unauthorized 또는 403 Forbidden 응답 처리
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('⚠️ 인증 오류 발생 - 인증 정보 삭제');
      
      // 인증 정보 삭제
      await clearAllAuth();
      
      // 로그인 화면으로 이동하는 로직은 각 컴포넌트에서 처리
    }

    return Promise.reject(error);
  }
);

export default client;

/**
 * API 응답 타입
 * 백엔드가 Api<T> 형식으로 응답을 래핑합니다.
 * Swagger 명세의 ApiMessageResponse, ApiUserResponse 등이 이 형식을 따릅니다.
 */
export interface ApiResponse<T = any> {
  errorCode?: number;
  description?: string;
  value: T;
}

/**
 * API 응답에서 value 추출 헬퍼
 * 백엔드 응답이 { errorCode, description, value } 형식이므로 value만 추출합니다.
 * 
 * HTML 응답이 들어오는 경우를 감지하여 에러를 던집니다.
 */
export function extractApiValue<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const data = response.data;
  
  // HTML 응답 감지 (인터셉터에서 처리되어야 하지만, 이중 체크)
  if (typeof data === 'string' && (
    data.includes('<!DOCTYPE html>') ||
    data.includes('<html') ||
    data.includes('Please sign in') ||
    data.includes('Login with OAuth 2.0')
  )) {
    throw new Error('인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.');
  }
  
  // JSON 응답인 경우
  if (data && typeof data === 'object' && 'value' in data) {
    return data.value;
  }
  
  // value 필드가 없는 경우 data 자체를 반환
  return data as T;
}
