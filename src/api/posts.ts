import { requestWithWebViewFallback } from './http';
import { API_CONFIG } from '../config/api';
import { WebViewManager } from '../utils/webViewManager';

export type PostKind = 'EXERCISE' | 'FOOD' | 'DIET' | 'COMPETITION';

export interface PostCreateRequest {
  title: string;
  content: string;
  postKind: PostKind;
}

export interface PostUpdateRequest {
  id: number;
  title: string;
  content: string;
  postKind?: PostKind;
}

export interface PostsResponse {
  id: number;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  likeCount: number;
  unLikeCount: number;
  commentCount: number;
  imageUrls?: string[]; // 백엔드에서 이미지 URL 목록 제공
}

export interface PostResponse {
  id: number;
  title: string;
  content: string;
  authorName: string;
  authorId: number;
  viewCount: number;
  likeCount: number;
  unLikeCount: number;
  commentCount: number;
  postKind: PostKind;
  createdAt: string;
  updatedAt: string;
  imageUrls?: string[];
  comments?: CommentInfo[];
}

export interface CommentInfo {
  id: number;
  content: string;
  authorName: string;
  authorId: number;
  createdAt: string;
  likeCount: number;
  imageUrl?: string;
}

export interface SearchPostResponse {
  id: number;
  title: string;
  content: string;
  authorName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

export interface MessageResponse {
  message: string;
}

export interface PostImageUpload {
  uri: string;
  name?: string;
  type?: string;
}

/**
 * 게시글 목록 조회
 * 백엔드: GET /api/post/posts?postKind=EXERCISE
 */
export async function getPosts(postKind: PostKind): Promise<PostsResponse[]> {
  try {
    return await requestWithWebViewFallback<PostsResponse[]>('GET', '/api/post/posts', {
      query: { postKind },
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    // 404, 500, 사용자를 찾을 수 없습니다 등의 에러는 빈 배열 반환
    if (
      message.includes('404') ||
      message.includes('500') ||
      message.includes('"errorCode":1100') ||
      message.includes('USER_NOT_FOUND') ||
      message.includes('사용자를 찾을 수 없습니다') ||
      message.includes('Internal Server Error')
    ) {
      console.log('[Post API] 게시글 목록 조회 실패, 빈 배열 반환:', postKind, message);
      return [];
    }
    throw error;
  }
}

/**
 * 게시글 상세 조회
 * 백엔드: GET /api/post/{postId}
 */
export async function getPost(postId: number): Promise<PostResponse | null> {
  try {
    return await requestWithWebViewFallback<PostResponse>('GET', `/api/post/${postId}`);
  } catch (error: any) {
    const message = String(error?.message || '');
    // 404 에러나 사용자를 찾을 수 없습니다 에러는 null 반환
    if (
      message.includes('404') ||
      message.includes('"errorCode":1100') ||
      message.includes('USER_NOT_FOUND') ||
      message.includes('사용자를 찾을 수 없습니다') ||
      message.includes('POST_NOT_FOUND')
    ) {
      console.log('[Post API] 게시글 조회 실패 (404), null 반환:', postId);
      return null;
    }
    throw error;
  }
}

/**
 * 게시글 검색
 * 백엔드: GET /api/post?title=...
 */
export async function searchPosts(title: string): Promise<SearchPostResponse[]> {
  try {
    return await requestWithWebViewFallback<SearchPostResponse[]>('GET', '/api/post', {
      query: { title },
    });
  } catch (error: any) {
    const message = String(error?.message || '');
    // 404, 500, POST_NOT_FOUND 등의 에러는 빈 배열 반환
    if (
      message.includes('404') ||
      message.includes('500') ||
      message.includes('POST_NOT_FOUND') ||
      message.includes('Internal Server Error')
    ) {
      console.log('[Post API] 게시글 검색 실패, 빈 배열 반환:', title, message);
      return [];
    }
    throw error;
  }
}

/**
 * 게시글 작성
 * 백엔드: POST /api/post/create
 * consumes: MediaType.MULTIPART_FORM_DATA_VALUE
 * @RequestPart @Valid PostCreateRequest postCreateRequest
 * @RequestPart(required = false) List<MultipartFile> files
 * 
 * 백엔드 구조:
 * - PostCreateRequest: { title: String, content: String, postKind: PostKind }
 * - files: List<MultipartFile> (optional)
 */
export async function createPost(
  request: PostCreateRequest,
  files?: PostImageUpload[],
): Promise<MessageResponse> {
  // WebView 확인
  if (!WebViewManager.isAvailable()) {
    throw new Error('WebView가 필요합니다. 로그인 후 다시 시도해주세요.');
  }

  // 백엔드 validation과 동일하게 검증
  if (!request.title || !request.title.trim()) {
    throw new Error('제목을 입력해주세요.');
  }
  if (request.title.trim().length > 100) {
    throw new Error('제목은 최대 100자까지 가능합니다.');
  }
  if (!request.content || !request.content.trim()) {
    throw new Error('내용을 입력해주세요.');
  }
  if (request.content.trim().length > 1000) {
    throw new Error('내용은 최대 1000자까지 가능합니다.');
  }
  if (!request.postKind) {
    throw new Error('게시글 종류를 선택해주세요.');
  }

  // 인증 헤더 준비
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  const token = await getAccessToken();
  const cookie = await getSessionCookie();
  
  const headers: Record<string, string> = { 
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else if (cookie) {
    let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
    if (!cookieValue.includes('JSESSIONID=')) {
      cookieValue = `JSESSIONID=${cookieValue}`;
    }
    headers['Cookie'] = cookieValue;
  } else {
    // 토큰과 쿠키가 모두 없으면 에러
    throw new Error('인증 정보가 없습니다. 로그인 후 다시 시도해주세요.');
  }

  // 백엔드 기대 형식: multipart/form-data
  // - part 이름: "postCreateRequest" (JSON, Content-Type: application/json)
  // - part 이름: "files" (List<MultipartFile>, optional)
  const formDataFields: Record<string, any> = {
    postCreateRequest: {
      title: request.title.trim(),
      content: request.content.trim(),
      postKind: request.postKind, // EXERCISE, FOOD, DIET, COMPETITION
    },
  };
  
  // 디버깅: 요청 데이터 검증
  if (!formDataFields.postCreateRequest.title || formDataFields.postCreateRequest.title.length === 0) {
    throw new Error('제목이 비어있습니다.');
  }
  if (!formDataFields.postCreateRequest.content || formDataFields.postCreateRequest.content.length === 0) {
    throw new Error('내용이 비어있습니다.');
  }
  if (!formDataFields.postCreateRequest.postKind) {
    throw new Error('게시글 종류가 지정되지 않았습니다.');
  }

  // 디버깅: formDataFields 로깅
  console.log('[CREATE_POST] formDataFields 준비:', {
    postCreateRequest: {
      title: formDataFields.postCreateRequest.title,
      content: formDataFields.postCreateRequest.content,
      contentLength: formDataFields.postCreateRequest.content?.length || 0,
      postKind: formDataFields.postCreateRequest.postKind,
    },
    hasFiles: files && files.length > 0,
  });

  // 파일 처리: WebView에서 FileReader 사용을 위해 base64로 변환
  if (files && files.length > 0) {
    const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    
    const filePromises = files.map(async (file, index) => {
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        // 파일 크기 검증
        if (blob.size > MAX_FILE_SIZE) {
          throw new Error(`파일 크기가 6MB를 초과합니다. (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
        }
        
        const fileItem = await new Promise<{ data: string; name: string; type: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            
            // 파일 이름 처리: 확장자가 확실히 포함되도록 보장
            let fileName = file.name || `post-${Date.now()}-${index}.jpg`;
            
            // 파일 타입에서 확장자 추출
            const mimeType = file.type || blob.type || 'image/jpeg';
            const mimeExt = mimeType.split('/')[1]?.toLowerCase() || 'jpg';
            
            // 파일 이름에 확장자가 없으면 추가
            if (!fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
              // 허용된 확장자인지 확인
              const ext = ALLOWED_EXTENSIONS.includes(mimeExt) ? mimeExt : 'jpg';
              fileName = fileName.replace(/\.[^.]*$/, '') + '.' + ext;
            }
            
            // 허용된 확장자인지 확인
            const currentExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
            if (!ALLOWED_EXTENSIONS.includes(currentExt)) {
              // 허용되지 않은 확장자는 jpg로 변경
              fileName = fileName.replace(/\.[^.]*$/, '.jpg');
            }
            
            // 파일 타입 검증 (허용된 MIME 타입인지)
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const finalMimeType = allowedMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg';
            
            console.log('[CREATE_POST] 파일 처리 완료:', {
              index,
              originalName: file.name,
              finalName: fileName,
              mimeType: finalMimeType,
              size: blob.size,
              sizeMB: (blob.size / 1024 / 1024).toFixed(2),
            });
            
            resolve({
              data: base64,
              name: fileName,
              type: finalMimeType,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return fileItem;
      } catch (error: any) {
        throw new Error(`파일 변환 실패 (${file.name || `파일 ${index + 1}`}): ${error?.message || String(error)}`);
      }
    });

    const fileData = await Promise.all(filePromises);
    formDataFields.files = fileData;
    
    console.log('[CREATE_POST] 파일 처리 완료:', {
      filesCount: fileData.length,
      fileNames: fileData.map(f => f.name),
      totalSize: fileData.reduce((sum, f) => sum + (f.data.length * 0.75), 0), // base64 크기 (대략)
    });
  }

  // API 요청
  console.log('[CREATE_POST] API 요청 시작:', {
    path: '/api/post/create',
    method: 'POST',
    hasAuth: !!(headers['Authorization'] || headers['Cookie']),
  });

  const response = await WebViewManager.requestApi({
    method: 'POST',
    path: '/api/post/create',
    headers,
    useFormData: true,
    formDataFields,
  });

  // 디버깅: 응답 로깅
  console.log('[CREATE_POST] API 응답 받음:', {
    responseType: typeof response,
    isObject: typeof response === 'object',
    hasStatus: response && typeof response === 'object' && 'status' in response,
    hasErrorCode: response && typeof response === 'object' && 'errorCode' in response,
    hasError: response && typeof response === 'object' && 'error' in response,
    hasResponse: !!response,
    hasValue: response && typeof response === 'object' && 'value' in response,
    responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
    responsePreview: typeof response === 'object' ? JSON.stringify(response).substring(0, 500) : String(response).substring(0, 500),
  });

  // 백엔드 응답 형식: Api<MessageResponse>
  // Api { errorCode: 200, value: MessageResponse { message: string } }
  // 또는 에러 시: Api { errorCode: xxx, description: string }
  // WebViewManager는 status >= 400일 때도 resolve로 반환하므로 주의 필요
  
  // 에러 처리 (우선순위: status > errorCode > error 속성)
  if (response && typeof response === 'object') {
    // 1. status가 400 이상이면 에러 (가장 우선)
    if ('status' in response && typeof (response as any).status === 'number' && (response as any).status >= 400) {
      let errorMsg = (response as any).description || (response as any).message || (response as any).error || '게시글 작성에 실패했습니다.';
      
      // 백엔드 에러 메시지 파싱
      const status = (response as any).status;
      const responseText = JSON.stringify(response);
      
      if (status === 400) {
        // 400 Bad Request: validation 실패 또는 제목 중복
        if (responseText.includes('같은 제목의 게시글이 존재합니다')) {
          errorMsg = '내 게시글에 같은 제목의 게시글이 이미 존재합니다.';
        } else if (responseText.includes('NotBlank') || responseText.includes('NotNull')) {
          errorMsg = '제목, 내용, 게시글 종류를 모두 입력해주세요.';
        } else if (responseText.includes('Size')) {
          errorMsg = '제목은 최대 100자, 내용은 최대 1000자까지 가능합니다.';
        } else if (responseText.includes('validation') || responseText.includes('Validation')) {
          errorMsg = '입력한 내용을 확인해주세요.';
        }
      } else if (status === 401 || status === 403) {
        errorMsg = '인증이 필요합니다. 로그인 후 다시 시도해주세요.';
      } else if (status === 500) {
        // 500 Internal Server Error: 서버 오류
        errorMsg = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n\n문제가 계속되면 관리자에게 문의해주세요.';
      }
      
      console.log('[CREATE_POST] status >= 400 에러:', { status, message: errorMsg, response });
      throw new Error(errorMsg);
    }
    
    // 2. errorCode가 있고 200이 아니면 에러
    if ('errorCode' in response && typeof (response as any).errorCode === 'number' && (response as any).errorCode !== 200) {
      let errorMsg = (response as any).description || (response as any).message || (response as any).error || '게시글 작성에 실패했습니다.';
      
      // 백엔드 에러 메시지 파싱
      const errorCode = (response as any).errorCode;
      const responseText = JSON.stringify(response);
      
      if (errorCode === 400) {
        if (responseText.includes('같은 제목의 게시글이 존재합니다')) {
          errorMsg = '내 게시글에 같은 제목의 게시글이 이미 존재합니다.';
        } else if (responseText.includes('NotBlank') || responseText.includes('NotNull')) {
          errorMsg = '제목, 내용, 게시글 종류를 모두 입력해주세요.';
        } else if (responseText.includes('Size')) {
          errorMsg = '제목은 최대 100자, 내용은 최대 1000자까지 가능합니다.';
        }
      }
      
      console.log('[CREATE_POST] errorCode != 200 에러:', { errorCode, message: errorMsg, response });
      throw new Error(errorMsg);
    }
    
    // 3. error 속성이 true이면 에러
    if ((response as any).error === true) {
      let errorMsg = (response as any).description || (response as any).message || '게시글 작성에 실패했습니다.';
      
      // 백엔드 에러 메시지 파싱
      const responseText = JSON.stringify(response);
      if (responseText.includes('같은 제목의 게시글이 존재합니다')) {
        errorMsg = '내 게시글에 같은 제목의 게시글이 이미 존재합니다.';
      }
      
      console.log('[CREATE_POST] error === true 에러:', { message: errorMsg, response });
      throw new Error(errorMsg);
    }
    
    // 성공 응답 처리
    // 백엔드 Api 래퍼 형식: { errorCode: 200, value: { message: string } }
    if ('value' in response && (response as any).value) {
      const value = (response as any).value;
      // value가 MessageResponse 형식인지 확인
      if (typeof value === 'object' && ('message' in value || typeof value === 'string')) {
        console.log('[CREATE_POST] 성공 (value 속성):', value);
        return typeof value === 'string' ? { message: value } : value as MessageResponse;
      }
    }
    
    // message 속성이 있고 error가 없으면 MessageResponse 직접
    if ('message' in response && typeof (response as any).message === 'string' && !('error' in response) && !('status' in response)) {
      console.log('[CREATE_POST] 성공 (message 직접):', response);
      return response as MessageResponse;
    }
  }

  // 응답이 예상과 다를 경우
  if (response && typeof response === 'object') {
    console.warn('[CREATE_POST] 예상하지 못한 응답 형식:', response);
  }

  console.log('[CREATE_POST] 성공 (응답 직접 반환):', response);
  return response as MessageResponse;
}

/**
 * 게시글 수정
 * 백엔드: POST /api/post/update
 * @RequestPart PostUpdateRequest postUpdateRequest
 * @RequestPart(required = false) List<MultipartFile> files
 * 
 * 백엔드 구조:
 * - PostUpdateRequest: { id: Long, title: String, content: String, postKind: PostKind? }
 * - files: List<MultipartFile> (optional)
 */
export async function updatePost(
  request: PostUpdateRequest,
  files?: PostImageUpload[],
): Promise<MessageResponse> {
  // WebView 확인
  if (!WebViewManager.isAvailable()) {
    throw new Error('WebView가 필요합니다. 로그인 후 다시 시도해주세요.');
  }

  // 백엔드 validation 검증
  if (!request.id) {
    throw new Error('게시글 ID가 필요합니다.');
  }
  if (!request.title || !request.title.trim()) {
    throw new Error('제목을 입력해주세요.');
  }
  if (request.title.trim().length > 100) {
    throw new Error('제목은 최대 100자까지 가능합니다.');
  }
  if (!request.content || !request.content.trim()) {
    throw new Error('내용을 입력해주세요.');
  }
  if (request.content.trim().length > 1000) {
    throw new Error('내용은 최대 1000자까지 가능합니다.');
  }

  // 인증 헤더 준비
  const { getAccessToken, getSessionCookie } = await import('../utils/storage');
  const token = await getAccessToken();
  const cookie = await getSessionCookie();
  
  const headers: Record<string, string> = { 
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  } else if (cookie) {
    let cookieValue = cookie.includes(';') ? cookie.split(';')[0] : cookie;
    if (!cookieValue.includes('JSESSIONID=')) {
      cookieValue = `JSESSIONID=${cookieValue}`;
    }
    headers['Cookie'] = cookieValue;
  }

  // 백엔드 기대 형식: multipart/form-data
  // - part 이름: "postUpdateRequest" (JSON, Content-Type: application/json)
  // - part 이름: "files" (List<MultipartFile>, optional)
  const formDataFields: Record<string, any> = {
    postUpdateRequest: {
      id: request.id,
      title: request.title.trim(),
      content: request.content.trim(),
      // postKind가 없으면 null로 보내지 않고 필드 자체를 생략 (백엔드가 optional로 처리)
      ...(request.postKind ? { postKind: request.postKind } : {}),
    },
  };

  console.log('[UPDATE_POST] formDataFields 준비:', {
    postUpdateRequest: {
      id: formDataFields.postUpdateRequest.id,
      title: formDataFields.postUpdateRequest.title,
      content: formDataFields.postUpdateRequest.content.substring(0, 50),
      postKind: formDataFields.postUpdateRequest.postKind || 'undefined',
    },
    hasFiles: files && files.length > 0,
  });

  // 파일 처리: WebView에서 FileReader 사용을 위해 base64로 변환 (createPost와 동일)
  if (files && files.length > 0) {
    const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
    
    const filePromises = files.map(async (file, index) => {
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        
        // 파일 크기 검증
        if (blob.size > MAX_FILE_SIZE) {
          throw new Error(`파일 크기가 6MB를 초과합니다. (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
        }
        
        const fileItem = await new Promise<{ data: string; name: string; type: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            
            // 파일 이름 처리: 확장자가 확실히 포함되도록 보장
            let fileName = file.name || `post-${Date.now()}-${index}.jpg`;
            
            // 파일 타입에서 확장자 추출
            const mimeType = file.type || blob.type || 'image/jpeg';
            const mimeExt = mimeType.split('/')[1]?.toLowerCase() || 'jpg';
            
            // 파일 이름에 확장자가 없으면 추가
            if (!fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
              // 허용된 확장자인지 확인
              const ext = ALLOWED_EXTENSIONS.includes(mimeExt) ? mimeExt : 'jpg';
              fileName = fileName.replace(/\.[^.]*$/, '') + '.' + ext;
            }
            
            // 허용된 확장자인지 확인
            const currentExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
            if (!ALLOWED_EXTENSIONS.includes(currentExt)) {
              // 허용되지 않은 확장자는 jpg로 변경
              fileName = fileName.replace(/\.[^.]*$/, '.jpg');
            }
            
            // 파일 타입 검증 (허용된 MIME 타입인지)
            const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            const finalMimeType = allowedMimeTypes.includes(mimeType) ? mimeType : 'image/jpeg';
            
            resolve({
              data: base64,
              name: fileName,
              type: finalMimeType,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return fileItem;
      } catch (error: any) {
        throw new Error(`파일 변환 실패 (${file.name || `파일 ${index + 1}`}): ${error?.message || String(error)}`);
      }
    });

    const fileData = await Promise.all(filePromises);
    formDataFields.files = fileData;
  }

  // API 요청
  console.log('[UPDATE_POST] API 요청 시작:', {
    method: 'POST',
    path: '/api/post/update',
    hasAuth: !!(token || cookie),
    hasFiles: files && files.length > 0,
  });

  const response = await WebViewManager.requestApi({
    method: 'POST',
    path: '/api/post/update',
    headers,
    useFormData: true,
    formDataFields,
  });

  console.log('[UPDATE_POST] API 응답 받음:', {
    hasResponse: !!response,
    isObject: typeof response === 'object',
    responseKeys: response && typeof response === 'object' ? Object.keys(response) : [],
    hasStatus: response && typeof response === 'object' && 'status' in response,
    status: response && typeof response === 'object' && 'status' in response ? (response as any).status : undefined,
    hasError: response && typeof response === 'object' && 'error' in response,
    hasValue: response && typeof response === 'object' && 'value' in response,
    responsePreview: response && typeof response === 'object' ? JSON.stringify(response).substring(0, 200) : String(response).substring(0, 200),
  });

  // 백엔드 응답 형식: Api<MessageResponse>
  // 에러 처리
  if (response && typeof response === 'object') {
    // status가 400 이상이면 에러
    if ('status' in response && (response as any).status >= 400) {
      const errorMsg = (response as any).message || (response as any).error || '게시글 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // errorCode가 있고 200이 아니면 에러
    if ('errorCode' in response && (response as any).errorCode !== 200) {
      const errorMsg = (response as any).description || (response as any).message || '게시글 수정에 실패했습니다.';
      throw new Error(errorMsg);
    }
    
    // error 속성이 true이면 에러
    if ((response as any).error === true) {
      const errorMsg = (response as any).message || (response as any).error || '게시글 수정에 실패했습니다.';
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

/**
 * 게시글 삭제
 * 백엔드: POST /api/post/{postId}
 * @PathVariable Long postId
 */
export async function deletePost(postId: number): Promise<MessageResponse> {
  if (!postId || postId <= 0) {
    throw new Error('유효한 게시글 ID가 필요합니다.');
  }

  try {
    const result = await requestWithWebViewFallback<MessageResponse>('POST', `/api/post/${postId}`);
    
    // 백엔드 응답 형식: Api<MessageResponse>
    // Api { errorCode: 200, value: MessageResponse { message: string } }
    // 또는 에러 시: Api { errorCode: xxx, description: string }
    
    if (result && typeof result === 'object') {
      // value 속성이 있으면 ApiResponse 래퍼
      if ('value' in result) {
        return (result as any).value as MessageResponse;
      }
      
      // message 속성이 있고 error가 없으면 MessageResponse 직접
      if ('message' in result && !('error' in result)) {
        return result as MessageResponse;
      }
      
      // errorCode가 있고 200이 아니면 에러
      if ('errorCode' in result && (result as any).errorCode !== 200) {
        const errorMsg = (result as any).description || (result as any).message || '게시글 삭제에 실패했습니다.';
        throw new Error(errorMsg);
      }
    }
    
    return result as MessageResponse;
  } catch (error: any) {
    const message = String(error?.message || '');
    let errorMessage = message;
    
    // 500, 404 등의 에러 메시지 개선
    if (message.includes('500') || message.includes('Internal Server Error')) {
      console.log('[DELETE_POST] 게시글 삭제 실패 (500):', postId, message);
      errorMessage = '서버 오류로 인해 게시글 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.';
    } else if (message.includes('404') || message.includes('POST_NOT_FOUND')) {
      console.log('[DELETE_POST] 게시글 삭제 실패 (404):', postId, message);
      errorMessage = '삭제하려는 게시글을 찾을 수 없습니다.';
    } else if (message.includes('편집 권한이 없습니다') || message.includes('권한')) {
      console.log('[DELETE_POST] 게시글 삭제 실패 (권한 없음):', postId, message);
      errorMessage = '게시글을 삭제할 권한이 없습니다.';
    } else {
      console.log('[DELETE_POST] 게시글 삭제 실패:', postId, message);
    }
    
    throw new Error(errorMessage);
  }
}

export async function likePost(postId: number): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', `/api/post/like/${postId}`);
}

export async function unlikePost(postId: number): Promise<MessageResponse> {
  return requestWithWebViewFallback<MessageResponse>('POST', `/api/post/unLike/${postId}`);
}
