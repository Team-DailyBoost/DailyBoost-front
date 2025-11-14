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
 * POST /api/exercise/recommend
 * 
 * Swagger 명세:
 * - operationId: recommendExercise
 * - requestBody: ExerciseRequest (required)
 * - response: Api<List<ExerciseRecommendation>>
 * 
 * 백엔드가 POST를 사용하므로 그대로 호출합니다.
 */
export async function getExerciseRecommendation(
  userInput: string,
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER',
  part: ExerciseRequest['part'] = 'HOME_TRAINING'
): Promise<ExerciseRecommendationItem[]> {
  const request: ExerciseRequest = { userInput, level, part };

  return requestWithWebViewFallback<ExerciseRecommendationItem[]>('POST', '/api/exercise/recommend', {
    body: request,
  });
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
