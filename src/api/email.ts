/**
 * Email API
 * 
 * OpenAPI: /api/email/**
 * 
 * 이메일 전송 관련 API입니다.
 */
import client, { extractApiValue, ApiResponse } from './client';

/**
 * Mail Html Send DTO 타입
 */
export interface MailHtmlSendDTO {
  emailAddr: string;
}

/**
 * Message Response 타입
 */
export interface MessageResponse {
  message: string;
}

/**
 * 이메일 전송 (계정 복구 코드)
 * POST /api/email/htmlEmail
 * 
 * 지정된 이메일에 계정 복구 코드를 전송합니다.
 * 
 * 백엔드 에러 처리:
 * - "이 계정은 정상적인 계정입니다." - IllegalArgumentException (정상 계정)
 * - "TOO_FREQUENT_REQUEST" - IllegalWriteException (30초 내 재발송 제한)
 */
export async function sendHtmlEmail(request: MailHtmlSendDTO): Promise<MessageResponse> {
  try {
    const response = await client.post<ApiResponse<MessageResponse>>('/api/email/htmlEmail', request);
    return extractApiValue(response);
  } catch (error: any) {
    // 백엔드 에러 응답 형식: Api<Object> { errorCode, description, value: null }
    const errorData = error?.response?.data;
    const errorCode = errorData?.errorCode;
    const description = errorData?.description || error?.message || '';
    const errorMessage = String(description).toLowerCase();
    
    // 정상 계정 에러 (백엔드에서 IllegalArgumentException으로 던짐)
    if (errorMessage.includes('정상적인 계정') || errorMessage.includes('이 계정은')) {
      throw new Error('이 계정은 정상적인 계정입니다. 로그인을 시도해주세요.');
    }
    
    // 재발송 제한 에러 (백엔드에서 IllegalWriteException으로 던짐)
    if (errorMessage.includes('too_frequent_request') || errorMessage.includes('너무 자주') || errorMessage.includes('frequent')) {
      throw new Error('이메일 전송은 30초에 한 번만 가능합니다. 잠시 후 다시 시도해주세요.');
    }
    
    // 기타 에러는 백엔드에서 제공한 description 사용
    if (description) {
      throw new Error(description);
    }
    
    // 기타 에러는 그대로 전달
    throw error;
  }
}

