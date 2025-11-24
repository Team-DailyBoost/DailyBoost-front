import { requestWithWebViewFallback } from './http';
import { WebViewManager } from '../utils/webViewManager';
import {
  CommentRequest,
  CommentUpdateRequest,
  CommentUnregisterRequest,
  CommentResponse,
  MessageResponse,
} from './types';

export interface CommentImageUpload {
  uri: string;
  name?: string;
  type?: string;
}

export async function getComments(postId: number): Promise<CommentResponse[]> {
  try {
    return await requestWithWebViewFallback<CommentResponse[]>('GET', `/api/comment/${postId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    // 404, 500 등의 에러는 빈 배열 반환
    if (
      message.includes('404') ||
      message.includes('500') ||
      message.includes('POST_NOT_FOUND') ||
      message.includes('Internal Server Error')
    ) {
      console.log('[Comment API] 댓글 조회 실패, 빈 배열 반환:', postId, message);
      return [];
    }
    throw error;
  }
}

export async function createComment(
  request: CommentRequest,
  file?: CommentImageUpload,
): Promise<MessageResponse> {
  if (!WebViewManager.isAvailable()) {
    throw new Error('WebView가 필요합니다. 로그인 후 다시 시도해주세요.');
  }

  // content 필드 검증 및 처리 (백엔드 @NotBlank validation 통과를 위해)
  const content = request.content?.trim() || '';
  if (!content && !file) {
    throw new Error('댓글 내용 또는 이미지를 입력해주세요.');
  }

  // 인증 헤더 준비
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  const token = await getAccessToken();
  const cookie = await getSessionCookie();
  
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else if (cookie) {
    let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
    if (!cookieValue.includes('JSESSIONID=')) {
      cookieValue = `JSESSIONID=${cookieValue}`;
    }
    headers['Cookie'] = cookieValue;
  }

  // 백엔드 @NotBlank validation 통과를 위해 content가 비어있으면 기본값 설정
  const formDataFields: Record<string, any> = {
    commentRequest: {
      postId: request.postId,
      content: content || '내용 없음',
    },
  };

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
      throw new Error(`파일 변환 실패: ${file.uri}`);
    }
  }

  const response = await WebViewManager.requestApi({
    method: 'POST',
    path: '/api/comment/create',
    headers,
    useFormData: true,
    formDataFields,
  });

  // 백엔드 응답 형식: Api<MessageResponse>
  // 에러 처리
  if (response && typeof response === 'object') {
    // status가 400 이상이면 에러
    if ('status' in response && (response as any).status >= 400) {
      const errorMsg = (response as any).message || (response as any).error || '댓글 작성에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // errorCode가 있고 200이 아니면 에러
    if ('errorCode' in response && (response as any).errorCode !== 200) {
      const errorMsg = (response as any).description || (response as any).message || '댓글 작성에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // error 속성이 true이면 에러
    if ((response as any).error === true) {
      const errorMsg = (response as any).message || (response as any).error || '댓글 작성에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // 성공: value 속성이 있으면 ApiResponse 래퍼
    if ('value' in response) {
      return (response as any).value as MessageResponse;
    }
    
    // message 속성이 있고 error가 없으면 MessageResponse 직접
    if ('message' in response && !('error' in response)) {
      return response as MessageResponse;
    }
  }

  return response as MessageResponse;
}

export async function updateComment(
  request: CommentUpdateRequest,
  file?: CommentImageUpload,
): Promise<MessageResponse> {
  if (!WebViewManager.isAvailable()) {
    throw new Error('WebView가 필요합니다. 로그인 후 다시 시도해주세요.');
  }

  // 백엔드 validation 검증
  if (!request.postId) {
    throw new Error('게시글 ID가 필요합니다.');
  }
  if (!request.commentId) {
    throw new Error('댓글 ID가 필요합니다.');
  }
  
  // content 필드 검증 및 처리 (백엔드 @NotBlank validation 통과를 위해)
  const content = request.content?.trim() || '';
  if (!content && !file) {
    throw new Error('댓글 내용 또는 이미지를 입력해주세요.');
  }

  // 인증 헤더 준비
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  const token = await getAccessToken();
  const cookie = await getSessionCookie();
  
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else if (cookie) {
    let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
    if (!cookieValue.includes('JSESSIONID=')) {
      cookieValue = `JSESSIONID=${cookieValue}`;
    }
    headers['Cookie'] = cookieValue;
  }

  // 백엔드 @NotBlank validation 통과를 위해 content가 비어있으면 기본값 설정
  const formDataFields: Record<string, any> = {
    commentUpdateRequest: {
      postId: request.postId,
      commentId: request.commentId,
      content: content || '내용 없음',
    },
  };

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
      throw new Error(`파일 변환 실패: ${file.uri}`);
    }
  }

  const response = await WebViewManager.requestApi({
    method: 'POST',
    path: '/api/comment/update',
    headers,
    useFormData: true,
    formDataFields,
  });

  // 백엔드 응답 형식: Api<MessageResponse>
  // 에러 처리
  if (response && typeof response === 'object') {
    // status가 400 이상이면 에러
    if ('status' in response && (response as any).status >= 400) {
      const errorMsg = (response as any).message || (response as any).error || '댓글 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // errorCode가 있고 200이 아니면 에러
    if ('errorCode' in response && (response as any).errorCode !== 200) {
      const errorMsg = (response as any).description || (response as any).message || '댓글 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // error 속성이 true이면 에러
    if ((response as any).error === true) {
      const errorMsg = (response as any).message || (response as any).error || '댓글 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // 성공: value 속성이 있으면 ApiResponse 래퍼
    if ('value' in response) {
      return (response as any).value as MessageResponse;
    }
    
    // message 속성이 있고 error가 없으면 MessageResponse 직접
    if ('message' in response && !('error' in response)) {
      return response as MessageResponse;
    }
  }

  return response as MessageResponse;
}

export async function deleteComment(request: CommentUnregisterRequest): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', '/api/comment/unregister', {
    body: request,
  });
}

export async function likeComment(commentId: number): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', `/api/comment/like/${commentId}`);
}

export async function unlikeComment(commentId: number): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', `/api/comment/unLike/${commentId}`);
}
