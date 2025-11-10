/**
 * Comment API
 * 
 * OpenAPI: /api/comment/**
 */
import client, { extractApiValue, ApiResponse } from './client';
import {
  CommentRequest,
  CommentUpdateRequest,
  CommentUnregisterRequest,
  CommentResponse,
  MessageResponse,
} from './types';

/**
 * 댓글 목록 조회
 * GET /api/comment/{postId}
 */
export async function getComments(postId: number): Promise<CommentResponse[]> {
  const response = await client.get<ApiResponse<CommentResponse[]>>(`/api/comment/${postId}`);
  return extractApiValue(response);
}

/**
 * 댓글 생성
 * POST /api/comment/create
 */
export async function createComment(request: CommentRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/comment/create', request);
  return extractApiValue(response);
}

/**
 * 댓글 수정
 * POST /api/comment/update
 */
export async function updateComment(request: CommentUpdateRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/comment/update', request);
  return extractApiValue(response);
}

/**
 * 댓글 삭제
 * POST /api/comment/unregister
 */
export async function deleteComment(request: CommentUnregisterRequest): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>('/api/comment/unregister', request);
  return extractApiValue(response);
}

/**
 * 댓글 좋아요
 * POST /api/comment/like/{commentId}
 */
export async function likeComment(commentId: number): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(`/api/comment/like/${commentId}`);
  return extractApiValue(response);
}

/**
 * 댓글 좋아요 취소
 * POST /api/comment/unLike/{commentId}
 */
export async function unlikeComment(commentId: number): Promise<MessageResponse> {
  const response = await client.post<ApiResponse<MessageResponse>>(`/api/comment/unLike/${commentId}`);
  return extractApiValue(response);
}

