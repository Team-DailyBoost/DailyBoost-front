/**
 * Event API
 * 
 * OpenAPI: /api/event/**
 */
import client, { extractApiValue, ApiResponse } from './client';
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
  const response = await client.get<ApiResponse<EventsResponse>>(`/api/event/${calendarId}`, {
    params: { rangeStart, rangeEnd },
  });
  return extractApiValue(response);
}

/**
 * 이벤트 상세 조회
 * GET /api/event?eventId=...&calendarId=...
 */
export async function getEvent(eventId: number, calendarId: number): Promise<EventResponse> {
  const response = await client.get<ApiResponse<EventResponse>>('/api/event', {
    params: { eventId, calendarId },
  });
  return extractApiValue(response);
}

/**
 * 이벤트 생성
 * POST /api/event/create
 */
export async function createEvent(request: EventsRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/event/create', request);
  return extractApiValue(response);
}

/**
 * 이벤트 수정
 * POST /api/event/update
 */
export async function updateEvent(request: EventUpdateRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/event/update', request);
  return extractApiValue(response);
}

/**
 * 이벤트 삭제
 * POST /api/event/delete
 */
export async function deleteEvent(request: EventDeleteRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/event/delete', request);
  return extractApiValue(response);
}

