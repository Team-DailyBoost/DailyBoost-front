import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // expo용 아이콘 라이브러리

import Dashboard from './components/Dashboard';
import FoodLogger from './components/FoodLogger';
import WorkoutLogger from './components/WorkoutLogger';
import Challenge from './components/Challenge';
import Community from './components/Community';
import MyPage from './components/MyPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'food': return <FoodLogger />;
      case 'workout': return <WorkoutLogger />;
      case 'challenge': return <Challenge />;
      case 'community': return <Community />;
      case 'mypage': return <MyPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderContent()}</View>

      <View style={styles.tabBar}>
        <TabButton
          icon="home-outline"
          label="홈"
          active={activeTab === 'dashboard'}
          onPress={() => setActiveTab('dashboard')}
        />
        <TabButton
          icon="fast-food-outline"
          label="식단"
          active={activeTab === 'food'}
          onPress={() => setActiveTab('food')}
        />
        <TabButton
          icon="barbell-outline"
          label="운동"
          active={activeTab === 'workout'}
          onPress={() => setActiveTab('workout')}
        />
        <TabButton
          icon="trophy-outline"
          label="챌린지"
          active={activeTab === 'challenge'}
          onPress={() => setActiveTab('challenge')}
        />
        <TabButton
          icon="people-outline"
          label="커뮤니티"
          active={activeTab === 'community'}
          onPress={() => setActiveTab('community')}
        />
        <TabButton
          icon="person-outline"
          label="마이"
          active={activeTab === 'mypage'}
          onPress={() => setActiveTab('mypage')}
        />
      </View>
    </SafeAreaView>
  );
}

function TabButton({ icon, label, active, onPress }: any) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Ionicons name={icon} size={22} color={active ? '#007AFF' : '#999'} />
      <Text style={[styles.tabLabel, active && { color: '#007AFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f9f9f9',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 3,
    color: '#666',
  },
});
