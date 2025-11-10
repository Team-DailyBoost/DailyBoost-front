/**
 * Session Storage Helper
 * 
 * OAuth2 로그인 후 받은 JWT 토큰과 세션 쿠키를 AsyncStorage에 저장/관리합니다.
 * 
 * 저장 항목:
 * - @accessToken: JWT Access Token (Bearer 토큰)
 * - @refreshToken: JWT Refresh Token
 * - @sessionCookie: 세션 쿠키 (JSESSIONID 등)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@accessToken',
  REFRESH_TOKEN: '@refreshToken',
  SESSION_COOKIE: '@sessionCookie',
  CURRENT_USER: '@currentUser',
} as const;

export const SessionStorage = {
  /**
   * JWT Access Token 저장
   */
  async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (error) {
      console.error('Access Token 저장 실패:', error);
    }
  },

  /**
   * JWT Access Token 가져오기
   */
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error('Access Token 가져오기 실패:', error);
      return null;
    }
  },

  /**
   * JWT Refresh Token 저장
   */
  async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (error) {
      console.error('Refresh Token 저장 실패:', error);
    }
  },

  /**
   * JWT Refresh Token 가져오기
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Refresh Token 가져오기 실패:', error);
      return null;
    }
  },

  /**
   * 세션 쿠키 저장
   * WebView에서 추출한 쿠키를 저장합니다.
   */
  async setSessionCookie(cookie: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COOKIE, cookie);
    } catch (error) {
      console.error('Session Cookie 저장 실패:', error);
    }
  },

  /**
   * 세션 쿠키 가져오기
   */
  async getSessionCookie(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COOKIE);
    } catch (error) {
      console.error('Session Cookie 가져오기 실패:', error);
      return null;
    }
  },

  /**
   * 현재 사용자 정보 저장
   */
  async setCurrentUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (error) {
      console.error('Current User 저장 실패:', error);
    }
  },

  /**
   * 현재 사용자 정보 가져오기
   */
  async getCurrentUser(): Promise<any | null> {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Current User 가져오기 실패:', error);
      return null;
    }
  },

  /**
   * 모든 인증 정보 삭제 (로그아웃)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.SESSION_COOKIE,
        STORAGE_KEYS.CURRENT_USER,
      ]);
    } catch (error) {
      console.error('인증 정보 삭제 실패:', error);
    }
  },
};

