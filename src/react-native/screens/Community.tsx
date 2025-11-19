import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, API_CONFIG } from '../../services/api';
import { createPost } from '../../api/posts';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

interface Post {
  id: string;
  author: string;
  authorId: string;
  authorProfileImage?: string | null;
  category: string;
  title: string;
  content: string;
  likes: number;
  likedBy: string[];
  comments: number;
  createdAt: string;
  time: string;
  displayDate: string;
  imageUrls?: string[];
  thumbnail?: string | null;
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  time: string;
  likes?: number;
  likedBy?: string[];
  imageUrl?: string | null;
}

interface CompetitionEntry {
  id: string;
  userId: string;
  userName: string;
  userHeight: number;
  userWeight: number;
  category: 'classic' | 'physique';
  weightClass: string;
  images: string[]; // 최소 3장의 이미지
  votes: number;
  votedBy: string[];
  submittedAt: string;
}

const POST_KIND_CATEGORY_MAP: Record<string, string> = {
  EXERCISE: '운동',
  FOOD: '식단',
  DIET: '질문',
};

const COMMUNITY_CATEGORY_ORDER = ['운동', '식단', '질문', '자유'];
const COMMUNITY_CATEGORY_FILTERS = ['전체', ...COMMUNITY_CATEGORY_ORDER];

const resolveImageUrl = (input?: string | null): string | null => {
  if (!input) return null;

  const raw = input.trim();
  if (!raw) return null;

  const toUploadsUrl = (filename: string) =>
    `${API_CONFIG.BASE_URL}/uploads/${filename}`;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  const filenameMatch = raw.match(/([^/\\]+)$/);
  const filename = filenameMatch ? filenameMatch[1] : undefined;

  if (raw.includes('upload-dir') && filename) {
    return toUploadsUrl(filename);
  }

  if (raw.startsWith('uploads/') && filename) {
    return toUploadsUrl(filename);
  }

  if (raw.startsWith('/uploads/') && filename) {
    return toUploadsUrl(filename);
  }

  if (raw.startsWith('/')) {
    return `${API_CONFIG.BASE_URL}${raw}`;
  }

  return `${API_CONFIG.BASE_URL}/${raw}`;
};

const normalizeImageValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return resolveImageUrl(value);
  }
  if (value && typeof value === 'object' && 'url' in (value as Record<string, unknown>)) {
    const maybeUrl = (value as Record<string, unknown>).url;
    if (typeof maybeUrl === 'string') {
      return resolveImageUrl(maybeUrl);
    }
  }
  return null;
};

const resolveImageList = (input?: unknown): string[] => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map(normalizeImageValue)
      .filter((url): url is string => Boolean(url));
  }
  const normalized = normalizeImageValue(input);
  return normalized ? [normalized] : [];
};

const formatPostDate = (input?: string | Date | null) => {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatAbsoluteDate = (input?: string | Date | null) => {
  if (!input) return '';
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const normalizePost = (raw: any, fallbackCategory?: string): Post => {
  const createdAtRaw =
    raw?.createdAt ??
    raw?.createAt ??
    raw?.time ??
    raw?.timestamp ??
    raw?.postedAt;

  const createdAtDate = createdAtRaw ? new Date(createdAtRaw) : null;
  const createdAtIso =
    createdAtDate && !Number.isNaN(createdAtDate.getTime())
      ? createdAtDate.toISOString()
      : null;

  const category =
    raw?.category ??
    POST_KIND_CATEGORY_MAP[raw?.postKind] ??
    fallbackCategory ??
    '운동';

  const authorId =
    raw?.authorId ??
    raw?.userId ??
    raw?.authorEmail ??
    raw?.email ??
    'unknown';

  const imageCandidates = [
    ...resolveImageList(raw?.imageUrls),
    ...resolveImageList(raw?.images),
    ...resolveImageList(raw?.image),
    ...resolveImageList(raw?.imageUrl),
  ];
  const imageUrls = Array.from(new Set(imageCandidates));
  const thumbnail =
    imageUrls[0] ??
    normalizeImageValue(raw?.thumbnail) ??
    normalizeImageValue(raw?.thumbnailUrl) ??
    null;

  return {
    id: String(raw?.id ?? raw?.postId ?? Date.now()),
    author: raw?.author ?? raw?.authorName ?? raw?.nickname ?? '익명',
    authorId: String(authorId),
    authorProfileImage:
      resolveImageUrl(
        raw?.authorProfileImage ??
          raw?.authorProfileImageUrl ??
          raw?.profileImage ??
          raw?.profileImageUrl ??
          null
      ),
    category,
    title: raw?.title ?? '',
    content: raw?.content ?? '',
    likes: Number(raw?.likes ?? raw?.likeCount ?? 0),
    likedBy: Array.isArray(raw?.likedBy) ? raw.likedBy.map((id: any) => String(id)) : [],
    comments: Number(raw?.comments ?? raw?.commentCount ?? 0),
    createdAt: createdAtIso ?? (createdAtRaw ? String(createdAtRaw) : ''),
    time: createdAtIso ? formatPostDate(createdAtIso) : '',
    displayDate: createdAtIso ? formatAbsoluteDate(createdAtIso) : '',
    imageUrls,
    thumbnail,
  };
};

const enrichPostsWithDetails = async (posts: Post[]): Promise<Post[]> => {
  const postsNeedingDetails = posts.filter(
    (post) => !post.createdAt || !post.displayDate || !post.time
  );

  if (postsNeedingDetails.length === 0) {
    return posts;
  }

  const uniqueIds = Array.from(new Set(postsNeedingDetails.map((post) => post.id)));

  const detailResults = await Promise.allSettled(
    uniqueIds.map(async (postId) => {
      try {
        const res = await api.get<any>(`${API_CONFIG.ENDPOINTS.GET_POST_DETAIL}/${postId}`);
        if (res.success && res.data?.createdAt) {
          const createdAtIso = new Date(res.data.createdAt).toISOString();
          const detailImages = resolveImageList(res.data.imageUrls);
          return {
            id: String(postId),
            createdAt: createdAtIso,
            time: formatPostDate(createdAtIso),
            displayDate: formatAbsoluteDate(createdAtIso),
            imageUrls: detailImages,
            thumbnail: detailImages[0] || null,
          };
        }
      } catch (error) {
        console.warn('⚠️ 게시글 상세 조회(날짜) 실패:', postId, error);
      }
      return null;
    })
  );

  const enrichmentMap = new Map<
    string,
    { createdAt: string; time: string; displayDate: string; imageUrls?: string[]; thumbnail?: string | null }
  >();

  detailResults.forEach((result) => {
    if (result.status === 'fulfilled' && result.value && result.value.createdAt) {
      enrichmentMap.set(result.value.id, {
        createdAt: result.value.createdAt,
        time: result.value.time,
        displayDate: result.value.displayDate,
        imageUrls: result.value.imageUrls,
        thumbnail:
          (result.value.thumbnail ??
            (result.value.imageUrls && result.value.imageUrls[0])) || null,
      });
    }
  });

  if (enrichmentMap.size === 0) {
    return posts;
  }

  return posts.map((post) => {
    const enriched = enrichmentMap.get(String(post.id));
    if (!enriched) return post;
    return {
      ...post,
      createdAt: enriched.createdAt,
      time: enriched.time,
      displayDate: enriched.displayDate,
      imageUrls: enriched.imageUrls && enriched.imageUrls.length > 0 ? enriched.imageUrls : post.imageUrls,
      thumbnail:
        (enriched.thumbnail ??
          post.thumbnail ??
          (post.imageUrls && post.imageUrls[0])) || null,
    };
  });
};

export function Community() {
  const [activeTab, setActiveTab] = useState<'posts' | 'competition'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: '운동',
  });
  const [competitionCategory, setCompetitionCategory] = useState<'classic' | 'physique'>('classic');
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [showPostDetailModal, setShowPostDetailModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [showCommentImageActionSheet, setShowCommentImageActionSheet] = useState(false);
  const [competitionImages, setCompetitionImages] = useState<string[]>([]);
  const [postImages, setPostImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showPostImageActionSheet, setShowPostImageActionSheet] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [followers, setFollowers] = useState<Record<string, number>>({});
  const [followingUsers, setFollowingUsers] = useState<Record<string, boolean>>({});
  const [userProfileImages, setUserProfileImages] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<any>({ email: 'user@example.com', name: '사용자', height: 175, weight: 70 });
  const [userId, setUserId] = useState<string>('user@example.com');
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostData, setEditPostData] = useState({ title: '', content: '' });
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('전체');
  const [loadingPosts, setLoadingPosts] = useState<boolean>(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const filteredByCategory = useMemo(
    () =>
      activeCategoryFilter === '전체'
        ? filteredPosts
        : filteredPosts.filter(post => post.category === activeCategoryFilter),
    [activeCategoryFilter, filteredPosts],
  );

  const sortedPosts = useMemo(() => {
    if (!filteredByCategory || filteredByCategory.length === 0) {
      return [];
    }

    return [...filteredByCategory].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredByCategory]);

  useEffect(() => {
    loadProfileImages();
  }, [posts]);

  useEffect(() => {
    // 실제 사용자 정보 로드
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('currentUser');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
          setUserId(parsed.email || parsed.id || 'user@example.com');
        }
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    })();
  }, []);

  const loadProfileImages = async () => {
    const imageMap: Record<string, string> = {};
    const missingAuthorIds: Set<string> = new Set();

    for (const post of posts) {
      if (post.authorProfileImage) {
        imageMap[post.authorId] = resolveImageUrl(post.authorProfileImage) || post.authorProfileImage;
        try {
          await AsyncStorage.setItem(
            `profileImage_${post.authorId}`,
            post.authorProfileImage
          );
        } catch {}
      } else if (!imageMap[post.authorId]) {
        missingAuthorIds.add(post.authorId);
      }
    }

    for (const authorId of missingAuthorIds) {
      try {
        const saved = await AsyncStorage.getItem(`profileImage_${authorId}`);
        if (saved) {
          imageMap[authorId] = resolveImageUrl(saved) || saved;
        }
      } catch {}
    }

    setUserProfileImages(imageMap);
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoadingPosts(true);
      try {
        const [exerciseRes, foodRes, dietRes] = await Promise.all([
          api.get<any[]>(`${API_CONFIG.ENDPOINTS.GET_POSTS}?postKind=EXERCISE`),
          api.get<any[]>(`${API_CONFIG.ENDPOINTS.GET_POSTS}?postKind=FOOD`),
          api.get<any[]>(`${API_CONFIG.ENDPOINTS.GET_POSTS}?postKind=DIET`),
        ]);

        const allPosts: Post[] = [];
        const categoryMap = ['운동', '식단', '질문'];

        [exerciseRes, foodRes, dietRes].forEach((res, index) => {
          if (res.success && Array.isArray(res.data)) {
            const transformedPosts = res.data.map((post: any) =>
              normalizePost(post, categoryMap[index])
            );
            allPosts.push(...transformedPosts);
          }
        });

        if (allPosts.length > 0) {
          const enrichedPosts = await enrichPostsWithDetails(allPosts);
          if (isMounted) {
            setPosts(enrichedPosts);
            await AsyncStorage.setItem('communityPosts', JSON.stringify(enrichedPosts));
          }
        } else {
          const savedPosts = await AsyncStorage.getItem('communityPosts');
          if (savedPosts && isMounted) {
            const parsed: any[] = JSON.parse(savedPosts);
            setPosts(parsed.map(item => normalizePost(item)));
          }
        }

        const savedCompetition = await AsyncStorage.getItem('competitionEntries');
        if (savedCompetition && isMounted) setCompetitionEntries(JSON.parse(savedCompetition));
        
        const currentUserId = userId;
        const savedFollowing = await AsyncStorage.getItem(`following_${currentUserId}`);
        if (savedFollowing && isMounted) setFollowing(JSON.parse(savedFollowing));
      } catch (error) {
        console.error('Failed to load data:', error);
        try {
          const savedPosts = await AsyncStorage.getItem('communityPosts');
          if (savedPosts && isMounted) {
            const parsed: any[] = JSON.parse(savedPosts);
            setPosts(parsed.map(item => normalizePost(item)));
          }
          const savedCompetition = await AsyncStorage.getItem('competitionEntries');
          if (savedCompetition && isMounted) setCompetitionEntries(JSON.parse(savedCompetition));
          const currentUserId = userId;
          const savedFollowing = await AsyncStorage.getItem(`following_${currentUserId}`);
          if (savedFollowing && isMounted) setFollowing(JSON.parse(savedFollowing));
        } catch (fallbackError) {
          console.error('Failed to load from local storage:', fallbackError);
        }
      } finally {
        if (isMounted) {
          setLoadingPosts(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [userId]);

  const loadComments = async (postId: string) => {
    try {
      // 댓글 상세 조회로 이미지 URL 포함 정보 가져오기 (CommentResponse에는 imageUrl 있음)
      // 이 API를 우선 사용하여 이미지 정보를 확보
      const res = await api.get<Comment[]>(`${API_CONFIG.ENDPOINTS.GET_COMMENTS}/${postId}`);
      
      // 게시글 상세 조회로 댓글 기본 정보 가져오기 (authorName 포함)
      let commentInfosMap: Map<string, any> = new Map();
      const postDetailRes = await api.get<any>(`${API_CONFIG.ENDPOINTS.GET_POST_DETAIL}/${postId}`);
      if (postDetailRes.success && postDetailRes.data) {
        const postData = postDetailRes.data; // PostResponse
        
        // PostResponse를 로컬 Post 형식으로 변환하여 selectedPost 업데이트
        if (selectedPost && selectedPost.id === postId) {
          const createdAtIso = postData.createdAt
            ? new Date(postData.createdAt).toISOString()
            : selectedPost.createdAt;
          const resolvedImages = Array.isArray(postData.imageUrls)
            ? postData.imageUrls
                .map((url: string) => resolveImageUrl(url))
                .filter((url): url is string => Boolean(url))
            : selectedPost.imageUrls;
          const updatedPost: Post = {
            ...selectedPost,  // 기존 데이터 유지
            title: postData.title || selectedPost.title,
            content: postData.content || selectedPost.content,
            author: postData.authorName || selectedPost.author,
            authorProfileImage:
              resolveImageUrl(postData.authorProfileImageUrl) || selectedPost.authorProfileImage,
            likes: postData.likeCount || selectedPost.likes,
            comments: postData.commentCount || selectedPost.comments,
            createdAt: createdAtIso,
            time: formatPostDate(createdAtIso),
            displayDate: formatAbsoluteDate(createdAtIso),
            imageUrls: resolvedImages || [],
            thumbnail: resolvedImages && resolvedImages.length > 0 ? resolvedImages[0] : selectedPost.thumbnail,
          };
          setSelectedPost(updatedPost);
        }
        
        // CommentInfo에서 기본 정보 추출 (이미지 URL은 없음)
        if (postData.commentInfos && Array.isArray(postData.commentInfos)) {
          postData.commentInfos.forEach((comment: any) => {
            const commentId = String(comment.commentId || Date.now());
            commentInfosMap.set(commentId, {
              author: comment.authorName || '익명',
              authorId: comment.authorId || String(comment.userId) || 'unknown',
              content: comment.content || comment.comment,
              time: formatPostDate(comment.createAt || comment.createdAt || new Date()),
              likes: comment.likeCount || 0,
            });
          });
        }
      }
      
      if (res.success && Array.isArray(res.data)) {
        // 디버깅: 백엔드 응답 확인
        console.log('📦 CommentResponse 데이터:', JSON.stringify(res.data, null, 2));
        
        // 백엔드 응답 구조 변환: CommentResponse → Comment
        // CommentResponse 필드: comment, createAt, likeCount, unLikeCount, imageUrl
        const transformedComments = res.data.map((comment: any, index: number) => {
          // CommentResponse의 필드명 확인: comment (내용), imageUrl (이미지 URL)
          const rawImageUrl = comment.imageUrl || comment.image?.url || comment.image?.imageUrl || null;
          const commentContent = comment.comment || comment.content || '';
          
          console.log(`📝 댓글 ${index}:`, {
            content: commentContent,
            imageUrl: rawImageUrl,
            hasImageUrl: !!rawImageUrl,
            fullComment: comment
          });
          
          // CommentInfo에서 content로 매핑 시도
          let matchedCommentInfo: any = null;
          let matchedCommentId: string | null = null;
          
          if (commentInfosMap.size > 0) {
            // content로 매핑 (정확한 매칭)
            for (const [id, info] of commentInfosMap.entries()) {
              if (info.content === commentContent || info.content?.trim() === commentContent?.trim()) {
                matchedCommentInfo = info;
                matchedCommentId = id;
                break;
              }
            }
            // 매핑 실패 시 index로 매핑 (순서 기반)
            if (!matchedCommentInfo && index < commentInfosMap.size) {
              const infoArray = Array.from(commentInfosMap.entries());
              const [id, info] = infoArray[index];
              matchedCommentInfo = info;
              matchedCommentId = id;
            }
          }
          
          // 이미지 URL 처리 - rawImageUrl이 있으면 반드시 resolveImageUrl 적용
          const resolvedImageUrl = rawImageUrl ? resolveImageUrl(rawImageUrl) : null;
          console.log(`🖼️ 이미지 URL 처리 [${index}]:`, {
            raw: rawImageUrl,
            resolved: resolvedImageUrl,
            willShow: !!resolvedImageUrl
          });
          
          const finalComment = {
            id: matchedCommentId || String(comment.commentId || comment.id || `temp_${Date.now()}_${index}`),
            postId: postId,
            author: matchedCommentInfo?.author || comment.authorName || '익명',
            authorId: matchedCommentInfo?.authorId || String(comment.authorId || comment.userId || 'unknown'),
            content: matchedCommentInfo?.content || commentContent,
            time: matchedCommentInfo?.time || formatPostDate(comment.createAt || comment.createdAt || new Date()),
            likes: matchedCommentInfo?.likes || comment.likeCount || 0,
            imageUrl: resolvedImageUrl, // 이미지 URL 저장
          };
          
          console.log(`✅ 최종 댓글 [${index}]:`, {
            id: finalComment.id,
            content: finalComment.content.substring(0, 20) + '...',
            hasImage: !!finalComment.imageUrl,
            imageUrl: finalComment.imageUrl
          });
          
          return finalComment;
        });
        
        // CommentInfo가 있지만 CommentResponse에 없는 경우 추가 (이미지 없는 댓글)
        // content로 매핑하여 중복 제거
        if (commentInfosMap.size > 0) {
          const usedContents = new Set(transformedComments.map(c => c.content?.trim()));
          
          commentInfosMap.forEach((info, commentId) => {
            // 이미 매핑된 content가 아니면 추가 (이미지 없는 댓글)
            if (!usedContents.has(info.content?.trim())) {
              transformedComments.push({
                id: commentId,
                postId: postId,
                ...info,
                imageUrl: null, // CommentInfo에는 이미지가 없음
              });
              usedContents.add(info.content?.trim());
            }
          });
        }
        
        // ID 중복 제거 (같은 ID를 가진 댓글이 있으면 최신 것만 유지)
        const uniqueComments = new Map<string, Comment>();
        transformedComments.forEach(comment => {
          const existing = uniqueComments.get(comment.id);
          // 이미지가 있는 댓글이 우선순위가 높음
          if (!existing || (comment.imageUrl && !existing.imageUrl)) {
            uniqueComments.set(comment.id, comment);
          }
        });
        
        const finalComments = Array.from(uniqueComments.values());
        
        console.log('🎯 최종 댓글 목록:', finalComments.map(c => ({
          id: c.id,
          content: c.content.substring(0, 20) + '...',
          hasImage: !!c.imageUrl,
          imageUrl: c.imageUrl
        })));
        
        setComments(finalComments);
      } else if (commentInfosMap.size > 0) {
        // CommentResponse 조회 실패 시 CommentInfo만 사용
        const transformedComments = Array.from(commentInfosMap.entries()).map(([commentId, info]) => ({
          id: commentId,
          postId: postId,
          ...info,
          imageUrl: null, // CommentInfo에는 이미지가 없음
        }));
        setComments(transformedComments);
      } else {
        // 로컬 저장소에서 댓글 가져오기
        const savedComments = await AsyncStorage.getItem(`comments_${postId}`);
        if (savedComments) {
          const parsed: Comment[] = JSON.parse(savedComments);
          setComments(
            parsed.map(comment => ({
              ...comment,
              time: formatPostDate(comment.time) || String(comment.time || ''),
            }))
          );
        } else {
          setComments([]);
        }
      }
    } catch (error) {
      console.warn('댓글 로드 실패:', error);
      // 로컬 저장소에서 댓글 가져오기
      const savedComments = await AsyncStorage.getItem(`comments_${postId}`);
      if (savedComments) {
        const parsed: Comment[] = JSON.parse(savedComments);
        setComments(
          parsed.map(comment => ({
            ...comment,
            time: formatPostDate(comment.time) || String(comment.time || ''),
          }))
        );
      } else {
        setComments([]);
      }
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || (!newComment.trim() && !commentImage)) {
      Alert.alert('알림', '댓글 내용 또는 이미지를 입력해주세요');
      return;
    }

    // 백엔드에 댓글 추가 (postId는 Long 타입이므로 number로 변환)
    try {
      let res;
      
      // 백엔드가 @RequestPart를 사용하므로 항상 FormData로 전송
      const formData = new FormData();
      formData.append('commentRequest', JSON.stringify({
        postId: Number(selectedPost.id),
        content: newComment.trim() || ' ',
      }));
      
      // 이미지가 있으면 file 추가
      if (commentImage) {
        formData.append('file', {
          uri: commentImage.uri,
          name: commentImage.fileName || `comment-${Date.now()}.${commentImage.mimeType?.split('/')?.[1] ?? 'jpg'}`,
          type: commentImage.mimeType || 'image/jpeg',
        } as any);
      }
      
      // FormData를 사용할 때는 Content-Type을 설정하지 않음
      // axios가 자동으로 boundary를 포함한 올바른 Content-Type을 설정함
      res = await api.post(API_CONFIG.ENDPOINTS.CREATE_COMMENT, formData, {
        headers: {
          'Content-Type': undefined, // React Native에서 FormData 사용 시 자동 설정되도록
        },
      });

      if (res.success) {
        // 백엔드 성공 시 댓글 목록 새로고침
        await loadComments(selectedPost.id);
        
        // 게시글 상세 정보도 새로고침하여 댓글 수 업데이트
        try {
          const postDetailRes = await api.get<any>(`${API_CONFIG.ENDPOINTS.GET_POST_DETAIL}/${selectedPost.id}`);
          if (postDetailRes.success && postDetailRes.data) {
            const postData = postDetailRes.data;
            const updatedPost: Post = {
              ...selectedPost,
              comments: postData.commentCount || selectedPost.comments + 1,
            };
            setSelectedPost(updatedPost);
            
            // 목록에서도 업데이트
            const updatedPosts = posts.map(post => {
              if (post.id === selectedPost.id) {
                return updatedPost;
              }
              return post;
            });
            setPosts(updatedPosts);
            await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
          } else {
            // 게시글 상세 조회 실패 시 로컬에서 댓글 수만 증가
            const updatedPosts = posts.map(post => {
              if (post.id === selectedPost.id) {
                return { ...post, comments: (post.comments || 0) + 1 };
              }
              return post;
            });
            setPosts(updatedPosts);
            setSelectedPost({
              ...selectedPost,
              comments: (selectedPost.comments || 0) + 1,
            });
          }
        } catch (refreshError) {
          // 게시글 상세 조회 실패 시 로컬에서 댓글 수만 증가
          const updatedPosts = posts.map(post => {
            if (post.id === selectedPost.id) {
              return { ...post, comments: (post.comments || 0) + 1 };
            }
            return post;
          });
          setPosts(updatedPosts);
          setSelectedPost({
            ...selectedPost,
            comments: (selectedPost.comments || 0) + 1,
          });
        }
        
        setNewComment('');
        setCommentImage(null);
        Alert.alert('완료', '댓글이 작성되었습니다.');
      } else {
        const errorMsg = res.error || '댓글 작성에 실패했습니다.';
        if (errorMsg.includes('인증') || errorMsg.includes('OAuth2')) {
          Alert.alert('알림', '댓글 작성은 OAuth2 소셜 로그인(카카오/네이버)이 필요합니다.');
        } else {
          Alert.alert('오류', errorMsg);
        }
      }
    } catch (error: any) {
      const errorMsg = error.message || '댓글 작성에 실패했습니다.';
      if (errorMsg.includes('인증') || errorMsg.includes('OAuth2')) {
        Alert.alert('알림', '댓글 작성은 OAuth2 소셜 로그인(카카오/네이버)이 필요합니다.');
      } else {
        Alert.alert('오류', errorMsg);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      '게시글 삭제',
      '정말 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post(`${API_CONFIG.ENDPOINTS.DELETE_POST}/${postId}`, {});
              if (res.success) {
                // 성공 시 목록에서 제거
                const updatedPosts = posts.filter(p => p.id !== postId);
                setPosts(updatedPosts);
                await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
                
                // 상세 모달이 열려있으면 닫기
                if (selectedPost && selectedPost.id === postId) {
                  setShowPostDetailModal(false);
                  setSelectedPost(null);
                }
                
                Alert.alert('완료', '게시글이 삭제되었습니다.');
              } else {
                Alert.alert('오류', res.error || '게시글 삭제에 실패했습니다.');
              }
            } catch (error: any) {
              Alert.alert('오류', error.message || '게시글 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleEditPost = async () => {
    if (!editingPost || !editPostData.title.trim() || !editPostData.content.trim()) {
      Alert.alert('알림', '제목과 내용을 입력해주세요');
      return;
    }

    try {
      const res = await api.post(API_CONFIG.ENDPOINTS.UPDATE_POST, {
        postId: Number(editingPost.id),
        title: editPostData.title.trim(),
        content: editPostData.content.trim(),
      });

      if (res.success) {
        // 성공 시 목록 업데이트
        const updatedPosts = posts.map(post => {
          if (post.id === editingPost.id) {
            return {
              ...post,
              title: editPostData.title.trim(),
              content: editPostData.content.trim(),
            };
          }
          return post;
        });
        setPosts(updatedPosts);
        await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
        
        // 상세 모달에서도 업데이트
        if (selectedPost && selectedPost.id === editingPost.id) {
          setSelectedPost({
            ...selectedPost,
            title: editPostData.title.trim(),
            content: editPostData.content.trim(),
          });
        }
        
        setShowEditPostModal(false);
        setEditingPost(null);
        setEditPostData({ title: '', content: '' });
        Alert.alert('완료', '게시글이 수정되었습니다.');
      } else {
        Alert.alert('오류', res.error || '게시글 수정에 실패했습니다.');
      }
    } catch (error: any) {
      Alert.alert('오류', error.message || '게시글 수정에 실패했습니다.');
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    Alert.alert(
      '댓글 삭제',
      '정말 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.post(API_CONFIG.ENDPOINTS.DELETE_COMMENT, {
                commentId: Number(commentId),
                postId: Number(postId),
              });

              if (res.success) {
                // 성공 시 댓글 목록 새로고침
                await loadComments(postId);
                
                // 게시글의 댓글 수 업데이트
                const updatedPosts = posts.map(post => {
                  if (post.id === postId) {
                    return { ...post, comments: Math.max((post.comments || 1) - 1, 0) };
                  }
                  return post;
                });
                setPosts(updatedPosts);
                await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
              } else {
                Alert.alert('오류', res.error || '댓글 삭제에 실패했습니다.');
              }
            } catch (error: any) {
              Alert.alert('오류', error.message || '댓글 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleLike = async (postId: string) => {
    // 현재 게시글의 좋아요 상태 확인
    const currentPost = posts.find(p => p.id === postId);
    const hasLiked = currentPost?.likedBy.includes(userId) || false;
    
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: hasLiked ? post.likes - 1 : post.likes + 1,
          likedBy: hasLiked
            ? post.likedBy.filter(id => id !== userId)
            : [...post.likedBy, userId],
        };
      }
      return post;
    });
    setPosts(updatedPosts);
    
    // 선택된 게시글이면 상세 화면도 업데이트
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(updatedPosts.find(p => p.id === postId) || selectedPost);
    }
    
    await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
    // backend
    try { 
      // 좋아요 취소는 unLike API, 좋아요는 like API 사용
      const endpoint = hasLiked 
        ? `${API_CONFIG.ENDPOINTS.UNLIKE_POST}/${postId}`
        : `${API_CONFIG.ENDPOINTS.LIKE_POST}/${postId}`;
      await api.post(endpoint, {}); 
    } catch {}
  };

  const handleVote = async (entryId: string) => {
    const updated = competitionEntries.map(entry => {
      if (entry.id === entryId) {
        const hasVoted = entry.votedBy.includes(userId);
        return {
          ...entry,
          votes: hasVoted ? entry.votes - 1 : entry.votes + 1,
          votedBy: hasVoted
            ? entry.votedBy.filter(id => id !== userId)
            : [...entry.votedBy, userId],
        };
      }
      return entry;
    });
    setCompetitionEntries(updated);
    await AsyncStorage.setItem('competitionEntries', JSON.stringify(updated));
  };

  const canParticipate = (category: 'classic' | 'physique') => {
    const weightClasses = {
      classic: [
        { name: '165cm 이하', heightMin: 0, heightMax: 165, weightLimit: 70 },
        { name: '170cm 이하', heightMin: 165.1, heightMax: 170, weightLimit: 75 },
        { name: '175cm 이하', heightMin: 170.1, heightMax: 175, weightLimit: 80 },
        { name: '180cm 이하', heightMin: 175.1, heightMax: 180, weightLimit: 85 },
        { name: '180cm 초과', heightMin: 180.1, heightMax: 999, weightLimit: 90 },
      ],
      physique: [
        { name: '165cm 이하', heightMin: 0, heightMax: 165, weightLimit: 65 },
        { name: '170cm 이하', heightMin: 165.1, heightMax: 170, weightLimit: 70 },
        { name: '175cm 이하', heightMin: 170.1, heightMax: 175, weightLimit: 75 },
        { name: '180cm 이하', heightMin: 175.1, heightMax: 180, weightLimit: 80 },
        { name: '180cm 초과', heightMin: 180.1, heightMax: 999, weightLimit: 85 },
      ],
    };

    const classes = weightClasses[category];
    return classes.some(c =>
      currentUser.height >= c.heightMin &&
      currentUser.height <= c.heightMax &&
      currentUser.weight <= c.weightLimit
    );
  };

  const pickCompetitionImage = async () => {
    if (competitionImages.length >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('알림', '사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setCompetitionImages([...competitionImages, result.assets[0].uri]);
    }
  };

  const removeCompetitionImage = (index: number) => {
    setCompetitionImages(competitionImages.filter((_, i) => i !== index));
  };

  const pickPostImageFromLibrary = useCallback(async () => {
    if (postImages.length >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('알림', '사진 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPostImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('갤러리 열기 실패:', error);
      Alert.alert('알림', '갤러리를 여는 중 문제가 발생했습니다.');
    }
  }, [postImages]);

  const pickPostImageFromCamera = useCallback(async () => {
    if (postImages.length >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 업로드할 수 있습니다.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('알림', '카메라 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setPostImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('카메라 실행 실패:', error);
      Alert.alert('알림', '카메라를 여는 중 문제가 발생했습니다.');
    }
  }, [postImages]);

  const removePostImage = useCallback((index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const pickCommentImageFromLibrary = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('알림', '사진 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets?.[0]) {
        setCommentImage(result.assets[0]);
      }
    } catch (error) {
      console.error('갤러리 열기 실패:', error);
      Alert.alert('알림', '갤러리를 여는 중 문제가 발생했습니다.');
    }
  }, []);

  const pickCommentImageFromCamera = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('알림', '카메라 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setCommentImage(result.assets[0]);
      }
    } catch (error) {
      console.error('카메라 실행 실패:', error);
      Alert.alert('알림', '카메라를 여는 중 문제가 발생했습니다.');
    }
  }, []);

  const removeCommentImage = useCallback(() => {
    setCommentImage(null);
  }, []);

  const resetNewPostForm = useCallback(() => {
    setNewPost({ title: '', content: '', category: '운동' });
    setPostImages([]);
  }, []);

  const closeWriteModal = useCallback(() => {
    resetNewPostForm();
    setShowWriteModal(false);
  }, [resetNewPostForm]);

  const refreshPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const [exerciseRes, foodRes, dietRes] = await Promise.all([
        api.get<any[]>(`${API_CONFIG.ENDPOINTS.GET_POSTS}?postKind=EXERCISE`),
        api.get<any[]>(`${API_CONFIG.ENDPOINTS.GET_POSTS}?postKind=FOOD`),
        api.get<any[]>(`${API_CONFIG.ENDPOINTS.GET_POSTS}?postKind=DIET`),
      ]);

      const allPosts: Post[] = [];
      const categoryMap = ['운동', '식단', '질문'];

      [exerciseRes, foodRes, dietRes].forEach((res, index) => {
        if (res.success && Array.isArray(res.data)) {
          const transformedPosts = res.data.map((post: any) =>
            normalizePost(post, categoryMap[index])
          );
          allPosts.push(...transformedPosts);
        }
      });

      if (allPosts.length > 0) {
        const enrichedPosts = await enrichPostsWithDetails(allPosts);
        setPosts(enrichedPosts);
        await AsyncStorage.setItem('communityPosts', JSON.stringify(enrichedPosts));
      } else {
        const savedPosts = await AsyncStorage.getItem('communityPosts');
        if (savedPosts) {
          const parsed: any[] = JSON.parse(savedPosts);
          setPosts(parsed.map(item => normalizePost(item)));
        }
      }

      const savedCompetition = await AsyncStorage.getItem('competitionEntries');
      if (savedCompetition) setCompetitionEntries(JSON.parse(savedCompetition));
      
      const currentUserId = userId;
      const savedFollowing = await AsyncStorage.getItem(`following_${currentUserId}`);
      if (savedFollowing) setFollowing(JSON.parse(savedFollowing));
    } catch (error) {
      console.error('Failed to load data:', error);
      try {
        const savedPosts = await AsyncStorage.getItem('communityPosts');
        if (savedPosts) {
          const parsed: any[] = JSON.parse(savedPosts);
          setPosts(parsed.map(item => normalizePost(item)));
        }
        const savedCompetition = await AsyncStorage.getItem('competitionEntries');
        if (savedCompetition) setCompetitionEntries(JSON.parse(savedCompetition));
        const currentUserId = userId;
        const savedFollowing = await AsyncStorage.getItem(`following_${currentUserId}`);
        if (savedFollowing) setFollowing(JSON.parse(savedFollowing));
      } catch (fallbackError) {
        console.error('Failed to load from local storage:', fallbackError);
      }
    } finally {
      setLoadingPosts(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshPosts();
  }, [refreshPosts]);

  const handleFollow = async (targetUserId: string) => {
    if (targetUserId === userId) {
      Alert.alert('알림', '본인은 팔로우할 수 없습니다.');
      return;
    }

    const isFollowing = followingUsers[targetUserId] || false;
    const newFollowingUsers = {
      ...followingUsers,
      [targetUserId]: !isFollowing,
    };
    setFollowingUsers(newFollowingUsers);

    // 팔로워 수 업데이트
    const newFollowers = { ...followers };
    if (!isFollowing) {
      newFollowers[targetUserId] = (newFollowers[targetUserId] || 0) + 1;
    } else {
      newFollowers[targetUserId] = Math.max((newFollowers[targetUserId] || 1) - 1, 0);
    }
    setFollowers(newFollowers);

    // 로컬 저장
    await AsyncStorage.setItem(`followingUsers_${userId}`, JSON.stringify(newFollowingUsers));
    await AsyncStorage.setItem(`followers_${targetUserId}`, JSON.stringify(newFollowers[targetUserId] || 0));
  };

  useEffect(() => {
    (async () => {
      if (selectedUser) {
        const savedFollowing = await AsyncStorage.getItem(`followingUsers_${userId}`);
        if (savedFollowing) {
          setFollowingUsers(JSON.parse(savedFollowing));
        }
        const savedFollowers = await AsyncStorage.getItem(`followers_${selectedUser.id}`);
        if (savedFollowers) {
          const followerCount = JSON.parse(savedFollowers);
          setFollowers(prev => ({ ...prev, [selectedUser.id]: followerCount }));
        }
      }
    })();
  }, [selectedUser, userId]); // userId 의존성 추가
  useEffect(() => {
    if (searchQuery.trim()) {
      // 백엔드 검색 API 호출
      (async () => {
        try {
          const res = await api.get<any[]>(`${API_CONFIG.ENDPOINTS.SEARCH_POSTS}?title=${encodeURIComponent(searchQuery)}`);
          if (res.success && Array.isArray(res.data)) {
            const transformedPosts = res.data.map((post: any) =>
              normalizePost(post)
            );
            setFilteredPosts(transformedPosts);
          } else {
            // 백엔드 검색 실패 시 로컬 필터링
            const localFiltered = posts.filter(
              post =>
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.content.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredPosts(localFiltered);
          }
        } catch (error) {
          // 에러 발생 시 로컬 필터링
          const localFiltered = posts.filter(
            post =>
              post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              post.content.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setFilteredPosts(localFiltered);
        }
      })();
    } else {
      setFilteredPosts(posts);
    }
  }, [searchQuery, posts]);

  const classicEntries = competitionEntries
    .filter(e => e.category === 'classic')
    .sort((a, b) => b.votes - a.votes);

  const physiqueEntries = competitionEntries
    .filter(e => e.category === 'physique')
    .sort((a, b) => b.votes - a.votes);

  const renderPostCard = (post: Post) => (
    <TouchableOpacity
      key={post.id}
      onPress={() => {
        setSelectedPost(post);
        loadComments(post.id);
        setShowPostDetailModal(true);
      }}
    >
      <Card style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postAuthorContainer}>
            {userProfileImages[post.authorId] ? (
              <Image 
                source={{ uri: userProfileImages[post.authorId] }} 
                style={styles.postAuthorAvatar}
              />
            ) : (
              <View style={styles.postAuthorAvatarPlaceholder}>
                <Text style={styles.postAuthorAvatarText}>
                  {post.author?.charAt(0)?.toUpperCase() || '👤'}
                </Text>
              </View>
            )}
            <View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedUser({ id: post.authorId, name: post.author });
                  setShowProfileModal(true);
                }}
              >
                <Text style={styles.postAuthor}>{post.author}</Text>
              </TouchableOpacity>
              <Text style={styles.postTime}>
                {post.displayDate}
                {post.time ? ` · ${post.time}` : ''}
              </Text>
            </View>
          </View>
              <Badge>{post.category}</Badge>
        </View>

        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postContent} numberOfLines={2}>
          {post.content}
        </Text>

        {(post.imageUrls && post.imageUrls.length > 0) || post.thumbnail ? (
          <View style={styles.postImageWrapper}>
            <Image
              source={{ uri: (post.imageUrls && post.imageUrls[0]) || post.thumbnail! }}
              style={styles.postImage}
            />
            {post.imageUrls && post.imageUrls.length > 1 && (
              <View style={styles.postImageBadge}>
                <Text style={styles.postImageBadgeText}>+{post.imageUrls.length - 1}</Text>
              </View>
            )}
          </View>
        ) : null}

        <View style={styles.postFooter}>
          <TouchableOpacity
            style={styles.likeButton}
            onPress={(e) => {
              e.stopPropagation();
              handleLike(post.id);
            }}
          >
            <Text style={styles.likeIcon}>
              {post.likedBy.includes(userId) ? '❤️' : '🤍'}
            </Text>
            <Text style={styles.likeCount}>{post.likes}</Text>
          </TouchableOpacity>
          <View style={styles.commentButton}>
            <Text style={styles.commentIcon}>💬</Text>
            <Text style={styles.commentCount}>{post.comments}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>커뮤니티</Text>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => {
            resetNewPostForm();
            setShowWriteModal(true);
          }}
        >
          <Text style={styles.writeButtonText}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Text style={[styles.tabText, activeTab === 'posts' && styles.tabTextActive]}>
            게시글
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'competition' && styles.tabActive]}
          onPress={() => setActiveTab('competition')}
        >
          <Text style={[styles.tabText, activeTab === 'competition' && styles.tabTextActive]}>
            대회
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'posts' ? (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollViewContent}
        >
          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="게시물 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilterRow}
          >
            {COMMUNITY_CATEGORY_FILTERS.map(category => (
              <TouchableOpacity
                key={`filter-${category}`}
                style={[
                  styles.categoryFilterChip,
                  activeCategoryFilter === category && styles.categoryFilterChipActive,
                ]}
                onPress={() => setActiveCategoryFilter(category)}
              >
                <Text
                  style={[
                    styles.categoryFilterChipText,
                    activeCategoryFilter === category && styles.categoryFilterChipTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Posts */}
          {loadingPosts ? (
            <View style={styles.postsLoadingState}>
              <ActivityIndicator size="small" color="#6366F1" />
              <Text style={styles.postsLoadingText}>게시글을 불러오는 중입니다...</Text>
            </View>
          ) : sortedPosts.length === 0 ? (
            <View style={styles.postsEmptyState}>
              <Text style={styles.postsEmptyText}>표시할 게시글이 없습니다.</Text>
              <Text style={styles.postsEmptySubtext}>새 글을 작성하거나 검색어를 변경해보세요.</Text>
            </View>
          ) : (
            sortedPosts.map(renderPostCard)
          )}
        </ScrollView>
      ) : (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollViewContent}
        >
          <Card style={styles.competitionCard}>
            <View style={styles.competitionHeader}>
              <Text style={styles.cardTitle}>🏆 피지크 대회</Text>
              <Button
                title="참가 신청"
                onPress={() => setShowCompetitionModal(true)}
              />
            </View>
            <Text style={styles.competitionDesc}>
              사진을 업로드하고 투표를 받아보세요!
            </Text>

            {/* Competition Categories */}
            <View style={styles.competitionTabs}>
              <TouchableOpacity
                style={[
                  styles.competitionTab,
                  competitionCategory === 'classic' && styles.competitionTabActive,
                ]}
                onPress={() => setCompetitionCategory('classic')}
              >
                <Text
                  style={[
                    styles.competitionTabText,
                    competitionCategory === 'classic' && styles.competitionTabTextActive,
                  ]}
                >
                  클래식 피지크
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.competitionTab,
                  competitionCategory === 'physique' && styles.competitionTabActive,
                ]}
                onPress={() => setCompetitionCategory('physique')}
              >
                <Text
                  style={[
                    styles.competitionTabText,
                    competitionCategory === 'physique' && styles.competitionTabTextActive,
                  ]}
                >
                  피지크
                </Text>
              </TouchableOpacity>
            </View>

            {/* Entries */}
            {(competitionCategory === 'classic' ? classicEntries : physiqueEntries).map(
              (entry, idx) => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryRank}>
                    <Text style={styles.entryRankText}>#{idx + 1}</Text>
                  </View>
                  {entry.images && entry.images.length > 0 && (
                    <Image source={{ uri: entry.images[0] }} style={styles.entryImage} />
                  )}
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryName}>{entry.userName}</Text>
                    <Text style={styles.entryDetails}>
                      {entry.weightClass} | {entry.userHeight}cm / {entry.userWeight}kg
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.voteButton,
                        entry.votedBy.includes(userId) && styles.voteButtonActive,
                      ]}
                      onPress={() => handleVote(entry.id)}
                    >
                      <Text style={styles.voteButtonText}>
                        {entry.votedBy.includes(userId) ? '❤️' : '🤍'} {entry.votes}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            )}
          </Card>
        </ScrollView>
      )}

      {/* Post Image Action Sheet */}
      <Modal
        visible={showPostImageActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPostImageActionSheet(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheetContainer}>
            <Text style={styles.actionSheetTitle}>사진 업로드</Text>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => {
                setShowPostImageActionSheet(false);
                pickPostImageFromCamera();
              }}
            >
              <Text style={styles.actionSheetButtonText}>📷 카메라로 촬영</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => {
                setShowPostImageActionSheet(false);
                pickPostImageFromLibrary();
              }}
            >
              <Text style={styles.actionSheetButtonText}>🖼 갤러리에서 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetButton, styles.actionSheetCancelButton]}
              onPress={() => setShowPostImageActionSheet(false)}
            >
              <Text style={[styles.actionSheetButtonText, styles.actionSheetCancelButtonText]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Comment Image Action Sheet */}
      <Modal
        visible={showCommentImageActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCommentImageActionSheet(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheetContainer}>
            <Text style={styles.actionSheetTitle}>댓글 사진 업로드</Text>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => {
                setShowCommentImageActionSheet(false);
                pickCommentImageFromCamera();
              }}
            >
              <Text style={styles.actionSheetButtonText}>📷 카메라로 촬영</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => {
                setShowCommentImageActionSheet(false);
                pickCommentImageFromLibrary();
              }}
            >
              <Text style={styles.actionSheetButtonText}>🖼 갤러리에서 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetButton, styles.actionSheetCancelButton]}
              onPress={() => setShowCommentImageActionSheet(false)}
            >
              <Text style={[styles.actionSheetButtonText, styles.actionSheetCancelButtonText]}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Write Post Modal */}
      <Modal
        visible={showWriteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeWriteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>게시글 작성</Text>

            <Text style={styles.modalLabel}>카테고리</Text>
            <View style={styles.modalRow}>
              {['운동', '식단', '질문', '자유'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    newPost.category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setNewPost({ ...newPost, category: cat })}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      newPost.category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>제목</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="제목을 입력하세요"
              value={newPost.title}
              onChangeText={text => setNewPost({ ...newPost, title: text })}
            />

            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="내용을 입력하세요"
              multiline
              numberOfLines={6}
              value={newPost.content}
              onChangeText={text => setNewPost({ ...newPost, content: text })}
            />

            <Text style={styles.modalLabel}>사진 첨부 (최대 3장)</Text>
            <View style={styles.imageGrid}>
              {postImages.map((image, index) => (
                <View key={`${image.uri}-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removePostImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {postImages.length < 3 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => setShowPostImageActionSheet(true)}
                >
                  <Text style={styles.addImageText}>+</Text>
                  <Text style={styles.addImageLabel}>
                    {postImages.length}/3
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="취소"
                onPress={closeWriteModal}
              />
              <Button
                title="작성하기"
                onPress={async () => {
                  if (!newPost.title.trim()) {
                    Alert.alert('알림', '제목을 입력해주세요');
                    return;
                  }
                  if (!newPost.content.trim() && postImages.length === 0) {
                    Alert.alert('알림', '내용 또는 이미지를 입력해주세요');
                    return;
                  }

                  // 백엔드 매핑 (운동 -> EXERCISE, 식단 -> FOOD, 질문/자유 -> DIET)
                  const categoryMap: { [key: string]: string } = {
                    '운동': 'EXERCISE',
                    '식단': 'FOOD',
                    '질문': 'DIET',
                    '자유': 'DIET'
                  };

                  const payload = {
                    postKind: categoryMap[newPost.category] || 'DIET',
                    title: newPost.title.trim(),
                    content: newPost.content.trim() || ' ',
                  };

                  const uploadFiles = postImages.map((asset, index) => ({
                    uri: asset.uri,
                    name:
                      asset.fileName ||
                      `post-${Date.now()}-${index}.${asset.mimeType?.split('/')?.[1] ?? 'jpg'}`,
                    type: asset.mimeType || 'image/jpeg',
                  }));

                  try {
                    await createPost(payload, uploadFiles);
                    await refreshPosts();
                    closeWriteModal();
                    Alert.alert('완료', '게시글이 작성되었습니다');
                    return;
                  } catch (error) {
                    console.error('Failed to create post:', error);
                    Alert.alert('알림', '서버에 게시글을 저장하지 못했습니다. 로컬에 임시로 저장합니다.');
                  }

                  const createdAtIso = new Date().toISOString();
                  const profileImageUrl =
                    currentUser.profileImage ||
                    currentUser.profileImageUrl ||
                    userProfileImages[userId] ||
                    null;
                  const fallbackImageUris = uploadFiles.map(file => file.uri);
                  const post: Post = {
                    id: Date.now().toString(),
                    author: currentUser.name,
                    authorId: userId,
                    authorProfileImage: profileImageUrl,
                    category: newPost.category,
                    title: newPost.title,
                    content: newPost.content,
                    likes: 0,
                    likedBy: [],
                    comments: 0,
                    createdAt: createdAtIso,
                    time: formatPostDate(createdAtIso),
                    imageUrls: fallbackImageUris,
                    thumbnail: fallbackImageUris[0] || null,
                  };
                  setPosts(prev => {
                    const next = [post, ...prev];
                    AsyncStorage.setItem('communityPosts', JSON.stringify(next));
                    return next;
                  });
                  if (profileImageUrl) {
                    setUserProfileImages(prev => ({
                      ...prev,
                      [userId]: profileImageUrl,
                    }));
                  }
                  closeWriteModal();
                  Alert.alert('완료', '게시글이 로컬에 저장되었습니다');
                }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Post Detail Modal */}
      <Modal
        visible={showPostDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowPostDetailModal(false);
          setSelectedPost(null);
          setNewComment('');
          setCommentImage(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.postDetailModalContent}>
            {selectedPost && (
              <>
                {/* Header */}
                <View style={styles.postDetailHeader}>
                  <Text style={styles.postDetailTitle}>게시글</Text>
                  <View style={styles.postDetailHeaderActions}>
                    {selectedPost.authorId === userId && (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingPost(selectedPost);
                            setEditPostData({
                              title: selectedPost.title,
                              content: selectedPost.content,
                            });
                            setShowEditPostModal(true);
                          }}
                          style={styles.editButton}
                        >
                          <Text style={styles.editButtonText}>수정</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeletePost(selectedPost.id)}
                          style={styles.deleteButton}
                        >
                          <Text style={styles.deleteButtonText}>삭제</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        setShowPostDetailModal(false);
                        setSelectedPost(null);
                        setNewComment('');
                      }}
                    >
                      <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView 
                  style={styles.postDetailScroll}
                  contentContainerStyle={styles.postDetailScrollContent}
                >
                  {/* Post Content */}
                  <Card style={styles.postDetailCard}>
                    <View style={styles.postHeader}>
                      <View style={styles.postAuthorContainer}>
                        {userProfileImages[selectedPost.authorId] ? (
                          <Image 
                            source={{ uri: userProfileImages[selectedPost.authorId] }} 
                            style={styles.postAuthorAvatar}
                          />
                        ) : (
                          <View style={styles.postAuthorAvatarPlaceholder}>
                            <Text style={styles.postAuthorAvatarText}>
                              {selectedPost.author?.charAt(0)?.toUpperCase() || '👤'}
                            </Text>
                          </View>
                        )}
                        <View>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedUser({ id: selectedPost.authorId, name: selectedPost.author });
                              setShowProfileModal(true);
                            }}
                          >
                            <Text style={styles.postAuthor}>{selectedPost.author}</Text>
                          </TouchableOpacity>
                          <Text style={styles.postTime}>
                            {selectedPost.displayDate}
                            {selectedPost.time ? ` · ${selectedPost.time}` : ''}
                          </Text>
                        </View>
                      </View>
                      <Badge>{selectedPost.category}</Badge>
                    </View>

                    <Text style={styles.postTitle}>{selectedPost.title}</Text>
                    <Text style={styles.postDetailContent}>{selectedPost.content}</Text>

                    {selectedPost.imageUrls && selectedPost.imageUrls.length > 0 ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.postDetailImagesScroll}
                        contentContainerStyle={styles.postDetailImagesContent}
                      >
                        {selectedPost.imageUrls.map((uri, index) => (
                          <Image
                            key={`${uri}-${index}`}
                            source={{ uri }}
                            style={styles.postDetailImage}
                          />
                        ))}
                      </ScrollView>
                    ) : selectedPost.thumbnail ? (
                      <Image source={{ uri: selectedPost.thumbnail }} style={styles.postDetailImageSingle} />
                    ) : null}

                    <View style={styles.postFooter}>
                      <TouchableOpacity
                        style={styles.likeButton}
                        onPress={() => handleLike(selectedPost.id)}
                      >
                        <Text style={styles.likeIcon}>
                          {selectedPost.likedBy.includes(userId) ? '❤️' : '🤍'}
                        </Text>
                        <Text style={styles.likeCount}>{selectedPost.likes}</Text>
                      </TouchableOpacity>
                      <View style={styles.commentButton}>
                        <Text style={styles.commentIcon}>💬</Text>
                        <Text style={styles.commentCount}>{comments.length}</Text>
                      </View>
                    </View>
                  </Card>

                  {/* Comments Section */}
                  <View style={styles.commentsSection}>
                    <Text style={styles.commentsTitle}>댓글 {comments.length}</Text>
                    {comments.length === 0 ? (
                      <Text style={styles.emptyComments}>아직 댓글이 없습니다.</Text>
                    ) : (
                      comments.map(comment => (
                        <View key={comment.id} style={styles.commentItem}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentHeaderLeft}>
                              <Text style={styles.commentAuthor}>{comment.author}</Text>
                              <Text style={styles.commentTime}>{comment.time}</Text>
                            </View>
                            {(comment.authorId === userId || String(comment.authorId) === String(userId)) && (
                              <TouchableOpacity
                                onPress={() => handleDeleteComment(comment.id, selectedPost.id)}
                                style={styles.commentDeleteButton}
                              >
                                <Text style={styles.commentDeleteButtonText}>삭제</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <Text style={styles.commentContent}>{comment.content}</Text>
                          {comment.imageUrl ? (
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedImageUrl(comment.imageUrl);
                                setShowImageModal(true);
                              }}
                              activeOpacity={0.9}
                              style={styles.commentImageWrapper}
                            >
                              <Image 
                                source={{ uri: comment.imageUrl }} 
                                style={styles.commentImage}
                                resizeMode="cover"
                                onError={(error) => {
                                  console.warn('❌ 댓글 이미지 로드 실패:', error, comment.imageUrl);
                                }}
                                onLoad={() => {
                                  console.log('✅ 댓글 이미지 로드 성공:', comment.imageUrl);
                                }}
                              />
                            </TouchableOpacity>
                          ) : null}
                        </View>
                      ))
                    )}
                  </View>
                </ScrollView>

                {/* Comment Input */}
                <View style={styles.commentInputContainer}>
                  {commentImage && (
                    <View style={styles.commentImagePreview}>
                      <Image 
                        source={{ uri: commentImage.uri }} 
                        style={styles.commentImagePreviewImage}
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        style={styles.commentImageRemoveButton}
                        onPress={removeCommentImage}
                      >
                        <Text style={styles.commentImageRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.commentInputRow}>
                    <TouchableOpacity
                      style={styles.commentImageButton}
                      onPress={() => setShowCommentImageActionSheet(true)}
                    >
                      <Text style={styles.commentImageButtonText}>📷</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="댓글을 입력하세요..."
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                    />
                    <TouchableOpacity
                      style={[
                        styles.commentSendButton,
                        (!newComment.trim() && !commentImage) && styles.commentSendButtonDisabled,
                      ]}
                      onPress={handleAddComment}
                      disabled={!newComment.trim() && !commentImage}
                    >
                      <Text style={styles.commentSendButtonText}>전송</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Competition Modal */}
      <Modal
        visible={showCompetitionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompetitionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            style={styles.modalScrollContent}
            contentContainerStyle={styles.modalScrollContentContainer}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>대회 참가 신청</Text>

              <Text style={styles.modalLabel}>나의 정보</Text>
              <View style={styles.userInfo}>
                <Text>키: {currentUser.height}cm</Text>
                <Text>몸무게: {currentUser.weight}kg</Text>
                {canParticipate('classic') ? (
                  <Text style={styles.eligibleText}>✅ 출전 가능</Text>
                ) : (
                  <Text style={styles.ineligibleText}>❌ 체급 조건 불만족</Text>
                )}
              </View>

              <Text style={styles.modalLabel}>사진 업로드 (최소 3장 필수)</Text>
              <View style={styles.imageGrid}>
                {competitionImages.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.uploadedImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeCompetitionImage(index)}
                    >
                      <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                {competitionImages.length < 3 && (
                  <TouchableOpacity style={styles.addImageButton} onPress={pickCompetitionImage}>
                    <Text style={styles.addImageText}>+</Text>
                    <Text style={styles.addImageLabel}>
                      {competitionImages.length}/3
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.modalButtons}>
                <Button
                  title="취소"
                  onPress={() => {
                    setShowCompetitionModal(false);
                    setCompetitionImages([]);
                  }}
                />
                <Button
                  title="제출"
                  onPress={() => {
                    if (competitionImages.length < 3) {
                      Alert.alert('알림', '사진을 최소 3장 업로드해주세요.');
                      return;
                    }
                    if (!canParticipate('classic')) {
                      Alert.alert('체급 조건을 만족하지 않습니다');
                      return;
                    }
                    Alert.alert('참가 신청이 완료되었습니다!');
                    setShowCompetitionModal(false);
                    setCompetitionImages([]);
                  }}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Post Modal */}
      <Modal
        visible={showEditPostModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditPostModal(false);
          setEditingPost(null);
          setEditPostData({ title: '', content: '' });
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>게시글 수정</Text>

            <Text style={styles.modalLabel}>제목</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="제목을 입력하세요"
              value={editPostData.title}
              onChangeText={text => setEditPostData({ ...editPostData, title: text })}
            />

            <Text style={styles.modalLabel}>내용</Text>
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="내용을 입력하세요"
              multiline
              numberOfLines={6}
              value={editPostData.content}
              onChangeText={text => setEditPostData({ ...editPostData, content: text })}
            />

            <View style={styles.modalButtons}>
              <Button
                title="취소"
                onPress={() => {
                  setShowEditPostModal(false);
                  setEditingPost(null);
                  setEditPostData({ title: '', content: '' });
                }}
              />
              <Button
                title="수정하기"
                onPress={handleEditPost}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Zoom Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowImageModal(false);
          setSelectedImageUrl(null);
        }}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalCloseArea}
            activeOpacity={1}
            onPress={() => {
              setShowImageModal(false);
              setSelectedImageUrl(null);
            }}
          >
            <View style={styles.imageModalContainer}>
              <TouchableOpacity
                style={styles.imageModalCloseButton}
                onPress={() => {
                  setShowImageModal(false);
                  setSelectedImageUrl(null);
                }}
              >
                <Text style={styles.imageModalCloseButtonText}>✕</Text>
              </TouchableOpacity>
              {selectedImageUrl && (
                <Image
                  source={{ uri: selectedImageUrl }}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowProfileModal(false);
          setSelectedUser(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.profileModalHeader}>
                  <Text style={styles.modalTitle}>{selectedUser.name}의 프로필</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowProfileModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.profileInfo}>
                  <View style={styles.profileStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{followers[selectedUser.id] || 0}</Text>
                      <Text style={styles.statLabel}>팔로워</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>
                        {posts.filter(p => p.authorId === selectedUser.id).length}
                      </Text>
                      <Text style={styles.statLabel}>게시글</Text>
                    </View>
                  </View>

                  <Button
                    title={followingUsers[selectedUser.id] ? '팔로우 취소' : '팔로우'}
                    onPress={() => handleFollow(selectedUser.id)}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  writeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  writeButtonText: {
    fontSize: 20,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 80, // 탭바 높이 + 여유 공간
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryFilterRow: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  categoryFilterChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryFilterChipText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  categoryFilterChipTextActive: {
    color: '#fff',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  categoryCount: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  postsEmptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  postsEmptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  postsEmptySubtext: {
    fontSize: 13,
    color: '#9E9E9E',
  },
  postsLoadingState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingVertical: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  postsLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
  },
  postCard: {
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  postAuthorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  postAuthorAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  postAuthor: {
    fontSize: 14,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    color: '#666',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  postImageWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  postImageBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postImageBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeIcon: {
    fontSize: 20,
  },
  likeCount: {
    fontSize: 14,
    color: '#666',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentIcon: {
    fontSize: 20,
  },
  commentCount: {
    fontSize: 14,
    color: '#666',
  },
  competitionCard: {
    marginBottom: 16,
  },
  competitionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  competitionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  competitionTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  competitionTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  competitionTabActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  competitionTabText: {
    fontSize: 14,
    color: '#333',
  },
  competitionTabTextActive: {
    color: '#fff',
  },
  entryCard: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  entryRank: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  entryRankText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  entryImage: {
    width: '100%',
    height: 250,
  },
  entryInfo: {
    padding: 12,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  voteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  voteButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  voteButtonText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 500,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  userInfo: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  eligibleText: {
    color: '#34C759',
    marginTop: 4,
  },
  ineligibleText: {
    color: '#FF3B30',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
  },
  modalTextArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  postDetailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    height: '100%',
    paddingTop: 50,
    flex: 1,
  },
  postDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  postDetailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 4,
  },
  postDetailScroll: {
    flex: 1,
    padding: 16,
  },
  postDetailScrollContent: {
    paddingBottom: 100, // 댓글 입력창 높이 + 여유 공간
  },
  postDetailCard: {
    marginBottom: 16,
  },
  postDetailContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  postDetailImagesScroll: {
    marginTop: 8,
  },
  postDetailImagesContent: {
    paddingVertical: 4,
    gap: 12,
  },
  postDetailImage: {
    width: 240,
    height: 240,
    borderRadius: 12,
  },
  postDetailImageSingle: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginTop: 8,
  },
  commentsSection: {
    marginTop: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptyComments: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  commentInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: '#000',
  },
  commentSendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentSendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  commentSendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalScrollContent: {
    maxHeight: '80%',
    width: '100%',
  },
  modalScrollContentContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  imageWrapper: {
    width: '30%',
    position: 'relative',
  },
  uploadedImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addImageButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addImageText: {
    fontSize: 32,
    color: '#007AFF',
    fontWeight: '300',
  },
  addImageLabel: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 16,
    textAlign: 'center',
    color: '#111',
  },
  actionSheetButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionSheetButtonText: {
    fontSize: 16,
    color: '#333',
  },
  actionSheetCancelButton: {
    borderBottomWidth: 0,
  },
  actionSheetCancelButtonText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
  profileModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileInfo: {
    alignItems: 'center',
    gap: 16,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  postDetailHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  commentHeaderLeft: {
    flex: 1,
  },
  commentDeleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  commentDeleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  commentImageWrapper: {
    width: '100%',
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  commentImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  commentImagePreview: {
    position: 'relative',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  commentImagePreviewImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
  },
  commentImageRemoveButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentImageRemoveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  commentImageButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentImageButtonText: {
    fontSize: 24,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalCloseButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
});
