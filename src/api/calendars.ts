/**
 * Calendar API
 * 
 * OpenAPI: /api/calendar/**
 */
import { requestWithWebViewFallback } from './http';
import {
  CalendarRequest,
  CalendarUpdateRequest,
  CalendarResponse,
  CalendarsResponse,
  AddUsersEmailRequest,
  MessageResponse,
} from './types';

/**
 * 캘린더 목록 조회
 * GET /api/calendar
 */
export async function getCalendars(): Promise<CalendarsResponse> {
  try {
    return await requestWithWebViewFallback<CalendarsResponse>('GET', '/api/calendar');
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Calendar API] 캘린더 목록 조회 실패:', message);
    throw error;
  }
}

/**
 * 캘린더 상세 조회
 * GET /api/calendar/{calendarId}
 */
export async function getCalendar(calendarId: number): Promise<CalendarResponse> {
  try {
    return await requestWithWebViewFallback<CalendarResponse>('GET', `/api/calendar/${calendarId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Calendar API] 캘린더 상세 조회 실패:', calendarId, message);
    throw error;
  }
}

/**
 * 캘린더 생성
 * POST /api/calendar/create
 */
export async function createCalendar(request: CalendarRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증
  if (!request.name || !request.name.trim()) {
    throw new Error('캘린더 이름을 입력해주세요.');
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', '/api/calendar/create', {
      body: request,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Calendar API] 캘린더 생성 실패:', message);
    throw error;
  }
}

/**
 * 캘린더 수정
 * POST /api/calendar/update
 */
export async function updateCalendar(request: CalendarUpdateRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증
  if (!request.calendarId) {
    throw new Error('캘린더 ID가 필요합니다.');
  }
  if (!request.name || !request.name.trim()) {
    throw new Error('캘린더 이름을 입력해주세요.');
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', '/api/calendar/update', {
      body: request,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Calendar API] 캘린더 수정 실패:', message);
    throw error;
  }
}

/**
 * 캘린더 삭제
 * POST /api/calendar/delete/{calendarId}
 */
export async function deleteCalendar(calendarId: number): Promise<MessageResponse> {
  if (!calendarId) {
    throw new Error('캘린더 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', `/api/calendar/delete/${calendarId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Calendar API] 캘린더 삭제 실패:', calendarId, message);
    throw error;
  }
}

/**
 * 캘린더에 사용자 초대
 * POST /api/calendar/invite/{calendarId}
 */
export async function inviteUsersToCalendar(
  calendarId: number,
  request: AddUsersEmailRequest
): Promise<MessageResponse> {
  if (!calendarId) {
    throw new Error('캘린더 ID가 필요합니다.');
  }
  if (!request.emails || !Array.isArray(request.emails) || request.emails.length === 0) {
    throw new Error('초대할 이메일을 입력해주세요.');
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', `/api/calendar/invite/${calendarId}`, {
      body: request,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Calendar API] 사용자 초대 실패:', calendarId, message);
    throw error;
  }
}

