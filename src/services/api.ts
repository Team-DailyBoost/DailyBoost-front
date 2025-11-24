import { API_CONFIG } from '../config/api';
export { API_CONFIG } from '../config/api';
import {
  getAccessToken,
  setAccessToken,
  removeAccessToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getSessionCookie,
  setSessionCookie,
  removeSessionCookie,
  clearAllAuth,
} from '../utils/storage';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  private async getToken(): Promise<string | null> {
    return getAccessToken();
  }
  
  private async setToken(token: string): Promise<void> {
    return setAccessToken(token);
  }
  
  async setAuthToken(token: string): Promise<void> {
    return this.setToken(token);
  }
  
  private async removeToken(): Promise<void> {
    return removeAccessToken();
  }

  private async removeRefreshTokenFromStorage(): Promise<void> {
    return removeRefreshToken();
  }
  
  private async getSessionCookie(): Promise<string | null> {
    return getSessionCookie();
  }
  
  async setSessionCookie(cookie: string): Promise<void> {
    return setSessionCookie(cookie);
  }
  
  private async removeSessionCookie(): Promise<void> {
    return removeSessionCookie();
  }
  
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      const isFormData = options.body instanceof FormData;
      const customHeaders = options.headers as Record<string, string> | undefined;
      const headers: Record<string, string> = { 'Accept': 'application/json' };
      
      if (!isFormData) {
        headers['Content-Type'] = customHeaders?.['Content-Type'] || 'application/json';
      }
      
      if (customHeaders) {
        Object.entries(customHeaders).forEach(([key, value]) => {
          if (isFormData && key.toLowerCase() === 'content-type') return;
          if (value !== undefined && value !== 'undefined') {
            headers[key] = value;
          }
        });
      }
      
      if (token) {
        const authHeader = token.startsWith('Bearer') ? token : `Bearer ${token}`;
        headers['Authorization'] = authHeader;
        console.log('[API] Authorization 헤더 추가:', authHeader.substring(0, 30) + '...');
      } else {
        const sessionCookie = await this.getSessionCookie();
        if (sessionCookie) {
          const cookieValue = sessionCookie.includes('=') ? sessionCookie.split('=')[1].split(';')[0] : sessionCookie;
          headers['Cookie'] = `JSESSIONID=${cookieValue}`;
          console.log('[API] Cookie 헤더 추가:', cookieValue.substring(0, 30) + '...');
        } else {
          console.warn('[API] 인증 정보 없음 - 토큰도 쿠키도 없습니다');
        }
      }
      
      const fullUrl = this.baseURL + endpoint;
      console.log('[API] 요청:', options.method || 'GET', fullUrl);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const response = await fetch(fullUrl, {
          ...options,
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        console.log('[API] 응답 상태:', response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.log('[API] 에러 응답:', response.status, errorText.substring(0, 200));
        }
        
        const authHeader = response.headers.get('Authorization') || response.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const jwtToken = authHeader.replace('Bearer ', '').trim();
          if (jwtToken) await this.setToken(jwtToken);
        }
        
        const refreshHeader = response.headers.get('X-Refresh-Token') || response.headers.get('x-refresh-token');
        if (refreshHeader) {
          const refreshToken = refreshHeader.replace('Bearer ', '').trim();
          if (refreshToken) await setRefreshToken(refreshToken);
        }
        
        const currentToken = await this.getToken();
        if (!currentToken) {
          const setCookieHeader = response.headers.get('Set-Cookie');
          if (setCookieHeader) {
            const jsessionMatch = setCookieHeader.match(/JSESSIONID=([^;]+)/);
            if (jsessionMatch) {
              await setSessionCookie(jsessionMatch[1]);
            }
          }
        }
        
        const contentType = response.headers.get('content-type') || '';
        let responseData: any;
        
        if (contentType.includes('application/json')) {
          responseData = await response.json();
        } else {
          const text = await response.text();
          responseData = { error: text || '알 수 없는 오류' };
        }
        
        if (!response.ok) {
          return {
            success: false,
            error: responseData?.message || responseData?.error || responseData?.description || `서버 오류 (${response.status})`,
          };
        }
        
        if (responseData && typeof responseData === 'object') {
          if ('value' in responseData) {
            return { success: true, data: responseData.value };
          }
          if ('data' in responseData) {
            return { success: true, data: responseData.data };
          }
          return { success: true, data: responseData };
        }
        
        return { success: true, data: responseData };
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return { success: false, error: '요청 시간이 초과되었습니다.' };
        }
        throw fetchError;
      }
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || error?.error || '알 수 없는 오류가 발생했습니다.',
      };
    }
  }
  
  async get<T = any>(endpoint: string, options?: { params?: Record<string, any> }): Promise<ApiResponse<T>> {
    const queryString = options?.params ? '?' + new URLSearchParams(options.params).toString() : '';
    return this.request<T>(endpoint + queryString, { method: 'GET' });
  }
  
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
    });
  }
  
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    const body = data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined);
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
    });
  }
  
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  
  async getWithBody<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.post<T>(endpoint, data);
  }
  
  async clearAuthToken(): Promise<void> {
    await this.removeToken();
    await this.removeRefreshTokenFromStorage();
    await this.removeSessionCookie();
  }
}

export const api = new ApiClient(API_CONFIG.BASE_URL);
