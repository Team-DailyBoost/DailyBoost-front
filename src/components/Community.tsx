import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Search, Edit, Heart, MessageCircle, Send, Trophy, Upload, UserPlus, UserMinus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner@2.0.3';

interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  time: string;
}

interface Post {
  id: string;
  author: string;
  authorId: string;
  category: string;
  title: string;
  content: string;
  likes: number;
  likedBy: string[];
  comments: number;
  time: string;
  image?: string;
}

interface CompetitionEntry {
  id: string;
  userId: string;
  userName: string;
  userHeight: number;
  userWeight: number;
  category: 'classic' | 'physique';
  weightClass: string;
  image: string;
  votes: number;
  votedBy: string[];
  submittedAt: string;
}

interface CompetitionWeightClass {
  name: string;
  heightMin: number;
  heightMax: number;
  weightLimit: number;
}

const competitionWeightClasses: Record<'classic' | 'physique', CompetitionWeightClass[]> = {
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

const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    author: '헬스왕',
    authorId: 'user1',
    category: '운동',
    title: '스쿼트 자세 피드백 부탁드려요!',
    content: '오늘 80kg으로 스쿼트했는데 무릎이 살짝 아픈 것 같아요. 자세 체크 부탁드립니다!',
    likes: 24,
    likedBy: [],
    comments: 0,
    time: '10분 전',
  },
  {
    id: '2',
    author: '다이어터',
    authorId: 'user2',
    category: '식단',
    title: '저칼로리 샐러드 레시피 공유!',
    content: '다이어트 중에도 맛있게 먹을 수 있는 레시피입니다. 닭가슴살, 방울토마토, 아보카도를 넣고...',
    likes: 156,
    likedBy: [],
    comments: 0,
    time: '1시간 전',
  },
];

export function Community() {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showWriteDialog, setShowWriteDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState({
    category: '운동',
    title: '',
    content: '',
    image: '',
  });
  
  // Competition state
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>([]);
  const [showCompetitionDialog, setShowCompetitionDialog] = useState(false);
  const [competitionForm, setCompetitionForm] = useState({
    category: 'classic' as 'classic' | 'physique',
    image: '',
  });
  
  // User search and follow
  const [showUserSearchDialog, setShowUserSearchDialog] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUserProfile, setSelectedUserProfile] = useState<any>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userId = currentUser.email || 'guest';

  useEffect(() => {
    const savedPosts = localStorage.getItem('communityPosts');
    const savedComments = localStorage.getItem('communityComments');
    const savedCompetition = localStorage.getItem('competitionEntries');
    const savedFollowing = localStorage.getItem(`following_${userId}`);
    
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem('communityPosts', JSON.stringify(INITIAL_POSTS));
    }
    
    if (savedComments) setComments(JSON.parse(savedComments));
    if (savedCompetition) setCompetitionEntries(JSON.parse(savedCompetition));
    if (savedFollowing) setFollowing(JSON.parse(savedFollowing));
  }, [userId]);

  const savePosts = (newPosts: Post[]) => {
    setPosts(newPosts);
    localStorage.setItem('communityPosts', JSON.stringify(newPosts));
  };

  const saveComments = (newComments: Comment[]) => {
    setComments(newComments);
    localStorage.setItem('communityComments', JSON.stringify(newComments));
  };

  const saveCompetitionEntries = (entries: CompetitionEntry[]) => {
    setCompetitionEntries(entries);
    localStorage.setItem('competitionEntries', JSON.stringify(entries));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'post' | 'competition') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'post') {
          setNewPost({ ...newPost, image: reader.result as string });
        } else {
          setCompetitionForm({ ...competitionForm, image: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) return;

    const post: Post = {
      id: Date.now().toString(),
      author: currentUser.name || '사용자',
      authorId: userId,
      category: newPost.category,
      title: newPost.title,
      content: newPost.content,
      image: newPost.image,
      likes: 0,
      likedBy: [],
      comments: 0,
      time: '방금 전',
    };

    savePosts([post, ...posts]);
    setNewPost({ category: '운동', title: '', content: '', image: '' });
    setShowWriteDialog(false);
    toast.success('게시글이 작성되었습니다!');
  };

  const handleLike = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedPosts = posts.map((post) => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(userId);
        return {
          ...post,
          likes: hasLiked ? post.likes - 1 : post.likes + 1,
          likedBy: hasLiked
            ? post.likedBy.filter((id) => id !== userId)
            : [...post.likedBy, userId],
        };
      }
      return post;
    });
    savePosts(updatedPosts);
    
    if (selectedPost) {
      const updated = updatedPosts.find(p => p.id === selectedPost.id);
      if (updated) setSelectedPost(updated);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedPost) return;

    const comment: Comment = {
      id: Date.now().toString(),
      postId: selectedPost.id,
      author: currentUser.name || '사용자',
      authorId: userId,
      content: newComment,
      time: '방금 전',
    };

    const updatedComments = [...comments, comment];
    saveComments(updatedComments);

    const updatedPosts = posts.map((post) =>
      post.id === selectedPost.id
        ? { ...post, comments: post.comments + 1 }
        : post
    );
    savePosts(updatedPosts);

    const updatedSelectedPost = updatedPosts.find(p => p.id === selectedPost.id);
    if (updatedSelectedPost) setSelectedPost(updatedSelectedPost);
    
    setNewComment('');
    toast.success('댓글이 작성되었습니다!');
  };

  const handleSubmitCompetition = () => {
    if (!competitionForm.image) {
      toast.error('사진을 업로드해주세요!');
      return;
    }

    const weightClass = getWeightClass(competitionForm.category, currentUser.height, currentUser.weight);
    if (!weightClass) {
      toast.error('체급 조건을 만족하지 않습니다!');
      return;
    }

    const entry: CompetitionEntry = {
      id: Date.now().toString(),
      userId,
      userName: currentUser.name || '사용자',
      userHeight: currentUser.height,
      userWeight: currentUser.weight,
      category: competitionForm.category,
      weightClass: weightClass.name,
      image: competitionForm.image,
      votes: 0,
      votedBy: [],
      submittedAt: new Date().toISOString(),
    };

    saveCompetitionEntries([...competitionEntries, entry]);
    setCompetitionForm({ category: 'classic', image: '' });
    setShowCompetitionDialog(false);
    toast.success('대회 참가 신청이 완료되었습니다!');
  };

  const getWeightClass = (category: 'classic' | 'physique', height: number, weight: number) => {
    const classes = competitionWeightClasses[category];
    return classes.find(c => 
      height >= c.heightMin && 
      height <= c.heightMax && 
      weight <= c.weightLimit
    );
  };

  const handleVote = (entryId: string) => {
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
    saveCompetitionEntries(updated);
  };

  const handleFollow = (targetUserId: string) => {
    const isFollowing = following.includes(targetUserId);
    const updated = isFollowing
      ? following.filter(id => id !== targetUserId)
      : [...following, targetUserId];
    
    setFollowing(updated);
    localStorage.setItem(`following_${userId}`, JSON.stringify(updated));
    toast.success(isFollowing ? '팔로우를 취소했습니다' : '팔로우했습니다!');
  };

  const searchUsers = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter((user: any) => 
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(userSearchQuery.toLowerCase()))
    );
  };

  const getUserProfile = (userEmail: string) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    return users.find((u: any) => u.email === userEmail);
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const postComments = selectedPost
    ? comments.filter((c) => c.postId === selectedPost.id)
    : [];

  const canParticipate = (category: 'classic' | 'physique') => {
    if (!currentUser.height || !currentUser.weight) return false;
    const weightClass = getWeightClass(category, currentUser.height, currentUser.weight);
    return !!weightClass;
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">커뮤니티</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowUserSearchDialog(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button size="sm" className="rounded-full" onClick={() => setShowWriteDialog(true)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="posts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posts">게시글</TabsTrigger>
          <TabsTrigger value="competition">대회</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="게시물 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Posts List */}
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {post.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{post.author}</div>
                        <div className="text-xs text-muted-foreground">{post.time}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{post.category}</Badge>
                  </div>

                  <div className="space-y-2 mb-3">
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.content}
                    </p>
                    {post.image && (
                      <img src={post.image} alt="Post" className="w-full h-48 object-cover rounded-lg" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-3 border-t">
                    <button
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                      onClick={(e) => handleLike(post.id, e)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          post.likedBy.includes(userId)
                            ? 'fill-red-500 text-red-500'
                            : ''
                        }`}
                      />
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MessageCircle className="h-4 w-4 text-blue-500" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="competition" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  피지크 대회
                </CardTitle>
                <Button size="sm" onClick={() => setShowCompetitionDialog(true)}>
                  참가 신청
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                사진을 업로드하고 투표를 받아보세요!
              </div>

              {/* Competition Categories */}
              <Tabs defaultValue="classic">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="classic">클래식 피지크</TabsTrigger>
                  <TabsTrigger value="physique">피지크</TabsTrigger>
                </TabsList>

                <TabsContent value="classic" className="space-y-3 mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {competitionEntries
                        .filter(e => e.category === 'classic')
                        .sort((a, b) => b.votes - a.votes)
                        .map((entry, idx) => (
                          <Card key={entry.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="relative">
                                <img 
                                  src={entry.image} 
                                  alt={entry.userName}
                                  className="w-full h-64 object-cover"
                                />
                                <Badge className="absolute top-2 left-2">
                                  #{idx + 1}
                                </Badge>
                              </div>
                              <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{entry.userName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {entry.weightClass} | {entry.userHeight}cm / {entry.userWeight}kg
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={entry.votedBy.includes(userId) ? 'default' : 'outline'}
                                    onClick={() => handleVote(entry.id)}
                                  >
                                    <Heart className={`h-4 w-4 mr-1 ${entry.votedBy.includes(userId) ? 'fill-current' : ''}`} />
                                    {entry.votes}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="physique" className="space-y-3 mt-4">
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3 pr-4">
                      {competitionEntries
                        .filter(e => e.category === 'physique')
                        .sort((a, b) => b.votes - a.votes)
                        .map((entry, idx) => (
                          <Card key={entry.id} className="overflow-hidden">
                            <CardContent className="p-0">
                              <div className="relative">
                                <img 
                                  src={entry.image} 
                                  alt={entry.userName}
                                  className="w-full h-64 object-cover"
                                />
                                <Badge className="absolute top-2 left-2">
                                  #{idx + 1}
                                </Badge>
                              </div>
                              <div className="p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{entry.userName}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {entry.weightClass} | {entry.userHeight}cm / {entry.userWeight}kg
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant={entry.votedBy.includes(userId) ? 'default' : 'outline'}
                                    onClick={() => handleVote(entry.id)}
                                  >
                                    <Heart className={`h-4 w-4 mr-1 ${entry.votedBy.includes(userId) ? 'fill-current' : ''}`} />
                                    {entry.votes}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Write Post Dialog */}
      <Dialog open={showWriteDialog} onOpenChange={setShowWriteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 게시글 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <Select
                value={newPost.category}
                onValueChange={(value) =>
                  setNewPost({ ...newPost, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="운동">운동</SelectItem>
                  <SelectItem value="식단">식단</SelectItem>
                  <SelectItem value="질문">질문</SelectItem>
                  <SelectItem value="자유">자유</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                placeholder="제목을 입력하세요"
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                placeholder="내용을 입력하세요"
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>사진 (선택)</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'post')}
                className="hidden"
                id="post-image-upload"
              />
              <Label htmlFor="post-image-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    사진 업로드
                  </span>
                </Button>
              </Label>
              {newPost.image && (
                <img src={newPost.image} alt="Preview" className="w-full h-32 object-cover rounded" />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWriteDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button onClick={handleCreatePost} className="flex-1">
                작성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Competition Submit Dialog */}
      <Dialog open={showCompetitionDialog} onOpenChange={setShowCompetitionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>대회 참가 신청</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>종목 선택</Label>
              <Select
                value={competitionForm.category}
                onValueChange={(value: any) =>
                  setCompetitionForm({ ...competitionForm, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">클래식 피지크</SelectItem>
                  <SelectItem value="physique">피지크</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm space-y-2">
              <div className="font-medium">나의 정보</div>
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div>키: {currentUser.height || '-'}cm</div>
                <div>몸무게: {currentUser.weight || '-'}kg</div>
                {canParticipate(competitionForm.category) && (
                  <div className="text-primary font-medium">
                    출전 가능 체급: {getWeightClass(competitionForm.category, currentUser.height, currentUser.weight)?.name}
                  </div>
                )}
                {!canParticipate(competitionForm.category) && (
                  <div className="text-destructive font-medium">
                    체급 조건을 만족하지 않습니다
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>사진 업로드 *</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'competition')}
                className="hidden"
                id="competition-image-upload"
              />
              <Label htmlFor="competition-image-upload">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    사진 선택
                  </span>
                </Button>
              </Label>
              {competitionForm.image && (
                <img src={competitionForm.image} alt="Preview" className="w-full h-64 object-cover rounded" />
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCompetitionDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button 
                onClick={handleSubmitCompetition} 
                className="flex-1"
                disabled={!canParticipate(competitionForm.category)}
              >
                제출
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Search Dialog */}
      <Dialog open={showUserSearchDialog} onOpenChange={setShowUserSearchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 검색</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="이메일 또는 이름으로 검색..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
            />
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {searchUsers().map((user: any) => (
                  <Card key={user.email} className="cursor-pointer hover:bg-accent/50">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3" onClick={() => setSelectedUserProfile(user)}>
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{user.name?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || '사용자'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUserProfile(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {user.email !== userId && (
                          <Button
                            size="sm"
                            variant={following.includes(user.email) ? 'secondary' : 'default'}
                            onClick={() => handleFollow(user.email)}
                          >
                            {following.includes(user.email) ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <UserPlus className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUserProfile} onOpenChange={() => setSelectedUserProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프로필</DialogTitle>
          </DialogHeader>
          {selectedUserProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl">
                    {selectedUserProfile.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{selectedUserProfile.name || '사용자'}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUserProfile.email}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">나이</div>
                  <div className="font-medium">{selectedUserProfile.age || '-'}세</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">성별</div>
                  <div className="font-medium">
                    {selectedUserProfile.gender === 'male' ? '남성' : selectedUserProfile.gender === 'female' ? '여성' : '기타'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">키</div>
                  <div className="font-medium">{selectedUserProfile.height || '-'}cm</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">몸무게</div>
                  <div className="font-medium">{selectedUserProfile.weight || '-'}kg</div>
                </div>
              </div>

              {selectedUserProfile.email !== userId && (
                <Button
                  className="w-full"
                  variant={following.includes(selectedUserProfile.email) ? 'secondary' : 'default'}
                  onClick={() => handleFollow(selectedUserProfile.email)}
                >
                  {following.includes(selectedUserProfile.email) ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-2" />
                      팔로우 취소
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      팔로우
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Post Detail Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {selectedPost.author[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedPost.author}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedPost.time}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary">{selectedPost.category}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <DialogTitle className="text-xl mb-3">
                    {selectedPost.title}
                  </DialogTitle>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedPost.content}
                  </p>
                  {selectedPost.image && (
                    <img src={selectedPost.image} alt="Post" className="w-full h-64 object-cover rounded-lg mt-3" />
                  )}
                </div>

                <div className="flex items-center gap-4 py-3 border-y">
                  <button
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={(e) => handleLike(selectedPost.id, e)}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        selectedPost.likedBy.includes(userId)
                          ? 'fill-red-500 text-red-500'
                          : ''
                      }`}
                    />
                    <span>{selectedPost.likes}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    <span>{selectedPost.comments}</span>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    댓글 {postComments.length}
                  </h3>

                  {postComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {comment.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{comment.author}</span>
                          <span className="text-xs text-muted-foreground">
                            {comment.time}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="댓글을 입력하세요..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button onClick={handleAddComment} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
