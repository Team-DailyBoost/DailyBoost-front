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
  const formData = new FormData();
  formData.append('postCreateRequest', JSON.stringify(request));

  if (files && files.length > 0) {
    files.forEach((file, index) => {
      if (!file?.uri) return;
      formData.append(
        'files',
        {
          uri: file.uri,
          name: file.name || `post-${Date.now()}-${index}.jpg`,
          type: file.type || 'image/jpeg',
        } as any,
      );
    });
  }

  const response = await client.post<ApiResponse<MessageResponse>>('/api/post/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return extractApiValue(response);
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
