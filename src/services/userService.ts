import { api, API_CONFIG } from './api';
import { 
  getUserProfile as getUserProfileApi, 
  initUserInfo as initUserInfoApi, 
  updateUserInfo as updateUserInfoApi, 
  unregisterUser as unregisterUserApi, 
  recoverUserAccount as recoverUserAccountApi 
} from '../api/users';
import type { UserRequest, UserUpdateRequest, VerifyCodeRequest } from '../api/users';

/**
 * User profile data interface
 * Matches Swagger API specification
 */
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * Health info interface
 */
export interface HealthInfo {
  weight?: number;
  height?: number;
  goal?: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH_IMPROVEMENT' | 'ENDURANCE_IMPROVEMENT' | 'GENERAL_HEALTH_MAINTENANCE' | 'BODY_SHAPE_MANAGEMENT';
}

/**
 * User request (for initInfo)
 */
export interface UserRequest {
  healthInfo: HealthInfo;
}

/**
 * User update request
 */
export interface UserUpdateRequest {
  age?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  healthInfo?: HealthInfo;
}

/**
 * Verify code request (for account recovery)
 */
export interface VerifyCodeRequest {
  email: string;
  inputCode: string;
}

/**
 * User Service
 */
export class UserService {
  /**
   * Get user profile
   * 백엔드: GET /api/user/{userId}
   * 
   * OpenAPI 명세에 맞춰 수정됨
   */
  static async getProfile(userId?: string | number): Promise<UserProfile | null> {
    try {
      if (typeof userId === 'undefined' || userId === null) {
        // 서버에 현재 사용자 프로필을 조회하는 엔드포인트가 없으므로 로컬 저장소에서 반환
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const saved = await AsyncStorage.getItem('currentUser');
        return saved ? (JSON.parse(saved) as UserProfile) : null;
      }
      // userId를 number로 변환
      const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
      if (isNaN(userIdNum)) {
        return null;
      }
      // OpenAPI 스펙에 맞춘 API 호출
      const profile = await getUserProfileApi(userIdNum);
      return profile as UserProfile;
    } catch (error) {
      console.error('사용자 프로필 조회 실패:', error);
      return null;
    }
  }
  
  /**
   * Initialize user health info
   * 백엔드: POST /api/user/initInfo
   * Note: Requires authentication
   * 
   * OpenAPI 명세에 맞춰 수정됨
   */
  static async initUserInfo(request: UserRequest) {
    try {
      const result = await initUserInfoApi(request);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('사용자 정보 등록 실패:', error);
      return { success: false, error: error?.message || '사용자 정보 등록 실패' };
    }
  }
  
  /**
   * Recover user account
   * 백엔드: POST /api/user/recover
   * 
   * OpenAPI 명세에 맞춰 수정됨
   */
  static async recoverAccount(request: VerifyCodeRequest) {
    try {
      const result = await recoverUserAccountApi(request);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('계정 복구 실패:', error);
      return { success: false, error: error?.message || '계정 복구 실패' };
    }
  }
  
  /**
   * Update user profile
   * 백엔드: POST /api/user/update
   * 
   * OpenAPI 명세에 맞춰 수정됨
   */
  static async updateProfile(request: UserUpdateRequest) {
    try {
      const result = await updateUserInfoApi(request);
      return { success: true, data: result };
    } catch (error: any) {
      console.error('프로필 수정 실패:', error);
      return { success: false, error: error?.message || '프로필 수정 실패' };
    }
  }
  
  /**
   * Delete user account
   * 백엔드: POST /api/user/unregister
   * 
   * OpenAPI 명세에 맞춰 수정됨
   */
  static async deleteAccount() {
    try {
      const result = await unregisterUserApi();
      if (result) {
        await api.clearAuthToken();
      }
      return { success: true, data: result };
    } catch (error: any) {
      console.error('계정 삭제 실패:', error);
      return { success: false, error: error?.message || '계정 삭제 실패' };
    }
  }
  
  /**
   * Logout user
   */
  static async logout() {
    return await api.logout();
  }
  
  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      // 네이티브 저장소에 토큰/세션/유저가 있으면 인증된 것으로 간주
      const [user, access, sess1, sess2] = await Promise.all([
        (await import('@react-native-async-storage/async-storage')).default.getItem('currentUser'),
        (await import('@react-native-async-storage/async-storage')).default.getItem('@accessToken'),
        (await import('@react-native-async-storage/async-storage')).default.getItem('@sessionCookie'),
        (await import('@react-native-async-storage/async-storage')).default.getItem('backend:session-cookie'),
      ]);
      if (user) return true;
      if (access && access.trim().length > 0) return true;
      if ((sess1 && sess1.trim().length > 0) || (sess2 && sess2.trim().length > 0)) return true;
      return false;
    } catch (error) {
      return false;
    }
  }
  
}

