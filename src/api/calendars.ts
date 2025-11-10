/**
 * Calendar API
 * 
 * OpenAPI: /api/calendar/**
 */
import client, { extractApiValue, ApiResponse } from './client';
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
  const response = await client.get<ApiResponse<CalendarsResponse>>('/api/calendar');
  return extractApiValue(response);
}

/**
 * 캘린더 상세 조회
 * GET /api/calendar/{calendarId}
 */
export async function getCalendar(calendarId: number): Promise<CalendarResponse> {
  const response = await client.get<ApiResponse<CalendarResponse>>(`/api/calendar/${calendarId}`);
  return extractApiValue(response);
}

/**
 * 캘린더 생성
 * POST /api/calendar/create
 */
export async function createCalendar(request: CalendarRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/calendar/create', request);
  return extractApiValue(response);
}

/**
 * 캘린더 수정
 * POST /api/calendar/update
 */
export async function updateCalendar(request: CalendarUpdateRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/calendar/update', request);
  return extractApiValue(response);
}

/**
 * 캘린더 삭제
 * POST /api/calendar/delete/{calendarId}
 */
export async function deleteCalendar(calendarId: number): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(`/api/calendar/delete/${calendarId}`);
  return extractApiValue(response);
}

/**
 * 캘린더에 사용자 초대
 * POST /api/calendar/invite/{calendarId}
 */
export async function inviteUsersToCalendar(
  calendarId: number,
  request: AddUsersEmailRequest
): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(
    `/api/calendar/invite/${calendarId}`,
    request
  );
  return extractApiValue(response);
}

