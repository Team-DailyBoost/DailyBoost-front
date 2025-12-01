import { api, API_CONFIG } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomExerciseRecommendations } from '../constants/fallbacks';
import { ServiceResult } from '../types/service';
import type { ExerciseRecommendationItem } from '../api/exercises';
import type { MessageResponse } from '../api/types';

// NOTE:
// 로그인은 WebView에서 해서 세션쿠키가 WebView 쪽에만 있음.
// RN fetch는 그 쿠키를 자동으로 안 보내므로,
// CookieManager로 JSESSIONID를 읽어서 Cookie 헤더에 수동으로 넣어야 한다.
// 안 넣으면 스프링 시큐리티가 403을 돌려준다.
// 
// Expo에서는 CookieManager가 작동하지 않을 수 있으므로,
// AsyncStorage에서 JSESSIONID를 가져오는 방식도 함께 시도함.
// CookieManager 사용 코드는 제거 (Expo 환경에서는 동작하지 않으므로 AsyncStorage 활용)

/**
 * Workout log entry interface
 */
export interface WorkoutLogEntry {
  id?: string;
  userId: string;
  date: string;
  workoutType: string;
  duration: number; // in minutes
  caloriesBurned: number;
  exercises?: ExerciseSet[];
  notes?: string;
  timestamp?: string;
}

/**
 * Exercise set interface
 */
export interface ExerciseSet {
  exerciseName: string;
  sets: number;
  reps?: number;
  weight?: number;
  duration?: number;
}

/**
 * Workout Service
 */
export class WorkoutService {
  /**
   * Add workout log entry
   */
  static async addWorkoutLog(entry: Omit<WorkoutLogEntry, 'id' | 'timestamp'>) {
    return await api.post(API_CONFIG.ENDPOINTS.WORKOUT_LOG, entry);
  }
  
  /**
   * Get workout logs for a user
   */
  static async getWorkoutLogs(userId: string, date?: string) {
    const params: Record<string, any> = { userId };
    if (date) params.date = date;
    return await api.get<WorkoutLogEntry[]>(API_CONFIG.ENDPOINTS.GET_WORKOUT_LOGS, params);
  }
  
  /**
   * Update workout log entry
   */
  static async updateWorkoutLog(id: string, entry: Partial<WorkoutLogEntry>) {
    return await api.put(`${API_CONFIG.ENDPOINTS.UPDATE_WORKOUT_LOG}/${id}`, entry);
  }
  
  /**
   * Delete workout log entry
   */
  static async deleteWorkoutLog(id: string) {
    return await api.delete(`${API_CONFIG.ENDPOINTS.DELETE_WORKOUT_LOG}/${id}`);
  }
  
  /**
   * Get today's workout logs
   */
  static async getTodayWorkoutLogs(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    return await this.getWorkoutLogs(userId, today);
  }
  
  /**
   * Calculate weekly workout totals
   */
  static calculateWeeklyTotals(entries: WorkoutLogEntry[]) {
    return entries.reduce(
      (totals, entry) => ({
        totalDuration: totals.totalDuration + entry.duration,
        totalCalories: totals.totalCalories + entry.caloriesBurned,
        workoutCount: totals.workoutCount + 1,
      }),
      { totalDuration: 0, totalCalories: 0, workoutCount: 0 }
    );
  }
  
  /**
   * Get recommended workout for user (legacy - may not exist)
   */
  static async getRecommendedWorkout(userId: string, timeMinutes?: number) {
    const params: Record<string, any> = { userId };
    if (timeMinutes) params.time = timeMinutes;
    return await api.get<any>(API_CONFIG.ENDPOINTS.GET_RECOMMENDED_WORKOUT, params);
  }

  // 레거시 후보 엔드포인트/직접 fetch 로직 제거 (백엔드 스펙 확정: POST /api/recommend/exercise)

  /**
   * Get AI exercise recommendation based on exercise time and condition
   * 백엔드: GET /api/exercise/recommend (⚠️ 비표준: GET with @RequestBody)
   * 
   * 백엔드 요청: ExerciseRequest { exerciseTime: int, condition: ConditionStatus }
   * - exerciseTime: 운동 시간 (분 단위)
   * - condition: 컨디션 상태 (TIRED, NORMAL, BEST)
   * 
   * Note: Requires authentication
   * Response: ExerciseRecommendationItem[] (List<ExerciseRecommendation> in backend)
   */
  static async getExerciseRecommendation(
    exerciseTime: number = 30,
    condition: 'TIRED' | 'NORMAL' | 'BEST' = 'NORMAL'
  ): Promise<ServiceResult<ExerciseRecommendationItem[]>> {
    try {
      // 우리가 만든 client.ts 기반 API 사용
      const { getExerciseRecommendation } = await import('../api/exercises');
      const result = await getExerciseRecommendation(exerciseTime, condition);
      
      // result가 배열이고 비어있지 않으면 그대로 반환
      if (Array.isArray(result) && result.length > 0) {
        return {
          success: true,
          data: result,
        };
      }
      
      // 빈 배열이거나 null이면 랜덤 더미 데이터 사용
      return {
        success: true,
        data: getRandomExerciseRecommendations(5, 'HOME_TRAINING'),
        meta: {
          usedFallback: true,
          reason: '운동 추천 API가 빈 결과를 반환했습니다.',
        },
      };
    } catch (error: any) {
      const message = String(error?.message || '');
      
      // 인증 오류인 경우
      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        message.includes('401') ||
        message.includes('403')
      ) {
        return {
          success: false,
          error: '인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.',
        };
      }
      
      // 500, 404 등 서버 에러는 fallback 사용
      const reason = typeof error?.message === 'string' && error.message.trim().length > 0
        ? error.message
        : 'AI 운동 추천 서버가 응답하지 않습니다.';

      console.log('[WorkoutService] 운동 추천 실패, 랜덤 더미 데이터 사용:', reason);
      return {
        success: true,
        data: getRandomExerciseRecommendations(5, 'HOME_TRAINING'),
        meta: {
          usedFallback: true,
          reason,
        },
      };
    }
  }

  /**
   * Get AI exercise recommendation based on body part, level, and user input
   * 백엔드: GET /api/exercise/part/recommend (⚠️ 비표준: GET with @RequestBody)
   * 
   * 백엔드 요청: PartExerciseRequest { userInput: String, level: Level, part: ExercisePart }
   * 
   * Note: Requires authentication
   * Response: ExerciseRecommendationItem[] (List<ExerciseRecommendation> in backend)
   */
  static async getPartExerciseRecommendation(
    userInput: string,
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER',
    part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING' = 'HOME_TRAINING'
  ): Promise<ServiceResult<ExerciseRecommendationItem[]>> {
    try {
      // 우리가 만든 client.ts 기반 API 사용
      const { getPartExerciseRecommendation } = await import('../api/exercises');
      const result = await getPartExerciseRecommendation(userInput, level, part);
      
      // result가 배열이고 비어있지 않으면 그대로 반환
      if (Array.isArray(result) && result.length > 0) {
        return {
          success: true,
          data: result,
        };
      }
      
      // 빈 배열이거나 null이면 랜덤 더미 데이터 사용
      return {
        success: true,
        data: getRandomExerciseRecommendations(6, part),
        meta: {
          usedFallback: true,
          reason: '부위별 운동 추천 API가 빈 결과를 반환했습니다.',
        },
      };
    } catch (error: any) {
      const message = String(error?.message || '');
      
      // 인증 오류인 경우
      if (
        error.response?.status === 401 ||
        error.response?.status === 403 ||
        message.includes('401') ||
        message.includes('403')
      ) {
        return {
          success: false,
          error: '인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.',
        };
      }
      
      // 500, 404 등 서버 에러는 fallback 사용
      const reason = typeof error?.message === 'string' && error.message.trim().length > 0
        ? error.message
        : 'AI 부위별 운동 추천 서버가 응답하지 않습니다.';

      console.log('[WorkoutService] 부위별 운동 추천 실패, 랜덤 더미 데이터 사용:', reason);
      return {
        success: true,
        data: getRandomExerciseRecommendations(6, part),
        meta: {
          usedFallback: true,
          reason,
        },
      };
    }
  }

  /**
   * Register exercise recommendation
   * 백엔드: POST /api/exercise/register/{exerciseId}
   * Note: Requires authentication
   * 
   * @param exerciseId 운동 ID
   * @returns ServiceResult<MessageResponse> { success: boolean, data?: MessageResponse, error?: string }
   */
  static async registerExercise(exerciseId: number): Promise<ServiceResult<MessageResponse>> {
    console.log('[WorkoutService] registerExercise 호출:', { exerciseId });
    
    try {
      const { registerExercise } = await import('../api/exercises');
      console.log('[WorkoutService] registerExercise API 함수 import 완료');
      
      console.log('[WorkoutService] registerExercise API 호출 시작:', exerciseId);
      const result = await registerExercise(exerciseId);
      console.log('[WorkoutService] registerExercise API 응답:', result);
      
      return { success: true, data: result };
    } catch (error: any) {
      const errorMessage = error?.message || '운동 등록 실패';
      console.error('[WorkoutService] 운동 등록 실패:', { exerciseId, error: errorMessage });
      console.error('[WorkoutService] 운동 등록 실패 상세:', error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Unregister exercise recommendation
   * 백엔드: POST /api/exercise/unregister/{exerciseId}
   * Note: Requires authentication
   * 
   * @param exerciseId 운동 ID
   * @returns ServiceResult<MessageResponse> { success: boolean, data?: MessageResponse, error?: string }
   */
  static async unregisterExercise(exerciseId: number): Promise<ServiceResult<MessageResponse>> {
    try {
      const { unregisterExercise } = await import('../api/exercises');
      const result = await unregisterExercise(exerciseId);
      return { success: true, data: result };
    } catch (error: any) {
      const errorMessage = error?.message || '운동 등록 해제 실패';
      console.error('[WorkoutService] 운동 등록 해제 실패:', { exerciseId, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get registered exercise
   * 백엔드: GET /api/exercise/{exerciseId}
   * Note: Requires authentication
   * 
   * 등록된 운동(REGISTERED 상태)의 상세 정보를 조회합니다.
   */
  static async getExercise(exerciseId: number) {
    try {
      const { getExercise } = await import('../api/exercises');
      const result = await getExercise(exerciseId);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error?.message || '운동 조회 실패' };
    }
  }
}
