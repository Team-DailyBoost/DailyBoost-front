/**
 * Gemini/AI Recommendation API
 * 
 * OpenAPI: /api/recommend/**
 * 
 * 주의: OpenAPI 명세서에 따르면 이 엔드포인트들은 GET 메서드인데 requestBody가 있습니다.
 * 이는 HTTP 표준에 맞지 않으므로, POST로 먼저 시도하고 실패하면 GET with query parameters로 fallback합니다.
 */
import client, { extractApiValue, ApiResponse } from './client';
import {
  FoodRecommendation,
  FoodRequest,
  RecipeRequest,
  ExerciseRequest,
  ExerciseRecommendation,
} from './types';

/**
 * 음식 추천 (Gemini)
 * GET /api/recommend/food
 * 
 * OpenAPI 명세:
 * - operationId: recommendFood
 * - requestBody: FoodRequest (required)
 * - response: ApiFoodRecommendation (value는 FoodRecommendation)
 * 
 * 주의: 백엔드가 GET with @RequestBody를 사용하는 비표준 설계입니다.
 * HTTP 표준상 GET 요청에는 body를 보낼 수 없으므로, POST로 시도합니다.
 */
export async function recommendFood(request: FoodRequest): Promise<FoodRecommendation> {
  try {
    // POST로 먼저 시도 (백엔드가 POST도 허용하는 경우)
    const response = await client.post<ApiResponse<FoodRecommendation>>(
      '/api/recommend/food',
      request
    );
    return extractApiValue(response);
  } catch (error: any) {
    // POST 실패 시 GET with query parameters로 fallback 시도
    if (error.response?.status === 405) {
      const response = await client.get<ApiResponse<FoodRecommendation>>(
        '/api/recommend/food',
        { params: { userInput: request.userInput } }
      );
      return extractApiValue(response);
    }
    throw error;
  }
}

/**
 * 레시피 추천 (Gemini)
 * GET /api/recommend/recipe
 * 
 * OpenAPI 명세:
 * - operationId: recommendRecipe
 * - requestBody: RecipeRequest (required)
 * - response: ApiFoodRecommendation (value는 FoodRecommendation)
 * 
 * 주의: 백엔드가 GET with @RequestBody를 사용하는 비표준 설계입니다.
 * HTTP 표준상 GET 요청에는 body를 보낼 수 없으므로, POST로 시도합니다.
 */
export async function recommendRecipe(request: RecipeRequest): Promise<FoodRecommendation> {
  try {
    // POST로 먼저 시도 (백엔드가 POST도 허용하는 경우)
    const response = await client.post<ApiResponse<FoodRecommendation>>(
      '/api/recommend/recipe',
      request
    );
    return extractApiValue(response);
  } catch (error: any) {
    // POST 실패 시 GET with query parameters로 fallback 시도
    if (error.response?.status === 405) {
      const response = await client.get<ApiResponse<FoodRecommendation>>(
        '/api/recommend/recipe',
        { params: { userInput: request.userInput } }
      );
      return extractApiValue(response);
    }
    throw error;
  }
}

/**
 * 운동 추천 (Gemini)
 * GET /api/recommend/exercise
 * 
 * OpenAPI 명세:
 * - operationId: recommendExercise
 * - requestBody: ExerciseRequest (required)
 * - response: ApiExerciseRecommendation (value는 ExerciseRecommendation)
 * 
 * 주의: 백엔드가 GET with @RequestBody를 사용하는 비표준 설계입니다.
 * HTTP 표준상 GET 요청에는 body를 보낼 수 없으므로, POST로 시도합니다.
 */
export async function recommendExercise(request: ExerciseRequest): Promise<ExerciseRecommendation> {
  const response = await client.post<ApiResponse<ExerciseRecommendation>>(
    '/api/recommend/exercise',
    request
  );
  return extractApiValue(response);
}

