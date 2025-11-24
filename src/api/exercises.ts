import { requestWithWebViewFallback } from './http';
import { API_CONFIG } from '../config/api';
import { getRandomExerciseRecommendations } from '../constants/fallbacks';

export interface ExerciseInfoDto {
  name: string;
  description: string;
  youtubeLinks: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface ExerciseRecommendationItem {
  name: string;
  description: string;
  youtubeLink: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
  duration?: number;
}

export type ExerciseRecommendation = ExerciseRecommendationItem[];

export interface ExerciseRequest {
  userInput: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
}

/**
 * 운동 추천
 * GET /api/exercise/recommend
 * 
 * 백엔드 응답: Api<List<ExerciseRecommendation>>
 * - value: List<ExerciseRecommendation> [{ name, description, youtubeLink, level, part }]
 * 
 * 주의: 백엔드가 @GetMapping에 @RequestBody를 사용하는 비표준 API입니다.
 * Spring Boot는 GET 요청의 body를 읽지 못하므로 이 API는 정상 작동하지 않습니다.
 * fallback 데이터를 사용합니다.
 */
export async function getExerciseRecommendation(
  userInput: string,
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER',
  part: ExerciseRequest['part'] = 'HOME_TRAINING'
): Promise<ExerciseRecommendationItem[]> {
  // 백엔드 validation 검증
  if (!userInput || !userInput.trim()) {
    console.warn('[Exercise API] userInput이 없어 기본값 사용');
    userInput = `${part} 운동 추천해줘`;
  }
  
  const request: ExerciseRequest = { 
    userInput: userInput.trim(), 
    level, 
    part 
  };
  const path = API_CONFIG.ENDPOINTS?.EXERCISE_RECOMMEND || '/api/exercise/recommend';

  console.log('[Exercise API] 운동 추천 요청:', { part, level, userInput: userInput?.substring(0, 50) });
  
  try {
    // 백엔드가 GET + @RequestBody를 사용하는 비표준 API
    // WebView를 통한 GET + body 시도
    const response = await requestWithWebViewFallback<ExerciseRecommendationItem[]>('GET', path, {
      body: request,
    });
    
    // 응답이 배열인지 확인
    if (Array.isArray(response)) {
      // 각 항목 정규화
      return response.map(item => ({
        name: item.name || '',
        description: item.description || '',
        youtubeLink: item.youtubeLink || '', // 백엔드: youtubeLink (단수)
        level: item.level || level,
        part: item.part || part,
      }));
    }
    
    return response || [];
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 추천 API 실패, fallback 데이터 사용:', message);
    
    // 모든 에러에 대해 요청한 부위에 맞는 랜덤 운동 추천 반환
    return getRandomExerciseRecommendations(5, part);
  }
}

export async function registerExercise(exerciseId: number): Promise<{ message: string }> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<{ message: string }>('POST', `/api/exercise/register/${exerciseId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 등록 실패:', exerciseId, message);
    throw error;
  }
}

export async function unregisterExercise(exerciseId: number): Promise<{ message: string }> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<{ message: string }>('POST', `/api/exercise/unregister/${exerciseId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 등록 해제 실패:', exerciseId, message);
    throw error;
  }
}

export async function completeExercise(exerciseId: number): Promise<{ message: string }> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<{ message: string }>('POST', `/api/exercise/complete/${exerciseId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 완료 처리 실패:', exerciseId, message);
    throw error;
  }
}

export async function uncompleteExercise(exerciseId: number): Promise<{ message: string }> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<{ message: string }>('POST', `/api/exercise/uncomplete/${exerciseId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 완료 취소 실패:', exerciseId, message);
    throw error;
  }
}
