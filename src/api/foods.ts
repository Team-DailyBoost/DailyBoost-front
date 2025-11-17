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
 * - GET /api/food/recommend: 하루 음식 추천
 * - GET /api/food?keyword=...: 음식 키워드 검색
 * - GET /api/food/recipe/recommend: 레시피 추천
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
 * Swagger 명세의 components.schemas.FoodResponse를 그대로 옮긴 것입니다.
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
}

/**
 * Food Recommendation 타입
 * Swagger 명세의 components.schemas.FoodRecommendation을 그대로 옮긴 것입니다.
 */
export interface FoodRecommendation {
  name: string;
  calory?: number;
  carbohydrate?: number;
  protein?: number;
  fat?: number;
  foodKind?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'RECIPE';
  description?: string;
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
 */
export async function getTodayFoods(): Promise<FoodResponse[]> {
  return requestWithWebViewFallback<FoodResponse[]>('GET', '/api/food/today');
}

/**
 * 주간 식단 조회
 * GET /api/food/weekly
 * 
 * Swagger 명세:
 * - operationId: getByWeekly
 * - response: ApiListFoodResponse (value는 FoodResponse[])
 */
export async function getWeeklyFoods(): Promise<FoodResponse[]> {
  return requestWithWebViewFallback<FoodResponse[]>('GET', '/api/food/weekly');
}

/**
 * 하루 음식 추천
 * GET /api/food/recommend
 * 
 * Swagger 명세:
 * - operationId: recommendFood_1
 * - response: ApiListFoodRecommendation (value는 FoodRecommendation[])
 */
export async function getFoodRecommendations(): Promise<FoodRecommendation[]> {
  return requestWithWebViewFallback<FoodRecommendation[]>('GET', '/api/food/recommend');
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
  return requestWithWebViewFallback<FoodResponse[]>('GET', '/api/food', {
    query: { keyword },
  });
}

/**
 * 레시피 추천
 * POST /api/food/recipe/recommend
 * 
 * Swagger 명세:
 * - operationId: recommendRecipe_1
 * - requestBody: RecipeRequest (required)
 * - response: ApiFoodRecommendation (value는 FoodRecommendation)
 * 
 * 백엔드가 @GetMapping에 @RequestBody를 사용하지만, HTTP 표준상 POST로 요청합니다.
 */
export async function recommendRecipe(request: RecipeRequest): Promise<FoodRecommendation> {
  return requestWithWebViewFallback<FoodRecommendation>('POST', '/api/food/recipe/recommend', {
    body: request,
  });
}