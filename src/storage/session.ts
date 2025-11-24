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
};
