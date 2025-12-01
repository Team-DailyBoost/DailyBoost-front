import { requestWithWebViewFallback } from './http';
import { API_CONFIG } from '../config/api';
import { getRandomExerciseRecommendations } from '../constants/fallbacks';
import { MessageResponse } from './types';

export interface ExerciseInfoDto {
  name: string;
  description: string;
  youtubeLinks: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface ExerciseRecommendationItem {
  id?: number; // 운동 ID (백엔드 응답에 포함될 수 있음)
  name: string;
  description: string;
  youtubeLink: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
  duration?: number;
  sets?: number; // 세트 수 (Integer)
  reps?: number; // 횟수 (Integer)
  weight?: number; // 무게 (Double)
}

/**
 * 운동 조회 응답
 * GET /api/exercise/{exerciseId}
 * 백엔드 응답: Api<ExerciseResponse>
 * - 등록된 운동(REGISTERED 상태)의 상세 정보
 * 
 * 업데이트: sets, reps, weight 필드 추가
 */
export interface ExerciseResponse {
  id: number;
  name: string;
  description: string;
  youtubeLink?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
  status: 'REGISTERED' | 'UNREGISTERED';
  completionStatus: 'COMPLETED' | 'UNCOMPLETED';
  sets?: number; // 세트 수 (Integer)
  reps?: number; // 횟수 (Integer)
  weight?: number; // 무게 (Double)
}

export type ExerciseRecommendation = ExerciseRecommendationItem[];

/**
 * Exercise Request
 * 백엔드: ExerciseRequest { exerciseTime: int, condition: ConditionStatus }
 * - exerciseTime: 운동 시간 (분 단위)
 * - condition: 컨디션 상태 (TIRED, NORMAL, BEST)
 */
export interface ExerciseRequest {
  exerciseTime: number; // int
  condition: 'TIRED' | 'NORMAL' | 'BEST'; // ConditionStatus enum
}

/**
 * Part Exercise Request
 * 백엔드: PartExerciseRequest { userInput: String, level: Level, part: ExercisePart }
 * - /api/exercise/part/recommend 엔드포인트용
 */
export interface PartExerciseRequest {
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
 * 백엔드 요청: ExerciseRequest { exerciseTime: int, condition: ConditionStatus }
 * - exerciseTime: 운동 시간 (분 단위)
 * - condition: 컨디션 상태 (TIRED, NORMAL, BEST)
 * 
 * 주의: 백엔드가 @GetMapping에 @RequestBody를 사용하는 비표준 API입니다.
 * Spring Boot는 GET 요청의 body를 읽지 못하므로 이 API는 정상 작동하지 않습니다.
 * fallback 데이터를 사용합니다.
 */
export async function getExerciseRecommendation(
  exerciseTime: number = 30,
  condition: 'TIRED' | 'NORMAL' | 'BEST' = 'NORMAL'
): Promise<ExerciseRecommendationItem[]> {
  // 백엔드 validation 검증
  if (!exerciseTime || exerciseTime <= 0) {
    console.warn('[Exercise API] exerciseTime이 없거나 0 이하, 기본값 30 사용');
    exerciseTime = 30;
  }
  
  const request: ExerciseRequest = { 
    exerciseTime,
    condition
  };
  const path = API_CONFIG.ENDPOINTS?.EXERCISE_RECOMMEND || '/api/exercise/recommend';

  console.log('[Exercise API] 운동 추천 요청:', { exerciseTime, condition });
  
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
        id: item.id, // 백엔드 응답에 ID가 있을 수 있음
        name: item.name || '',
        description: item.description || '',
        youtubeLink: item.youtubeLink || '', // 백엔드: youtubeLink (단수)
        level: item.level || 'BEGINNER',
        part: item.part || 'HOME_TRAINING',
        sets: item.sets, // 세트 수
        reps: item.reps, // 횟수
        weight: item.weight, // 무게
      }));
    }
    
    return response || [];
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 추천 API 실패, fallback 데이터 사용:', message);
    
    // 모든 에러에 대해 랜덤 운동 추천 반환
    return getRandomExerciseRecommendations(5, 'HOME_TRAINING');
  }
}

/**
 * 부위별 운동 추천
 * POST /api/exercise/part/recommend
 * 
 * 백엔드 응답: Api<List<ExerciseRecommendation>>
 * - value: List<ExerciseRecommendation> [{ name, description, youtubeLink, level, part }]
 * 
 * 백엔드 요청: PartExerciseRequest { userInput: String, level: Level, part: ExercisePart }
 */
export async function getPartExerciseRecommendation(
  userInput: string,
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' = 'BEGINNER',
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING' = 'HOME_TRAINING'
): Promise<ExerciseRecommendationItem[]> {
  // 백엔드 validation 검증
  if (!userInput || !userInput.trim()) {
    console.warn('[Exercise API] userInput이 없어 기본값 사용');
    userInput = `${part} 운동 추천해줘`;
  }
  
  const request: PartExerciseRequest = { 
    userInput: userInput.trim(), 
    level, 
    part 
  };
  const path = '/api/exercise/part/recommend';

  console.log('[Exercise API] 부위별 운동 추천 요청:', { part, level, userInput: userInput?.substring(0, 50) });
  
  try {
    // POST 요청으로 body 전송
    const response = await requestWithWebViewFallback<ExerciseRecommendationItem[]>('POST', path, {
      body: request,
    });
    
    // 응답이 배열인지 확인
    if (Array.isArray(response)) {
      // 각 항목 정규화
      return response.map(item => ({
        id: item.id, // 백엔드 응답에 ID가 있을 수 있음
        name: item.name || '',
        description: item.description || '',
        youtubeLink: item.youtubeLink || '', // 백엔드: youtubeLink (단수)
        level: item.level || level,
        part: item.part || part,
        sets: item.sets, // 세트 수
        reps: item.reps, // 횟수
        weight: item.weight, // 무게
      }));
    }
    
    return response || [];
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 부위별 운동 추천 API 실패, fallback 데이터 사용:', message);
    
    // 모든 에러에 대해 요청한 부위에 맞는 랜덤 운동 추천 반환
    return getRandomExerciseRecommendations(6, part);
  }
}

/**
 * 운동 기록에 추가
 * POST /api/exercise/register/{exerciseId}
 * 
 * 백엔드 응답: Api<MessageResponse>
 * - errorCode: 200 (성공 시)
 * - value: { message: "운동 기록이 등록되었습니다." }
 * 
 * @param exerciseId 운동 ID (Long)
 * @returns MessageResponse { message: string }
 */
export async function registerExercise(exerciseId: number): Promise<MessageResponse> {
  console.log('[Exercise API] registerExercise 호출:', { exerciseId });
  
  if (!exerciseId) {
    console.error('[Exercise API] exerciseId가 없습니다:', exerciseId);
    throw new Error('운동 ID가 필요합니다.');
  }
  
  const url = `/api/exercise/register/${exerciseId}`;
  console.log('[Exercise API] 요청 URL:', url);
  
  try {
    console.log('[Exercise API] requestWithWebViewFallback 호출 시작');
    const response = await requestWithWebViewFallback<MessageResponse>('POST', url);
    console.log('[Exercise API] requestWithWebViewFallback 응답:', response);
    
    // 백엔드 응답 형식: Api<MessageResponse> = { errorCode: 200, value: { message: string } }
    // requestWithWebViewFallback이 value를 추출하므로 MessageResponse가 반환됨
    
    // 응답이 예상 형식인지 확인
    if (response && typeof response === 'object' && 'message' in response) {
      console.log('[Exercise API] 정상 응답 반환:', response);
      return response;
    }
    
    // 응답이 문자열인 경우 (백엔드가 직접 message를 반환하는 경우)
    if (typeof response === 'string') {
      console.log('[Exercise API] 문자열 응답 변환:', response);
      return { message: response };
    }
    
    // 예상하지 못한 형식
    console.warn('[Exercise API] 예상하지 못한 응답 형식:', response);
    return { message: '운동이 등록되었습니다.' };
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Exercise API] 운동 등록 실패:', { exerciseId, error: message });
    console.error('[Exercise API] 운동 등록 실패 상세:', error);
    throw error;
  }
}

/**
 * 운동 기록에서 제거
 * POST /api/exercise/unregister/{exerciseId}
 * 
 * 백엔드 응답: Api<MessageResponse>
 * - errorCode: 200 (성공 시)
 * - value: { message: "운동 기록이 삭제되었습니다." }
 * 
 * @param exerciseId 운동 ID (Long)
 * @returns MessageResponse { message: string }
 */
export async function unregisterExercise(exerciseId: number): Promise<MessageResponse> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', `/api/exercise/unregister/${exerciseId}`);
    
    // 백엔드 응답 형식: Api<MessageResponse> = { errorCode: 200, value: { message: string } }
    // requestWithWebViewFallback이 value를 추출하므로 MessageResponse가 반환됨
    
    // 응답이 예상 형식인지 확인
    if (response && typeof response === 'object' && 'message' in response) {
      return response;
    }
    
    // 응답이 문자열인 경우
    if (typeof response === 'string') {
      return { message: response };
    }
    
    // 예상하지 못한 형식
    console.warn('[Exercise API] 예상하지 못한 응답 형식:', response);
    return { message: '운동이 등록 해제되었습니다.' };
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Exercise API] 운동 등록 해제 실패:', { exerciseId, error: message });
    throw error;
  }
}

/**
 * 운동 완료 처리
 * POST /api/exercise/complete/{exerciseId}
 * 
 * 백엔드 응답: Api<MessageResponse>
 * - errorCode: 200 (성공 시)
 * - value: { message: "운동 완료" }
 * 
 * @param exerciseId 운동 ID (Long)
 * @returns MessageResponse { message: string }
 */
export async function completeExercise(exerciseId: number): Promise<MessageResponse> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', `/api/exercise/complete/${exerciseId}`);
    
    // 응답이 예상 형식인지 확인
    if (response && typeof response === 'object' && 'message' in response) {
      return response;
    }
    
    // 응답이 문자열인 경우
    if (typeof response === 'string') {
      return { message: response };
    }
    
    return { message: '운동이 완료되었습니다.' };
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Exercise API] 운동 완료 처리 실패:', { exerciseId, error: message });
    throw error;
  }
}

/**
 * 운동 완료 취소
 * POST /api/exercise/uncomplete/{exerciseId}
 * 
 * 백엔드 응답: Api<MessageResponse>
 * - errorCode: 200 (성공 시)
 * - value: { message: "운동 미완료" }
 * 
 * @param exerciseId 운동 ID (Long)
 * @returns MessageResponse { message: string }
 */
export async function uncompleteExercise(exerciseId: number): Promise<MessageResponse> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    const response = await requestWithWebViewFallback<MessageResponse>('POST', `/api/exercise/uncomplete/${exerciseId}`);
    
    // 응답이 예상 형식인지 확인
    if (response && typeof response === 'object' && 'message' in response) {
      return response;
    }
    
    // 응답이 문자열인 경우
    if (typeof response === 'string') {
      return { message: response };
    }
    
    return { message: '운동 완료가 취소되었습니다.' };
  } catch (error: any) {
    const message = String(error?.message || '');
    console.error('[Exercise API] 운동 완료 취소 실패:', { exerciseId, error: message });
    throw error;
  }
}

/**
 * 등록된 운동 조회
 * GET /api/exercise/{exerciseId}
 * 
 * 백엔드 응답: Api<ExerciseResponse>
 * - 등록된 운동(REGISTERED 상태)의 상세 정보를 조회합니다.
 * 
 * @param exerciseId 운동 ID (Long)
 * @returns ExerciseResponse 등록된 운동 정보
 */
export async function getExercise(exerciseId: number): Promise<ExerciseResponse> {
  if (!exerciseId) {
    throw new Error('운동 ID가 필요합니다.');
  }
  
  try {
    return await requestWithWebViewFallback<ExerciseResponse>('GET', `/api/exercise/${exerciseId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Exercise API] 운동 조회 실패:', exerciseId, message);
    throw error;
  }
}

/**
 * 오늘의 운동 목록 조회
 * GET /api/exercise/today
 * 
 * 백엔드 응답: Api<List<ExerciseResponse>>
 * - 오늘 등록된 운동(REGISTERED 상태) 목록을 조회합니다.
 * 
 * @returns ExerciseResponse[] 오늘의 운동 목록
 */
export async function getTodayExercises(): Promise<ExerciseResponse[]> {
  try {
    const result = await requestWithWebViewFallback<ExerciseResponse[]>('GET', '/api/exercise/today');
    // 배열이 아니면 빈 배열 반환
    return Array.isArray(result) ? result : [];
  } catch (error: any) {
    const message = String(error?.message || '');
    // 500, 404 등의 에러는 빈 배열 반환
    if (
      message.includes('500') ||
      message.includes('404') ||
      message.includes('Internal Server Error') ||
      message.includes('사용자를 찾을 수 없습니다')
    ) {
      console.log('[Exercise API] 오늘의 운동 조회 API 에러, 빈 배열 반환:', message);
      return [];
    }
    throw error;
  }
}
