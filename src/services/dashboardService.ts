import { api, API_CONFIG } from './api';

/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  dailyExercise: number;
  weeklyCalories: number[];
  weeklyExercise: number[];
  weightTrend: Array<{ date: string; weight: number }>;
  inBodyData?: InBodyData;
}

/**
 * InBody data interface
 */
export interface InBodyData {
  weight: number;
  muscleMass: number;
  bodyFatPercentage: number;
  bmi: number;
  lastUpdated: string;
  isConnected: boolean;
}

/**
 * Dashboard Service
 */
export class DashboardService {
  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(userId: string, date?: string) {
    const params: Record<string, any> = { userId };
    if (date) params.date = date;
    return await api.get<DashboardStats>(API_CONFIG.ENDPOINTS.DASHBOARD_STATS, params);
  }
  
  /**
   * Get weekly statistics
   */
  static async getWeeklyStats(userId: string, weekStart?: string) {
    const params: Record<string, any> = { userId };
    if (weekStart) params.weekStart = weekStart;
    return await api.get<DashboardStats>(API_CONFIG.ENDPOINTS.WEEKLY_STATS, params);
  }
  
  /**
   * Sync InBody data
   */
  static async syncInBody(userId: string) {
    return await api.post(API_CONFIG.ENDPOINTS.SYNC_INBODY, { userId });
  }
  
  /**
   * Get InBody data
   */
  static async getInBodyData(userId: string) {
    return await api.get<InBodyData>(API_CONFIG.ENDPOINTS.GET_INBODY_DATA, { userId });
  }
}

