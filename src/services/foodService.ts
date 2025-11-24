import { api, API_CONFIG } from './api';
import { WebViewManager } from '../utils/webViewManager';
import { getFoodRecommendations as fetchFoodRecommendations } from '../api/foods';
import { getRandomFoodRecommendations } from '../constants/fallbacks';
import { ServiceResult } from '../types/service';

/**
 * Food response interface (from backend)
 * Matches Swagger API specification
 */
export interface FoodResponse {
  id: number;
  name: string;
  calory?: number; // Note: backend uses "calory" not "calories"
  carbohydrate?: number; // Note: backend uses "carbohydrate" not "carbs"
  protein?: number;
  fat?: number;
  foodKind?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'RECIPE';
  description?: string;
}

/**
 * Food recommendation interface
 * Matches Swagger API specification
 */
export interface FoodRecommendation {
  name: string;
  calory?: number; // Note: backend uses "calory" not "calories"
  carbohydrate?: number; // Note: backend uses "carbohydrate" not "carbs"
  protein?: number;
  fat?: number;
  foodKind?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'RECIPE';
  description?: string;
}

/**
 * Recipe request interface
 */
export interface RecipeRequest {
  userInput: string;
}

/**
 * Food Service
 * Updated to match backend API specification
 */
export class FoodService {
  private static buildFallbackFoodLogs(): FoodResponse[] {
    const now = Date.now();
    return FALLBACK_FOOD_RECOMMENDATIONS.map((item, index) => ({
      id: -(index + 1),
      name: item.name,
      calory: item.calory,
      carbohydrate: item.carbohydrate,
      protein: item.protein,
      fat: item.fat,
      foodKind: item.foodKind,
      description: item.description,
      // registeredAt 필드는 백엔드에서 사용하지 않음
    }));
  }

  private static handleFoodApiError<T>(
    errorMessage?: string,
  ): { success: true; data: T; meta?: Record<string, any> } | null {
    if (!errorMessage) return null;
    const upper = errorMessage.toUpperCase();

    if (
      upper.includes('FOOD_NOT_FOUND') ||
      upper.includes('USER_NOT_FOUND') ||
      errorMessage.includes('사용자를 찾을 수 없습니다.')
    ) {
      return { success: true, data: [] as T };
    }

    if (upper.includes('INTERNAL SERVER ERROR') || errorMessage.includes('서버 오류')) {
      return {
        success: true,
        data: FoodService.buildFallbackFoodLogs() as unknown as T,
        meta: {
          usedFallback: true,
          reason: errorMessage,
        },
      };
    }

    return null;
  }

  /**
   * 식단 추천 엔드포인트 후보 (백엔드 구현 차이 대응)
   */
  private static readonly FOOD_RECOMMEND_ENDPOINT_CANDIDATES = [
    API_CONFIG.ENDPOINTS.FOOD_RECOMMEND, // '/api/food/recommend'
    '/api/recommend/food',               // 대안 엔드포인트
  ] as const;
  /**
   * Normalize backend/proxy response to value array/object
   */
  private static normalizeValue<T>(raw: any): T {
    if (!raw) return raw as T;
    const value = (raw && typeof raw === 'object' && ('value' in raw)) ? (raw as any).value : raw;
    return value as T;
  }
  /**
   * Get today's food logs
   * 백엔드: GET /api/food/today
   * Note: Requires authentication
   */
  static async getTodayFoodLogs() {
    // 인증 정보 확인 (함수 시작 시점에 한 번만 확인)
    const { getAccessToken, getSessionCookie } = await import('../utils/storage');
    const token = await getAccessToken();
    const cookie = await getSessionCookie();
    
    // 인증 정보가 없으면 API 호출하지 않고 빈 배열 반환
    if (!token && !cookie) {
      console.log('[FoodService] 식단 조회: 인증 정보가 없습니다. 로그인이 필요합니다.');
      return { 
        success: false, 
        error: '로그인이 필요합니다.',
        data: [] 
      };
    }
    
    try {
      // 개선된 API 함수 사용 (에러 처리 포함)
      const { getTodayFoods } = await import('../api/foods');
      const result = await getTodayFoods();
      
      // 배열이 아니면 빈 배열 반환
      const dataArray = Array.isArray(result) ? result : [];
      return { success: true, data: dataArray };
    } catch (error: any) {
      // 네트워크 오류나 기타 예외
      const status = error?.response?.status;
      const errorData = error?.response?.data;
      
      // 401/403 에러는 인증 문제
      if (status === 401 || status === 403) {
        console.log('[FoodService] 식단 조회: 인증이 만료되었습니다. 다시 로그인해주세요.');
        return { 
          success: false, 
          error: '인증이 만료되었습니다. 다시 로그인해주세요.',
          data: [] 
        };
      }
      
      // 500 에러는 백엔드 서버 오류 - 빈 배열 반환 (로컬 캐시 사용)
      if (status === 500) {
        console.log('[FoodService] 식단 조회: 백엔드 500 오류, 빈 배열 반환 (로컬 캐시 사용)');
        return {
          success: true,
          data: [],
          meta: {
            usedFallback: true,
            reason: 'backend_500',
          },
        };
      }

      // 기타 에러도 빈 배열 반환하여 앱이 계속 작동하도록 함
      console.log('[FoodService] 식단 조회: 에러 발생, 빈 배열 반환', error?.message || errorData?.error);
      return { 
        success: true, 
        data: [],
        meta: {
          usedFallback: true,
          reason: error?.message || errorData?.error || 'unknown_error',
        }
      };
    }
  }
  
  /**
   * Get weekly food logs
   * 백엔드: GET /api/food/weekly
   * Note: Requires authentication
   */
  static async getWeeklyFoodLogs() {
    try {
      // 개선된 API 함수 사용 (에러 처리 포함)
      const { getWeeklyFoods } = await import('../api/foods');
      const result = await getWeeklyFoods();
      
      // 배열이 아니면 빈 배열 반환
      const dataArray = Array.isArray(result) ? result : [];
      return { success: true, data: dataArray };
    } catch (error: any) {
      console.log('[FoodService] 주간 식단 조회: 예외 발생, 빈 배열 반환', error?.message);
      return {
        success: true,
        data: [],
        meta: {
          usedFallback: true,
          reason: error?.message || 'exception',
        },
      };
    }
  }
  
  /**
   * Get food recommendations
   * 백엔드: GET /api/food/recommend
   * 
   * 이제 우리가 만든 client.ts 기반 API를 사용합니다.
   * client.ts는 AsyncStorage의 @sessionCookie를 자동으로 헤더에 추가합니다.
   * 
   * Note: Requires authentication, no body needed
   */
  static async getFoodRecommendations(): Promise<ServiceResult<FoodRecommendation[]>> {
    try {
      // 개선된 API 함수 사용 (에러 처리 포함)
      const { getFoodRecommendations } = await import('../api/foods');
      const result = await getFoodRecommendations();
      
      // 배열이 아니면 빈 배열 반환 (fallback 사용)
      if (!Array.isArray(result) || result.length === 0) {
        return {
          success: true,
          data: FALLBACK_FOOD_RECOMMENDATIONS,
          meta: {
            usedFallback: true,
            reason: '식단 추천 결과가 비어있습니다.',
          },
        };
      }
      
      return { 
        success: true, 
        data: result 
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
          error: '인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.' 
        };
      }
      
      const reason = typeof error?.message === 'string' && error.message.trim().length > 0
        ? error.message
        : 'AI 식단 추천 서버가 응답하지 않습니다.';

      console.log('[FoodService] 식단 추천 실패, 랜덤 더미 데이터 사용:', reason);
      return {
        success: true,
        data: getRandomFoodRecommendations(3),
        meta: {
          usedFallback: true,
          reason,
        },
      };
    }
  }

  /**
   * Get recipe recommendation based on user input
   * 백엔드: GET /api/food/recipe/recommend (⚠️ @RequestBody 있음 - 비표준)
   * 
   * Note: Requires authentication
   * 백엔드가 GET 메서드에 @RequestBody를 사용하므로 WebView를 통해 처리합니다.
   */
  static async getRecipeRecommendation(userInput: string): Promise<ServiceResult<FoodRecommendation>> {
    try {
      // 백엔드가 GET 메서드에 @RequestBody를 사용하므로 requestWithWebViewFallback 사용
      const { recommendRecipe } = await import('../api/foods');
      const result = await recommendRecipe({ userInput });
      
      if (result && typeof result === 'object' && 'name' in result && result.name) {
        return {
          success: true,
          data: result,
        };
      }
      
      // name이 null이거나 없으면 fallback 사용
      const fallbackRecipe = {
        name: '훈제 닭가슴살 샐러드',
        calory: 420,
        carbohydrate: 30,
        protein: 38,
        fat: 12,
        foodKind: 'RECIPE',
        description:
          '훈제 닭가슴살과 다양한 채소(로메인, 방울토마토, 오이, 아보카도)를 곁들여 소금, 후추, 올리브오일, 레몬즙으로 간을 합니다. 곁들여 먹을 요거트 드레싱은 플레인 요거트와 꿀, 머스터드 약간을 섞어 완성합니다.',
      };
      
      return {
        success: true,
        data: fallbackRecipe,
        meta: {
          usedFallback: true,
          reason: '레시피 추천 응답 형식이 올바르지 않습니다.',
        },
      };
    } catch (error: any) {
      const message = String(error?.message || '');
      const errorMessage = message || '레시피 추천 중 오류가 발생했습니다.';
      
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
      const fallbackRecipe = {
        name: '훈제 닭가슴살 샐러드',
        calory: 420,
        carbohydrate: 30,
        protein: 38,
        fat: 12,
        foodKind: 'RECIPE',
        description:
          '훈제 닭가슴살과 다양한 채소(로메인, 방울토마토, 오이, 아보카도)를 곁들여 소금, 후추, 올리브오일, 레몬즙으로 간을 합니다. 곁들여 먹을 요거트 드레싱은 플레인 요거트와 꿀, 머스터드 약간을 섞어 완성합니다.',
      };
      
      console.log('[FoodService] 레시피 추천 실패, 랜덤 더미 데이터 사용:', errorMessage);
      // 랜덤으로 선택된 레시피 하나 반환
      const randomRecipes = getRandomFoodRecommendations(1, 'DINNER');
      const randomRecipe = randomRecipes.length > 0 ? randomRecipes[0] : null;
      
      if (randomRecipe) {
        return {
          success: true,
          data: {
            name: randomRecipe.name,
            calory: String(randomRecipe.calory),
            carbohydrate: String(randomRecipe.carbohydrate),
            protein: String(randomRecipe.protein),
            fat: String(randomRecipe.fat),
            foodKind: 'RECIPE' as const,
            description: randomRecipe.description,
            weight: '300g',
          },
          meta: {
            usedFallback: true,
            reason: errorMessage,
          },
        };
      }
      
      // 랜덤 레시피가 없으면 기본 레시피 사용
      return {
        success: true,
        data: fallbackRecipe,
        meta: {
          usedFallback: true,
          reason: errorMessage,
        },
      };
    }
  }

  /**
   * Search food by keyword
   * 백엔드: GET /api/food?keyword=...
   * Note: Requires authentication
   */
  static async searchFood(keyword: string) {
    // keyword가 없거나 빈 문자열이면 빈 배열 반환
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return { success: true, data: [] };
    }

    try {
      // api.get의 params 형식으로 올바르게 전달
      const res = await api.get<FoodResponse[]>(API_CONFIG.ENDPOINTS.FOOD_SEARCH, { 
        params: { keyword: keyword.trim() } 
      });
      if (res.success && res.data) {
        const dataArray = Array.isArray(res.data) ? res.data : [];
        return { success: true, data: dataArray };
      }

      // 400 Bad Request나 기타 에러는 빈 배열 반환 (검색 결과 없음으로 처리)
      console.log('[FoodService] 음식 검색: 에러 발생, 빈 배열 반환', res.error);
      return {
        success: true,
        data: [],
        meta: {
          usedFallback: true,
          reason: res.error || 'search_failed',
        },
      };
    } catch (error: any) {
      console.warn('음식 검색: 예외 발생, 빈 배열 반환', error?.message);
      return {
        success: true,
        data: [],
        meta: {
          usedFallback: true,
          reason: error?.message || 'exception',
        },
      };
    }
  }

  /**
   * Register food to daily log
   * 백엔드: POST /api/food/register/{foodId}
   * Note: Requires authentication
   */
  static async registerFood(foodId: number) {
    try {
      // front/src/api/foods.ts의 registerFood 함수를 직접 사용
      const { registerFood } = await import('../api/foods');
      const result = await registerFood(foodId);
      return { success: true, data: result };
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.message || '식단 등록 실패' 
      };
    }
  }

  /**
   * Unregister food from daily log
   * 백엔드: POST /api/food/unregister/{foodId}
   * Note: Requires authentication
   */
  static async unregisterFood(foodId: number) {
    try {
      // front/src/api/foods.ts의 unregisterFood 함수를 직접 사용
      const { unregisterFood } = await import('../api/foods');
      const result = await unregisterFood(foodId);
      return { success: true, data: result };
    } catch (error: any) {
      return { 
        success: false, 
        error: error?.message || '식단 제거 실패' 
      };
    }
  }

  /**
   * Reset daily food log
   * 백엔드: POST /api/food/reset
   * Note: Requires authentication
   */
  static async resetFood() {
    try {
      const res = await api.post(API_CONFIG.ENDPOINTS.FOOD_RESET);
      if ((res as any).success) return res as any;
      try {
        const proxy = await WebViewManager.requestApi({ path: API_CONFIG.ENDPOINTS.FOOD_RESET, method: 'POST', headers: { 'Accept': 'application/json' } });
        if (proxy.status >= 200 && proxy.status < 300) {
          return { success: true, data: FoodService.normalizeValue<any>(proxy.data) } as any;
        }
      } catch {}
      return res as any;
    } catch (error) {
      return { success: false, error: '식단 초기화 실패' };
    }
  }
  
  /**
   * Calculate daily nutrition totals
   * Note: Converts backend field names (calory, carbohydrate) to frontend names (calories, carbs)
   */
  static calculateDailyTotals(entries: FoodResponse[]) {
    return entries.reduce(
      (totals, entry) => ({
        calories: totals.calories + (entry.calory || 0),
        protein: totals.protein + (entry.protein || 0),
        carbs: totals.carbs + (entry.carbohydrate || 0),
        fat: totals.fat + (entry.fat || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }
}

