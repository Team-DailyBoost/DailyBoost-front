import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';

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

export function Community() {
  const [activeTab, setActiveTab] = useState<'posts' | 'competition'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showCompetitionModal, setShowCompetitionModal] = useState(false);
  const [competitionCategory, setCompetitionCategory] = useState<'classic' | 'physique'>('classic');
  const [competitionEntries, setCompetitionEntries] = useState<CompetitionEntry[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  const currentUser = { email: 'user@example.com', name: '사용자', height: 175, weight: 70 };
  const userId = currentUser.email;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedPosts = await AsyncStorage.getItem('communityPosts');
      const savedCompetition = await AsyncStorage.getItem('competitionEntries');
      const savedFollowing = await AsyncStorage.getItem(`following_${userId}`);

      if (savedPosts) setPosts(JSON.parse(savedPosts));
      if (savedCompetition) setCompetitionEntries(JSON.parse(savedCompetition));
      if (savedFollowing) setFollowing(JSON.parse(savedFollowing));
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleLike = async (postId: string) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(userId);
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
    await AsyncStorage.setItem('communityPosts', JSON.stringify(updatedPosts));
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

  const filteredPosts = posts.filter(
    post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const classicEntries = competitionEntries
    .filter(e => e.category === 'classic')
    .sort((a, b) => b.votes - a.votes);

  const physiqueEntries = competitionEntries
    .filter(e => e.category === 'physique')
    .sort((a, b) => b.votes - a.votes);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>커뮤니티</Text>
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => setShowWriteModal(true)}
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
        <ScrollView style={styles.content}>
          {/* Search */}
          <TextInput
            style={styles.searchInput}
            placeholder="게시물 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Posts */}
          {filteredPosts.map(post => (
            <Card key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <View>
                  <Text style={styles.postAuthor}>{post.author}</Text>
                  <Text style={styles.postTime}>{post.time}</Text>
                </View>
                <Badge text={post.category} />
              </View>

              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent} numberOfLines={2}>
                {post.content}
              </Text>

              {post.image && (
                <Image source={{ uri: post.image }} style={styles.postImage} />
              )}

              <View style={styles.postFooter}>
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => handleLike(post.id)}
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
          ))}
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
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
                  {entry.image && (
                    <Image source={{ uri: entry.image }} style={styles.entryImage} />
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

      {/* Competition Modal */}
      <Modal
        visible={showCompetitionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCompetitionModal(false)}
      >
        <View style={styles.modalOverlay}>
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

            <View style={styles.modalButtons}>
              <Button
                title="취소"
                onPress={() => setShowCompetitionModal(false)}
              />
              <Button
                title="제출"
                onPress={() => {
                  if (canParticipate('classic')) {
                    Alert.alert('참가 신청이 완료되었습니다!');
                    setShowCompetitionModal(false);
                  } else {
                    Alert.alert('체급 조건을 만족하지 않습니다');
                  }
                }}
              />
            </View>
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
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
    width: '80%',
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
  },
});
