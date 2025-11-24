import { api, API_CONFIG } from './api';

/**
 * Post kind enum
 */
export type PostKind = 'EXERCISE' | 'FOOD' | 'DIET' | 'COMPETITION';

/**
 * Post create request
 */
export interface PostCreateRequest {
  title: string;
  content: string;
  postKind: PostKind;
}

/**
 * Post update request
 * Note: Backend uses @NotBlank on id (Long) which is incorrect, but we match the backend structure
 */
export interface PostUpdateRequest {
  id: number; // Backend expects this as Long, but marked as @NotBlank (backend issue)
  title: string;
  content: string;
  postKind?: PostKind;
}

/**
 * Comment info (nested in PostResponse)
 */
export interface CommentInfo {
  commentId: number;
  content: string;
  createAt: string; // date-time format
  likeCount: number;
  unLikeCount: number;
  authorName: string;
}

/**
 * Post response (detail view)
 * Matches Swagger API specification
 */
export interface PostResponse {
  title: string;
  content: string;
  authorName: string; // Note: backend uses "authorName" not "userName"
  createdAt: string; // date-time format
  viewCount: number;
  commentCount: number;
  likeCount: number;
  unLikeCount: number;
  commentInfos: CommentInfo[];
}

/**
 * Posts list response item
 * Matches Swagger API specification
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
 * Search post response
 * Matches Swagger API specification
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
 * Post Service
 * Updated to match backend API specification
 */
export class PostService {
  /**
   * Get posts by kind
   * 백엔드: GET /api/post/posts?postKind=EXERCISE
   * Note: postKind is required
   */
  static async getPosts(postKind: PostKind) {
    try {
      return await api.get<PostResponse[]>(API_CONFIG.ENDPOINTS.GET_POSTS, { postKind });
    } catch (error) {
      return { success: false, error: '게시글 조회 실패' };
    }
  }

  /**
   * Get post by id
   * 백엔드: GET /api/post/{postId}
   * Note: Requires authentication
   */
  static async getPost(postId: number) {
    try {
      return await api.get<PostResponse>(`${API_CONFIG.ENDPOINTS.GET_POST_DETAIL}/${postId}`);
    } catch (error) {
      return { success: false, error: '게시글 조회 실패' };
    }
  }

  /**
   * Search posts by title
   * 백엔드: GET /api/post?title=...
   */
  static async searchPosts(title: string) {
    try {
      return await api.get<SearchPostResponse[]>(API_CONFIG.ENDPOINTS.SEARCH_POSTS, { title });
    } catch (error) {
      return { success: false, error: '게시글 검색 실패' };
    }
  }

  /**
   * Create post
   * 백엔드: POST /api/post/create
   * Note: Requires authentication
   */
  static async createPost(request: PostCreateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.CREATE_POST, request);
    } catch (error) {
      return { success: false, error: '게시글 작성 실패' };
    }
  }

  /**
   * Update post
   * 백엔드: POST /api/post/update
   * Note: Requires authentication
   */
  static async updatePost(request: PostUpdateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.UPDATE_POST, request);
    } catch (error) {
      return { success: false, error: '게시글 수정 실패' };
    }
  }

  /**
   * Delete post
   * 백엔드: POST /api/post/{postId}
   * Note: Requires authentication
   */
  static async deletePost(postId: number) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.DELETE_POST}/${postId}`);
    } catch (error) {
      return { success: false, error: '게시글 삭제 실패' };
    }
  }

  /**
   * Like post
   * 백엔드: POST /api/post/like/{postId}
   * Note: Requires authentication
   */
  static async likePost(postId: number) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.LIKE_POST}/${postId}`);
    } catch (error) {
      return { success: false, error: '좋아요 실패' };
    }
  }

  /**
   * Unlike post
   * 백엔드: POST /api/post/unLike/{postId}
   * Note: Requires authentication
   */
  static async unlikePost(postId: number) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.UNLIKE_POST}/${postId}`);
    } catch (error) {
      return { success: false, error: '좋아요 취소 실패' };
    }
  }
}

