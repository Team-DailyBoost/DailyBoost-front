/**
 * User API
 * 
 * OpenAPI: /api/user/**
 * 
 * 사용자 관련 API 함수들입니다.
 * 
 * 주의: 이 파일의 함수들은 requestWithWebViewFallback을 사용하여
 * RN에서 직접 호출 시 HTML 로그인 페이지가 오면 WebView를 통해 다시 시도합니다.
 */
import { requestWithWebViewFallback } from './http';
import client, { ApiResponse, extractApiValue } from './client';

/**
 * Health Info 타입
 */
export interface HealthInfo {
  weight?: number;
  height?: number;
  goal?: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH_IMPROVEMENT' | 'ENDURANCE_IMPROVEMENT' | 'GENERAL_HEALTH_MAINTENANCE' | 'BODY_SHAPE_MANAGEMENT';
}

/**
 * User Response 타입
 */
export interface UserResponse {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * User Request 타입 (초기 정보 등록용)
 */
export interface UserRequest {
  healthInfo: HealthInfo;
}

/**
 * User Update Request 타입
 */
export interface UserUpdateRequest {
  age?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  healthInfo?: HealthInfo;
}

export interface UserProfileUploadFile {
  uri: string;
  name?: string;
  type?: string;
}

/**
 * Verify Code Request 타입
 */
export interface VerifyCodeRequest {
  email: string;
  inputCode: string;
}

/**
 * Message Response 타입
 */
export interface MessageResponse {
  message: string;
}

/**
 * 사용자 프로필 조회
 * GET /api/user/{userId}
 * 
 * OpenAPI 명세:
 * - operationId: userProfile
 * - parameters: userId (path, int64, required)
 * - response: ApiUserResponse (value는 UserResponse)
 */
export async function getUserProfile(userId: number): Promise<UserResponse> {
  const response = await requestWithWebViewFallback<UserResponse>('GET', `/api/user/${userId}`);
  // requestWithWebViewFallback이 이미 ApiResponse<T>의 value를 반환하므로
  return response;
}

/**
 * 사용자 헬스 정보 등록
 * POST /api/user/initInfo
 * 
 * OpenAPI 명세:
 * - operationId: userInfoInsert
 * - requestBody: UserRequest (required)
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function initUserInfo(request: UserRequest): Promise<MessageResponse> {
  const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/user/initInfo', {
    body: request,
  });
  // requestWithWebViewFallback이 이미 ApiResponse<T>의 value를 반환하므로
  return response;
}

/**
 * 사용자 정보 수정
 * POST /api/user/update
 * 
 * OpenAPI 명세:
 * - operationId: update
 * - requestBody: UserUpdateRequest (required)
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function updateUserInfo(
  request: UserUpdateRequest,
  file?: UserProfileUploadFile,
): Promise<MessageResponse> {
  const formData = new FormData();
  formData.append('userUpdateRequest', JSON.stringify(request ?? {}));

  if (file?.uri) {
    formData.append(
      'file',
      {
        uri: file.uri,
        name: file.name || `profile-${Date.now()}.jpg`,
        type: file.type || 'image/jpeg',
      } as any,
    );
  }

  const response = await client.post<ApiResponse<MessageResponse>>(
    '/api/user/update',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return extractApiValue(response);
}

/**
 * 계정 등록 해제
 * POST /api/user/unregister
 * 
 * OpenAPI 명세:
 * - operationId: unregister
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function unregisterUser(): Promise<MessageResponse> {
  const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/user/unregister');
  // requestWithWebViewFallback이 이미 ApiResponse<T>의 value를 반환하므로
  return response;
}

/**
 * 계정 복구
 * POST /api/user/recover
 * 
 * OpenAPI 명세:
 * - operationId: recoverUserAccount
 * - requestBody: VerifyCodeRequest (required)
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function recoverUserAccount(request: VerifyCodeRequest): Promise<MessageResponse> {
  const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/user/recover', {
    body: request,
  });
  // requestWithWebViewFallback이 이미 ApiResponse<T>의 value를 반환하므로
  return response;
}
