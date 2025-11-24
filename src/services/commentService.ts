import { api, API_CONFIG } from './api';
import { WebViewManager } from '../utils/webViewManager';

/**
 * Comment create request
 */
export interface CommentCreateRequest {
  postId: number;
  content: string;
}

export interface CommentImageUpload {
  uri: string;
  name?: string;
  type?: string;
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

type MessageResponse = {
  message?: string;
};

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
      const { getComments: getCommentsApi } = await import('../api/comments');
      const result = await getCommentsApi(postId);
      // result가 배열이면 그대로 반환, 아니면 빈 배열
      return Array.isArray(result) ? { success: true, data: result } : { success: true, data: [] };
    } catch (error: any) {
      const message = String(error?.message || '');
      // 404, 500 등 에러는 빈 배열 반환
      console.warn('댓글 조회 실패, 빈 배열 반환:', postId, message);
      return { success: true, data: [] };
    }
  }

  /**
   * Create comment
   * 백엔드: POST /api/comment/create
   * Note: Requires authentication
   */
  static async createComment(request: CommentCreateRequest, file?: CommentImageUpload) {
    try {
      const response = await CommentService.submitMultipartComment(
        API_CONFIG.ENDPOINTS.CREATE_COMMENT,
        { commentRequest: request },
        file,
      );
      return response;
    } catch (error: any) {
      return { success: false, error: error?.message || '댓글 작성 실패' };
    }
  }

  /**
   * Update comment
   * 백엔드: POST /api/comment/update
   * Note: Requires authentication
   */
  static async updateComment(request: CommentUpdateRequest, file?: CommentImageUpload) {
    try {
      const response = await CommentService.submitMultipartComment(
        API_CONFIG.ENDPOINTS.UPDATE_COMMENT,
        { commentUpdateRequest: request },
        file,
      );
      return response;
    } catch (error: any) {
      return { success: false, error: error?.message || '댓글 수정 실패' };
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

  private static async submitMultipartComment(
    path: string,
    formDataFields: Record<string, any>,
    file?: CommentImageUpload,
  ) {
    if (!WebViewManager.isAvailable()) {
      throw new Error('WebView 세션이 필요합니다. 로그인 후 다시 시도해주세요.');
    }

    const headers = await CommentService.buildAuthHeaders();

    if (file) {
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        const fileData = await new Promise<{ data: string; name: string; type: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve({
              data: base64,
              name: file.name || `comment-${Date.now()}.jpg`,
              type: file.type || 'image/jpeg',
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        formDataFields.file = fileData;
      } catch (error) {
        throw new Error(`댓글 이미지 업로드 실패: ${file.uri}`);
      }
    }

    const response = await WebViewManager.requestApi({
      method: 'POST',
      path,
      headers,
      useFormData: true,
      formDataFields,
    });

    if (response && typeof response === 'object' && 'value' in response) {
      return { success: true, data: response.value as MessageResponse };
    }
    if (response && typeof response === 'object' && 'message' in response) {
      return { success: true, data: response as MessageResponse };
    }
    if (response && typeof response === 'object' && 'error' in response) {
      throw new Error(response.message || response.error || '댓글 처리 실패');
    }

    return { success: true, data: response as MessageResponse };
  }

  private static async buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    const { getAccessToken, getSessionCookie } = await import('../utils/storage');
    const token = await getAccessToken();
    const cookie = await getSessionCookie();

    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    } else if (cookie) {
      let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
      if (!cookieValue.includes('JSESSIONID=')) {
        cookieValue = `JSESSIONID=${cookieValue}`;
      }
      headers['Cookie'] = cookieValue;
    }

    return headers;
  }
}

