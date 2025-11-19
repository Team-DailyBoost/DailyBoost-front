/**
 * AsyncStorage 유틸리티
 * 중복 코드 제거 및 통합 관리
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 토큰 관련 키
 */
export const ACCESS_TOKEN_KEYS = ['@accessToken', 'authToken'] as const;
export const REFRESH_TOKEN_KEYS = ['@refreshToken', 'refreshToken'] as const;
export const SESSION_COOKIE_KEYS = ['@sessionCookie', 'JSESSIONID'] as const;

/**
 * AsyncStorage에서 값 가져오기 (여러 키 시도)
 */
export async function getStorageValue(keys: readonly string[]): Promise<string | null> {
  try {
    for (const key of keys) {
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
 * AsyncStorage에 값 저장 (여러 키에 동시 저장)
 */
export async function setStorageValue(keys: readonly string[], value: string): Promise<void> {
  try {
    await Promise.all(keys.map((key) => AsyncStorage.setItem(key, value)));
  } catch (error) {
    // Ignore error
  }
}

/**
 * AsyncStorage에서 값 제거 (여러 키에서 동시 제거)
 */
export async function removeStorageValue(keys: readonly string[]): Promise<void> {
  try {
    await Promise.all(keys.map((key) => AsyncStorage.removeItem(key)));
  } catch (error) {
    // Ignore error
  }
}

/**
 * JWT 토큰 가져오기
 */
export async function getAccessToken(): Promise<string | null> {
  return getStorageValue(ACCESS_TOKEN_KEYS);
}

/**
 * JWT 토큰 저장
 */
export async function setAccessToken(token: string): Promise<void> {
  return setStorageValue(ACCESS_TOKEN_KEYS, token);
}

/**
 * JWT 토큰 제거
 */
export async function removeAccessToken(): Promise<void> {
  return removeStorageValue(ACCESS_TOKEN_KEYS);
}

/**
 * Refresh 토큰 가져오기
 */
export async function getRefreshToken(): Promise<string | null> {
  return getStorageValue(REFRESH_TOKEN_KEYS);
}

/**
 * Refresh 토큰 저장
 */
export async function setRefreshToken(token: string): Promise<void> {
  return setStorageValue(REFRESH_TOKEN_KEYS, token);
}

/**
 * Refresh 토큰 제거
 */
export async function removeRefreshToken(): Promise<void> {
  return removeStorageValue(REFRESH_TOKEN_KEYS);
}

/**
 * 세션 쿠키 가져오기
 */
export async function getSessionCookie(): Promise<string | null> {
  return getStorageValue(SESSION_COOKIE_KEYS);
}

/**
 * 세션 쿠키 저장
 */
export async function setSessionCookie(cookie: string): Promise<void> {
  // JSESSIONID=ABC123 형식에서 값만 추출
  const sessionId = cookie.includes('=') ? cookie.split('=')[1].split(';')[0] : cookie;
  return setStorageValue(SESSION_COOKIE_KEYS, sessionId);
}

/**
 * 세션 쿠키 제거
 */
export async function removeSessionCookie(): Promise<void> {
  return removeStorageValue(SESSION_COOKIE_KEYS);
}

/**
 * 모든 인증 정보 제거
 */
export async function clearAllAuth(): Promise<void> {
  await Promise.all([
    removeAccessToken(),
    removeRefreshToken(),
    removeSessionCookie(),
  ]);
}

