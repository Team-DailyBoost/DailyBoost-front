/**
 * Post API
 * 
 * OpenAPI: /api/post/**
 * 
 * 게시글 관련 API 함수들입니다.
 */
import client, { extractApiValue, ApiResponse } from './client';

/**
 * Post Kind 타입
 */
export type PostKind = 'EXERCISE' | 'FOOD' | 'DIET';

/**
 * Post Create Request 타입
 */
export interface PostCreateRequest {
  title: string;
  content: string;
  postKind: PostKind;
}

/**
 * Post Update Request 타입
 */
export interface PostUpdateRequest {
  id: number;
  title: string;
  content: string;
  postKind?: PostKind;
}

/**
 * Posts Response 타입 (목록 아이템)
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
 * Comment Info 타입 (게시글 상세에 포함)
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
 * Post Response 타입 (상세)
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
 * Search Post Response 타입
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
 * Message Response 타입
 */
export interface MessageResponse {
  message: string;
}

/**
 * 게시글 목록 조회 (PostKind별)
 * GET /api/post/posts?postKind=...
 */
export async function getPosts(postKind: PostKind): Promise<PostsResponse[]> {
  const response = await client.get<ApiResponse<PostsResponse[]>>('/api/post/posts', {
    params: { postKind },
  });
  return extractApiValue(response);
}

/**
 * 게시글 상세 조회
 * GET /api/post/{postId}
 */
export async function getPost(postId: number): Promise<PostResponse> {
  const response = await client.get<ApiResponse<PostResponse>>(`/api/post/${postId}`);
  return extractApiValue(response);
}

/**
 * 게시글 제목으로 검색
 * GET /api/post?title=...
 */
export async function searchPosts(title: string): Promise<SearchPostResponse[]> {
  const response = await client.get<ApiResponse<SearchPostResponse[]>>('/api/post', {
    params: { title },
  });
  return extractApiValue(response);
}

/**
 * 게시글 생성
 * POST /api/post/create
 */
export interface PostImageUpload {
  uri: string;
  name?: string;
  type?: string;
}

export async function createPost(
  request: PostCreateRequest,
  files?: PostImageUpload[],
): Promise<MessageResponse> {
  // React Native의 FormData를 직접 사용하여 multipart/form-data 전송
  const { API_CONFIG } = await import('../config/api');
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  
  const path = API_CONFIG.ENDPOINTS?.CREATE_POST || '/api/post/create';
  const fullUrl = `${API_CONFIG.BASE_URL}${path}`;
  
  try {
    // FormData 생성
    const formData = new FormData();
    
    // JSON part 추가
    // React Native FormData는 문자열을 추가하면 text/plain으로 전송되지만,
    // Spring @RequestPart는 Content-Type: application/json을 기대함
    // React Native에서는 FormData에 JSON을 Blob처럼 추가할 수 없으므로
    // 문자열로 추가하고 백엔드가 파싱할 수 있도록 함
    formData.append('postCreateRequest', JSON.stringify(request));
    
    // 파일 추가 (있는 경우)
    if (files && files.length > 0) {
      files.forEach((file) => {
        // React Native FormData는 { uri, type, name } 형식으로 파일 추가
        formData.append('files', {
          uri: file.uri,
          type: file.type || 'image/jpeg',
          name: file.name || `image-${Date.now()}.jpg`,
        } as any);
      });
    }
    
    console.log('📤 [createPost] FormData 생성 완료, 전송 시작');
    console.log('📤 [createPost] 요청 데이터:', { title: request.title, postKind: request.postKind, filesCount: files?.length || 0 });
    
    // 인증 정보 가져오기
    const token = await getAccessToken();
    const sessionCookie = await getSessionCookie();
    
    // 헤더 구성
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // JWT 토큰이 있으면 사용, 없으면 세션 쿠키 사용
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    } else if (sessionCookie) {
      const cookieValue = sessionCookie.includes('=') ? sessionCookie.split('=')[1].split(';')[0] : sessionCookie;
      headers['Cookie'] = `JSESSIONID=${cookieValue}`;
    }
    
    // FormData는 Content-Type을 자동으로 설정 (boundary 포함)
    // React Native가 자동으로 multipart/form-data와 boundary를 설정함
    
    // 직접 fetch 사용
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });
    
    console.log('📦 [createPost] 응답 상태:', response.status);
    
    // 응답 파싱
    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.warn('📦 [createPost] JSON이 아닌 응답:', text.substring(0, 200));
      responseData = { error: text || '알 수 없는 오류' };
    }
    
    console.log('📦 [createPost] 응답 수신:', JSON.stringify(responseData).substring(0, 200));
    
    // 에러 상태 코드 처리
    if (!response.ok) {
      const errorMessage = 
        (responseData?.message || responseData?.error || responseData?.description) ||
        `서버 오류 (${response.status})`;
      throw new Error(errorMessage);
    }
    
    // api.post를 사용하여 FormData 전송
    // const response = await api.post<MessageResponse>(path, formData);
    
    // 백엔드 응답 형식: Api<MessageResponse> = { errorCode, description, value: { message: string } }
    if (responseData && typeof responseData === 'object') {
      const dataObj = responseData as Record<string, unknown>;
      
      // Api<T> 형식: { errorCode, description, value }
      if ('value' in dataObj) {
        const value = dataObj.value;
        if (value && typeof value === 'object' && value !== null) {
          const valueObj = value as Record<string, unknown>;
          if ('message' in valueObj && typeof valueObj.message === 'string') {
            return { message: valueObj.message } as MessageResponse;
          }
          return value as MessageResponse;
        }
        return value as MessageResponse;
      }
      
      // 직접 MessageResponse 형식
      if ('message' in dataObj && typeof dataObj.message === 'string') {
        return { message: dataObj.message } as MessageResponse;
      }
      
      // 에러 응답
      if ('errorCode' in dataObj && dataObj.errorCode !== 200) {
        const errorMessage = 
          (typeof dataObj.description === 'string' ? dataObj.description : null) ||
          '게시글 작성에 실패했습니다.';
        throw new Error(errorMessage);
      }
    }
    
    console.error('❌ [createPost] 예상치 못한 응답 형식:', responseData);
    throw new Error(`게시글 작성에 실패했습니다. 응답: ${JSON.stringify(responseData).substring(0, 100)}`);
  } catch (error) {
    console.error('❌ [createPost] 에러 발생:', error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : (typeof error === 'object' && error !== null && 'error' in error && typeof (error as Record<string, unknown>).error === 'string'
          ? (error as Record<string, unknown>).error
          : '게시글 작성에 실패했습니다.');
    throw new Error(String(errorMessage));
  }
}

/**
 * 게시글 수정
 * POST /api/post/update
 */
export async function updatePost(request: PostUpdateRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/post/update', request);
  return extractApiValue(response);
}

/**
 * 게시글 삭제
 * POST /api/post/{postId}
 */
export async function deletePost(postId: number): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(`/api/post/${postId}`);
  return extractApiValue(response);
}

/**
 * 게시글 좋아요
 * POST /api/post/like/{postId}
 */
export async function likePost(postId: number): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(`/api/post/like/${postId}`);
  return extractApiValue(response);
}

/**
 * 게시글 좋아요 취소
 * POST /api/post/unLike/{postId}
 */
export async function unlikePost(postId: number): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(`/api/post/unLike/${postId}`);
  return extractApiValue(response);
}
