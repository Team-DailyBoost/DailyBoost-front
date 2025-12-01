/**
 * Challenge API
 * 
 * OpenAPI: /api/challenges/**
 * 
 * 챌린지 관련 API입니다.
 */
import { requestWithWebViewFallback } from './http';
import { MessageResponse } from './types';

/**
 * Challenge Request
 * POST /api/challenges
 * 백엔드: ChallengeRequest { title, description, startDate, endDate }
 */
export interface ChallengeRequest {
  title: string;
  description: string;
  startDate: string; // ISO 8601 date-time format (LocalDateTime)
  endDate: string; // ISO 8601 date-time format (LocalDateTime)
}

/**
 * Challenge Response
 * GET /api/challenges/all
 * 백엔드: ChallengeResponse { id, title, description, status, startDate, endDate, participantCount }
 */
export interface ChallengeResponse {
  id: number;
  title: string;
  description: string;
  status: 'REGISTERED' | 'UNREGISTERED';
  startDate: string; // ISO 8601 date-time format
  endDate: string; // ISO 8601 date-time format
  participantCount: number;
}

/**
 * 챌린지 생성
 * POST /api/challenges
 * 
 * 백엔드 응답: Api<MessageResponse>
 * - errorCode: 200 (성공 시)
 * - value: { message: string }
 * 
 * @param request 챌린지 생성 요청
 * @returns MessageResponse { message: string }
 */
export async function createChallenge(request: ChallengeRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증
  if (!request.title || !request.title.trim()) {
    throw new Error('챌린지 제목을 입력해주세요.');
  }
  if (!request.description || !request.description.trim()) {
    throw new Error('챌린지 설명을 입력해주세요.');
  }
  if (!request.startDate) {
    throw new Error('시작 날짜를 입력해주세요.');
  }
  if (!request.endDate) {
    throw new Error('종료 날짜를 입력해주세요.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', '/api/challenges', {
      body: request,
    });
    
    // 응답이 예상 형식인지 확인
    if (response && typeof response === 'object' && 'message' in response) {
      return response;
    }
    
    // 응답이 문자열인 경우
    if (typeof response === 'string') {
      return { message: response };
    }
    
    return { message: '챌린지가 생성되었습니다.' };
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Challenge API] 챌린지 생성 실패:', message);
    throw error;
  }
}

/**
 * 챌린지 참가
 * POST /api/challenges/{challengeId}/join
 * 
 * 백엔드 응답: Api<MessageResponse>
 * - errorCode: 200 (성공 시)
 * - value: { message: string }
 * 
 * @param challengeId 챌린지 ID
 * @returns MessageResponse { message: string }
 */
export async function joinChallenge(challengeId: number): Promise<MessageResponse> {
  if (!challengeId) {
    throw new Error('챌린지 ID가 필요합니다.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', `/api/challenges/${challengeId}/join`);
    
    // 응답이 예상 형식인지 확인
    if (response && typeof response === 'object' && 'message' in response) {
      return response;
    }
    
    // 응답이 문자열인 경우
    if (typeof response === 'string') {
      return { message: response };
    }
    
    return { message: '챌린지에 참가했습니다.' };
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Challenge API] 챌린지 참가 실패:', { challengeId, error: message });
    throw error;
  }
}

/**
 * 챌린지 목록 조회
 * GET /api/challenges/all
 * 
 * 백엔드 응답: Api<List<ChallengeResponse>>
 * - errorCode: 200 (성공 시)
 * - value: List<ChallengeResponse>
 * 
 * @returns ChallengeResponse[] 챌린지 목록
 */
export async function getChallenges(): Promise<ChallengeResponse[]> {
  try {
    const response = await requestWithWebViewFallback<ChallengeResponse[]>('GET', '/api/challenges/all');
    
    // 응답이 배열인지 확인
    if (Array.isArray(response)) {
      return response;
    }
    
    // 응답이 객체이고 배열 속성이 있는 경우
    if (response && typeof response === 'object' && 'challenges' in response) {
      return (response as any).challenges;
    }
    
    return [];
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Challenge API] 챌린지 목록 조회 실패:', message);
    throw error;
  }
}

