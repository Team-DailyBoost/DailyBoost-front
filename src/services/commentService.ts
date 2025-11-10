import { api, API_CONFIG } from './api';

/**
 * Comment create request
 */
export interface CommentCreateRequest {
  postId: number;
  content: string;
}

/**
 * Comment update request
 */
export interface CommentUpdateRequest {
  postId: number;
  commentId: number;
  content: string;
}

/**
 * Comment delete request
 */
export interface CommentDeleteRequest {
  postId: number;
  commentId: number;
}

/**
 * Comment response
 * Matches Swagger API specification
 */
export interface CommentResponse {
  comment: string; // Note: backend uses "comment" not "content"
  createAt: string; // date-time format, Note: backend uses "createAt" not "createdAt"
  likeCount: number;
  unLikeCount: number;
}

/**
 * Comment Service
 * Updated to match backend API specification
 */
export class CommentService {
  /**
   * Get comments by post id
   * 백엔드: GET /api/comment/{postId}
   */
  static async getComments(postId: number) {
    try {
      return await api.get<CommentResponse[]>(`${API_CONFIG.ENDPOINTS.GET_COMMENTS}/${postId}`);
    } catch (error) {
      return { success: false, error: '댓글 조회 실패' };
    }
  }

  /**
   * Create comment
   * 백엔드: POST /api/comment/create
   * Note: Requires authentication
   */
  static async createComment(request: CommentCreateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.CREATE_COMMENT, request);
    } catch (error) {
      return { success: false, error: '댓글 작성 실패' };
    }
  }

  /**
   * Update comment
   * 백엔드: POST /api/comment/update
   * Note: Requires authentication
   */
  static async updateComment(request: CommentUpdateRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.UPDATE_COMMENT, request);
    } catch (error) {
      return { success: false, error: '댓글 수정 실패' };
    }
  }

  /**
   * Delete comment
   * 백엔드: POST /api/comment/unregister
   * Note: Requires authentication, body needed
   */
  static async deleteComment(request: CommentDeleteRequest) {
    try {
      return await api.post(API_CONFIG.ENDPOINTS.DELETE_COMMENT, request);
    } catch (error) {
      return { success: false, error: '댓글 삭제 실패' };
    }
  }

  /**
   * Like comment
   * 백엔드: POST /api/comment/like/{commentId}
   * Note: Requires authentication
   */
  static async likeComment(commentId: number) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.LIKE_COMMENT}/${commentId}`);
    } catch (error) {
      return { success: false, error: '좋아요 실패' };
    }
  }

  /**
   * Unlike comment
   * 백엔드: POST /api/comment/unLike/{commentId}
   * Note: Requires authentication
   */
  static async unlikeComment(commentId: number) {
    try {
      return await api.post(`${API_CONFIG.ENDPOINTS.UNLIKE_COMMENT}/${commentId}`);
    } catch (error) {
      return { success: false, error: '좋아요 취소 실패' };
    }
  }
}

