import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * 인증 토큰 및 세션 관리 유틸리티
 * 
 * JWT 기반 인증을 우선 사용하고, 세션 쿠키는 보조 수단으로 사용합니다.
 */
const ACCESS_TOKEN_KEY = '@accessToken';
const REFRESH_TOKEN_KEY = '@refreshToken';
const SESSION_COOKIE_KEY = '@sessionCookie';

/**
 * AccessToken과 RefreshToken을 저장합니다.
 * 
 * @param accessToken JWT AccessToken (Bearer 포함 여부 자동 처리)
 * @param refreshToken JWT RefreshToken (선택)
 */
export async function saveTokens(accessToken: string, refreshToken?: string): Promise<void> {
  try {
    // accessToken에 'Bearer '가 없으면 추가하지 않고 그대로 저장
    // (http.ts에서 헤더에 붙일 때 'Bearer '를 추가함)
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    
    console.log('[DEBUG] saveTokens: accessToken saved, refreshToken', refreshToken ? 'saved' : 'not provided');
  } catch (error) {
    console.error('[DEBUG] saveTokens error:', error);
    throw error;
  }
}

/**
 * AccessToken을 조회합니다.
 * 
 * @returns AccessToken 또는 null
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    console.log('[DEBUG] getAccessToken =', token ? 'found' : 'null');
    return token;
  } catch (error) {
    console.error('[DEBUG] getAccessToken error:', error);
    return null;
  }
}

/**
 * RefreshToken을 조회합니다.
 * 
 * @returns RefreshToken 또는 null
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    return token;
  } catch (error) {
    console.error('[DEBUG] getRefreshToken error:', error);
    return null;
  }
}

/**
 * 세션 쿠키(JSESSIONID)를 저장합니다.
 * 
 * @param jsessionId JSESSIONID 값 (JSESSIONID= 포함 여부 자동 처리)
 */
export async function saveSessionCookie(jsessionId: string): Promise<void> {
  try {
    // jsessionId가 'JSESSIONID=' 형태인지 확인
    let cookieValue = jsessionId;
    if (!cookieValue.includes('JSESSIONID=')) {
      cookieValue = `JSESSIONID=${cookieValue}`;
    }
    
    // 세미콜론 이후 제거
    if (cookieValue.includes(';')) {
      cookieValue = cookieValue.split(';')[0];
    }
    
    await AsyncStorage.setItem(SESSION_COOKIE_KEY, cookieValue);
    console.log('[DEBUG] saveSessionCookie: saved');
  } catch (error) {
    console.error('[DEBUG] saveSessionCookie error:', error);
    throw error;
  }
}

/**
 * 세션 쿠키(JSESSIONID)를 조회합니다.
 * 
 * @returns JSESSIONID 쿠키 또는 null
 */
export async function getSessionCookie(): Promise<string | null> {
  try {
    const cookie = await AsyncStorage.getItem(SESSION_COOKIE_KEY);
    console.log('[DEBUG] getSessionCookie =', cookie ? 'found' : 'null');
    return cookie;
  } catch (error) {
    console.error('[DEBUG] getSessionCookie error:', error);
    return null;
  }
}

/**
 * 모든 인증 정보를 삭제합니다.
 */
export async function clearAuth(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SESSION_COOKIE_KEY]);
    console.log('[DEBUG] clearAuth: all auth data removed');
  } catch (error) {
    console.error('[DEBUG] clearAuth error:', error);
  }
}

// 하위 호환성을 위한 별칭 함수들
export async function setAccessToken(token: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function removeAccessToken(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

export async function setRefreshToken(token: string): Promise<void> {
  await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export async function removeRefreshToken(): Promise<void> {
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
}

export async function setSessionCookie(cookie: string): Promise<void> {
  return saveSessionCookie(cookie);
}

export async function removeSessionCookie(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
}

export async function clearAllAuth(): Promise<void> {
  return clearAuth();
}

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
export async function clearAllLocalData(): Promise<void> {
  try {
    await AsyncStorage.clear();
    console.log('[DEBUG] clearAllLocalData: all local data cleared');
  } catch (error) {
    console.error('[DEBUG] clearAllLocalData error:', error);
    throw error;
  }
}