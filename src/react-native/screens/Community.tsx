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
import { createComment } from '../../api/comments';
import { Feather as Icon } from '@expo/vector-icons';
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
  verified: boolean; // 사진 인증 완료 여부
  month: string; // 참가 월 (YYYY-MM)
  isWinner?: boolean; // 우승자 여부
  postId?: number; // 백엔드 게시글 ID
}

interface CompetitionInfo {
  currentMonth: string; // 현재 대회 월 (YYYY-MM)
  startDate: string; // 대회 시작일
  endDate: string; // 대회 종료일
  isActive: boolean; // 대회 진행 여부
  winner?: CompetitionEntry; // 이달의 우승자
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

// 대회 종목별 설명
const COMPETITION_CATEGORY_DESCRIPTIONS: Record<'classic' | 'physique', string> = {
  classic: '클래식 피지크: 근육량과 대칭성을 중심으로 평가하는 클래식 바디빌딩 스타일',
  physique: '피지크: 선명한 근육 라인과 균형잡힌 체형 미를 평가하는 현대적 바디빌딩 스타일',
};

// 현재 월 가져오기 (YYYY-MM 형식)
const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// 대회 기간 확인 (매월 1일부터 마지막 날까지)
const getCompetitionPeriod = (yearMonth: string): { startDate: string; endDate: string } => {
  const [year, month] = yearMonth.split('-').map(Number);
  const startDate = `${yearMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${yearMonth}-${String(lastDay).padStart(2, '0')}`;
  return { startDate, endDate };
};

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
  const [competitionInfo, setCompetitionInfo] = useState<CompetitionInfo | null>(null);
  const [selectedCompetitionCategory, setSelectedCompetitionCategory] = useState<'classic' | 'physique'>('classic'); // 참가 신청 시 선택한 종목
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

  // 월별 대회 시스템 초기화 및 백엔드에서 대회 목록 로드
  useEffect(() => {
    (async () => {
      const currentMonth = getCurrentMonth();
      const { startDate, endDate } = getCompetitionPeriod(currentMonth);
      
      try {
        // 대회 정보 설정
        const info: CompetitionInfo = {
          currentMonth,
          startDate,
          endDate,
          isActive: true,
        };
        setCompetitionInfo(info);
        
        // 백엔드에서 대회 게시글 가져오기
        await loadCompetitionPosts();
      } catch (error) {
        console.log('[Competition] 대회 정보 초기화 실패:', error);
      }
    })();
  }, []);

  // 백엔드에서 대회 게시글 로드
  const loadCompetitionPosts = async () => {
    try {
      const { getPosts } = await import('../../api/posts');
      const competitionPosts = await getPosts('COMPETITION');
      
      console.log('[Competition] 백엔드 대회 게시글 로드:', competitionPosts.length, '개');
      
      // Post를 CompetitionEntry로 변환
      const currentMonth = getCurrentMonth();
      const entries: CompetitionEntry[] = competitionPosts
        .filter(post => {
          // 제목에서 종목과 체급 정보 추출
          // 형식: "{종목} - {체급}" 또는 "{종목}"
          return post.title && post.title.includes('피지크') || post.title.includes('클래식');
        })
        .map((post, index) => {
          // 제목에서 종목 추출
          const isClassic = post.title.includes('클래식');
          const isPhysique = post.title.includes('피지크');
          const category = isClassic ? 'classic' : (isPhysique ? 'physique' : 'classic');
          
          // 체급 정보 추출 (제목에서)
          const weightClassMatch = post.title.match(/(\d+cm\s*(이하|초과)?)/);
          const weightClass = weightClassMatch ? weightClassMatch[0] : '미지정';
          
          return {
            id: `competition_${post.id}`,
            userId: post.authorName || 'unknown',
            userName: post.authorName || '사용자',
            userHeight: 0, // 백엔드에서 가져올 수 없음
            userWeight: 0, // 백엔드에서 가져올 수 없음
            category: category as 'classic' | 'physique',
            weightClass,
            images: [], // PostsResponse에는 이미지 정보가 없음 (필요시 getPost로 상세 정보 가져오기)
            votes: post.likeCount || 0,
            votedBy: [], // 백엔드에서 가져올 수 없음
            submittedAt: post.createdAt || new Date().toISOString(),
            verified: true,
            month: currentMonth,
            isWinner: false,
            postId: post.id, // 백엔드 게시글 ID 저장
          };
        });
      
      setCompetitionEntries(entries);
    } catch (error) {
      console.error('[Competition] 백엔드 대회 게시글 로드 실패:', error);
      // 에러 발생 시 빈 배열로 설정
      setCompetitionEntries([]);
    }
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

        // 대회 목록은 백엔드에서 로드 (loadCompetitionPosts에서 처리)
        
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
                .filter((url: string | null): url is string => Boolean(url))
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
        
        // 로컬 댓글도 추가 (서버 댓글과 병합)
        try {
          const savedComments = await AsyncStorage.getItem(`comments_${postId}`);
          if (savedComments) {
            const parsed: Comment[] = JSON.parse(savedComments);
            const localComments = parsed.filter(comment => isLocalComment(comment.id));
            localComments.forEach(comment => {
              if (!uniqueComments.has(comment.id)) {
                uniqueComments.set(comment.id, comment);
              }
            });
          }
        } catch (e) {
          // 로컬 댓글 로드 실패 시 무시
        }
        
        setComments(Array.from(uniqueComments.values()));
      } else if (commentInfosMap.size > 0) {
        // CommentResponse 조회 실패 시 CommentInfo만 사용
        const transformedComments = Array.from(commentInfosMap.entries()).map(([commentId, info]) => ({
          id: commentId,
          postId: postId,
          ...info,
          imageUrl: null, // CommentInfo에는 이미지가 없음
        }));
        
        // 로컬 댓글도 추가 (서버 댓글과 병합)
        try {
          const savedComments = await AsyncStorage.getItem(`comments_${postId}`);
          if (savedComments) {
            const parsed: Comment[] = JSON.parse(savedComments);
            const localComments = parsed.filter(comment => isLocalComment(comment.id));
            transformedComments.push(...localComments);
          }
        } catch (e) {
          // 로컬 댓글 로드 실패 시 무시
        }
        
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

    // 로컬 게시글인지 확인 (local- 접두사로 판별)
    if (String(selectedPost.id).startsWith('local-')) {
      // 로컬 게시글은 로컬에서만 댓글 저장 (API 요청 없음)
      try {
        const localCommentId = `local-comment-${Date.now()}`;
        const now = new Date().toISOString();
        const authorName = currentUser?.nickname || currentUser?.name || '익명';
        const authorProfileImage = currentUser?.profileImage || currentUser?.profileImageUrl || null;
        
        const localComment: Comment = {
          id: localCommentId,
          postId: selectedPost.id,
          author: authorName,
          authorId: String(userId),
          content: newComment.trim() || '',
          time: formatPostDate(now),
          likes: 0,
          likedBy: [],
          imageUrl: commentImage ? commentImage.uri : null,
        };
        
        // 기존 댓글에 추가 (상태 먼저 업데이트)
        const currentComments = comments || [];
        const updatedComments = [localComment, ...currentComments];
        setComments(updatedComments);
        
        // 게시글 댓글 수 증가
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
        
        setNewComment('');
        setCommentImage(null);
        
        // AsyncStorage 저장은 백그라운드에서 처리
        Promise.all([
          AsyncStorage.setItem(`comments_${selectedPost.id}`, JSON.stringify(updatedComments)),
          AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts))
        ]).catch(err => {
          console.log('[Community] 로컬 댓글 저장 실패:', err);
        });
        
        console.log('[Community] 로컬 게시글에 로컬 댓글 저장 완료:', localCommentId);
      } catch (error: any) {
        console.log('[Community] 로컬 댓글 저장 중 오류:', error);
      }
      return;
    }

    // 서버 게시글은 서버에 댓글 작성 요청
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
      
      // 댓글 수 즉시 증가 (UI 반응성 향상)
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
      
      setNewComment('');
      setCommentImage(null);
      
      // 댓글 목록 업데이트와 AsyncStorage 저장은 백그라운드에서 처리
      Promise.all([
        loadComments(selectedPost.id),
        AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts))
      ]).catch(() => {});
    } catch (error: any) {
      // 서버 저장 실패 시 로컬에 저장
      console.log('[Community] 댓글 작성 서버 저장 실패, 로컬에 저장합니다');
      try {
        if (!selectedPost) return;
        
        const localCommentId = `local-comment-${Date.now()}`;
        const now = new Date().toISOString();
        const authorName = currentUser?.nickname || currentUser?.name || '익명';
        const authorProfileImage = currentUser?.profileImage || currentUser?.profileImageUrl || null;
        
        const localComment: Comment = {
          id: localCommentId,
          postId: selectedPost.id,
          author: authorName,
          authorId: String(userId),
          content: newComment.trim() || '',
          time: formatPostDate(now),
          likes: 0,
          likedBy: [],
          imageUrl: commentImage ? commentImage.uri : null,
        };
        
        // 기존 댓글에 추가 (상태 먼저 업데이트)
        const currentComments = comments || [];
        const updatedComments = [localComment, ...currentComments];
        setComments(updatedComments);
        
        // 게시글 댓글 수 증가
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
        
        setNewComment('');
        setCommentImage(null);
        
        // AsyncStorage 저장은 백그라운드에서 처리
        Promise.all([
          AsyncStorage.setItem(`comments_${selectedPost.id}`, JSON.stringify(updatedComments)),
          AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts))
        ]).catch(err => {
          console.log('[Community] 로컬 댓글 저장 실패:', err);
        });
        
        console.log('[Community] 로컬 댓글 저장 완료:', localCommentId);
      } catch (localSaveError: any) {
        console.log('[Community] 로컬 댓글 저장 중 오류:', localSaveError);
      }
    }
  };

  // 로컬 게시글인지 확인하는 헬퍼 함수
  const isLocalPost = (postId: string): boolean => {
    return String(postId).startsWith('local-');
  };

  // 로컬 댓글인지 확인하는 헬퍼 함수
  const isLocalComment = (commentId: string): boolean => {
    return String(commentId).startsWith('local-comment-');
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
            // 로컬 게시글인지 확인
            if (isLocalPost(postId)) {
              // 로컬 게시글은 로컬에서만 삭제
              try {
                const updatedPosts = posts.filter(p => p.id !== postId);
                setPosts(updatedPosts);
                
                // 내 게시글 ID 목록에서 제거
                const updatedMyPostIds = new Set(myPostIds);
                updatedMyPostIds.delete(postId);
                setMyPostIds(updatedMyPostIds);
                
                if (selectedPost && selectedPost.id === postId) {
                  setShowPostDetailModal(false);
                  setSelectedPost(null);
                }
                
                // AsyncStorage 저장은 백그라운드에서 처리
                Promise.all([
                  AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts)),
                  AsyncStorage.setItem(`myPosts_${userId}`, JSON.stringify(Array.from(updatedMyPostIds)))
                ]).catch(err => {
                  console.log('[Community] 로컬 게시글 삭제 저장 실패:', err);
                });
                
                console.log('[Community] 로컬 게시글 삭제 완료:', postId);
              } catch (error: any) {
                console.log('[Community] 로컬 게시글 삭제 실패:', error);
              }
            } else {
              // 서버 게시글은 서버에 삭제 요청
              try {
                await deletePost(Number(postId));
                const updatedPosts = posts.filter(p => p.id !== postId);
                setPosts(updatedPosts);
                
                if (selectedPost && selectedPost.id === postId) {
                  setShowPostDetailModal(false);
                  setSelectedPost(null);
                }
                
                // AsyncStorage 저장은 백그라운드에서 처리
                AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts)).catch(err => {
                  console.log('[Community] 게시글 삭제 저장 실패:', err);
                });
                
                console.log('[Community] 게시글 삭제 완료');
              } catch (error: any) {
                console.log('[Community] 게시글 삭제 실패:', error.message || '게시글 삭제에 실패했습니다.');
                Alert.alert('알림', error.message || '게시글 삭제에 실패했습니다.');
              }
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

    // 로컬 게시글인지 확인
    if (isLocalPost(editingPost.id)) {
      // 로컬 게시글은 로컬에서만 수정
      try {
        // 이미지 URL 처리
        const imageUrls = editPostImages.map(img => img.uri);
        
        const updatedPosts = posts.map(post => {
          if (post.id === editingPost.id) {
            return {
              ...post,
              title: editPostData.title.trim(),
              content: editPostData.content.trim(),
              imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
              thumbnail: imageUrls.length > 0 ? imageUrls[0] : null,
            };
          }
          return post;
        });
        
        setPosts(updatedPosts);
        
        if (selectedPost && selectedPost.id === editingPost.id) {
          setSelectedPost({
            ...selectedPost,
            title: editPostData.title.trim(),
            content: editPostData.content.trim(),
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
            thumbnail: imageUrls.length > 0 ? imageUrls[0] : null,
          });
        }
        
        setShowEditPostModal(false);
        setEditingPost(null);
        setEditPostData({ title: '', content: '' });
        setEditPostImages([]);
        
        // AsyncStorage 저장은 백그라운드에서 처리
        AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts)).catch(err => {
          console.log('[Community] 로컬 게시글 수정 저장 실패:', err);
        });
        
        console.log('[Community] 로컬 게시글 수정 완료:', editingPost.id);
      } catch (error: any) {
        console.log('[Community] 로컬 게시글 수정 실패:', error);
      }
      return;
    }

    // 서버 게시글은 서버에 수정 요청
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
      
      // AsyncStorage 저장은 백그라운드에서 처리
      AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts)).catch(err => {
        console.log('[Community] 게시글 수정 저장 실패:', err);
      });
      
      console.log('[Community] 게시글 수정 완료');
      
      // 게시글 목록 새로고침은 백그라운드에서
      refreshPosts().catch(() => {});
    } catch (error: any) {
      console.log('[Community] 게시글 수정 실패:', error.message || '게시글 수정에 실패했습니다.');
      Alert.alert('알림', error.message || '게시글 수정에 실패했습니다.');
    }
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

  // 투표 기능 (백엔드 좋아요 기능 사용)
  const handleVote = async (entry: CompetitionEntry) => {
    if (!userId || userId === 'user@example.com') {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    if (!entry.postId) {
      Alert.alert('오류', '게시글 ID가 없습니다.');
      return;
    }

    try {
      const { likePost, unlikePost } = await import('../../api/posts');
      
      // 이미 좋아요를 눌렀는지 확인 (로컬 상태 기준)
      const hasVoted = entry.votedBy.includes(userId);
      
      if (hasVoted) {
        // 좋아요 취소
        await unlikePost(entry.postId);
      } else {
        // 좋아요
        await likePost(entry.postId);
      }
      
      // 대회 목록 새로고침
      await loadCompetitionPosts();
    } catch (error: any) {
      console.error('[Competition] 투표 실패:', error);
      Alert.alert('오류', error?.message || '투표 처리 중 오류가 발생했습니다.');
    }
  };

  // 월말 우승자 선정 로직 (백엔드 데이터 기반)
  const checkAndSelectWinner = async () => {
    try {
      const now = new Date();
      const currentMonth = getCurrentMonth();
      const [year, monthNum] = currentMonth.split('-').map(Number);
      const lastDay = new Date(year, monthNum, 0).getDate();
      const isLastDay = now.getDate() === lastDay;
      
      // 매월 마지막 날이거나 그 이후인 경우 우승자 선정
      if (isLastDay || now.getDate() > lastDay) {
        // 각 종목별로 우승자 선정 (좋아요 수 기준)
        const classicEntries = competitionEntries
          .filter(e => e.category === 'classic')
          .sort((a, b) => b.votes - a.votes);
        const physiqueEntries = competitionEntries
          .filter(e => e.category === 'physique')
          .sort((a, b) => b.votes - a.votes);
        
        // 대회 정보 업데이트
        if (competitionInfo) {
          const winner = competitionCategory === 'classic' 
            ? classicEntries[0] 
            : physiqueEntries[0];
          if (winner) {
            const updatedInfo = {
              ...competitionInfo,
              winner: { ...winner, isWinner: true },
            };
            setCompetitionInfo(updatedInfo);
          }
        }
      }
    } catch (error) {
      console.error('[Competition] 우승자 선정 실패:', error);
    }
  };

  // 키에 따른 제한 제중 계산 및 체급 정보 반환
  const getWeightClass = (category: 'classic' | 'physique') => {
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
    
    const matchedClass = classes.find(c =>
      userHeight >= c.heightMin &&
      userHeight <= c.heightMax
    );

    if (!matchedClass) {
      return null;
    }

    return {
      ...matchedClass,
      canParticipate: userWeight <= matchedClass.weightLimit,
      userWeight,
      userHeight,
    };
  };

  const canParticipate = (category: 'classic' | 'physique') => {
    const weightClass = getWeightClass(category);
    return weightClass?.canParticipate ?? false;
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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

      // 기존 로컬 게시글 가져오기 (local- 접두사가 있는 게시글)
      const savedPosts = await AsyncStorage.getItem('communityPosts');
      const localPosts: Post[] = [];
      if (savedPosts) {
        try {
          const parsed: any[] = JSON.parse(savedPosts);
          const filtered = parsed
            .filter((item: any) => String(item?.id || '').startsWith('local-'))
            .map(item => normalizePost(item));
          localPosts.push(...filtered);
        } catch (e) {
          console.log('[refreshPosts] 로컬 게시글 파싱 실패:', e);
        }
      }

      if (allPosts.length > 0) {
        const enrichedPosts = await enrichPostsWithDetails(allPosts);
        // 서버 게시글과 로컬 게시글 병합
        const mergedPosts = [...enrichedPosts, ...localPosts];
        setPosts(mergedPosts);
        await AsyncStorage.setItem('communityPosts', JSON.stringify(mergedPosts));
      } else {
        // API에서 게시글이 없으면 로컬 캐시 사용 (로컬 게시글 포함)
        if (savedPosts) {
          const parsed: any[] = JSON.parse(savedPosts);
          setPosts(parsed.map(item => normalizePost(item)));
        } else if (localPosts.length > 0) {
          setPosts(localPosts);
          await AsyncStorage.setItem('communityPosts', JSON.stringify(localPosts));
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
          // 로컬 게시글(local- 접두사)은 항상 유지
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
              <View style={styles.cardTitleContainer}>
                <Icon name="award" size={20} color="#6366f1" style={{ marginRight: 6 }} />
                <Text style={styles.cardTitle}>피지크 대회</Text>
              </View>
              <Button
                title="참가 신청"
                onPress={() => setShowCompetitionModal(true)}
              />
            </View>
            <Text style={styles.competitionDesc}>
              사진을 업로드하고 투표를 받아보세요!
            </Text>
            
            {/* 이달의 우승자 표시 - 현재 선택된 종목 기준 */}
            {(() => {
              const currentMonth = getCurrentMonth();
              const winner = competitionEntries
                .filter(e => e.category === competitionCategory && e.isWinner && e.month === currentMonth)
                .sort((a, b) => b.votes - a.votes)[0];
              
              if (winner) {
                return (
                  <View style={styles.winnerCard}>
                    <View style={styles.winnerTitleContainer}>
                      <Icon name="award" size={18} color="#f59e0b" style={{ marginRight: 6 }} />
                      <Text style={styles.winnerTitle}>이달의 우승자</Text>
                    </View>
                    <Text style={styles.winnerName}>{winner.userName}</Text>
                    <Text style={styles.winnerDetails}>
                      {winner.category === 'classic' ? '클래식 피지크' : '피지크'} · {winner.weightClass}
                    </Text>
                    <Text style={styles.winnerVotes}>총 {winner.votes}표</Text>
                  </View>
                );
              }
              return null;
            })()}

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
            
            {/* 종목 선택 시 개요 설명 */}
            <View style={styles.competitionDescriptionContainer}>
              <Text style={styles.competitionDescriptionText}>
                {COMPETITION_CATEGORY_DESCRIPTIONS[competitionCategory]}
              </Text>
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
                      onPress={() => handleVote(entry)}
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
                    
                    // 파일이 있든 없든 한 번에 처리
                    await createPost(payload, uploadFiles.length > 0 ? uploadFiles : undefined);
                    console.log('[CREATE_POST] 게시글 작성 성공');
                    
                    // 게시글 목록 새로고침
                    await refreshPosts();
                    
                    // 성공 시 모달 닫기 및 폼 초기화
                    closeWriteModal();
                    setNewPost({ title: '', content: '', category: '운동' });
                    setPostImages([]);
                    Alert.alert('완료', '게시글이 작성되었습니다.');
                  } catch (error: any) {
                    const errorMessage = error?.message || '서버에 게시글을 저장하지 못했습니다.';
                    // 서버 에러는 로컬 저장으로 대체되므로 에러 로그 최소화
                    console.log('[CREATE_POST] 서버 저장 실패, 로컬에 저장합니다');
                    
                    // 서버 저장 실패 시 로컬에 저장
                    try {
                      const localPostId = `local-${Date.now()}`;
                      const now = new Date().toISOString();
                      const authorName = currentUser?.nickname || currentUser?.name || '익명';
                      const authorProfileImage = currentUser?.profileImage || currentUser?.profileImageUrl || null;
                      
                      // 이미지 URL 처리
                      const imageUrls = postImages.map(img => img.uri);
                      
                      const localPost: Post = {
                        id: localPostId,
                        author: authorName,
                        authorId: String(userId),
                        authorProfileImage: authorProfileImage,
                        category: newPost.category,
                        title: payload.title,
                        content: payload.content,
                        likes: 0,
                        likedBy: [],
                        comments: 0,
                        createdAt: now,
                        time: formatPostDate(now),
                        displayDate: formatAbsoluteDate(now),
                        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                        thumbnail: imageUrls.length > 0 ? imageUrls[0] : null,
                      };
                      
                      // 게시글 목록에 추가 (상태 먼저 업데이트)
                      const updatedPosts = [localPost, ...posts];
                      setPosts(updatedPosts);
                      
                      // 내 게시글 ID 목록에 추가
                      const updatedMyPostIds = new Set(myPostIds);
                      updatedMyPostIds.add(localPostId);
                      setMyPostIds(updatedMyPostIds);
                      
                      // 성공 시 모달 닫기 및 폼 초기화
                      closeWriteModal();
                      setNewPost({ title: '', content: '', category: '운동' });
                      setPostImages([]);
                      
                      // AsyncStorage 저장은 백그라운드에서 처리 (await 제거)
                      Promise.all([
                        AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts)),
                        AsyncStorage.setItem(`myPosts_${userId}`, JSON.stringify(Array.from(updatedMyPostIds)))
                      ]).catch(err => {
                        console.log('[CREATE_POST] 로컬 저장 실패:', err);
                      });
                      
                      console.log('[CREATE_POST] 로컬 게시글 저장 완료:', localPostId);
                    } catch (localSaveError: any) {
                      console.log('[CREATE_POST] 로컬 저장 중 오류:', localSaveError);
                      // 로컬 저장도 실패하면 조용히 실패 (에러 메시지 표시 안 함)
                    }
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
                          </View>
                          <Text style={styles.commentContent}>{comment.content}</Text>
                          {comment.imageUrl ? (
                            <TouchableOpacity
                              onPress={() => {
                                if (comment.imageUrl) {
                                  setSelectedImageUrl(comment.imageUrl);
                                  setShowImageModal(true);
                                }
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
                    setSelectedCompetitionCategory('classic');
                  }}
                />
                <Button
                  title="제출"
                  onPress={async () => {
                    // 사진 인증: 최소 3장 필수
                    if (competitionImages.length < 3) {
                      Alert.alert('알림', '사진을 최소 3장 업로드해주세요.');
                      return;
                    }
                    
                    // 키에 따른 제한 제중 확인
                    if (!canParticipate(selectedCompetitionCategory)) {
                      const weightClass = getWeightClass(selectedCompetitionCategory);
                      Alert.alert(
                        '체급 조건 불만족',
                        `선택한 종목의 체급 조건을 만족하지 않습니다.\n\n체급: ${weightClass?.name}\n제한 무게: ${weightClass?.weightLimit}kg 이하\n현재 무게: ${weightClass?.userWeight}kg`
                      );
                      return;
                    }
                    
                    // 체급 정보 가져오기
                    const weightClass = getWeightClass(selectedCompetitionCategory);
                    if (!weightClass) {
                      Alert.alert('오류', '체급 정보를 가져올 수 없습니다.');
                      return;
                    }
                    
                    // 백엔드에 대회 게시글 생성
                    try {
                      const { createPost } = await import('../../api/posts');
                      
                      const categoryName = selectedCompetitionCategory === 'classic' ? '클래식 피지크' : '피지크';
                      const title = `${categoryName} - ${weightClass.name}`;
                      const content = `체급: ${weightClass.name}\n제한 무게: ${weightClass.weightLimit}kg 이하\n신장: ${currentUser.height}cm\n체중: ${currentUser.weight}kg`;
                      
                      // 이미지를 PostImageUpload 형식으로 변환
                      const postImages = competitionImages.map((uri, index) => ({
                        uri,
                        name: `competition_${Date.now()}_${index}.jpg`,
                        type: 'image/jpeg',
                      }));
                      
                      const response = await createPost(
                        {
                          title,
                          content,
                          postKind: 'COMPETITION',
                        },
                        postImages
                      );
                      
                      console.log('[Competition] 대회 참가 신청 성공:', response);
                      
                      // 대회 목록 새로고침
                      await loadCompetitionPosts();
                      
                      Alert.alert('완료', '대회 참가 신청이 완료되었습니다!');
                      setShowCompetitionModal(false);
                      setCompetitionImages([]);
                      setSelectedCompetitionCategory('classic');
                    } catch (error: any) {
                      console.error('[Competition] 참가 신청 실패:', error);
                      const errorMessage = error?.message || '참가 신청 처리 중 오류가 발생했습니다.';
                      
                      // 중복 참가 확인
                      if (errorMessage.includes('같은 제목의 게시글이 존재합니다')) {
                        Alert.alert('알림', '이미 이번 달 대회에 참가하셨습니다.');
                      } else {
                        Alert.alert('오류', errorMessage);
                      }
                    }
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
    backgroundColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingTop: 60,
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  writeButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#4f46e5',
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
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    marginHorizontal: 6,
  },
  tabActive: {
    borderBottomColor: '#6366f1',
  },
  tabText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
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
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  competitionDescriptionContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  competitionDescriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  winnerCard: {
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#fb923c',
  },
  winnerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea580c',
  },
  winnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  winnerDetails: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
  },
  winnerVotes: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ea580c',
  },
  categorySelectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 4,
  },
  categorySelectButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categorySelectButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  categorySelectButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  competitionCategorySelector: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userInfo: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  userInfoText: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4,
  },
  eligibleText: {
    fontSize: 14,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 8,
  },
  ineligibleText: {
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
    marginTop: 8,
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
