import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import type { Post } from '../types';

export function Community() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'hot' | 'workout' | 'diet' | 'weight-loss'>('hot');

  // 핫 게시물
  const hotPosts: Post[] = [
    {
      id: '1',
      author: { name: '헬스마니아', level: '골드', avatar: '' },
      content: '3개월 헬스 변화 사진! 꾸준함이 답이네요 💪 오늘도 스쿼트 100개 완료!',
      category: 'workout',
      hashtags: ['헬스', '변화사진', '3개월차', '스쿼트'],
      likes: 247,
      comments: 38,
      timeAgo: '2시간 전',
      isLiked: false,
    },
    {
      id: '2',
      author: { name: '다이어터김씨', level: '실버', avatar: '' },
      content: '간헐적 단식 2주차 후기! 체중 3kg 감량 성공 🎉 배고프긴 했지만 효과가 확실해요',
      category: 'weight-loss',
      hashtags: ['간헐적단식', '2주차', '3kg감량', '다이어트성공'],
      likes: 189,
      comments: 52,
      timeAgo: '4시간 전',
      isLiked: true,
    },
    {
      id: '3',
      author: { name: '요리하는직장인', level: '브론즈', avatar: '' },
      content: '오늘의 도시락 메뉴! 닭가슴살 볶음밥 + 브로콜리 🥦 총 450kcal로 맞췄어요',
      category: 'diet',
      hashtags: ['도시락', '닭가슴살', '450kcal', '직장인식단'],
      likes: 156,
      comments: 29,
      timeAgo: '6시간 전',
      isLiked: false,
    },
    {
      id: '4',
      author: { name: '런닝맨박', level: '골드', avatar: '' },
      content: '첫 마라톤 완주 후기! 4시간 32분으로 완주했습니다 🏃‍♂️ 다리는 아프지만 뿌듯해요',
      category: 'workout',
      hashtags: ['마라톤', '첫완주', '4시간32분', '런닝'],
      likes: 312,
      comments: 67,
      timeAgo: '8시간 전',
      isLiked: true,
    },
  ];

  const workoutPosts: Post[] = hotPosts.filter((p) => p.category === 'workout');
  const dietPosts: Post[] = hotPosts.filter((p) => p.category === 'diet');
  const weightLossPosts: Post[] = hotPosts.filter((p) => p.category === 'weight-loss');

  const getPosts = () => {
    switch (activeCategory) {
      case 'hot':
        return hotPosts;
      case 'workout':
        return workoutPosts;
      case 'diet':
        return dietPosts;
      case 'weight-loss':
        return weightLossPosts;
      default:
        return hotPosts;
    }
  };

  const getCategoryIcon = (category: 'workout' | 'diet' | 'weight-loss') => {
    switch (category) {
      case 'workout':
        return 'activity';
      case 'diet':
        return 'coffee';
      case 'weight-loss':
        return 'trending-down';
    }
  };

  const getCategoryColor = (category: 'workout' | 'diet' | 'weight-loss') => {
    switch (category) {
      case 'workout':
        return '#3b82f6';
      case 'diet':
        return '#10b981';
      case 'weight-loss':
        return '#f59e0b';
    }
  };

  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set(['2', '4']));

  const toggleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>커뮤니티</Text>
        <TouchableOpacity>
          <Icon name="edit" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6b7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 카테고리 탭 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        <TouchableOpacity
          style={[styles.categoryButton, activeCategory === 'hot' && styles.categoryButtonActive]}
          onPress={() => setActiveCategory('hot')}
        >
          <Icon name="trending-up" size={18} color={activeCategory === 'hot' ? '#fff' : '#6366f1'} />
          <Text style={[styles.categoryText, activeCategory === 'hot' && styles.categoryTextActive]}>
            핫
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryButton, activeCategory === 'workout' && styles.categoryButtonActive]}
          onPress={() => setActiveCategory('workout')}
        >
          <Icon name="activity" size={18} color={activeCategory === 'workout' ? '#fff' : '#6366f1'} />
          <Text style={[styles.categoryText, activeCategory === 'workout' && styles.categoryTextActive]}>
            운동
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryButton, activeCategory === 'diet' && styles.categoryButtonActive]}
          onPress={() => setActiveCategory('diet')}
        >
          <Icon name="coffee" size={18} color={activeCategory === 'diet' ? '#fff' : '#6366f1'} />
          <Text style={[styles.categoryText, activeCategory === 'diet' && styles.categoryTextActive]}>
            식단
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.categoryButton, activeCategory === 'weight-loss' && styles.categoryButtonActive]}
          onPress={() => setActiveCategory('weight-loss')}
        >
          <Icon name="trending-down" size={18} color={activeCategory === 'weight-loss' ? '#fff' : '#6366f1'} />
          <Text style={[styles.categoryText, activeCategory === 'weight-loss' && styles.categoryTextActive]}>
            다이어트
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 게시물 목록 */}
      <ScrollView style={styles.content}>
        {getPosts().map((post) => (
          <Card key={post.id} style={styles.postCard}>
            {/* 작성자 정보 */}
            <View style={styles.postHeader}>
              <View style={styles.authorInfo}>
                <View style={styles.avatar}>
                  <Icon name="user" size={20} color="#6b7280" />
                </View>
                <View>
                  <Text style={styles.authorName}>{post.author.name}</Text>
                  <Text style={styles.timeAgo}>{post.timeAgo}</Text>
                </View>
              </View>
              <Badge variant="secondary">{post.author.level}</Badge>
            </View>

            {/* 카테고리 */}
            <View style={styles.categoryBadgeContainer}>
              <Icon
                name={getCategoryIcon(post.category)}
                size={16}
                color={getCategoryColor(post.category)}
              />
              <Text style={[styles.categoryBadgeText, { color: getCategoryColor(post.category) }]}>
                {post.category === 'workout'
                  ? '운동'
                  : post.category === 'diet'
                  ? '식단'
                  : '다이어트'}
              </Text>
            </View>

            {/* 내용 */}
            <Text style={styles.postContent}>{post.content}</Text>

            {/* 해시태그 */}
            <View style={styles.hashtags}>
              {post.hashtags.map((tag, index) => (
                <Text key={index} style={styles.hashtag}>
                  #{tag}
                </Text>
              ))}
            </View>

            {/* 액션 버튼 */}
            <View style={styles.postActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleLike(post.id)}
              >
                <Icon
                  name={likedPosts.has(post.id) ? 'heart' : 'heart'}
                  size={20}
                  color={likedPosts.has(post.id) ? '#ef4444' : '#6b7280'}
                  fill={likedPosts.has(post.id) ? '#ef4444' : 'none'}
                />
                <Text
                  style={[
                    styles.actionText,
                    likedPosts.has(post.id) && { color: '#ef4444' },
                  ]}
                >
                  {post.likes + (likedPosts.has(post.id) !== post.isLiked ? (likedPosts.has(post.id) ? 1 : -1) : 0)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Icon name="message-circle" size={20} color="#6b7280" />
                <Text style={styles.actionText}>{post.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Icon name="share-2" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1f2937',
  },
  categories: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
  },
  categoryTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  postCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  categoryBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadgeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 15,
    color: '#1f2937',
    lineHeight: 22,
    marginBottom: 12,
  },
  hashtags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  hashtag: {
    fontSize: 14,
    color: '#6366f1',
    marginRight: 8,
    marginBottom: 4,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6b7280',
  },
});
