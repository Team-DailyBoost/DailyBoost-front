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
import { createPost, updatePost, deletePost, getPost, PostKind, PostCreateRequest } from '../../api/posts';
import { createComment, deleteComment } from '../../api/comments';
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
  FOOD: '음식',
  DIET: '식단',
};

const CATEGORY_POST_KIND_MAP: Record<string, PostKind> = {
  '운동': 'EXERCISE',
  '음식': 'FOOD',
  '식단': 'DIET',
};

const COMMUNITY_CATEGORY_ORDER = ['운동', '음식', '식단'];
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

  let category =
    raw?.category ??
    POST_KIND_CATEGORY_MAP[raw?.postKind] ??
    fallbackCategory ??
    '운동';
  
  // 기존 '질문', '자유' 카테고리를 '식단'으로 통일 (DIET)
  // (이전 버전에서 '질문'이 DIET였지만, 이제 '식단'이 DIET)
  if (category === '질문' || category === '자유') {
    category = '식단';
  }

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
        // 게시글 상세 조회 실패 시 무시
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
  const [showEditPostImageActionSheet, setShowEditPostImageActionSheet] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [followers, setFollowers] = useState<Record<string, number>>({});
  const [followingUsers, setFollowingUsers] = useState<Record<string, boolean>>({});
  const [userProfileImages, setUserProfileImages] = useState<Record<string, string>>({});
  interface CurrentUser {
    email?: string;
    name?: string;
    nickname?: string;
    height?: number;
    weight?: number;
    profileImage?: string | null;
    profileImageUrl?: string | null;
    backendId?: number;
    id?: number | string;
  }
  const [currentUser, setCurrentUser] = useState<CurrentUser>({ email: 'user@example.com', name: '사용자', height: 175, weight: 70 });
  const [userId, setUserId] = useState<string>('user@example.com');
  const [myPostIds, setMyPostIds] = useState<Set<string>>(new Set()); // 현재 사용자가 작성한 게시글 ID 목록
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPostData, setEditPostData] = useState({ title: '', content: '' });
  const [editPostImages, setEditPostImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
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

  // 게시글 목록 업데이트 시 내 게시글 ID 추출
  useEffect(() => {
    (async () => {
      if (!userId || userId === 'user@example.com' || posts.length === 0) return;
      
      try {
        const myPostsKey = `myPosts_${userId}`;
        const existingMyPosts = await AsyncStorage.getItem(myPostsKey);
        const myPosts = existingMyPosts ? JSON.parse(existingMyPosts) : [];
        const myPostSet = new Set(myPosts);
        
        // 현재 사용자의 닉네임과 일치하는 게시글 찾기
        const currentUserNickname = currentUser.nickname || currentUser.name;
        const newMyPosts = posts
          .filter(post => 
            // 이미 내 게시글 목록에 있거나
            myPostSet.has(post.id) ||
            // 작성자가 현재 사용자와 일치하는 경우
            (currentUserNickname && post.author === currentUserNickname)
          )
          .map(post => post.id);
        
        if (newMyPosts.length > 0) {
          const updatedMyPosts = Array.from(new Set([...myPosts, ...newMyPosts]));
          await AsyncStorage.setItem(myPostsKey, JSON.stringify(updatedMyPosts));
          setMyPostIds(new Set(updatedMyPosts));
          console.log('[Community] 내 게시글 ID 목록 업데이트:', updatedMyPosts.length);
        }
      } catch (error) {
        console.log('[Community] 내 게시글 ID 목록 업데이트 실패:', error);
      }
    })();
  }, [posts, userId, currentUser.nickname, currentUser.name]);

  useEffect(() => {
    // 실제 사용자 정보 로드
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('currentUser');
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentUser(parsed);
          
          // userId 설정: 백엔드 ID가 있으면 사용, 없으면 이메일 사용
          // authorId 비교를 위해 백엔드 ID를 문자열로 저장
          const userIdValue = parsed.backendId 
            ? String(parsed.backendId) 
            : (parsed.id ? String(parsed.id) : (parsed.email || 'user@example.com'));
          setUserId(userIdValue);
          
          // 현재 사용자가 작성한 게시글 ID 목록 로드
          try {
            const myPostsKey = `myPosts_${userIdValue}`;
            const existingMyPosts = await AsyncStorage.getItem(myPostsKey);
            if (existingMyPosts) {
              const myPosts = JSON.parse(existingMyPosts);
              setMyPostIds(new Set(myPosts));
              console.log('[Community] 내 게시글 ID 목록 로드:', Array.from(myPosts));
            }
          } catch (error) {
            console.log('[Community] 내 게시글 ID 목록 로드 실패:', error);
          }
        }
      } catch (error) {
        // 사용자 정보 로드 실패 시 무시
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
        const categoryMap = ['운동', '음식', '식단'];

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
          // 로컬 저장소 로드 실패 시 무시
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
          // 백엔드 PostResponse에 authorId가 없으므로, 게시글 작성 시 저장한 정보 사용
          // 또는 게시글 목록에서 가져온 authorId 사용 (목록에도 없지만 변환 시 'unknown'으로 설정됨)
          // 임시 해결책: 게시글 작성자의 닉네임과 현재 사용자의 닉네임 비교
          const updatedPost: Post = {
            ...selectedPost,  // 기존 데이터 유지
            title: postData.title || selectedPost.title,
            content: postData.content || selectedPost.content,
            author: postData.authorName || selectedPost.author,
            // authorId는 업데이트하지 않음 (백엔드에서 반환하지 않음)
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
        // 백엔드 응답 구조 변환: CommentResponse → Comment
        const transformedComments = res.data.map((comment: any, index: number) => {
          const rawImageUrl = comment.imageUrl || comment.image?.url || comment.image?.imageUrl || null;
          const commentContent = comment.comment || comment.content || '';
          
          // CommentInfo에서 content로 매핑 시도
          let matchedCommentInfo: any = null;
          let matchedCommentId: string | null = null;
          
          if (commentInfosMap.size > 0) {
            for (const [id, info] of commentInfosMap.entries()) {
              if (info.content === commentContent || info.content?.trim() === commentContent?.trim()) {
                matchedCommentInfo = info;
                matchedCommentId = id;
                break;
              }
            }
            if (!matchedCommentInfo && index < commentInfosMap.size) {
              const infoArray = Array.from(commentInfosMap.entries());
              const [id, info] = infoArray[index];
              matchedCommentInfo = info;
              matchedCommentId = id;
            }
          }
          
          const resolvedImageUrl = rawImageUrl ? resolveImageUrl(rawImageUrl) : null;
          
          return {
            id: matchedCommentId || String(comment.commentId || comment.id || `temp_${Date.now()}_${index}`),
            postId: postId,
            author: matchedCommentInfo?.author || comment.authorName || '익명',
            authorId: matchedCommentInfo?.authorId || String(comment.authorId || comment.userId || 'unknown'),
            content: matchedCommentInfo?.content || commentContent,
            time: matchedCommentInfo?.time || formatPostDate(comment.createAt || comment.createdAt || new Date()),
            likes: matchedCommentInfo?.likes || comment.likeCount || 0,
            imageUrl: resolvedImageUrl,
          };
        });
        
        if (commentInfosMap.size > 0) {
          const usedContents = new Set(transformedComments.map(c => c.content?.trim()));
          
          commentInfosMap.forEach((info, commentId) => {
            if (!usedContents.has(info.content?.trim())) {
              transformedComments.push({
                id: commentId,
                postId: postId,
                ...info,
                imageUrl: null,
              });
              usedContents.add(info.content?.trim());
            }
          });
        }
        
        const uniqueComments = new Map<string, Comment>();
        transformedComments.forEach(comment => {
          const existing = uniqueComments.get(comment.id);
          if (!existing || (comment.imageUrl && !existing.imageUrl)) {
            uniqueComments.set(comment.id, comment);
          }
        });
        
        setComments(Array.from(uniqueComments.values()));
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

    try {
      const commentFile = commentImage ? {
        uri: commentImage.uri,
        name: commentImage.fileName || `comment-${Date.now()}.${commentImage.mimeType?.split('/')?.[1] ?? 'jpg'}`,
        type: commentImage.mimeType || 'image/jpeg',
      } : undefined;

      await createComment({
        postId: Number(selectedPost.id),
        content: newComment.trim() || '',
      }, commentFile);
      await loadComments(selectedPost.id);
      
      // 게시글 상세 정보 업데이트 (댓글 수 반영)
      try {
        const { getPost } = await import('../../api/posts');
        const postDetail = await getPost(Number(selectedPost.id));
        if (postDetail) {
          const updatedPost: Post = {
            ...selectedPost,
            comments: postDetail.commentCount || selectedPost.comments + 1,
          };
          setSelectedPost(updatedPost);
          
          const updatedPosts = posts.map(post => {
            if (post.id === selectedPost.id) {
              return updatedPost;
            }
            return post;
          });
          setPosts(updatedPosts);
          await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
        } else {
          // 404 에러로 null 반환된 경우, 로컬에서 댓글 수 증가
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
      } catch (refreshError: any) {
        // 에러 발생 시에도 로컬에서 댓글 수 증가
        console.warn('게시글 상세 조회 실패, 로컬에서 댓글 수 증가:', refreshError?.message);
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
    } catch (error: any) {
      const errorMsg = String(error?.message || '댓글 작성에 실패했습니다.');
      console.log('[Community] 댓글 작성 실패:', errorMsg);
      // 에러는 로그에만 기록하고 사용자에게는 표시하지 않음
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
      await deletePost(Number(postId));
      const updatedPosts = posts.filter(p => p.id !== postId);
      setPosts(updatedPosts);
      await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
      
      if (selectedPost && selectedPost.id === postId) {
        setShowPostDetailModal(false);
        setSelectedPost(null);
      }
      
      console.log('[Community] 게시글 삭제 완료');
    } catch (error: any) {
      console.log('[Community] 게시글 삭제 실패:', error.message || '게시글 삭제에 실패했습니다.');
      Alert.alert('알림', error.message || '게시글 삭제에 실패했습니다.');
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
      // 기존 게시글의 postKind를 category에서 가져오기
      // category: '운동' -> postKind: 'EXERCISE'
      // category: '음식' -> postKind: 'FOOD'
      // category: '식단' -> postKind: 'DIET'
      let existingPostKind: PostKind = CATEGORY_POST_KIND_MAP[editingPost.category] || 'DIET';
      
      // 만약 category에서 매핑되지 않으면 API로 확인 시도 (fallback)
      if (existingPostKind === 'DIET' && !CATEGORY_POST_KIND_MAP[editingPost.category]) {
        try {
          const postDetail = await getPost(Number(editingPost.id));
          if (postDetail?.postKind) {
            existingPostKind = postDetail.postKind;
          }
        } catch (error) {
          // 상세 조회 실패 시 기본값 사용
          console.log('[Community] 게시글 상세 조회 실패 (postKind 가져오기), category에서 추정:', editingPost.category, '->', existingPostKind);
        }
      }

      console.log('[UPDATE_POST] 게시글 수정 시작:', {
        id: editingPost.id,
        title: editPostData.title.trim(),
        content: editPostData.content.trim(),
        postKind: existingPostKind,
        filesCount: editPostImages.length,
      });

      // 파일 업로드 처리
      const uploadFiles = editPostImages.length > 0 
        ? editPostImages.map((asset, index) => ({
            uri: asset.uri,
            name: asset.fileName || `post-${Date.now()}-${index}.${asset.mimeType?.split('/')?.[1] ?? 'jpg'}`,
            type: asset.mimeType || 'image/jpeg',
          }))
        : undefined;

      await updatePost({
        id: Number(editingPost.id),
        title: editPostData.title.trim(),
        content: editPostData.content.trim(),
        postKind: existingPostKind,
      }, uploadFiles);

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
      setEditPostImages([]);
      console.log('[Community] 게시글 수정 완료');
      
      // 게시글 목록 새로고침
      await refreshPosts();
    } catch (error: any) {
      console.log('[Community] 게시글 수정 실패:', error.message || '게시글 수정에 실패했습니다.');
      Alert.alert('알림', error.message || '게시글 수정에 실패했습니다.');
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
              await deleteComment({
                commentId: Number(commentId),
                postId: Number(postId),
              });

              await loadComments(postId);
              
              const updatedPosts = posts.map(post => {
                if (post.id === postId) {
                  return { ...post, comments: Math.max((post.comments || 0) - 1, 0) };
                }
                return post;
              });
              setPosts(updatedPosts);
              await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
            } catch (error: any) {
              const errorMsg = error?.message || '댓글 삭제에 실패했습니다.';
              console.log('[Community] 댓글 삭제 실패:', errorMsg);
              Alert.alert('알림', errorMsg);
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
    } catch (error: any) {
      // 좋아요 API 실패 시 로컬 상태는 이미 업데이트되었으므로 에러만 로깅
      console.log('[Community] 좋아요 API 실패:', error?.message || '좋아요 처리에 실패했습니다.');
    }
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
    const userHeight = currentUser.height ?? 0;
    const userWeight = currentUser.weight ?? 0;
    return classes.some(c =>
      userHeight >= c.heightMin &&
      userHeight <= c.heightMax &&
      userWeight <= c.weightLimit
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
      Alert.alert('알림', '카메라를 여는 중 문제가 발생했습니다.');
    }
  }, [postImages]);

  const removePostImage = useCallback((index: number) => {
    setPostImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 수정용 이미지 함수
  const pickEditPostImageFromLibrary = useCallback(async () => {
    if (editPostImages.length >= 3) {
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
        setEditPostImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('알림', '갤러리를 여는 중 문제가 발생했습니다.');
    }
  }, [editPostImages]);

  const pickEditPostImageFromCamera = useCallback(async () => {
    if (editPostImages.length >= 3) {
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
        setEditPostImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      Alert.alert('알림', '카메라를 여는 중 문제가 발생했습니다.');
    }
  }, [editPostImages]);

  const removeEditPostImage = useCallback((index: number) => {
    setEditPostImages(prev => prev.filter((_, i) => i !== index));
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
      // getPosts API 함수 사용 (404/500 에러 자동 처리)
      const { getPosts } = await import('../../api/posts');
      const [exercisePosts, foodPosts, dietPosts] = await Promise.all([
        getPosts('EXERCISE'),
        getPosts('FOOD'),
        getPosts('DIET'),
      ]);

      const allPosts: Post[] = [];
      const categoryMap = ['운동', '음식', '식단'];
      const postArrays = [exercisePosts, foodPosts, dietPosts];

      postArrays.forEach((postArray, index) => {
        if (Array.isArray(postArray) && postArray.length > 0) {
          const transformedPosts = postArray.map((post: any) =>
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
        // API에서 게시글이 없으면 로컬 캐시 사용
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
    } catch (error: any) {
      console.warn('게시글 새로고침 실패, 로컬 캐시 사용:', error?.message);
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
        // 로컬 저장소 로드 실패 시 무시
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
                      <Text style={[
                        styles.voteButtonText,
                        entry.votedBy.includes(userId) && styles.voteButtonTextActive
                      ]}>
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

      {/* Edit Post Image Action Sheet */}
      <Modal
        visible={showEditPostImageActionSheet}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditPostImageActionSheet(false)}
      >
        <View style={styles.actionSheetOverlay}>
          <View style={styles.actionSheetContainer}>
            <Text style={styles.actionSheetTitle}>사진 업로드</Text>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => {
                setShowEditPostImageActionSheet(false);
                pickEditPostImageFromCamera();
              }}
            >
              <Text style={styles.actionSheetButtonText}>📷 카메라로 촬영</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionSheetButton}
              onPress={() => {
                setShowEditPostImageActionSheet(false);
                pickEditPostImageFromLibrary();
              }}
            >
              <Text style={styles.actionSheetButtonText}>🖼 갤러리에서 선택</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetButton, styles.actionSheetCancelButton]}
              onPress={() => setShowEditPostImageActionSheet(false)}
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
              {['운동', '음식', '식단'].map(cat => (
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
                  // 카테고리 검증
                  if (!newPost.category || !['운동', '음식', '식단'].includes(newPost.category)) {
                    Alert.alert('알림', '카테고리를 선택해주세요');
                    return;
                  }
                  
                  if (!newPost.title.trim()) {
                    Alert.alert('알림', '제목을 입력해주세요');
                    return;
                  }
                  
                  // 내용 검증: 이미지가 있으면 내용이 비어있어도 허용
                  const trimmedContent = (newPost.content || '').trim();
                  if (!trimmedContent && postImages.length === 0) {
                    Alert.alert('알림', '내용 또는 이미지를 입력해주세요');
                    return;
                  }

                  // WebView 가용성 확인
                  const { WebViewManager } = await import('../../utils/webViewManager');
                  if (!WebViewManager.isAvailable()) {
                    Alert.alert('오류', 'WebView가 필요합니다. 로그인 후 다시 시도해주세요.');
                    return;
                  }

                  // 백엔드 PostKind enum: EXERCISE, FOOD, DIET, COMPETITION
                  // EXERCISE: 운동
                  // FOOD: 음식 (레시피, 음식 추천)
                  // DIET: 식단 (식단 관리, 다이어트)
                  // 프론트엔드 카테고리 -> 백엔드 PostKind 매핑
                  const categoryMap: { [key: string]: PostKind } = {
                    '운동': 'EXERCISE',
                    '음식': 'FOOD',
                    '식단': 'DIET',
                    'COMPETITION': 'COMPETITION', // 혹시 필요할 경우 대비
                  };

                  const selectedPostKind = categoryMap[newPost.category] || 'DIET';
                  
                  // 디버깅: 선택된 카테고리와 매핑된 PostKind 확인
                  console.log('[CREATE_POST] category:', newPost.category, '-> postKind:', selectedPostKind);

                  // content가 비어있으면 기본값 설정 (백엔드 @NotBlank 검증 통과)
                  const finalContent = trimmedContent || '내용 없음'; // 빈 문자열이면 기본값 설정
                  
                  console.log('[CREATE_POST] content 처리:', {
                    original: newPost.content,
                    trimmed: trimmedContent,
                    final: finalContent,
                    isEmpty: !trimmedContent,
                  });
                  
                  const payload: PostCreateRequest = {
                    postKind: selectedPostKind,
                    title: newPost.title.trim(),
                    content: finalContent, // 항상 값이 있도록 보장
                  };

                  const uploadFiles = postImages.map((asset, index) => ({
                    uri: asset.uri,
                    name:
                      asset.fileName ||
                      `post-${Date.now()}-${index}.${asset.mimeType?.split('/')?.[1] ?? 'jpg'}`,
                    type: asset.mimeType || 'image/jpeg',
                  }));

                  try {
                    console.log('[CREATE_POST] 게시글 작성 시작:', { 
                      title: payload.title, 
                      content: payload.content,
                      contentLength: payload.content?.length || 0,
                      postKind: payload.postKind, 
                      filesCount: uploadFiles.length 
                    });
                    console.log('[CREATE_POST] payload 전체:', JSON.stringify(payload));
                    
                    // 파일이 있을 때만 2단계로 처리 (백엔드 문제 우회)
                    if (uploadFiles.length > 0) {
                      // 1단계: 파일 없이 게시글 먼저 생성
                      await createPost(payload, undefined);
                      console.log('[CREATE_POST] 게시글 생성 성공 (파일 제외)');
                      
                      // 2단계: DB 반영 시간 확보를 위한 짧은 지연
                      await new Promise(resolve => setTimeout(resolve, 1000));
                      
                      // 3단계: 해당 postKind의 게시글만 직접 조회해서 최신 게시글 찾기
                      const { getPosts } = await import('../../api/posts');
                      let latestPost: any = null;
                      
                      try {
                        const kindPosts = await getPosts(payload.postKind);
                        
                        // 조회한 게시글을 normalizePost로 변환
                        const categoryMap: Record<PostKind, string> = {
                          'EXERCISE': '운동',
                          'FOOD': '음식',
                          'DIET': '식단',
                          'COMPETITION': '대회',
                        };
                        const normalizedPosts = kindPosts.map((post: any) =>
                          normalizePost(post, categoryMap[payload.postKind])
                        );
                        
                        // 최신 게시글 중에서 방금 생성한 게시글 찾기 (제목, 내용, 작성자로 매칭)
                        latestPost = normalizedPosts.find(p => 
                          p.title === payload.title.trim() &&
                          p.content === payload.content.trim() &&
                          p.authorId === userId
                        );
                      } catch (error) {
                        console.log('[CREATE_POST] 게시글 목록 조회 실패:', error);
                      }
                      
                      if (latestPost && latestPost.id) {
                        // 4단계: updatePost로 파일 추가
                        await updatePost({
                          id: Number(latestPost.id),
                          title: payload.title.trim(),
                          content: payload.content.trim(),
                          postKind: payload.postKind,
                        }, uploadFiles);
                        console.log('[CREATE_POST] 파일 추가 완료');
                        
                        // 파일 추가 후 전체 목록 새로고침
                        await refreshPosts();
                        
                        // 성공 시 모달 닫기 및 폼 초기화
                        closeWriteModal();
                        setNewPost({ title: '', content: '', category: '운동' });
                        setPostImages([]);
                        Alert.alert('완료', '게시글이 작성되었습니다.');
                      } else {
                        console.warn('[CREATE_POST] 최신 게시글을 찾을 수 없어 파일 추가 실패', {
                          searchedTitle: payload.title.trim(),
                          searchedContent: payload.content.trim(),
                        });
                        Alert.alert('알림', '게시글은 생성되었지만 파일 추가에 실패했습니다. 게시글 수정 기능으로 파일을 추가해주세요.');
                        // 게시글 목록 새로고침
                        await refreshPosts();
                        
                        // 게시글은 생성되었으므로 모달 닫기
                        closeWriteModal();
                        setNewPost({ title: '', content: '', category: '운동' });
                        setPostImages([]);
                      }
                    } else {
                      // 파일이 없으면 그냥 생성
                      await createPost(payload, undefined);
                      console.log('[CREATE_POST] 게시글 작성 성공');
                      
                      // 게시글 목록 새로고침
                      await refreshPosts();
                      
                      // 성공 시 모달 닫기 및 폼 초기화
                      closeWriteModal();
                      setNewPost({ title: '', content: '', category: '운동' });
                      setPostImages([]);
                      Alert.alert('완료', '게시글이 작성되었습니다.');
                    }
                  } catch (error: any) {
                    const errorMessage = error?.message || '서버에 게시글을 저장하지 못했습니다.';
                    console.log('[CREATE_POST_ERROR]', error);
                    console.log('[CREATE_POST_ERROR_DETAIL]', error?.response?.status, error?.response?.data, error?.response?.config?.headers);
                    console.log('[CREATE_POST] 에러 전체:', JSON.stringify(error, null, 2));
                    console.log('[CREATE_POST] 게시글 작성 실패:', errorMessage);
                    
                    // 에러 타입에 따른 메시지 개선
                    let userMessage = errorMessage;
                    if (errorMessage.includes('500') || errorMessage.includes('Internal Server Error')) {
                      userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n\n문제가 계속되면 관리자에게 문의해주세요.';
                    } else if (errorMessage.includes('400') || errorMessage.includes('Bad Request')) {
                      userMessage = '입력한 내용을 확인해주세요.\n\n' + errorMessage;
                    } else if (errorMessage.includes('네트워크') || errorMessage.includes('Network')) {
                      userMessage = '네트워크 연결을 확인해주세요.';
                    } else if (errorMessage.includes('WebView')) {
                      userMessage = 'WebView가 필요합니다. 로그인 후 다시 시도해주세요.';
                    }
                    
                    // 사용자에게 에러 메시지 표시 (모달은 닫지 않음 - 사용자가 수정할 수 있도록)
                    Alert.alert(
                      '게시글 작성 실패',
                      userMessage,
                      [{ 
                        text: '확인', 
                        style: 'default',
                        onPress: () => {
                          // 모달은 닫지 않고 사용자가 수정할 수 있도록 유지
                        }
                      }]
                    );
                    
                    // 서버 저장 실패 시 로컬 fallback 제거 (500 에러 등 서버 오류는 저장하지 않음)
                    // 게시글은 서버에 저장된 경우에만 표시
                    // 모달은 닫지 않음 - 사용자가 내용을 수정하고 다시 시도할 수 있도록
                  }
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
                    {/* 수정/삭제 버튼: 
                        1. authorId가 userId와 일치하거나
                        2. authorName이 현재 사용자의 nickname과 일치하거나
                        3. 로컬에 저장된 내 게시글 ID 목록에 포함된 경우 표시 */}
                    {((selectedPost.authorId === userId) || 
                      (selectedPost.author && currentUser.nickname && selectedPost.author === currentUser.nickname) ||
                      (selectedPost.authorId !== 'unknown' && String(selectedPost.authorId) === String(userId)) ||
                      (myPostIds.has(selectedPost.id))) && (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingPost(selectedPost);
                            setEditPostData({
                              title: selectedPost.title,
                              content: selectedPost.content,
                            });
                            // 기존 이미지 로드 - URL을 ImagePicker.Asset 형식으로 변환하지 않고 빈 배열로 시작
                            // (기존 이미지는 수정 시 유지되지만, 새로 추가한 이미지만 전송)
                            setEditPostImages([]);
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
                                onError={() => {
                                  // 이미지 로드 실패 시 무시
                                }}
                                onLoad={() => {
                                  // 이미지 로드 성공
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
                <Text>키: {currentUser.height ?? 0}cm</Text>
                <Text>몸무게: {currentUser.weight ?? 0}kg</Text>
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
          setEditPostImages([]);
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

            <Text style={styles.modalLabel}>사진 첨부 (최대 3장)</Text>
            <View style={styles.imageGrid}>
              {editPostImages.map((image, index) => (
                <View key={`${image.uri}-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.uploadedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeEditPostImage(index)}
                  >
                    <Text style={styles.removeImageText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {editPostImages.length < 3 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => setShowEditPostImageActionSheet(true)}
                >
                  <Text style={styles.addImageText}>+</Text>
                  <Text style={styles.addImageLabel}>
                    {editPostImages.length}/3
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="취소"
                onPress={() => {
                  setShowEditPostModal(false);
                  setEditingPost(null);
                  setEditPostData({ title: '', content: '' });
                  setEditPostImages([]);
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
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  writeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  writeButtonText: {
    fontSize: 22,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 4,
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#6366f1',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollViewContent: {
    paddingBottom: 80,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryFilterRow: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  categoryFilterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryFilterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryFilterChipText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryFilterChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 60,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postsEmptyText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  postsEmptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  postsLoadingState: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 48,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postsLoadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  postCard: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  postAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  postAuthorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  postAuthorAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAuthorAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  postTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    color: '#0f172a',
    lineHeight: 24,
  },
  postContent: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 14,
    lineHeight: 20,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 14,
  },
  postImageWrapper: {
    position: 'relative',
    marginBottom: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  postImageBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backdropFilter: 'blur(10px)',
  },
  postImageBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  postFooter: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  likeIcon: {
    fontSize: 20,
  },
  likeCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  commentIcon: {
    fontSize: 20,
  },
  commentCount: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
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
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  competitionTabActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  competitionTabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  competitionTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  voteButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  voteButtonTextActive: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 500,
    minWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#0f172a',
    letterSpacing: -0.5,
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
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    fontSize: 16,
    color: '#0f172a',
  },
  modalTextArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
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
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentTime: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  commentContent: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  commentInputContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    color: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  commentSendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  commentSendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  commentSendButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
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
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366f1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  addImageText: {
    fontSize: 36,
    color: '#6366f1',
    fontWeight: '300',
  },
  addImageLabel: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 4,
    fontWeight: '600',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  commentHeaderLeft: {
    flex: 1,
  },
  commentDeleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#ef4444',
  },
  commentDeleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
