/**
 * API Types
 * 
 * OpenAPI 3.1 명세를 기반으로 한 TypeScript 타입 정의
 */

/**
 * Health Info
 */
export interface HealthInfo {
  weight?: number;
  height?: number;
  goal?: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH_IMPROVEMENT' | 'ENDURANCE_IMPROVEMENT' | 'GENERAL_HEALTH_MAINTENANCE' | 'BODY_SHAPE_MANAGEMENT';
}

/**
 * User Response
 */
export interface UserResponse {
  id: number;
  email: string;
  name: string;
  nickname?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

/**
 * User Request (for initInfo)
 */
export interface UserRequest {
  healthInfo: HealthInfo;
}

/**
 * User Update Request
 */
export interface UserUpdateRequest {
  age?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  healthInfo?: HealthInfo;
}

/**
 * Verify Code Request
 */
export interface VerifyCodeRequest {
  email: string;
  inputCode: string;
}

/**
 * Food Response
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
 * Food Recommendation
 * 백엔드: FoodRecommendation (BigDecimal, Long 타입)
 * - calory, carbohydrate, protein, fat: BigDecimal -> number
 * - weight: Long -> number (그램 수)
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
 * Recipe Request
 */
export interface RecipeRequest {
  userInput: string;
}

/**
 * Post Kind
 * 백엔드: PostKind enum { EXERCISE, FOOD, DIET, COMPETITION }
 */
export type PostKind = 'EXERCISE' | 'FOOD' | 'DIET' | 'COMPETITION';

/**
 * Post Create Request
 */
export interface PostCreateRequest {
  title: string;
  content: string;
  postKind: PostKind;
}

/**
 * Post Update Request
 */
export interface PostUpdateRequest {
  id: number;
  title: string;
  content: string;
  postKind?: PostKind;
}

/**
 * Posts Response (list item)
 */
export interface PostsResponse {
  id: number;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  likeCount: number;
  unLikeCount: number;
  commentCount: number;
}

/**
 * Comment Info (nested in PostResponse)
 */
export interface CommentInfo {
  commentId: number;
  content: string;
  createAt: string;
  likeCount: number;
  unLikeCount: number;
  authorName: string;
}

/**
 * Post Response (detail)
 */
export interface PostResponse {
  title: string;
  content: string;
  authorName: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  likeCount: number;
  unLikeCount: number;
  commentInfos: CommentInfo[];
}

/**
 * Search Post Response
 */
export interface SearchPostResponse {
  id: number;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  likeCount: number;
  unLikeCount: number;
  commentCount: number;
}

/**
 * Comment Request
 */
export interface CommentRequest {
  postId: number;
  content: string;
}

/**
 * Comment Update Request
 */
export interface CommentUpdateRequest {
  postId: number;
  commentId: number;
  content: string;
}

/**
 * Comment Delete Request
 */
export interface CommentUnregisterRequest {
  postId: number;
  commentId: number;
}

/**
 * Comment Response
 */
export interface CommentResponse {
  comment: string;
  createAt: string;
  likeCount: number;
  unLikeCount: number;
}

/**
 * Calendar Request
 */
export interface CalendarRequest {
  name: string;
  color?: string;
}

/**
 * Calendar Update Request
 */
export interface CalendarUpdateRequest {
  calendarId: number;
  name?: string;
  color?: string;
}

/**
 * Calendar Response
 */
export interface CalendarResponse {
  id: number;
  name: string;
  color?: string;
}

/**
 * Calendars Response
 */
export interface CalendarsResponse {
  calendarResponses: CalendarResponse[];
}

/**
 * Calendar Invite Request
 */
export interface AddUsersEmailRequest {
  emails: string[];
}

/**
 * Event Create Request
 */
export interface EventsRequest {
  calendarId: number;
  title: string;
  description: string;
  startTime: string; // ISO 8601 date-time format
  endTime: string; // ISO 8601 date-time format
}

/**
 * Event Update Request
 */
export interface EventUpdateRequest {
  id: number;
  calendarId: number;
  title?: string;
  description?: string;
  startTime?: string; // ISO 8601 date-time format
  endTime?: string; // ISO 8601 date-time format
}

/**
 * Event Delete Request
 */
export interface EventDeleteRequest {
  id: number;
  calendarId: number;
}

/**
 * Event Info
 */
export interface EventInfo {
  id: number;
  calendarId: number;
  title: string;
  description: string;
  startTime: string; // ISO 8601 date-time format
  endTime: string; // ISO 8601 date-time format
}

/**
 * Event Response
 */
export interface EventResponse {
  id: number;
  calendarId: number;
  title: string;
  description: string;
  startTime: string; // ISO 8601 date-time format
  endTime: string; // ISO 8601 date-time format
}

/**
 * Events Response
 */
export interface EventsResponse {
  eventInfos: EventInfo[];
}

/**
 * Exercise Info DTO
 */
export interface ExerciseInfoDto {
  name: string;
  description: string;
  youtubeLinks: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

/**
 * Exercise Recommendation Item
 * 백엔드: ExerciseRecommendation (단일 항목)
 * 응답: Api<List<ExerciseRecommendation>>
 * 
 * 업데이트: sets, reps, weight 필드 추가
 */
export interface ExerciseRecommendationItem {
  name: string;
  description: string;
  youtubeLink: string; // 백엔드: youtubeLink (단수)
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
  sets?: number; // 세트 수 (Integer)
  reps?: number; // 횟수 (Integer)
  weight?: number; // 무게 (Double)
}

/**
 * Exercise Recommendation (List)
 * 백엔드 응답: List<ExerciseRecommendation>
 */
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
 * Food Request
 */
export interface FoodRequest {
  userInput: string;
}

/**
 * Message Response
 */
export interface MessageResponse {
  message: string;
}

