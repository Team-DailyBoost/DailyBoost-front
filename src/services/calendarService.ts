import { api, API_CONFIG } from './api';

/**
 * Calendar create request
 */
export interface CalendarCreateRequest {
  name: string;
  color?: string;
}

/**
 * Calendar update request
 */
export interface CalendarUpdateRequest {
  calendarId: number;
  name?: string;
  color?: string;
}

/**
 * Calendar invite request
 */
export interface CalendarInviteRequest {
  emails: string[];
}

/**
 * Calendar response
 */
export interface CalendarResponse {
  id: number;
  name: string;
  description?: string;
  userId: number;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Calendars response
 * Matches Swagger API specification
 */
export interface CalendarsResponse {
  calendarResponses: CalendarResponse[]; // Note: backend uses "calendarResponses" not "calendars"
}

/**
 * Calendar Service
 * Updated to match backend API specification
 */
export class CalendarService {
  /**
   * Get all calendars for current user
   * 백엔드: GET /api/calendar
   * Note: Requires authentication
   */
  static async getCalendars() {
    try {
      return await api.get<CalendarsResponse>(API_CONFIG.ENDPOINTS.GET_CALENDARS);
    } catch (error) {
      return { success: false, error: '캘린더 조회 실패' };
    }
  }

  /**
   * Get calendar by id
   * 백엔드: GET /api/calendar/{calendarId}
   */
  static async getCalendar(calendarId: number) {
    try {
      return await api.get<CalendarResponse>(`${API_CONFIG.ENDPOINTS.GET_CALENDAR}/${calendarId}`);
    } catch (error) {
      return { success: false, error: '캘린더 조회 실패' };
    }
  }

  /**
   * Create calendar
   * 백엔드: POST /api/calendar/create
   * Note: Requires authentication
   */
  static async createCalendar(request: CalendarCreateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.CALENDAR_CREATE, request);
    } catch (error) {
      return { success: false, error: '캘린더 생성 실패' };
    }
  }

  /**
   * Update calendar
   * 백엔드: POST /api/calendar/update
   * Note: Requires authentication
   */
  static async updateCalendar(request: CalendarUpdateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.CALENDAR_UPDATE, request);
    } catch (error) {
      return { success: false, error: '캘린더 수정 실패' };
    }
  }

  /**
   * Delete calendar
   * 백엔드: POST /api/calendar/delete/{calendarId}
   * Note: Requires authentication
   */
  static async deleteCalendar(calendarId: number) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.CALENDAR_DELETE}/${calendarId}`);
    } catch (error) {
      return { success: false, error: '캘린더 삭제 실패' };
    }
  }

  /**
   * Invite users to calendar
   * 백엔드: POST /api/calendar/invite/{calendarId}
   * Note: Requires authentication
   */
  static async inviteUsers(calendarId: number, request: CalendarInviteRequest) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.CALENDAR_INVITE}/${calendarId}`, request);
    } catch (error) {
      return { success: false, error: '초대 실패' };
    }
  }
}

