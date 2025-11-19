/**
 * Image API
 * 
 * OpenAPI: /api/image/upload
 * 
 * 이미지 업로드 관련 API입니다.
 * 
 * 중요: Swagger 명세는 application/json으로 되어 있지만,
 * 실제로는 multipart/form-data를 사용해야 합니다.
 * React Native에서는 FormData를 사용하여 파일을 업로드합니다.
 */
import client, { extractApiValue, ApiResponse } from './client';

/**
 * Message Response 타입
 */
export interface MessageResponse {
  message: string;
}

/**
 * 프로필 이미지 업로드
 * POST /api/image/upload
 * 
 * @param uri 이미지 파일 URI (React Native의 경우 file:// 또는 asset://)
 * @param fileName 파일 이름 (선택사항, 기본값: 'profile.jpg')
 * @param mimeType MIME 타입 (선택사항, 기본값: 'image/jpeg')
 * 
 * React Native에서는 FormData를 사용하여 파일을 업로드합니다.
 * FormData.append()의 두 번째 인자는 { uri, name, type } 형식의 객체입니다.
 */
export async function uploadProfileImage(
  uri: string,
  fileName?: string,
  mimeType?: string
): Promise<MessageResponse> {
  // React Native에서는 global.FormData를 사용
  const formData = new FormData();
  
  // 파일 추가
  // React Native에서는 { uri, name, type } 형식으로 전달
  formData.append('file', {
    uri,
    name: fileName || 'profile.jpg',
    type: mimeType || 'image/jpeg',
  } as any);

  // FormData를 사용할 때는 Content-Type을 설정하지 않음
  // axios가 자동으로 boundary를 포함한 올바른 Content-Type을 설정함
  const response = await client.post<ApiResponse<MessageResponse>>('/api/image/upload', formData, {
    headers: {
      'Content-Type': undefined, // React Native에서 FormData 사용 시 자동 설정되도록
    },
  });
  
  return extractApiValue(response);
}
