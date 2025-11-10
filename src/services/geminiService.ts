import { API_CONFIG } from './api';
import { requestWithWebViewFallback } from '../api/http';
import type { FoodRecommendation, RecipeRequest } from '../api/types';

/**
 * Food request for Gemini API
 */
export interface FoodRequest {
  userInput: string;
}

/**
 * Gemini/AI Service
 * Handles AI recommendation endpoints
 */
export class GeminiService {
  /**
   * Get food recommendation from Gemini
   * 백엔드: GET /api/recommend/food (⚠️ 비표준: GET with @RequestBody)
   * 
   * 문제: 백엔드가 GET with @RequestBody를 사용하지만, HTTP 표준상 GET 요청에는 body를 보낼 수 없음
   * 해결: POST로만 시도 (React Native는 GET with body를 지원하지 않음)
   * 
   * Note: Requires authentication
   */
  static async recommendFood(request: FoodRequest) {
    // 백엔드 실제 매핑은 POST /api/recommend/food
    const value = await requestWithWebViewFallback<FoodRecommendation>('POST', API_CONFIG.ENDPOINTS.GEMINI_RECOMMEND_FOOD, {
      body: request,
    });
    return { success: true, data: value } as const;
  }

  /**
   * Get recipe recommendation from Gemini
   * 백엔드: GET /api/recommend/recipe (⚠️ 비표준: GET with @RequestBody)
   * 
   * 문제: 백엔드가 GET with @RequestBody를 사용하지만, HTTP 표준상 GET 요청에는 body를 보낼 수 없음
   * 해결: POST로만 시도 (React Native는 GET with body를 지원하지 않음)
   * 
   * Note: Requires authentication
   */
  static async recommendRecipe(userInput: string) {
    const payload: RecipeRequest = { userInput };
    const value = await requestWithWebViewFallback<FoodRecommendation>('POST', API_CONFIG.ENDPOINTS.GEMINI_RECOMMEND_RECIPE, {
      body: payload,
    });
    return { success: true, data: value } as const;
  }
}

