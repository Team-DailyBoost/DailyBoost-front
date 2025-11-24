import { requestWithWebViewFallback } from './http';
import { buildPlaceholderImage } from '../utils/imagePlaceholder';

export interface HealthInfo {
  weight?: number;
  height?: number;
  goal?: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH_IMPROVEMENT' | 'ENDURANCE_IMPROVEMENT' | 'GENERAL_HEALTH_MAINTENANCE' | 'BODY_SHAPE_MANAGEMENT';
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface UserRequest {
  healthInfo: HealthInfo;
}

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

export interface VerifyCodeRequest {
  email: string;
  inputCode: string;
}

export interface MessageResponse {
  message: string;
}

export async function getUserProfile(userId: number): Promise<UserResponse | null> {
  try {
    const response = await requestWithWebViewFallback<UserResponse>('GET', `/api/user/${userId}`);
    return response;
  } catch (error: any) {
    const message = String(error?.message || '');
    // 404 에러나 사용자를 찾을 수 없습니다 에러는 null 반환
    if (
      message.includes('404') ||
      message.includes('"errorCode":1100') ||
      message.includes('USER_NOT_FOUND') ||
      message.includes('사용자를 찾을 수 없습니다')
    ) {
      console.warn('사용자 프로필 조회 실패 (404), null 반환:', userId);
      return null;
    }
    // 기타 에러도 null 반환하여 앱이 계속 작동하도록 함
    console.warn('사용자 프로필 조회 실패, null 반환:', userId, message);
    return null;
  }
}

export async function initUserInfo(request: UserRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증
  if (!request.healthInfo) {
    throw new Error('헬스 정보가 필요합니다.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/user/initInfo', {
      body: request,
    });
    return response;
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[User API] 헬스 정보 등록 실패:', message);
    throw error;
  }
}

export async function updateUserInfo(
  request: UserUpdateRequest,
  file?: UserProfileUploadFile,
): Promise<MessageResponse> {
  const { WebViewManager } = await import('../utils/webViewManager');
  
  if (!WebViewManager.isAvailable()) {
    throw new Error('WebView가 필요합니다. 로그인 후 다시 시도해주세요.');
  }

  // 인증 헤더 준비
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  const token = await getAccessToken();
  const cookie = await getSessionCookie();
  
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else if (cookie) {
    let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
    if (!cookieValue.includes('JSESSIONID=')) {
      cookieValue = `JSESSIONID=${cookieValue}`;
    }
    headers['Cookie'] = cookieValue;
  }

  const formDataFields: Record<string, any> = {
    userUpdateRequest: request,
  };

  let filePayload: { data: string; name: string; type: string } | null = null;

  if (file) {
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      filePayload = await new Promise<{ data: string; name: string; type: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve({
            data: base64,
            name: file.name || `profile-${Date.now()}.jpg`,
            type: file.type || 'image/jpeg',
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error(`파일 변환 실패: ${file.uri}`);
    }
  } else {
    filePayload = buildPlaceholderImage();
  }

  formDataFields.file = filePayload;

  const response = await WebViewManager.requestApi({
    method: 'POST',
    path: '/api/user/update',
    headers,
    useFormData: true,
    formDataFields,
  });

  // 백엔드 응답 형식: Api<MessageResponse>
  // 에러 처리
  if (response && typeof response === 'object') {
    // status가 400 이상이면 에러
    if ('status' in response && (response as any).status >= 400) {
      const errorMsg = (response as any).message || (response as any).error || '프로필 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // errorCode가 있고 200이 아니면 에러
    if ('errorCode' in response && (response as any).errorCode !== 200) {
      const errorMsg = (response as any).description || (response as any).message || '프로필 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // error 속성이 true이면 에러
    if ((response as any).error === true) {
      const errorMsg = (response as any).message || (response as any).error || '프로필 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // 성공: value 속성이 있으면 ApiResponse 래퍼
    if ('value' in response) {
      return (response as any).value as MessageResponse;
    }
    
    // message 속성이 있고 error가 없으면 MessageResponse 직접
    if ('message' in response && !('error' in response)) {
      return response as MessageResponse;
    }
  }

  return response as MessageResponse;
}

export async function unregisterUser(): Promise<MessageResponse> {
  const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/user/unregister');
  return response;
}

export async function recoverUserAccount(request: VerifyCodeRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증
  if (!request.email || !request.email.trim()) {
    throw new Error('이메일을 입력해주세요.');
  }
  if (!request.inputCode || !request.inputCode.trim()) {
    throw new Error('인증 코드를 입력해주세요.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/user/recover', {
      body: request,
    });
    return response;
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[User API] 계정 복구 실패:', message);
    throw error;
  }
}
