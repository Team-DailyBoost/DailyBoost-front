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
 */
export async function sendHtmlEmail(request: MailHtmlSendDTO): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/email/htmlEmail', request);
  return extractApiValue(response);
}

