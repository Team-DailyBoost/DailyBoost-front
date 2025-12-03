import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  ACCESS_TOKEN: '@accessToken',
  REFRESH_TOKEN: '@refreshToken',
  SESSION_COOKIE: '@sessionCookie',
  CURRENT_USER: '@currentUser',
} as const;

export const SessionStorage = {
  async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch {}
  },

  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch {}
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setSessionCookie(cookie: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION_COOKIE, cookie);
    } catch {}
  },

  async getSessionCookie(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_COOKIE);
    } catch {
      return null;
    }
  },

  async setCurrentUser(user: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch {}
  },

  async getCurrentUser(): Promise<any | null> {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.SESSION_COOKIE,
        STORAGE_KEYS.CURRENT_USER,
      ]);
    } catch {}
  },

  /**
   * 모든 로컬 데이터를 삭제합니다.
   * AsyncStorage의 모든 키를 삭제합니다.
   * 
   * 주의: 이 함수는 인증 정보뿐만 아니라 모든 로컬 저장 데이터를 삭제합니다.
   * - 토큰 및 세션 정보
   * - 사용자 정보
   * - 캐시된 게시물, 댓글
   * - 운동/음식 로그
   * - 기타 모든 로컬 저장 데이터
   */
  async clearAllLocalData(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('[SessionStorage] clearAllLocalData: all local data cleared');
    } catch (error) {
      console.error('[SessionStorage] clearAllLocalData error:', error);
      throw error;
    }
  },
};
