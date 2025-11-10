import { api, API_CONFIG } from './api';

/**
 * Event create request
 * Date format: ISO 8601 date-time (e.g., "2024-01-15T14:30:00")
 * Matches Swagger API specification
 */
export interface EventCreateRequest {
  calendarId: number;
  title: string;
  description: string;
  startTime: string; // date-time format (ISO 8601)
  endTime: string; // date-time format (ISO 8601)
}

/**
 * Event update request
 * Date format: ISO 8601 date-time (e.g., "2024-01-15T14:30:00")
 * Matches Swagger API specification
 */
export interface EventUpdateRequest {
  id: number;
  calendarId: number;
  title?: string;
  description?: string;
  startTime?: string; // date-time format (ISO 8601)
  endTime?: string; // date-time format (ISO 8601)
}

/**
 * Event delete request
 */
export interface EventDeleteRequest {
  id: number;
  calendarId: number;
}

/**
 * Event info (single event)
 * Matches Swagger API specification
 */
export interface EventInfo {
  id: number;
  calendarId: number;
  title: string;
  description: string;
  startTime: string; // date-time format (ISO 8601)
  endTime: string; // date-time format (ISO 8601)
}

/**
 * Event response (single event)
 * Matches Swagger API specification
 */
export interface EventResponse {
  id: number;
  calendarId: number;
  title: string;
  description: string;
  startTime: string; // date-time format (ISO 8601)
  endTime: string; // date-time format (ISO 8601)
}

/**
 * Events response (list)
 * Matches Swagger API specification
 */
export interface EventsResponse {
  eventInfos: EventInfo[]; // Note: backend uses "eventInfos" not "events"
}

/**
 * Event Service
 * Updated to match backend API specification
 */
export class EventService {
  /**
   * Get events by calendar and date range
   * 백엔드: GET /api/event/{calendarId}?rangeStart=...&rangeEnd=...
   * Note: Requires authentication
   * Dates should be in ISO 8601 date-time format (e.g., "2024-01-15T14:30:00")
   */
  static async getEvents(calendarId: number, rangeStart: string, rangeEnd: string) {
    try {
      return await api.get<EventsResponse>(
        `${API_CONFIG.ENDPOINTS.GET_EVENTS}/${calendarId}`,
        { rangeStart, rangeEnd }
      );
    } catch (error) {
      return { success: false, error: '이벤트 조회 실패' };
    }
  }

  /**
   * Get event by id and calendar id
   * 백엔드: GET /api/event?eventId=...&calendarId=...
   */
  static async getEvent(eventId: number, calendarId: number) {
    try {
      return await api.get<EventResponse>(
        API_CONFIG.ENDPOINTS.GET_EVENT,
        { eventId, calendarId }
      );
    } catch (error) {
      return { success: false, error: '이벤트 조회 실패' };
    }
  }

  /**
   * Create event
   * 백엔드: POST /api/event/create
   * Note: Requires authentication
   */
  static async createEvent(request: EventCreateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.EVENT_CREATE, request);
    } catch (error) {
      return { success: false, error: '이벤트 생성 실패' };
    }
  }

  /**
   * Update event
   * 백엔드: POST /api/event/update
   * Note: Requires authentication
   */
  static async updateEvent(request: EventUpdateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.EVENT_UPDATE, request);
    } catch (error) {
      return { success: false, error: '이벤트 수정 실패' };
    }
  }

  /**
   * Delete event
   * 백엔드: POST /api/event/delete
   * Note: Requires authentication
   */
  static async deleteEvent(request: EventDeleteRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.EVENT_DELETE, request);
    } catch (error) {
      return { success: false, error: '이벤트 삭제 실패' };
    }
  }
}

