import { api, API_CONFIG } from './api';
import { WebViewManager } from '../utils/webViewManager';

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
    try {
      const res = await api.get<FoodResponse[]>(API_CONFIG.ENDPOINTS.FOOD_TODAY);
      if (res.success) return res;
      // Fallback via WebView proxy
      try {
        const proxy = await WebViewManager.requestApi({ path: API_CONFIG.ENDPOINTS.FOOD_TODAY, method: 'GET', headers: { 'Accept': 'application/json' } });
        if (proxy.status >= 200 && proxy.status < 300) {
          const normalized = FoodService.normalizeValue<FoodResponse[]>(proxy.data);
          return { success: true, data: normalized } as any;
        }
      } catch {}
      return res;
    } catch (error) {
      return { success: false, error: '일일 식단 조회 실패' };
    }
  }
  
  /**
   * Get weekly food logs
   * 백엔드: GET /api/food/weekly
   * Note: Requires authentication
   */
  static async getWeeklyFoodLogs() {
    try {
      const res = await api.get<FoodResponse[]>(API_CONFIG.ENDPOINTS.FOOD_WEEKLY);
      if (res.success) return res;
      try {
        const proxy = await WebViewManager.requestApi({ path: API_CONFIG.ENDPOINTS.FOOD_WEEKLY, method: 'GET', headers: { 'Accept': 'application/json' } });
        if (proxy.status >= 200 && proxy.status < 300) {
          const normalized = FoodService.normalizeValue<FoodResponse[]>(proxy.data);
          return { success: true, data: normalized } as any;
        }
      } catch {}
      return res;
    } catch (error) {
      return { success: false, error: '주간 식단 조회 실패' };
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
  static async getFoodRecommendations() {
    try {
      // 우리가 만든 client.ts 기반 API 사용
      const { getFoodRecommendations } = await import('../api/foods');
      const result = await getFoodRecommendations();
      
      return { 
        success: true, 
        data: result 
      } as any;
    } catch (error: any) {
      console.error('식단 추천 오류:', error);
      
      // 인증 오류인 경우
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { 
          success: false, 
          error: '인증이 필요합니다. OAuth2 소셜 로그인(카카오/네이버)으로 다시 로그인해주세요.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || '식단 추천 실패' 
      };
    }
  }

  /**
   * Get recipe recommendation based on user input
   * 백엔드: GET /api/food/recipe/recommend (⚠️ 비표준: GET with @RequestBody)
   * 
   * 문제: 백엔드가 GET with @RequestBody를 사용하지만, HTTP 표준상 GET 요청에는 body를 보낼 수 없음
   * 해결: POST로만 시도 (React Native는 GET with body를 지원하지 않음)
   * 
   * Note: Requires authentication
   */
  static async getRecipeRecommendation(userInput: string) {
    try {
      // POST로 시도 (백엔드가 POST도 허용하는 경우)
      const postResponse = await api.post<FoodRecommendation>(
        API_CONFIG.ENDPOINTS.FOOD_RECIPE_RECOMMEND,
        { userInput } as RecipeRequest
      );
      
      if (postResponse.success) {
        return postResponse;
      }
      
      // POST 실패 시 쿼리 파라미터로 시도
      try {
        const queryResponse = await api.get<FoodRecommendation>(
          API_CONFIG.ENDPOINTS.FOOD_RECIPE_RECOMMEND,
          { userInput }
        );
        if (queryResponse.success) {
          return queryResponse;
        }
      } catch (queryError) {
        // 쿼리 파라미터도 실패
      }

      // Fallback via WebView proxy
      try {
        const proxyPost = await WebViewManager.requestApi({
          path: API_CONFIG.ENDPOINTS.FOOD_RECIPE_RECOMMEND,
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: { userInput },
        });
        if (proxyPost.status >= 200 && proxyPost.status < 300) {
          const normalized = FoodService.normalizeValue<FoodRecommendation | any>(proxyPost.data);
          return { success: true, data: normalized } as any;
        }
      } catch {}
      try {
        const proxyGet = await WebViewManager.requestApi({
          path: API_CONFIG.ENDPOINTS.FOOD_RECIPE_RECOMMEND,
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          query: { userInput },
        });
        if (proxyGet.status >= 200 && proxyGet.status < 300) {
          const normalized = FoodService.normalizeValue<FoodRecommendation | any>(proxyGet.data);
          return { success: true, data: normalized } as any;
        }
      } catch {}
      
      return { 
        success: false, 
        error: postResponse.error || '레시피 추천 실패. 백엔드 API가 GET 요청에 body를 요구하지만, HTTP 표준상 불가능합니다. 백엔드를 POST로 변경하거나 쿼리 파라미터를 사용하도록 수정이 필요합니다.' 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || '레시피 추천 실패. 백엔드 API가 GET 요청에 body를 요구하지만, HTTP 표준상 불가능합니다.' 
      };
    }
  }

  /**
   * Search food by keyword
   * 백엔드: GET /api/food?keyword=...
   * Note: Requires authentication
   */
  static async searchFood(keyword: string) {
    try {
      const res = await api.get<FoodResponse[]>(API_CONFIG.ENDPOINTS.FOOD_SEARCH, { keyword });
      if (res.success) return res;
      try {
        const proxy = await WebViewManager.requestApi({ path: API_CONFIG.ENDPOINTS.FOOD_SEARCH, method: 'GET', headers: { 'Accept': 'application/json' }, query: { keyword } });
        if (proxy.status >= 200 && proxy.status < 300) {
          const normalized = FoodService.normalizeValue<FoodResponse[]>(proxy.data);
          return { success: true, data: normalized } as any;
        }
      } catch {}
      return res;
    } catch (error) {
      return { success: false, error: '음식 검색 실패' };
    }
  }

  /**
   * Register food to daily log
   * 백엔드: POST /api/food/register/{foodId}
   * Note: Requires authentication
   */
  static async registerFood(foodId: number) {
    try {
      const res = await api.post(`${API_CONFIG.ENDPOINTS.FOOD_REGISTER}/${foodId}`);
      if ((res as any).success) return res as any;
      try {
        const proxy = await WebViewManager.requestApi({ path: `${API_CONFIG.ENDPOINTS.FOOD_REGISTER}/${foodId}`, method: 'POST', headers: { 'Accept': 'application/json' } });
        if (proxy.status >= 200 && proxy.status < 300) {
          return { success: true, data: FoodService.normalizeValue<any>(proxy.data) } as any;
        }
      } catch {}
      return res as any;
    } catch (error) {
      return { success: false, error: '식단 등록 실패' };
    }
  }

  /**
   * Unregister food from daily log
   * 백엔드: POST /api/food/unregister/{foodId}
   * Note: Requires authentication
   */
  static async unregisterFood(foodId: number) {
    try {
      const res = await api.post(`${API_CONFIG.ENDPOINTS.FOOD_UNREGISTER}/${foodId}`);
      if ((res as any).success) return res as any;
      try {
        const proxy = await WebViewManager.requestApi({ path: `${API_CONFIG.ENDPOINTS.FOOD_UNREGISTER}/${foodId}`, method: 'POST', headers: { 'Accept': 'application/json' } });
        if (proxy.status >= 200 && proxy.status < 300) {
          return { success: true, data: FoodService.normalizeValue<any>(proxy.data) } as any;
        }
      } catch {}
      return res as any;
    } catch (error) {
      return { success: false, error: '식단 제거 실패' };
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

