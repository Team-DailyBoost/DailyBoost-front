/**
 * Exercise API
 * 
 * Swagger 명세: /api/recommend/exercise
 * baseURL: https://dailyboost.duckdns.org
 * 
 * 운동 추천 관련 API 함수들입니다.
 * 
 * 주의: 이 파일의 함수들은 requestWithWebViewFallback을 사용하여
 * RN에서 직접 호출 시 HTML 로그인 페이지가 오면 WebView를 통해 다시 시도합니다.
 */
import { requestWithWebViewFallback } from './http';
import { API_CONFIG } from '../config/api';

/**
 * Exercise Info DTO 타입
 * Swagger 명세의 components.schemas.ExerciseInfoDto를 그대로 옮긴 것입니다.
 */
export interface ExerciseInfoDto {
  name: string;
  description: string;
  youtubeLinks: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

/**
 * Exercise Recommendation 타입 (백엔드 반환 형식과 동일)
 */
export interface ExerciseRecommendationItem {
  name: string;
  description: string;
  youtubeLink: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
  duration?: number;
}

/**
 * Exercise Recommendation 타입 (registerExercise 함수에서 사용)
 */
export type ExerciseRecommendation = ExerciseRecommendationItem;

/**
 * Exercise Request 타입
 * Swagger 명세의 components.schemas.ExerciseRequest을 그대로 옮긴 것입니다.
 */
export interface ExerciseRequest {
  userInput: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
}

/**
 * 운동 추천
 * 백엔드 스펙: GET /api/exercise/recommend (⚠️ @RequestBody 있음 - 비표준)
 *
 * Spring Boot는 GET 요청의 body를 읽을 수 없으므로,
 * WebView에서 POST로 시도합니다. POST가 405로 실패하면 GET으로 폴백합니다.
 */
export async function getExerciseRecommendation(
  userInput: string,
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER',
  part: ExerciseRequest['part'] = 'HOME_TRAINING'
): Promise<ExerciseRecommendationItem[]> {
  const request: ExerciseRequest = { userInput, level, part };
  const path = API_CONFIG.ENDPOINTS?.EXERCISE_RECOMMEND ?? '/api/exercise/recommend';

  try {
    // WebView에서 POST로 먼저 시도 (Spring에서 body를 읽을 수 있음)
    return await requestWithWebViewFallback<ExerciseRecommendationItem[]>('POST', path, {
      body: request,
    });
  } catch (error: any) {
    // POST가 405로 실패하면 GET으로 폴백 (WebView의 XMLHttpRequest는 GET + body 지원)
    const errorMessage = String(error?.message || '').toLowerCase();
    const errorData = error?.error || error;
    const is405 = errorMessage.includes('405') || 
                  errorMessage.includes('method not allowed') ||
                  (errorData && typeof errorData === 'object' && errorData.status === 405);
    
    if (is405) {
      console.log('⚠️ POST 실패 (405), GET으로 WebView 폴백 시도:', path);
      return await requestWithWebViewFallback<ExerciseRecommendationItem[]>('GET', path, {
        body: request,
      });
    }
    throw error;
  }
}

/**
 * 운동 등록
 * POST /api/exercise/register
 * 
 * Swagger 명세:
 * - operationId: register_1
 * - requestBody: ExerciseRecommendation (required)
 * - response: ApiMessageResponse
 */
export async function registerExercise(
  exerciseRecommendation: ExerciseRecommendation
): Promise<{ message: string }> {
  return requestWithWebViewFallback<{ message: string }>('POST', '/api/exercise/register', {
    body: exerciseRecommendation,
  });
}
