/**
 * API Configuration
 * Updated to match backend API specification
 */
export const API_CONFIG = {
  BASE_URL: 'https://dailyboost.duckdns.org',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    REFRESH_TOKEN: '/api/auth/refresh',
    
    // User endpoints
    USER_INIT_INFO: '/api/user/initInfo',  // POST /api/user/initInfo
    USER_PROFILE: '/api/user',  // GET /api/user/{userId}
    UPDATE_PROFILE: '/api/user/update',  // POST /api/user/update
    DELETE_USER: '/api/user/unregister',  // POST /api/user/unregister
    USER_RECOVER: '/api/user/recover',  // POST /api/user/recover
    
    // Food endpoints
    FOOD_TODAY: '/api/food/today',  // GET /api/food/today
    FOOD_WEEKLY: '/api/food/weekly',  // GET /api/food/weekly
    FOOD_RECOMMEND: '/api/food/recommend',  // GET /api/food/recommend (인증 필요, body 없음)
    FOOD_RECIPE_RECOMMEND: '/api/food/recipe/recommend',  // GET /api/food/recipe/recommend (인증 필요, @RequestBody 있음)
    FOOD_SEARCH: '/api/food',  // GET /api/food?keyword=...
    FOOD_REGISTER: '/api/food/register',  // POST /api/food/register/{foodId}
    FOOD_UNREGISTER: '/api/food/unregister',  // POST /api/food/unregister/{foodId}
    FOOD_RESET: '/api/food/reset',  // POST /api/food/reset
    
    // Exercise endpoints
    EXERCISE_REGISTER: '/api/exercise/register',  // POST /api/exercise/register
    EXERCISE_RECOMMEND: '/api/recommend/exercise',  // GET /api/recommend/exercise (⚠️ @RequestBody 있음 - 비표준)
    
    // AI/Gemini endpoints
    GEMINI_RECOMMEND_FOOD: '/api/recommend/food',  // GET /api/recommend/food (⚠️ @RequestBody 있음 - 비표준)
    GEMINI_RECOMMEND_RECIPE: '/api/recommend/recipe',  // GET /api/recommend/recipe (⚠️ @RequestBody 있음 - 비표준)
    
    // Post endpoints
    GET_POSTS: '/api/post/posts',  // GET /api/post/posts?postKind=EXERCISE (postKind 필수)
    CREATE_POST: '/api/post/create',  // POST /api/post/create
    DELETE_POST: '/api/post',  // POST /api/post/{postId}
    UPDATE_POST: '/api/post/update',  // POST /api/post/update
    GET_POST_DETAIL: '/api/post',  // GET /api/post/{postId}
    SEARCH_POSTS: '/api/post',  // GET /api/post?title=...
    LIKE_POST: '/api/post/like',  // POST /api/post/like/{postId}
    UNLIKE_POST: '/api/post/unLike',  // POST /api/post/unLike/{postId}
    
    // Comment endpoints
    CREATE_COMMENT: '/api/comment/create',  // POST /api/comment/create
    DELETE_COMMENT: '/api/comment/unregister',  // POST /api/comment/unregister (body 필요)
    UPDATE_COMMENT: '/api/comment/update',  // POST /api/comment/update
    GET_COMMENTS: '/api/comment',  // GET /api/comment/{postId}
    LIKE_COMMENT: '/api/comment/like',  // POST /api/comment/like/{commentId}
    UNLIKE_COMMENT: '/api/comment/unLike',  // POST /api/comment/unLike/{commentId}
    
    // Calendar endpoints
    CALENDAR_CREATE: '/api/calendar/create',  // POST /api/calendar/create
    CALENDAR_DELETE: '/api/calendar/delete',  // POST /api/calendar/delete/{calendarId}
    CALENDAR_UPDATE: '/api/calendar/update',  // POST /api/calendar/update
    GET_CALENDAR: '/api/calendar',  // GET /api/calendar/{calendarId}
    GET_CALENDARS: '/api/calendar',  // GET /api/calendar
    CALENDAR_INVITE: '/api/calendar/invite',  // POST /api/calendar/invite/{calendarId}
    
    // Event endpoints
    EVENT_CREATE: '/api/event/create',  // POST /api/event/create
    EVENT_UPDATE: '/api/event/update',  // POST /api/event/update
    EVENT_DELETE: '/api/event/delete',  // POST /api/event/delete
    GET_EVENTS: '/api/event',  // GET /api/event/{calendarId}?rangeStart=...&rangeEnd=...
    GET_EVENT: '/api/event',  // GET /api/event?eventId=...&calendarId=...
    
    // Image endpoints
    IMAGE_UPLOAD: '/api/image/upload',  // POST /api/image/upload
    
    // Dashboard endpoints (may not exist in backend)
    DASHBOARD_STATS: '/api/dashboard/stats',
    WEEKLY_STATS: '/api/dashboard/weekly',
    
    // Challenge endpoints (may not exist in backend)
    GET_CHALLENGES: '/api/challenge/list',
    JOIN_CHALLENGE: '/api/challenge/join',
    GET_CHALLENGE_PROGRESS: '/api/challenge/progress',
    
    // InBody endpoints (may not exist in backend)
    SYNC_INBODY: '/api/inbody/sync',
    GET_INBODY_DATA: '/api/inbody/data',
  }
} as const;

/**
 * Get full API URL
 */
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Helper to build query string
 */
export const buildQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

