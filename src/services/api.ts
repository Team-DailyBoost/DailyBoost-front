import { getApiUrl, API_CONFIG } from '../config/api';
export { API_CONFIG } from '../config/api';

const ACCESS_TOKEN_KEYS = ['@accessToken', 'authToken'] as const;
const REFRESH_TOKEN_KEYS = ['@refreshToken', 'refreshToken'] as const;
const SESSION_COOKIE_KEYS = ['@sessionCookie', 'JSESSIONID'] as const;

/**
 * API Response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * API Client Class
 */
class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  /**
   * Get auth token from storage
   */
  private async getToken(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      for (const key of ACCESS_TOKEN_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value && value.trim().length > 0) {
          return value;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Set auth token to storage
   */
  private async setToken(token: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await Promise.all(ACCESS_TOKEN_KEYS.map((key) => AsyncStorage.setItem(key, token)));
    } catch (error) {
      // Ignore error
    }
  }
  
  /**
   * Remove auth token from storage
   */
  private async removeToken(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await Promise.all(ACCESS_TOKEN_KEYS.map((key) => AsyncStorage.removeItem(key)));
    } catch (error) {
      // Ignore error
    }
  }

  /**
   * Remove refresh token from storage
   */
  private async removeRefreshToken(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await Promise.all(REFRESH_TOKEN_KEYS.map((key) => AsyncStorage.removeItem(key)));
    } catch (error) {
      // Ignore error
    }
  }
  
  /**
   * Get JSESSIONID cookie from storage
   */
  private async getSessionCookie(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      for (const key of SESSION_COOKIE_KEYS) {
        const cookie = await AsyncStorage.getItem(key);
        if (cookie && cookie.trim().length > 0) {
          return cookie;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Set JSESSIONID cookie to storage
   */
  async setSessionCookie(cookie: string): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      // JSESSIONID=ABC123 형식에서 값만 추출
      const sessionId = cookie.includes('=') ? cookie.split('=')[1].split(';')[0] : cookie;
      await Promise.all(SESSION_COOKIE_KEYS.map((key) => AsyncStorage.setItem(key, sessionId)));
    } catch (error) {
      // Ignore error
    }
  }
  
  /**
   * Remove JSESSIONID cookie from storage
   */
  private async removeSessionCookie(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await Promise.all(SESSION_COOKIE_KEYS.map((key) => AsyncStorage.removeItem(key)));
    } catch (error) {
      // Ignore error
    }
  }
  
  
  /**
   * Make API request
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      
      // JWT Bearer 토큰 사용 (세션 쿠키보다 우선)
      // JWT 토큰이 있으면 Authorization 헤더에 포함
      if (token) {
        if (token.startsWith('Bearer')) {
          headers['Authorization'] = token;
        } else {
          headers['Authorization'] = `Bearer ${token}`;
        }
        // JWT 토큰이 있으면 세션 쿠키는 사용하지 않음 (JWT가 우선)
      } else {
        // JWT 토큰이 없으면 세션 쿠키 사용 (fallback)
      const sessionCookie = await this.getSessionCookie();
      if (sessionCookie) {
        const cookieValue = sessionCookie.includes('=') ? sessionCookie.split('=')[1].split(';')[0] : sessionCookie;
        headers['Cookie'] = `JSESSIONID=${cookieValue}`;
      }
      }
      
      const fullUrl = this.baseURL + endpoint;
      
      // 타임아웃 설정 (15초)
      const timeout = 15000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      let response: Response;
      try {
        // Android에서 HTTP 연결 개선을 위한 추가 옵션
        // 세션 기반 인증을 위해 credentials: 'include' 사용 (쿠키 포함)
        const fetchOptions: RequestInit = {
          ...options,
          headers,
          signal: controller.signal,
          // Android 네트워크 연결 개선
          cache: 'no-cache',
          mode: 'cors',
          credentials: 'include', // 세션 쿠키 포함
        };
        
        response = await fetch(fullUrl, fetchOptions);
        clearTimeout(timeoutId);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // 네트워크 오류 처리
        if (fetchError.name === 'AbortError') {
          throw new Error('요청 시간이 초과되었습니다.');
        }
        
        if (fetchError.message?.includes('Network request failed') || 
            fetchError.message?.includes('Failed to fetch')) {
          throw new Error(`서버에 연결할 수 없습니다.\n\n확인 사항:\n1. 백엔드 서버가 실행 중인지 확인\n2. 서버 주소: ${this.baseURL}\n3. 네트워크 연결 상태 확인`);
        }
        
        throw fetchError;
      }
      
      // 응답이 비어있을 수 있음
      let data: any;
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      // 응답에서 JWT 토큰 확인 (우선 처리)
      // 백엔드가 OAuth 로그인 성공 시 응답 헤더에 JWT 토큰을 포함할 수 있음
      const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const jwtToken = authHeader.replace('Bearer ', '').trim();
        if (jwtToken) {
          console.log('✅ 응답에서 JWT 토큰 수신');
          await this.setToken(jwtToken);
        }
      }
      
      // 응답에서 Refresh Token 확인
      const refreshHeader = response.headers.get('X-Refresh-Token') || response.headers.get('x-refresh-token');
      if (refreshHeader) {
        const refreshToken = refreshHeader.replace('Bearer ', '').trim();
        if (refreshToken) {
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            await Promise.all(
              REFRESH_TOKEN_KEYS.map((key) => AsyncStorage.setItem(key, refreshToken))
            );
            console.log('✅ 응답에서 Refresh Token 수신');
          } catch (error) {
            // Ignore error
          }
        }
      }
      
      // 응답에서 Set-Cookie 헤더 확인하여 JSESSIONID 저장 (JWT가 없을 때만)
      const currentToken = await this.getToken();
      if (!currentToken) {
      const setCookieHeader = response.headers.get('Set-Cookie');
      if (setCookieHeader) {
        const jsessionMatch = setCookieHeader.match(/JSESSIONID=([^;]+)/);
        if (jsessionMatch) {
          await this.setSessionCookie(jsessionMatch[0]);
          }
        }
      }
      
      // 세션 쿠키 확인 (요청 시 포함된 쿠키 또는 응답에서 받은 쿠키)
      const hasSessionCookie = await this.getSessionCookie();
      const requestHadCookie = headers['Cookie'] && headers['Cookie'].includes('JSESSIONID');
      
      // 200 응답이고 쿠키가 있으면 무조건 인증 성공으로 처리
      // HTML이 반환되어도 200 + 쿠키 = 인증 성공
      if (response.status === 200 && (hasSessionCookie || requestHadCookie)) {
        
        // JSON 파싱 시도
        if (contentType && contentType.includes('application/json')) {
          try {
            data = text ? JSON.parse(text) : {};
          } catch (parseError) {
            // JSON 파싱 실패 - HTML이 반환된 경우
            // HTML이지만 쿠키가 있으면 세션은 유효함
            // 하지만 실제 데이터는 없으므로 에러 처리
            
            // HTML 로그인 페이지인지 확인
            if (text && text.includes('Please sign in') || text.includes('Login with OAuth 2.0')) {
              // 실제로 로그인 페이지면 인증 실패
              await this.clearAuthToken();
              await this.removeSessionCookie();
              throw new Error('인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.');
            }
            
            // HTML이지만 로그인 페이지가 아니면 세션은 유효하지만 데이터 없음
            data = { 
              success: false, 
              error: '서버에서 HTML을 반환했습니다. 세션은 유효하지만 API 응답 형식이 올바르지 않습니다.' 
            };
          }
        } else {
          // JSON이 아닌 경우 (HTML 등)
          // HTML 에러 페이지 감지 (whitelabel error page)
          // 백엔드가 @GetMapping에 @RequestBody를 사용하는 경우 GET 요청에 body를 보낼 수 없음
          // POST로 요청해도 백엔드가 GET만 받으므로 에러 발생
          const isWhitelabelError = text && (text.includes('whitelabel') || 
              text.includes('There was an unexpected error'));
          const isMethodNotAllowed = text && (text.includes('type=Method Not Allowed') || 
              text.includes('Request method') || 
              (text.includes('GET') && text.includes('not supported')) ||
              (text.includes('POST') && text.includes('not supported')));
          
          if (isWhitelabelError || isMethodNotAllowed) {
            // POST로 요청했는데 백엔드가 GET만 받는 경우
            if (options.method === 'POST' && (text.includes('GET') || isMethodNotAllowed)) {
              data = { 
                success: false, 
                error: '백엔드 API가 GET 방식만 지원하지만, GET 요청에는 body를 보낼 수 없어서 이 기능은 현재 작동하지 않습니다. 백엔드 수정이 필요합니다.' 
              };
            } else {
              data = { 
                success: false, 
                error: `백엔드가 ${options.method || 'GET'} 요청을 처리하지 못했습니다. (whitelabel error: ${fullUrl})` 
              };
            }
          } else if (text && (text.includes('Please sign in') || text.includes('Login with OAuth 2.0'))) {
            // 실제로 로그인 페이지면 세션이 만료되었거나 인증이 필요함
            // 세션이 만료되었거나, JSESSIONID가 유효하지 않거나, 세션에 user 속성이 없을 수 있음
            // 백엔드의 LoginUserArgumentResolver는 session.getAttribute("user")를 찾는데, 이것이 없으면 인증 실패
            // 하지만 200 응답이므로 Spring Security가 리다이렉트한 것일 수 있음
            
            // 세션 쿠키 제거하여 재로그인 유도
            await this.removeSessionCookie();
            
            data = { 
              success: false, 
              error: '세션이 만료되었거나 유효하지 않습니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.' 
            };
          } else {
            // HTML이지만 로그인 페이지가 아니면 세션은 유효하지만 데이터 없음
            data = { 
              success: false, 
              error: '서버에서 HTML을 반환했습니다. API 엔드포인트를 확인해주세요.' 
            };
          }
        }
        
        // success 필드가 없으면 추가
        if (typeof data.success === 'undefined') {
          return {
            success: true,
            data: data.value || data || { message: '인증 성공' },
          };
        }
        return data;
      }
      
      // 200이 아니거나 쿠키가 없는 경우
      // HTML 로그인 페이지 감지
      let isLoginPage = false;
      if (text && text.trim().startsWith('<!DOCTYPE html>')) {
        isLoginPage = text.includes('Please sign in') || text.includes('Login with OAuth 2.0');
      }
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = text ? JSON.parse(text) : {};
          
          // JSON 응답 내부에 HTML이 포함된 경우
          if (data.message && typeof data.message === 'string' && data.message.includes('<!DOCTYPE html>')) {
            isLoginPage = true;
          }
        } catch (parseError) {
          data = { message: text || '응답을 받았습니다.' };
        }
      } else {
        data = { message: text || '응답을 받았습니다.' };
      }
      
      // HTML 로그인 페이지가 반환된 경우 (인증 오류)
      if (isLoginPage) {
        await this.clearAuthToken();
        await this.removeSessionCookie();
        throw new Error('인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.');
      }
      
      if (!response.ok) {
        // 인증 오류인 경우
        if (response.status === 401 || response.status === 403) {
          await this.clearAuthToken();
          await this.removeSessionCookie();
          throw new Error('인증이 만료되었습니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.');
        }
        
        throw new Error(data.message || data.error || data.description || `서버 오류 (${response.status})`);
      }
      
      // 백엔드 응답이 이미 { success, data } 형식일 수도 있고 아닐 수도 있음
      // success 필드가 없으면 추가
      if (typeof data.success === 'undefined') {
        return {
          success: true,
          data: data.value || data, // 백엔드가 Api<T> 형식이면 value 필드 사용
        };
      }
      
      return data;
    } catch (error) {
      const lastError = error instanceof Error ? error : new Error(String(error));
      
      let errorMessage = '알 수 없는 오류가 발생했습니다.';
      
      if (lastError instanceof Error) {
        errorMessage = lastError.message;
        
        // 네트워크 오류 메시지 개선
        if (errorMessage.includes('Network request failed') || 
            errorMessage.includes('Failed to fetch') ||
            errorMessage.includes('서버 연결 실패')) {
          errorMessage = `서버에 연결할 수 없습니다.\n\n확인 사항:\n1. 백엔드 서버가 실행 중인지 확인\n2. 서버 주소: ${this.baseURL}\n3. 네트워크 연결 상태 확인\n4. Android: 개발 빌드 사용 권장 (npx expo prebuild)`;
        }
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
  
  /**
   * GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return this.request<T>(url, { method: 'GET' });
  }
  
  /**
   * GET request with body (비표준 - 백엔드가 @GetMapping에 @RequestBody를 사용하는 경우)
   * 
   * 문제: HTTP 표준에서 GET 요청에 body를 보낼 수 없음
   * 해결: POST로만 시도 (React Native는 GET with body를 지원하지 않음)
   * 
   * 참고: 백엔드가 GET with @RequestBody를 사용하는 것은 잘못된 설계입니다.
   *       백엔드를 POST로 변경하거나, 쿼리 파라미터로 변경해야 합니다.
   */
  async getWithBody<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // React Native의 fetch는 GET에 body를 허용하지 않으므로 POST로만 시도
    // 백엔드가 GET만 받으면 405 Method Not Allowed가 발생할 수 있음
    console.log('⚠️ getWithBody: POST로 시도 (GET with body는 React Native에서 불가능)');
    
    // POST로만 시도 (GET with body는 React Native에서 불가능)
    const postResponse = await this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // POST가 실패하면 명확한 에러 메시지 반환
    if (!postResponse.success) {
      return {
        success: false,
        error: postResponse.error || '백엔드 API가 GET 요청에 body를 요구하지만, HTTP 표준상 GET 요청에는 body를 보낼 수 없습니다. 백엔드를 POST로 변경하거나 쿼리 파라미터를 사용하도록 수정이 필요합니다.',
      };
    }
    
    return postResponse;
  }
  
  /**
   * POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
  
  /**
   * DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  /**
   * Set authentication token
   */
  async setAuthToken(token: string): Promise<void> {
    await this.setToken(token);
  }
  
  /**
   * Clear authentication token
   */
  async clearAuthToken(): Promise<void> {
    await this.removeToken();
    await this.removeRefreshToken();
    await this.removeSessionCookie();
  }
  
  /**
   * Logout user
   * 백엔드는 세션 기반 로그아웃
   */
  async logout(): Promise<ApiResponse> {
    // 백엔드에 /api/auth/logout 엔드포인트가 없을 수 있음
    // Spring Security의 기본 로그아웃: POST /logout
    try {
      const response = await this.post(API_CONFIG.ENDPOINTS.LOGOUT || '/logout');
      await this.clearAuthToken();
      return response;
    } catch (error) {
      // 로그아웃 실패해도 클라이언트에서는 세션 정리
      await this.clearAuthToken();
      return { success: true, data: { message: '로그아웃되었습니다.' } };
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL);

// Export convenience functions
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => apiClient.get<T>(endpoint, params),
  getWithBody: <T = any>(endpoint: string, data?: any) => apiClient.getWithBody<T>(endpoint, data),
  post: <T = any>(endpoint: string, data?: any) => apiClient.post<T>(endpoint, data),
  put: <T = any>(endpoint: string, data?: any) => apiClient.put<T>(endpoint, data),
  patch: <T = any>(endpoint: string, data?: any) => apiClient.patch<T>(endpoint, data),
  delete: <T = any>(endpoint: string) => apiClient.delete<T>(endpoint),
  logout: () => apiClient.logout(),
  setAuthToken: (token: string) => apiClient.setAuthToken(token),
  clearAuthToken: () => apiClient.clearAuthToken(),
  setSessionCookie: (cookie: string) => apiClient.setSessionCookie(cookie),
};

