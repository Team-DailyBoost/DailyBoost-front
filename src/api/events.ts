/**
 * Event API
 * 
 * OpenAPI: /api/event/**
 */
import { requestWithWebViewFallback } from './http';
import {
  EventsRequest,
  EventUpdateRequest,
  EventDeleteRequest,
  EventResponse,
  EventsResponse,
  MessageResponse,
} from './types';

/**
 * 이벤트 목록 조회 (캘린더별, 날짜 범위)
 * GET /api/event/{calendarId}?rangeStart=...&rangeEnd=...
 * 
 * @param calendarId 캘린더 ID
 * @param rangeStart 시작 날짜/시간 (ISO 8601 format, e.g., "2024-01-15T00:00:00")
 * @param rangeEnd 종료 날짜/시간 (ISO 8601 format, e.g., "2024-01-15T23:59:59")
 */
export async function getEvents(
  calendarId: number,
  rangeStart: string,
  rangeEnd: string
): Promise<EventsResponse> {
  if (!calendarId) {
    throw new Error('캘린더 ID가 필요합니다.');
  }
  if (!rangeStart || !rangeEnd) {
    throw new Error('시작 날짜와 종료 날짜가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<EventsResponse>('GET', `/api/event/${calendarId}`, {
      query: {
        rangeStart,
        rangeEnd,
      },
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Event API] 이벤트 목록 조회 실패:', calendarId, message);
    throw error;
  }
}

/**
 * 이벤트 상세 조회
 * GET /api/event?eventId=...&calendarId=...
 */
export async function getEvent(eventId: number, calendarId: number): Promise<EventResponse> {
  if (!eventId || !calendarId) {
    throw new Error('이벤트 ID와 캘린더 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<EventResponse>('GET', '/api/event', {
      query: {
        eventId: String(eventId),
        calendarId: String(calendarId),
      },
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Event API] 이벤트 상세 조회 실패:', eventId, calendarId, message);
    throw error;
  }
}

/**
 * 이벤트 생성
 * POST /api/event/create
 */
export async function createEvent(request: EventsRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증 (@NotNull)
  if (!request.calendarId) {
    throw new Error('캘린더 ID가 필요합니다.');
  }
  if (!request.title || !request.title.trim()) {
    throw new Error('이벤트 제목을 입력해주세요.');
  }
  if (!request.description || !request.description.trim()) {
    throw new Error('이벤트 설명을 입력해주세요.');
  }
  if (!request.startTime || !request.endTime) {
    throw new Error('시작 시간과 종료 시간이 필요합니다.');
  }
  if (new Date(request.startTime) >= new Date(request.endTime)) {
    throw new Error('시작 시간은 종료 시간보다 빨라야 합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', '/api/event/create', {
      body: request,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Event API] 이벤트 생성 실패:', message);
    throw error;
  }
}

/**
 * 이벤트 수정
 * POST /api/event/update
 */
export async function updateEvent(request: EventUpdateRequest): Promise<MessageResponse> {
  // 백엔드 validation 검증
  if (!request.id) {
    throw new Error('이벤트 ID가 필요합니다.');
  }
  if (!request.calendarId) {
    throw new Error('캘린더 ID가 필요합니다.');
  }
  if (request.startTime && request.endTime) {
    if (new Date(request.startTime) >= new Date(request.endTime)) {
      throw new Error('시작 시간은 종료 시간보다 빨라야 합니다.');
    }
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', '/api/event/update', {
      body: request,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Event API] 이벤트 수정 실패:', message);
    throw error;
  }
}

/**
 * 이벤트 삭제
 * POST /api/event/delete
 */
export async function deleteEvent(request: EventDeleteRequest): Promise<MessageResponse> {
  if (!request.id || !request.calendarId) {
    throw new Error('이벤트 ID와 캘린더 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<MessageResponse>('POST', '/api/event/delete', {
      body: request,
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Event API] 이벤트 삭제 실패:', request.id, message);
    throw error;
  }
}

