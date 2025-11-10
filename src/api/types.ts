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
 * Food Recommendation
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
 * Recipe Request
 */
export interface RecipeRequest {
  userInput: string;
}

/**
 * Post Kind
 */
export type PostKind = 'EXERCISE' | 'FOOD' | 'DIET';

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
 * Exercise Recommendation
 */
export interface ExerciseRecommendation {
  exerciseInfoDto: ExerciseInfoDto[];
}

/**
 * Exercise Request
 */
export interface ExerciseRequest {
  userInput: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
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

