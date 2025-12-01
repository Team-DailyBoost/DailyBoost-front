/**
 * Food API
 * 
 * Swagger 명세: /api/food/**
 * baseURL: https://dailyboost.duckdns.org
 * 
 * 이 파일은 Swagger 엔드포인트를 호출하는 예시입니다.
 * 
 * Swagger 명세를 기반으로 한 식단 관련 API 함수들입니다.
 * 이 패턴으로 나머지 /api/user/update, /api/user/initInfo, /api/post/create 같은 것도 만들 수 있습니다.
 * 
 * 구현된 엔드포인트:
 * - GET /api/food/today: 일일 식단 조회
 * - GET /api/food/weekly: 주간 식단 조회
 * - POST /api/food/recommend: 하루 음식 추천
 * - GET /api/food?keyword=...: 음식 키워드 검색
 * - POST /api/food/recipe/recommend: 레시피 추천
 * - POST /api/food/register/{foodId}: 식단 기록에 추가
 * - POST /api/food/unregister/{foodId}: 식단 기록에서 제거
 * - POST /api/food/reset: 일일 식단 초기화
 * 
 * 주의: 이 파일의 함수들은 requestWithWebViewFallback을 사용하여
 * RN에서 직접 호출 시 HTML 로그인 페이지가 오면 WebView를 통해 다시 시도합니다.
 */
import { requestWithWebViewFallback } from './http';
import { RecipeRequest } from './types';

/**
 * Food Response 타입
 * 백엔드: FoodResponse (BigDecimal, Long 타입)
 * - calory, carbohydrate, protein, fat: BigDecimal -> number
 * - weight: Long -> number (그램 수)
 */
export interface FoodResponse {
  id: number;
  name: string;
  calory?: number;
  carbohydrate?: number;
  protein?: number;
  fat?: number;
  foodKind?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'RECIPE';
  description?: string;
  weight?: number; // Long -> number (그램 수)
}

/**
 * Food Recommendation 타입
 * 백엔드: FoodRecommendation (BigDecimal, Long 타입)
 * - calory, carbohydrate, protein, fat: BigDecimal -> number or string
 * - weight: Long -> number or string (그램 수)
 */
export interface FoodRecommendation {
  name: string;
  calory?: number | string; // BigDecimal -> number or string
  carbohydrate?: number | string; // BigDecimal -> number or string
  protein?: number | string; // BigDecimal -> number or string
  fat?: number | string; // BigDecimal -> number or string
  foodKind?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'RECIPE';
  description?: string;
  weight?: number | string; // Long -> number or string (그램 수)
}

/**
 * Message Response 타입
 * Swagger 명세의 components.schemas.MessageResponse를 그대로 옮긴 것입니다.
 */
export interface MessageResponse {
  message: string;
}

/**
 * 일일 식단 조회
 * GET /api/food/today
 * 
 * Swagger 명세:
 * - operationId: getByToday
 * - response: ApiListFoodResponse (value는 FoodResponse[])
 * 
 * 이 함수는 requestWithWebViewFallback을 사용하여
 * RN에서 직접 호출 시 HTML 로그인 페이지가 오면 WebView를 통해 다시 시도합니다.
 * 
 * 백엔드 주의사항:
 * - 데이터가 없으면 IllegalArgumentException("FOOD_NOT_FOUND")를 던져서 500 에러 발생
 * - 이 경우 빈 배열로 처리하여 앱이 정상 작동하도록 함
 */
export async function getTodayFoods(): Promise<FoodResponse[]> {
  try {
    const result = await requestWithWebViewFallback<FoodResponse[]>('GET', '/api/food/today');
    // 배열이 아니면 빈 배열 반환
    if (Array.isArray(result)) {
      if (result.length > 0) {
        console.log('[Food API] 일일 식단 조회 성공:', result.length, '개');
      }
      return result;
    }
    console.warn('[Food API] 일일 식단 조회: 배열이 아닌 응답:', typeof result);
    return [];
  } catch (error: any) {
    const message = String(error?.message || '');
    const errorStr = String(error || '');
    
    // 백엔드에서 데이터가 없을 때 IllegalArgumentException("FOOD_NOT_FOUND")를 던져서 500 에러 발생
    // 500, 404, FOOD_NOT_FOUND, IllegalArgumentException 등의 에러는 빈 배열 반환
    if (
      message.includes('500') ||
      message.includes('404') ||
      message.includes('FOOD_NOT_FOUND') ||
      message.includes('IllegalArgumentException') ||
      message.includes('Internal Server Error') ||
      message.includes('사용자를 찾을 수 없습니다') ||
      errorStr.includes('FOOD_NOT_FOUND') ||
      errorStr.includes('IllegalArgumentException')
    ) {
      // 데이터가 없는 것은 정상적인 상황이므로 로그 레벨을 낮춤
      if (message.includes('FOOD_NOT_FOUND') || errorStr.includes('FOOD_NOT_FOUND')) {
        console.log('[Food API] 일일 식단 조회: 데이터 없음 (정상), 빈 배열 반환');
      } else {
        console.log('[Food API] 일일 식단 조회 API 에러, 빈 배열 반환:', message.substring(0, 100));
      }
      return [];
    }
    
    // 기타 에러는 상세 로깅 후 throw
    console.error('[Food API] 일일 식단 조회 실패 (알 수 없는 에러):', {
      message,
      error: errorStr.substring(0, 200),
      type: error?.constructor?.name,
    });
    throw error;
  }
}

/**
 * 주간 식단 조회
 * GET /api/food/weekly
 * 
 * Swagger 명세:
 * - operationId: getByWeekly
 * - response: ApiListFoodResponse (value는 FoodResponse[])
 * 
 * 백엔드 주의사항:
 * - 데이터가 없으면 IllegalArgumentException("FOOD_NOT_FOUND")를 던져서 500 에러 발생
 * - 이 경우 빈 배열로 처리하여 앱이 정상 작동하도록 함
 * - 백엔드의 getByStatusAndWeekly에서 start가 아닌 today를 사용하여 월요일 이전 데이터 미조회 가능
 */
export async function getWeeklyFoods(): Promise<FoodResponse[]> {
  try {
    const result = await requestWithWebViewFallback<FoodResponse[]>('GET', '/api/food/weekly');
    // 배열이 아니면 빈 배열 반환
    if (Array.isArray(result)) {
      if (result.length > 0) {
        console.log('[Food API] 주간 식단 조회 성공:', result.length, '개');
      }
      return result;
    }
    console.warn('[Food API] 주간 식단 조회: 배열이 아닌 응답:', typeof result);
    return [];
  } catch (error: any) {
    const message = String(error?.message || '');
    const errorStr = String(error || '');
    
    // 백엔드에서 데이터가 없을 때 IllegalArgumentException("FOOD_NOT_FOUND")를 던져서 500 에러 발생
    // 500, 404, FOOD_NOT_FOUND, IllegalArgumentException 등의 에러는 빈 배열 반환
    if (
      message.includes('500') ||
      message.includes('404') ||
      message.includes('FOOD_NOT_FOUND') ||
      message.includes('IllegalArgumentException') ||
      message.includes('Internal Server Error') ||
      message.includes('사용자를 찾을 수 없습니다') ||
      errorStr.includes('FOOD_NOT_FOUND') ||
      errorStr.includes('IllegalArgumentException')
    ) {
      // 데이터가 없는 것은 정상적인 상황이므로 로그 레벨을 낮춤
      if (message.includes('FOOD_NOT_FOUND') || errorStr.includes('FOOD_NOT_FOUND')) {
        console.log('[Food API] 주간 식단 조회: 데이터 없음 (정상), 빈 배열 반환');
      } else {
        console.log('[Food API] 주간 식단 조회 API 에러, 빈 배열 반환:', message.substring(0, 100));
      }
      return [];
    }
    
    // 기타 에러는 상세 로깅 후 throw
    console.error('[Food API] 주간 식단 조회 실패 (알 수 없는 에러):', {
      message,
      error: errorStr.substring(0, 200),
      type: error?.constructor?.name,
    });
    throw error;
  }
}

/**
 * 하루 음식 추천
 * POST /api/food/recommend
 * 
 * Swagger 명세:
 * - operationId: recommendFood_1
 * - response: ApiListFoodRecommendation (value는 FoodRecommendation[])
 */
export async function getFoodRecommendations(): Promise<FoodRecommendation[]> {
  try {
    const result = await requestWithWebViewFallback<FoodRecommendation[]>('POST', '/api/food/recommend');
    // 배열이 아니면 빈 배열 반환
    return Array.isArray(result) ? result : [];
  } catch (error: any) {
    const message = String(error?.message || '');
    // 500, 404, USER_NOT_FOUND 등의 에러는 빈 배열 반환
    if (
      message.includes('500') ||
      message.includes('404') ||
      message.includes('USER_NOT_FOUND') ||
      message.includes('Internal Server Error') ||
      message.includes('사용자를 찾을 수 없습니다')
    ) {
      console.log('[Food API] 식단 추천 API 에러, 빈 배열 반환:', message);
      return [];
    }
    throw error;
  }
}

/**
 * 식단 기록에 추가
 * POST /api/food/register/{foodId}
 * 
 * Swagger 명세:
 * - operationId: register
 * - parameters: foodId (path, int64)
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function registerFood(foodId: number): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', `/api/food/register/${foodId}`);
}

/**
 * 식단 기록에서 제거
 * POST /api/food/unregister/{foodId}
 * 
 * Swagger 명세:
 * - operationId: unregister_2
 * - parameters: foodId (path, int64)
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function unregisterFood(foodId: number): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', `/api/food/unregister/${foodId}`);
}

/**
 * 일일 식단 초기화
 * POST /api/food/reset
 * 
 * Swagger 명세:
 * - operationId: reset
 * - response: ApiMessageResponse (value는 MessageResponse)
 */
export async function resetFood(): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', '/api/food/reset');
}

/**
 * 음식 키워드 검색
 * GET /api/food?keyword=...
 * 
 * Swagger 명세:
 * - operationId: getByKeyword
 * - parameters: keyword (query, string, required)
 * - response: ApiListFoodResponse (value는 FoodResponse[])
 */
export async function searchFoodByKeyword(keyword: string): Promise<FoodResponse[]> {
  // keyword가 없거나 빈 문자열이면 빈 배열 반환
  if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
    console.warn('[Food API] 음식 검색: keyword가 없거나 빈 문자열, 빈 배열 반환');
    return [];
  }

  try {
    const result = await requestWithWebViewFallback<FoodResponse[]>('GET', '/api/food', {
      query: { keyword: keyword.trim() },
    });
    // 배열이 아니면 빈 배열 반환
    return Array.isArray(result) ? result : [];
  } catch (error: any) {
    const message = String(error?.message || '');
    // 400, 500, 404, FOOD_NOT_FOUND 등의 에러는 빈 배열 반환
    if (
      message.includes('400') ||
      message.includes('500') ||
      message.includes('404') ||
      message.includes('Bad Request') ||
      message.includes('Internal Server Error') ||
      message.includes('FOOD_NOT_FOUND') ||
      message.includes('사용자를 찾을 수 없습니다')
    ) {
      console.log('[Food API] 음식 검색 API 에러, 빈 배열 반환:', keyword, message);
      return [];
    }
    throw error;
  }
}

/**
 * 레시피 추천
 * POST /api/food/recipe/recommend
 * 
 * 백엔드 응답: Api<FoodRecommendation>
 * - value: FoodRecommendation { name, calory(BigDecimal), carbohydrate(BigDecimal), protein(BigDecimal), fat(BigDecimal), foodKind, description, weight(Long) }
 */
export async function recommendRecipe(request: RecipeRequest): Promise<FoodRecommendation | null> {
  console.log('[Food API] 레시피 추천 요청:', request.userInput?.substring(0, 50));
  
  try {
    // POST 요청으로 body 전송
    const response = await requestWithWebViewFallback<FoodRecommendation>('POST', '/api/food/recipe/recommend', {
      body: request,
    });
    
    // 응답 정규화 (BigDecimal -> number, Long -> number)
    if (response && typeof response === 'object') {
      const normalized: FoodRecommendation = {
        name: response.name || '',
        calory: typeof response.calory === 'string' ? parseFloat(response.calory) || 0 : (response.calory || 0),
        carbohydrate: typeof response.carbohydrate === 'string' ? parseFloat(response.carbohydrate) || 0 : (response.carbohydrate || 0),
        protein: typeof response.protein === 'string' ? parseFloat(response.protein) || 0 : (response.protein || 0),
        fat: typeof response.fat === 'string' ? parseFloat(response.fat) || 0 : (response.fat || 0),
        foodKind: response.foodKind || 'RECIPE',
        description: response.description || '',
        weight: typeof response.weight === 'string' ? parseFloat(response.weight) || 300 : (response.weight || 300),
      };
      return normalized;
    }
    
    return response;
  } catch (error: any) {
    const message = String(error?.message || '');
    console.log('[Food API] 레시피 추천 API 실패, fallback 데이터 사용:', message);
    
    // 모든 에러에 대해 랜덤 더미 레시피 반환
    const { getRandomFoodRecommendations } = await import('../constants/fallbacks');
    const randomRecipes = getRandomFoodRecommendations(1, 'DINNER');
    return randomRecipes.length > 0 ? {
      name: randomRecipes[0].name,
      calory: typeof randomRecipes[0].calory === 'number' ? randomRecipes[0].calory : parseFloat(String(randomRecipes[0].calory)) || 0,
      carbohydrate: typeof randomRecipes[0].carbohydrate === 'number' ? randomRecipes[0].carbohydrate : parseFloat(String(randomRecipes[0].carbohydrate)) || 0,
      protein: typeof randomRecipes[0].protein === 'number' ? randomRecipes[0].protein : parseFloat(String(randomRecipes[0].protein)) || 0,
      fat: typeof randomRecipes[0].fat === 'number' ? randomRecipes[0].fat : parseFloat(String(randomRecipes[0].fat)) || 0,
      foodKind: 'RECIPE' as const,
      description: randomRecipes[0].description || '',
      weight: 300,
    } : null;
  }
}