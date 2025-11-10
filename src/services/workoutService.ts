import { api, API_CONFIG } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
   * Get AI exercise recommendation based on user input
   * 백엔드: GET /api/recommend/exercise (⚠️ 비표준: GET with @RequestBody)
   * 
   * 이제 우리가 만든 client.ts 기반 API를 사용합니다.
   * client.ts는 AsyncStorage의 @sessionCookie를 자동으로 헤더에 추가합니다.
   * 
   * Note: Requires authentication
   * Response: Api<ExerciseRecommendation> where ExerciseRecommendation contains exerciseInfoDto array
   */
  static async getExerciseRecommendation(userInput: string, level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER') {
    try {
      // 사용자 정보 가져오기 (AsyncStorage 또는 API)
      let userInfoText = '';
      try {
        const currentUserStr = await AsyncStorage.getItem('currentUser');
        if (currentUserStr) {
          const currentUser = JSON.parse(currentUserStr);
          
          // 사용자 정보를 텍스트로 구성
          const infoParts: string[] = [];
          
          // 키, 몸무게, 목표 정보가 있으면 포함
          if (currentUser.healthInfo) {
            const { height, weight, goal } = currentUser.healthInfo;
            if (height) infoParts.push(`키: ${height}cm`);
            if (weight) infoParts.push(`몸무게: ${weight}kg`);
            if (goal) {
              const goalNames: Record<string, string> = {
                'WEIGHT_LOSS': '체중 감량',
                'MUSCLE_GAIN': '근육 증가',
                'STRENGTH_IMPROVEMENT': '근력 향상',
                'ENDURANCE_IMPROVEMENT': '지구력 향상',
                'GENERAL_HEALTH_MAINTENANCE': '일반 건강 유지',
                'BODY_SHAPE_MANAGEMENT': '체형 관리'
              };
              infoParts.push(`목표: ${goalNames[goal] || goal}`);
            }
          }
          
          // 성별, 나이 정보가 있으면 포함
          if (currentUser.gender) {
            const genderNames: Record<string, string> = {
              'MALE': '남성',
              'FEMALE': '여성',
              'OTHER': '기타'
            };
            infoParts.push(`성별: ${genderNames[currentUser.gender] || currentUser.gender}`);
          }
          if (currentUser.age) {
            infoParts.push(`나이: ${currentUser.age}세`);
          }
          
          if (infoParts.length > 0) {
            userInfoText = `\n\n사용자 정보: ${infoParts.join(', ')}`;
          }
        }
      } catch (userInfoError) {
        console.log('⚠️ 사용자 정보 가져오기 실패 (무시하고 계속):', userInfoError);
      }
      
      // 사용자 정보를 포함한 userInput 구성
      const enhancedUserInput = userInput + userInfoText;
      
      // 우리가 만든 client.ts 기반 API 사용
      const { getExerciseRecommendation } = await import('../api/exercises');
      const result = await getExerciseRecommendation(enhancedUserInput, level);
      
      
      return { 
        success: true, 
        data: result 
      };
    } catch (error: any) {
      
      // 인증 오류인 경우
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          error: '인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || '운동 추천 실패' 
      };
    }
  }

  /**
   * 백엔드 또는 프록시 응답을 화면에서 기대하는 형식으로 정규화
   * - Api<T> 형태면 value 사용
   * - 바로 exerciseInfoDto 배열이 오면 그대로 래핑
   * - 배열이 그대로 오면 exerciseInfoDto로 래핑
   */
  private static normalizeExerciseResponse(raw: any): ExerciseRecommendation {
    if (!raw) return { exerciseInfoDto: [] };
    const value = (raw && typeof raw === 'object' && ('value' in raw)) ? raw.value : raw;
    if (value && typeof value === 'object' && Array.isArray((value as any).exerciseInfoDto)) {
      return { exerciseInfoDto: (value as any).exerciseInfoDto };
    }
    if (Array.isArray(value)) {
      return { exerciseInfoDto: value as any[] } as ExerciseRecommendation;
    }
    // 다른 키로 올 가능성 (exerciseInfos 등) 대비
    const candidateKeys = ['exerciseInfos', 'items', 'list'];
    for (const k of candidateKeys) {
      if (value && typeof value === 'object' && Array.isArray((value as any)[k])) {
        return { exerciseInfoDto: (value as any)[k] } as ExerciseRecommendation;
      }
    }
    // 알 수 없는 형식이면 빈 배열 반환
    return { exerciseInfoDto: [] };
  }

  /**
   * Register exercise recommendation
   * 백엔드: POST /api/exercise/register
   * Note: Requires authentication
   */
  static async registerExercise(exerciseRecommendation: ExerciseRecommendation) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.EXERCISE_REGISTER, exerciseRecommendation);
    } catch (error) {
      return { success: false, error: '운동 등록 실패' };
    }
  }
}

/**
 * Exercise info DTO
 */
export interface ExerciseInfoDto {
  name: string;
  description: string;
  youtubeLinks: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

/**
 * Exercise recommendation interface (for registration)
 * 백엔드: POST /api/exercise/register
 */
export interface ExerciseRecommendation {
  exerciseInfoDto: ExerciseInfoDto[];
}

