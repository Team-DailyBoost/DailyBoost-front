import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Download, Palette, Layers, Smartphone, Layout, FileImage, Package } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// 전체 앱 구조를 SVG로 변환한 디자인 파일들
const figmaDesigns = {
  // 메인 앱 구조
  'app-structure': {
    name: '전체 앱 구조',
    description: '메인 레이아웃과 네비게이션 구조',
    category: 'structure',
    svg: `<svg width="375" height="812" viewBox="0 0 375 812" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Main Container -->
      <rect width="375" height="812" rx="20" fill="#FFFFFF"/>
      <rect x="1" y="1" width="373" height="810" rx="19" stroke="#E5E7EB" stroke-width="2"/>
      
      <!-- Header Area -->
      <rect x="16" y="60" width="343" height="60" rx="12" fill="#F9FAFB" stroke="#E5E7EB"/>
      <text x="32" y="85" font-family="Arial" font-size="18" font-weight="600" fill="#111827">안녕하세요! 👋</text>
      <circle cx="335" cy="90" r="20" fill="#6366F1"/>
      <text x="327" y="96" font-family="Arial" font-size="12" fill="white">김건</text>
      
      <!-- Content Area -->
      <rect x="16" y="136" width="343" height="576" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="187.5" y="440" font-family="Arial" font-size="14" fill="#64748B" text-anchor="middle">메인 컨텐츠 영역</text>
      
      <!-- Bottom Navigation -->
      <rect x="0" y="728" width="375" height="84" fill="#FFFFFF" stroke="#E5E7EB"/>
      
      <!-- Nav Items -->
      <g id="nav-home">
        <rect x="20" y="740" width="42" height="48" rx="8" fill="#6366F1" fill-opacity="0.1"/>
        <circle cx="41" cy="754" r="8" fill="#6366F1"/>
        <text x="41" y="775" font-family="Arial" font-size="10" fill="#6366F1" text-anchor="middle">홈</text>
      </g>
      
      <g id="nav-food">
        <rect x="82" y="740" width="42" height="48" rx="8" fill="transparent"/>
        <circle cx="103" cy="754" r="6" fill="#6B7280"/>
        <text x="103" y="775" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">식단</text>
      </g>
      
      <g id="nav-workout">
        <rect x="144" y="740" width="42" height="48" rx="8" fill="transparent"/>
        <rect x="98" y="750" width="12" height="4" rx="2" fill="#6B7280"/>
        <text x="165" y="775" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">운동</text>
      </g>
      
      <g id="nav-challenge">
        <rect x="206" y="740" width="42" height="48" rx="8" fill="transparent"/>
        <path d="M220 754 L222 750 L230 750 L225 754 L227 758 L222 756 L217 758 Z" fill="#6B7280"/>
        <text x="227" y="775" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">챌린지</text>
      </g>
      
      <g id="nav-community">
        <rect x="268" y="740" width="42" height="48" rx="8" fill="transparent"/>
        <circle cx="285" cy="751" r="4" fill="#6B7280"/>
        <circle cx="293" cy="754" r="3" fill="#6B7280"/>
        <text x="289" y="775" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">커뮤니티</text>
      </g>
      
      <g id="nav-mypage">
        <rect x="330" y="740" width="42" height="48" rx="8" fill="transparent"/>
        <circle cx="351" cy="754" r="6" fill="#6B7280"/>
        <text x="351" y="775" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">마이</text>
      </g>
    </svg>`
  },

  // 홈 대시보드
  'dashboard-layout': {
    name: '홈 대시보드',
    description: '메인 대시보드 화면 레이아웃',
    category: 'screens',
    svg: `<svg width="375" height="600" viewBox="0 0 375 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="375" height="600" fill="#F8FAFC"/>
      
      <!-- Character Card -->
      <rect x="16" y="16" width="343" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="187.5" y="50" font-family="Arial" font-size="32" text-anchor="middle">💪😁💪</text>
      <text x="187.5" y="75" font-family="Arial" font-size="14" font-weight="500" fill="#059669" text-anchor="middle">완벽해요! 오늘의 목표를 달성했어요!</text>
      <text x="187.5" y="95" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">운동 진행률: 100%</text>
      
      <!-- Stats Cards -->
      <g id="stats-grid">
        <rect x="16" y="152" width="167" height="80" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="99.5" y="175" font-family="Arial" font-size="24" font-weight="600" fill="#6366F1" text-anchor="middle">1650</text>
        <text x="99.5" y="195" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">섭취 칼로리</text>
        
        <rect x="192" y="152" width="167" height="80" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="275.5" y="175" font-family="Arial" font-size="24" font-weight="600" fill="#EF4444" text-anchor="middle">350</text>
        <text x="275.5" y="195" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">남은 칼로리</text>
      </g>
      
      <!-- Progress Cards -->
      <rect x="16" y="248" width="343" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="270" font-family="Arial" font-size="14" font-weight="500" fill="#111827">영양소 현황</text>
      
      <!-- Progress Bars -->
      <rect x="32" y="280" width="311" height="4" rx="2" fill="#E5E7EB"/>
      <rect x="32" y="280" width="186" height="4" rx="2" fill="#6366F1"/>
      <text x="32" y="298" font-family="Arial" font-size="12" fill="#6B7280">단백질</text>
      <text x="311" y="298" font-family="Arial" font-size="12" fill="#111827" text-anchor="end">95g / 120g</text>
      
      <rect x="32" y="310" width="311" height="4" rx="2" fill="#E5E7EB"/>
      <rect x="32" y="310" width="224" height="4" rx="2" fill="#10B981"/>
      <text x="32" y="328" font-family="Arial" font-size="12" fill="#6B7280">탄수화물</text>
      <text x="311" y="328" font-family="Arial" font-size="12" fill="#111827" text-anchor="end">180g / 250g</text>
      
      <!-- Chart Area -->
      <rect x="16" y="364" width="343" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="385" font-family="Arial" font-size="14" font-weight="500" fill="#111827">주간 칼로리 현황</text>
      
      <!-- Simple Bar Chart -->
      <g id="bar-chart">
        <rect x="40" y="420" width="20" height="40" rx="2" fill="#6366F1"/>
        <rect x="70" y="410" width="20" height="50" rx="2" fill="#6366F1"/>
        <rect x="100" y="400" width="20" height="60" rx="2" fill="#6366F1"/>
        <rect x="130" y="415" width="20" height="45" rx="2" fill="#6366F1"/>
        <rect x="160" y="405" width="20" height="55" rx="2" fill="#6366F1"/>
        <rect x="190" y="425" width="20" height="35" rx="2" fill="#6366F1"/>
        <rect x="220" y="420" width="20" height="40" rx="2" fill="#6366F1"/>
      </g>
      
      <!-- Quick Actions -->
      <g id="quick-actions">
        <rect x="16" y="500" width="167" height="80" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <circle cx="99.5" cy="525" r="16" fill="#6366F1" fill-opacity="0.1"/>
        <circle cx="99.5" cy="525" r="8" fill="#6366F1"/>
        <text x="99.5" y="555" font-family="Arial" font-size="12" fill="#111827" text-anchor="middle">운동 시작</text>
        
        <rect x="192" y="500" width="167" height="80" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <circle cx="275.5" cy="525" r="16" fill="#10B981" fill-opacity="0.1"/>
        <circle cx="275.5" cy="525" r="8" fill="#10B981"/>
        <text x="275.5" y="555" font-family="Arial" font-size="12" fill="#111827" text-anchor="middle">음식 기록</text>
      </g>
    </svg>`
  },

  // 운동 화면
  'workout-layout': {
    name: '운동 화면',
    description: '운동 선택과 기록 화면',
    category: 'screens',
    svg: `<svg width="375" height="600" viewBox="0 0 375 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="375" height="600" fill="#F8FAFC"/>
      
      <!-- Header -->
      <rect x="16" y="16" width="343" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="187.5" y="40" font-family="Arial" font-size="18" font-weight="600" fill="#111827" text-anchor="middle">오늘의 운동 🏋️‍♂️</text>
      <text x="187.5" y="58" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">부위별 운동을 선택해보세요</text>
      
      <!-- Exercise Categories Grid -->
      <g id="exercise-categories">
        <!-- Row 1 -->
        <rect x="16" y="92" width="107" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="69.5" y="115" font-family="Arial" font-size="24" text-anchor="middle">💪</text>
        <text x="69.5" y="135" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">가슴</text>
        <text x="69.5" y="150" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">12개 운동</text>
        
        <rect x="134" y="92" width="107" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="187.5" y="115" font-family="Arial" font-size="24" text-anchor="middle">🦵</text>
        <text x="187.5" y="135" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">하체</text>
        <text x="187.5" y="150" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">15개 운동</text>
        
        <rect x="252" y="92" width="107" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="305.5" y="115" font-family="Arial" font-size="24" text-anchor="middle">🏃‍♂️</text>
        <text x="305.5" y="135" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">유산소</text>
        <text x="305.5" y="150" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">8개 운동</text>
        
        <!-- Row 2 -->
        <rect x="16" y="184" width="107" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="69.5" y="207" font-family="Arial" font-size="24" text-anchor="middle">🤲</text>
        <text x="69.5" y="227" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">어깨</text>
        <text x="69.5" y="242" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">10개 운동</text>
        
        <rect x="134" y="184" width="107" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="187.5" y="207" font-family="Arial" font-size="24" text-anchor="middle">💪</text>
        <text x="187.5" y="227" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">등</text>
        <text x="187.5" y="242" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">14개 운동</text>
        
        <rect x="252" y="184" width="107" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="305.5" y="207" font-family="Arial" font-size="24" text-anchor="middle">💪</text>
        <text x="305.5" y="227" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">팔</text>
        <text x="305.5" y="242" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">16개 운동</text>
      </g>
      
      <!-- Today's Workout -->
      <rect x="16" y="280" width="343" height="140" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="302" font-family="Arial" font-size="14" font-weight="500" fill="#111827">오늘의 추천 운동</text>
      
      <!-- Workout List -->
      <rect x="32" y="315" width="311" height="50" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="48" y="335" font-family="Arial" font-size="12" font-weight="500" fill="#111827">푸시업</text>
      <text x="48" y="350" font-family="Arial" font-size="10" fill="#6B7280">3세트 × 15회</text>
      <rect x="295" y="330" width="32" height="20" rx="4" fill="#6366F1"/>
      <text x="311" y="342" font-family="Arial" font-size="10" fill="white" text-anchor="middle">시작</text>
      
      <rect x="32" y="375" width="311" height="50" rx="8" fill="#F8FAFC" stroke="#E2E8F0"/>
      <text x="48" y="395" font-family="Arial" font-size="12" font-weight="500" fill="#111827">플랭크</text>
      <text x="48" y="410" font-family="Arial" font-size="10" fill="#6B7280">3세트 × 30초</text>
      <rect x="295" y="390" width="32" height="20" rx="4" fill="#6366F1"/>
      <text x="311" y="402" font-family="Arial" font-size="10" fill="white" text-anchor="middle">시작</text>
      
      <!-- Workout Timer -->
      <rect x="16" y="436" width="343" height="100" rx="12" fill="#6366F1" fill-opacity="0.05" stroke="#6366F1" stroke-opacity="0.2"/>
      <text x="187.5" y="458" font-family="Arial" font-size="14" font-weight="500" fill="#6366F1" text-anchor="middle">운동 타이머</text>
      
      <circle cx="187.5" cy="490" r="30" fill="transparent" stroke="#6366F1" stroke-width="4"/>
      <circle cx="187.5" cy="490" r="30" fill="transparent" stroke="#6366F1" stroke-width="4" stroke-dasharray="75.4 113.1" transform="rotate(-90 187.5 490)"/>
      <text x="187.5" y="497" font-family="Arial" font-size="16" font-weight="600" fill="#6366F1" text-anchor="middle">2:30</text>
      
      <!-- Control Buttons -->
      <rect x="120" y="520" width="40" height="20" rx="10" fill="#10B981"/>
      <text x="140" y="532" font-family="Arial" font-size="10" fill="white" text-anchor="middle">시작</text>
      
      <rect x="170" y="520" width="40" height="20" rx="10" fill="#EF4444"/>
      <text x="190" y="532" font-family="Arial" font-size="10" fill="white" text-anchor="middle">정지</text>
      
      <rect x="220" y="520" width="40" height="20" rx="10" fill="#6B7280"/>
      <text x="240" y="532" font-family="Arial" font-size="10" fill="white" text-anchor="middle">완료</text>
    </svg>`
  },

  // 식단 화면
  'food-layout': {
    name: '식단 화면',
    description: '식단 기록과 관리 화면',
    category: 'screens',
    svg: `<svg width="375" height="600" viewBox="0 0 375 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="375" height="600" fill="#F8FAFC"/>
      
      <!-- Header -->
      <rect x="16" y="16" width="343" height="60" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="187.5" y="40" font-family="Arial" font-size="18" font-weight="600" fill="#111827" text-anchor="middle">오늘의 식단 🍽️</text>
      <text x="187.5" y="58" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">영양 균형을 맞춰보세요</text>
      
      <!-- Meal Categories -->
      <g id="meal-categories">
        <rect x="16" y="92" width="107" height="60" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="69.5" y="115" font-family="Arial" font-size="20" text-anchor="middle">🌅</text>
        <text x="69.5" y="135" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">아침</text>
        
        <rect x="134" y="92" width="107" height="60" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="187.5" y="115" font-family="Arial" font-size="20" text-anchor="middle">☀️</text>
        <text x="187.5" y="135" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">점심</text>
        
        <rect x="252" y="92" width="107" height="60" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
        <text x="305.5" y="115" font-family="Arial" font-size="20" text-anchor="middle">🌙</text>
        <text x="305.5" y="135" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">저녁</text>
      </g>
      
      <!-- Today's Meals -->
      <rect x="16" y="168" width="343" height="180" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="190" font-family="Arial" font-size="14" font-weight="500" fill="#111827">오늘 먹은 음식</text>
      
      <!-- Meal Items -->
      <rect x="32" y="205" width="311" height="40" rx="6" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="48" cy="225" r="12" fill="#FF6B6B"/>
      <text x="48" y="229" font-family="Arial" font-size="14" text-anchor="middle">🍎</text>
      <text x="72" y="220" font-family="Arial" font-size="12" font-weight="500" fill="#111827">사과 1개</text>
      <text x="72" y="235" font-family="Arial" font-size="10" fill="#6B7280">95kcal</text>
      <text x="320" y="229" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="end">아침</text>
      
      <rect x="32" y="255" width="311" height="40" rx="6" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="48" cy="275" r="12" fill="#4ECDC4"/>
      <text x="48" y="279" font-family="Arial" font-size="14" text-anchor="middle">🍚</text>
      <text x="72" y="270" font-family="Arial" font-size="12" font-weight="500" fill="#111827">현미밥 1공기</text>
      <text x="72" y="285" font-family="Arial" font-size="10" fill="#6B7280">320kcal</text>
      <text x="320" y="279" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="end">점심</text>
      
      <rect x="32" y="305" width="311" height="40" rx="6" fill="#F8FAFC" stroke="#E2E8F0"/>
      <circle cx="48" cy="325" r="12" fill="#45B7D1"/>
      <text x="48" y="329" font-family="Arial" font-size="14" text-anchor="middle">🥗</text>
      <text x="72" y="320" font-family="Arial" font-size="12" font-weight="500" fill="#111827">치킨 샐러드</text>
      <text x="72" y="335" font-family="Arial" font-size="10" fill="#6B7280">280kcal</text>
      <text x="320" y="329" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="end">저녁</text>
      
      <!-- Nutrition Summary -->
      <rect x="16" y="364" width="343" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="385" font-family="Arial" font-size="14" font-weight="500" fill="#111827">영양소 요약</text>
      
      <!-- Nutrition Circles -->
      <g id="nutrition-circles">
        <circle cx="75" cy="420" r="25" fill="transparent" stroke="#E5E7EB" stroke-width="4"/>
        <circle cx="75" cy="420" r="25" fill="transparent" stroke="#6366F1" stroke-width="4" stroke-dasharray="94.2 62.8"/>
        <text x="75" y="418" font-family="Arial" font-size="10" font-weight="600" fill="#6366F1" text-anchor="middle">60%</text>
        <text x="75" y="430" font-family="Arial" font-size="8" fill="#6B7280" text-anchor="middle">탄수화물</text>
        
        <circle cx="145" cy="420" r="25" fill="transparent" stroke="#E5E7EB" stroke-width="4"/>
        <circle cx="145" cy="420" r="25" fill="transparent" stroke="#10B981" stroke-width="4" stroke-dasharray="78.5 78.5"/>
        <text x="145" y="418" font-family="Arial" font-size="10" font-weight="600" fill="#10B981" text-anchor="middle">50%</text>
        <text x="145" y="430" font-family="Arial" font-size="8" fill="#6B7280" text-anchor="middle">단백질</text>
        
        <circle cx="215" cy="420" r="25" fill="transparent" stroke="#E5E7EB" stroke-width="4"/>
        <circle cx="215" cy="420" r="25" fill="transparent" stroke="#F59E0B" stroke-width="4" stroke-dasharray="110.0 47.0"/>
        <text x="215" y="418" font-family="Arial" font-size="10" font-weight="600" fill="#F59E0B" text-anchor="middle">70%</text>
        <text x="215" y="430" font-family="Arial" font-size="8" fill="#6B7280" text-anchor="middle">지방</text>
        
        <circle cx="285" cy="420" r="25" fill="transparent" stroke="#E5E7EB" stroke-width="4"/>
        <circle cx="285" cy="420" r="25" fill="transparent" stroke="#EF4444" stroke-width="4" stroke-dasharray="125.6 31.4"/>
        <text x="285" y="418" font-family="Arial" font-size="10" font-weight="600" fill="#EF4444" text-anchor="middle">80%</text>
        <text x="285" y="430" font-family="Arial" font-size="8" fill="#6B7280" text-anchor="middle">칼로리</text>
      </g>
      
      <!-- AI Recipe Recommendation -->
      <rect x="16" y="480" width="343" height="100" rx="12" fill="#6366F1" fill-opacity="0.05" stroke="#6366F1" stroke-opacity="0.2"/>
      <text x="32" y="502" font-family="Arial" font-size="14" font-weight="500" fill="#6366F1">AI 맞춤 레시피 🤖</text>
      <text x="32" y="520" font-family="Arial" font-size="12" fill="#111827">단백질 부족을 위한 추천</text>
      <text x="32" y="535" font-family="Arial" font-size="11" fill="#6B7280">• 연어 아보카도 샐러드 (35g 단백질)</text>
      <text x="32" y="550" font-family="Arial" font-size="11" fill="#6B7280">• 그릭 요거트 베리 볼 (20g 단백질)</text>
      
      <rect x="295" y="545" width="48" height="24" rx="12" fill="#6366F1"/>
      <text x="319" y="559" font-family="Arial" font-size="10" fill="white" text-anchor="middle">레시피 보기</text>
    </svg>`
  },

  // 챌린지 화면
  'challenge-layout': {
    name: '챌린지 화면',
    description: '랭킹과 경쟁 화면',
    category: 'screens',
    svg: `<svg width="375" height="600" viewBox="0 0 375 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="375" height="600" fill="#F8FAFC"/>
      
      <!-- Header -->
      <rect x="16" y="16" width="343" height="80" rx="12" fill="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"/>
      <text x="187.5" y="45" font-family="Arial" font-size="18" font-weight="600" fill="white" text-anchor="middle">이주의 챌린지 🏆</text>
      <text x="187.5" y="65" font-family="Arial" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">친구들과 함께 목표를 달성해보세요</text>
      <text x="187.5" y="80" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.6)" text-anchor="middle">5일 남음</text>
      
      <!-- My Rank Card -->
      <rect x="16" y="112" width="343" height="70" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <circle cx="50" cy="147" r="20" fill="#FFD700"/>
      <text x="50" y="153" font-family="Arial" font-size="16" font-weight="600" fill="white" text-anchor="middle">3</text>
      
      <text x="80" y="140" font-family="Arial" font-size="14" font-weight="600" fill="#111827">김건강 (나)</text>
      <text x="80" y="157" font-family="Arial" font-size="12" fill="#6B7280">이번 주 운동: 4회 · 320분</text>
      
      <rect x="280" y="130" width="60" height="20" rx="10" fill="#10B981"/>
      <text x="310" y="142" font-family="Arial" font-size="10" font-weight="500" fill="white" text-anchor="middle">목표 달성</text>
      
      <text x="320" y="165" font-family="Arial" font-size="16" font-weight="700" fill="#6366F1" text-anchor="end">1,250P</text>
      
      <!-- Ranking List -->
      <rect x="16" y="198" width="343" height="320" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="220" font-family="Arial" font-size="14" font-weight="500" fill="#111827">주간 랭킹</text>
      
      <!-- Rank 1 -->
      <rect x="32" y="235" width="311" height="50" rx="8" fill="#FFD700" fill-opacity="0.1" stroke="#FFD700" stroke-opacity="0.3"/>
      <circle cx="50" cy="260" r="15" fill="#FFD700"/>
      <text x="50" y="266" font-family="Arial" font-size="12" font-weight="600" fill="white" text-anchor="middle">1</text>
      
      <text x="75" y="255" font-family="Arial" font-size="12" font-weight="600" fill="#111827">박근육</text>
      <text x="75" y="270" font-family="Arial" font-size="10" fill="#6B7280">6회 · 450분</text>
      
      <text x="320" y="255" font-family="Arial" font-size="12" font-weight="700" fill="#FFD700" text-anchor="end">🥇</text>
      <text x="320" y="270" font-family="Arial" font-size="12" font-weight="600" fill="#111827" text-anchor="end">1,580P</text>
      
      <!-- Rank 2 -->
      <rect x="32" y="295" width="311" height="50" rx="8" fill="#C0C0C0" fill-opacity="0.1" stroke="#C0C0C0" stroke-opacity="0.3"/>
      <circle cx="50" cy="320" r="15" fill="#C0C0C0"/>
      <text x="50" y="326" font-family="Arial" font-size="12" font-weight="600" fill="white" text-anchor="middle">2</text>
      
      <text x="75" y="315" font-family="Arial" font-size="12" font-weight="600" fill="#111827">이운동</text>
      <text x="75" y="330" font-family="Arial" font-size="10" fill="#6B7280">5회 · 380분</text>
      
      <text x="320" y="315" font-family="Arial" font-size="12" font-weight="700" fill="#C0C0C0" text-anchor="end">🥈</text>
      <text x="320" y="330" font-family="Arial" font-size="12" font-weight="600" fill="#111827" text-anchor="end">1,420P</text>
      
      <!-- Rank 3 (Me) -->
      <rect x="32" y="355" width="311" height="50" rx="8" fill="#CD7F32" fill-opacity="0.1" stroke="#CD7F32" stroke-opacity="0.3"/>
      <circle cx="50" cy="380" r="15" fill="#CD7F32"/>
      <text x="50" y="386" font-family="Arial" font-size="12" font-weight="600" fill="white" text-anchor="middle">3</text>
      
      <text x="75" y="375" font-family="Arial" font-size="12" font-weight="600" fill="#6366F1">김건강 (나)</text>
      <text x="75" y="390" font-family="Arial" font-size="10" fill="#6B7280">4회 · 320분</text>
      
      <text x="320" y="375" font-family="Arial" font-size="12" font-weight="700" fill="#CD7F32" text-anchor="end">🥉</text>
      <text x="320" y="390" font-family="Arial" font-size="12" font-weight="600" fill="#111827" text-anchor="end">1,250P</text>
      
      <!-- Rank 4 -->
      <rect x="32" y="415" width="311" height="40" rx="6" fill="transparent"/>
      <text x="40" y="430" font-family="Arial" font-size="12" font-weight="500" fill="#6B7280">4</text>
      <text x="60" y="430" font-family="Arial" font-size="12" fill="#111827">최체력</text>
      <text x="60" y="443" font-family="Arial" font-size="10" fill="#6B7280">3회 · 240분</text>
      <text x="320" y="437" font-family="Arial" font-size="12" fill="#111827" text-anchor="end">980P</text>
      
      <!-- Rank 5 -->
      <rect x="32" y="455" width="311" height="40" rx="6" fill="transparent"/>
      <text x="40" y="470" font-family="Arial" font-size="12" font-weight="500" fill="#6B7280">5</text>
      <text x="60" y="470" font-family="Arial" font-size="12" fill="#111827">강건강</text>
      <text x="60" y="483" font-family="Arial" font-size="10" fill="#6B7280">2회 · 150분</text>
      <text x="320" y="477" font-family="Arial" font-size="12" fill="#111827" text-anchor="end">720P</text>
      
      <!-- Challenge Actions -->
      <rect x="16" y="534" width="167" height="50" rx="8" fill="#6366F1"/>
      <text x="99.5" y="555" font-family="Arial" font-size="12" font-weight="500" fill="white" text-anchor="middle">친구 초대</text>
      <text x="99.5" y="570" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">+100P 보너스</text>
      
      <rect x="192" y="534" width="167" height="50" rx="8" fill="#10B981"/>
      <text x="275.5" y="555" font-family="Arial" font-size="12" font-weight="500" fill="white" text-anchor="middle">보상 받기</text>
      <text x="275.5" y="570" font-family="Arial" font-size="10" fill="rgba(255,255,255,0.8)" text-anchor="middle">500P 사용가능</text>
    </svg>`
  },

  // 커뮤니티 화면
  'community-layout': {
    name: '커뮤니티 화면',
    description: '소셜 피드와 커뮤니티',
    category: 'screens',
    svg: `<svg width="375" height="600" viewBox="0 0 375 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="375" height="600" fill="#F8FAFC"/>
      
      <!-- Header with Search -->
      <rect x="16" y="16" width="343" height="40" rx="20" fill="#FFFFFF" stroke="#E2E8F0"/>
      <circle cx="35" cy="36" r="8" fill="#6B7280"/>
      <text x="55" y="40" font-family="Arial" font-size="12" fill="#6B7280">운동 팁이나 식단을 검색해보세요</text>
      
      <!-- Category Tabs -->
      <g id="category-tabs">
        <rect x="16" y="72" width="60" height="30" rx="15" fill="#6366F1"/>
        <text x="46" y="90" font-family="Arial" font-size="12" font-weight="500" fill="white" text-anchor="middle">전체</text>
        
        <rect x="86" y="72" width="60" height="30" rx="15" fill="transparent" stroke="#E2E8F0"/>
        <text x="116" y="90" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">운동</text>
        
        <rect x="156" y="72" width="60" height="30" rx="15" fill="transparent" stroke="#E2E8F0"/>
        <text x="186" y="90" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">식단</text>
        
        <rect x="226" y="72" width="70" height="30" rx="15" fill="transparent" stroke="#E2E8F0"/>
        <text x="261" y="90" font-family="Arial" font-size="12" fill="#6B7280" text-anchor="middle">다이어트</text>
      </g>
      
      <!-- Hot Posts Section -->
      <text x="24" y="125" font-family="Arial" font-size="14" font-weight="600" fill="#111827">🔥 인기 게시물</text>
      
      <!-- Post 1 -->
      <rect x="16" y="135" width="343" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      
      <!-- User Info -->
      <circle cx="35" cy="155" r="12" fill="#6366F1"/>
      <text x="35" y="160" font-family="Arial" font-size="10" fill="white" text-anchor="middle">김</text>
      <text x="55" y="153" font-family="Arial" font-size="12" font-weight="500" fill="#111827">김트레이너</text>
      <text x="55" y="166" font-family="Arial" font-size="10" fill="#6B7280">2시간 전</text>
      
      <!-- Post Content -->
      <text x="32" y="185" font-family="Arial" font-size="12" font-weight="500" fill="#111827">💪 초보자를 위한 홈트레이닝 루틴</text>
      <text x="32" y="200" font-family="Arial" font-size="11" fill="#6B7280">집에서도 충분히 할 수 있는 전신 운동을</text>
      <text x="32" y="215" font-family="Arial" font-size="11" fill="#6B7280">소개합니다. 기구 없이도 가능해요!</text>
      
      <!-- Engagement -->
      <g id="post-engagement">
        <text x="32" y="240" font-family="Arial" font-size="11" fill="#6B7280">❤️ 124</text>
        <text x="80" y="240" font-family="Arial" font-size="11" fill="#6B7280">💬 32</text>
        <text x="120" y="240" font-family="Arial" font-size="11" fill="#6B7280">🔄 15</text>
        
        <rect x="280" y="225" width="60" height="24" rx="12" fill="#6366F1"/>
        <text x="310" y="239" font-family="Arial" font-size="10" fill="white" text-anchor="middle">자세히 보기</text>
      </g>
      
      <!-- Post 2 -->
      <rect x="16" y="265" width="343" height="120" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      
      <!-- User Info -->
      <circle cx="35" cy="285" r="12" fill="#10B981"/>
      <text x="35" y="290" font-family="Arial" font-size="10" fill="white" text-anchor="middle">이</text>
      <text x="55" y="283" font-family="Arial" font-size="12" font-weight="500" fill="#111827">이영양사</text>
      <text x="55" y="296" font-family="Arial" font-size="10" fill="#6B7280">4시간 전</text>
      
      <!-- Post Content -->
      <text x="32" y="315" font-family="Arial" font-size="12" font-weight="500" fill="#111827">🥗 다이어트 도시락 만들기</text>
      <text x="32" y="330" font-family="Arial" font-size="11" fill="#6B7280">한 주 동안 먹을 건강한 도시락 레시피를</text>
      <text x="32" y="345" font-family="Arial" font-size="11" fill="#6B7280">공유해요. 칼로리까지 완벽!</text>
      
      <!-- Engagement -->
      <g id="post-engagement-2">
        <text x="32" y="370" font-family="Arial" font-size="11" fill="#6B7280">❤️ 98</text>
        <text x="75" y="370" font-family="Arial" font-size="11" fill="#6B7280">💬 28</text>
        <text x="115" y="370" font-family="Arial" font-size="11" fill="#6B7280">🔄 8</text>
        
        <rect x="280" y="355" width="60" height="24" rx="12" fill="#10B981"/>
        <text x="310" y="369" font-family="Arial" font-size="10" fill="white" text-anchor="middle">레시피 보기</text>
      </g>
      
      <!-- Post 3 -->
      <rect x="16" y="395" width="343" height="100" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      
      <!-- User Info -->
      <circle cx="35" cy="415" r="12" fill="#F59E0B"/>
      <text x="35" y="420" font-family="Arial" font-size="10" fill="white" text-anchor="middle">박</text>
      <text x="55" y="413" font-family="Arial" font-size="12" font-weight="500" fill="#111827">박다이어터</text>
      <text x="55" y="426" font-family="Arial" font-size="10" fill="#6B7280">6시간 전</text>
      
      <!-- Post Content -->
      <text x="32" y="445" font-family="Arial" font-size="12" font-weight="500" fill="#111827">🎉 3개월 -10kg 성공 후기!</text>
      <text x="32" y="460" font-family="Arial" font-size="11" fill="#6B7280">꾸준한 운동과 식단 관리로 목표 달성!</text>
      
      <!-- Engagement -->
      <g id="post-engagement-3">
        <text x="32" y="480" font-family="Arial" font-size="11" fill="#6B7280">❤️ 256</text>
        <text x="80" y="480" font-family="Arial" font-size="11" fill="#6B7280">💬 84</text>
        <text x="120" y="480" font-family="Arial" font-size="11" fill="#6B7280">🔄 42</text>
        
        <rect x="280" y="465" width="60" height="24" rx="12" fill="#F59E0B"/>
        <text x="310" y="479" font-family="Arial" font-size="10" fill="white" text-anchor="middle">응원하기</text>
      </g>
      
      <!-- Floating Action Button -->
      <circle cx="335" cy="560" r="25" fill="#6366F1" filter="drop-shadow(0 4px 12px rgba(99, 102, 241, 0.4))"/>
      <text x="335" y="567" font-family="Arial" font-size="16" fill="white" text-anchor="middle">✏️</text>
    </svg>`
  },

  // UI 컴포넌트들
  'ui-components': {
    name: 'UI 컴포넌트',
    description: '재사용 가능한 UI 요소들',
    category: 'components',
    svg: `<svg width="375" height="600" viewBox="0 0 375 600" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="375" height="600" fill="#F8FAFC"/>
      
      <!-- Title -->
      <text x="187.5" y="30" font-family="Arial" font-size="16" font-weight="600" fill="#111827" text-anchor="middle">UI 컴포넌트 라이브러리</text>
      
      <!-- Buttons -->
      <text x="24" y="60" font-family="Arial" font-size="14" font-weight="500" fill="#111827">버튼</text>
      
      <rect x="24" y="70" width="80" height="36" rx="8" fill="#6366F1"/>
      <text x="64" y="92" font-family="Arial" font-size="12" font-weight="500" fill="white" text-anchor="middle">Primary</text>
      
      <rect x="115" y="70" width="80" height="36" rx="8" fill="transparent" stroke="#6366F1"/>
      <text x="155" y="92" font-family="Arial" font-size="12" font-weight="500" fill="#6366F1" text-anchor="middle">Secondary</text>
      
      <rect x="206" y="70" width="80" height="36" rx="8" fill="#EF4444"/>
      <text x="246" y="92" font-family="Arial" font-size="12" font-weight="500" fill="white" text-anchor="middle">Danger</text>
      
      <!-- Cards -->
      <text x="24" y="135" font-family="Arial" font-size="14" font-weight="500" fill="#111827">카드</text>
      
      <rect x="24" y="145" width="150" height="80" rx="12" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="99" y="170" font-family="Arial" font-size="12" font-weight="500" fill="#111827" text-anchor="middle">기본 카드</text>
      <text x="99" y="185" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">설명 텍스트</text>
      <rect x="74" y="195" width="50" height="20" rx="4" fill="#6366F1"/>
      <text x="99" y="207" font-family="Arial" font-size="10" fill="white" text-anchor="middle">액션</text>
      
      <rect x="185" y="145" width="150" height="80" rx="12" fill="#6366F1" fill-opacity="0.05" stroke="#6366F1" stroke-opacity="0.3"/>
      <text x="260" y="170" font-family="Arial" font-size="12" font-weight="500" fill="#6366F1" text-anchor="middle">강조 카드</text>
      <text x="260" y="185" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">중요한 정보</text>
      <rect x="235" y="195" width="50" height="20" rx="4" fill="#6366F1"/>
      <text x="260" y="207" font-family="Arial" font-size="10" fill="white" text-anchor="middle">확인</text>
      
      <!-- Progress Bars -->
      <text x="24" y="260" font-family="Arial" font-size="14" font-weight="500" fill="#111827">프로그레스 바</text>
      
      <rect x="24" y="275" width="300" height="8" rx="4" fill="#E5E7EB"/>
      <rect x="24" y="275" width="180" height="8" rx="4" fill="#6366F1"/>
      <text x="174" y="295" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">60%</text>
      
      <rect x="24" y="305" width="300" height="8" rx="4" fill="#E5E7EB"/>
      <rect x="24" y="305" width="240" height="8" rx="4" fill="#10B981"/>
      <text x="144" y="325" font-family="Arial" font-size="10" fill="#6B7280" text-anchor="middle">80%</text>
      
      <!-- Input Fields -->
      <text x="24" y="355" font-family="Arial" font-size="14" font-weight="500" fill="#111827">입력 필드</text>
      
      <rect x="24" y="365" width="140" height="40" rx="8" fill="#FFFFFF" stroke="#E2E8F0"/>
      <text x="32" y="380" font-family="Arial" font-size="10" fill="#6B7280">이메일</text>
      <text x="32" y="395" font-family="Arial" font-size="12" fill="#111827">example@email.com</text>
      
      <rect x="175" y="365" width="140" height="40" rx="8" fill="#F3F4F6" stroke="#E2E8F0"/>
      <text x="183" y="380" font-family="Arial" font-size="10" fill="#6B7280">비밀번호</text>
      <text x="183" y="395" font-family="Arial" font-size="12" fill="#111827">••••••••</text>
      
      <!-- Badges -->
      <text x="24" y="435" font-family="Arial" font-size="14" font-weight="500" fill="#111827">배지</text>
      
      <rect x="24" y="445" width="40" height="20" rx="10" fill="#6366F1"/>
      <text x="44" y="457" font-family="Arial" font-size="10" fill="white" text-anchor="middle">New</text>
      
      <rect x="75" y="445" width="50" height="20" rx="10" fill="#10B981"/>
      <text x="100" y="457" font-family="Arial" font-size="10" fill="white" text-anchor="middle">성공</text>
      
      <rect x="136" y="445" width="50" height="20" rx="10" fill="#F59E0B"/>
      <text x="161" y="457" font-family="Arial" font-size="10" fill="white" text-anchor="middle">경고</text>
      
      <rect x="197" y="445" width="50" height="20" rx="10" fill="#EF4444"/>
      <text x="222" y="457" font-family="Arial" font-size="10" fill="white" text-anchor="middle">오류</text>
      
      <!-- Avatar/Profile -->
      <text x="24" y="495" font-family="Arial" font-size="14" font-weight="500" fill="#111827">아바타</text>
      
      <circle cx="44" cy="520" r="20" fill="#6366F1"/>
      <text x="44" y="526" font-family="Arial" font-size="12" fill="white" text-anchor="middle">김</text>
      
      <circle cx="94" cy="520" r="20" fill="#10B981"/>
      <text x="94" y="526" font-family="Arial" font-size="12" fill="white" text-anchor="middle">이</text>
      
      <circle cx="144" cy="520" r="20" fill="#F59E0B"/>
      <text x="144" y="526" font-family="Arial" font-size="12" fill="white" text-anchor="middle">박</text>
      
      <!-- Toggle/Switch -->
      <text x="200" y="495" font-family="Arial" font-size="14" font-weight="500" fill="#111827">토글</text>
      
      <rect x="200" y="510" width="40" height="20" rx="10" fill="#6366F1"/>
      <circle cx="230" cy="520" r="8" fill="white"/>
      
      <rect x="250" y="510" width="40" height="20" rx="10" fill="#E5E7EB"/>
      <circle cx="260" cy="520" r="8" fill="white"/>
      
      <!-- Icons -->
      <text x="24" y="570" font-family="Arial" font-size="14" font-weight="500" fill="#111827">아이콘</text>
      
      <circle cx="54" cy="585" r="12" fill="#6366F1" fill-opacity="0.1"/>
      <text x="54" y="590" font-family="Arial" font-size="12" fill="#6366F1" text-anchor="middle">🏠</text>
      
      <circle cx="84" cy="585" r="12" fill="#10B981" fill-opacity="0.1"/>
      <text x="84" y="590" font-family="Arial" font-size="12" fill="#10B981" text-anchor="middle">💪</text>
      
      <circle cx="114" cy="585" r="12" fill="#F59E0B" fill-opacity="0.1"/>
      <text x="114" y="590" font-family="Arial" font-size="12" fill="#F59E0B" text-anchor="middle">🍎</text>
      
      <circle cx="144" cy="585" r="12" fill="#EF4444" fill-opacity="0.1"/>
      <text x="144" y="590" font-family="Arial" font-size="12" fill="#EF4444" text-anchor="middle">🏆</text>
    </svg>`
  }
};

// 카테고리별 분류
const categories = {
  structure: '앱 구조',
  screens: '화면별 레이아웃', 
  components: 'UI 컴포넌트'
};

const downloadSvg = (filename: string, svgContent: string) => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fittracker-${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`${filename} SVG 파일이 다운로드되었습니다!`);
};

const downloadAllSvgs = () => {
  Object.entries(figmaDesigns).forEach(([name, design], index) => {
    setTimeout(() => downloadSvg(name, design.svg), index * 200);
  });
  toast.success('모든 디자인 파일이 다운로드되었습니다!');
};

export const FigmaExporter = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredDesigns = selectedCategory === 'all' 
    ? Object.entries(figmaDesigns)
    : Object.entries(figmaDesigns).filter(([_, design]) => design.category === selectedCategory);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
          <Palette className="h-5 w-5" />
          피그마 디자인 파일 다운로드
        </h2>
        <p className="text-muted-foreground text-sm">
          전체 앱을 피그마에서 편집할 수 있는 SVG 파일로 제공합니다
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            전체
          </Button>
          {Object.entries(categories).map(([key, name]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {name}
            </Button>
          ))}
        </div>
        <Button onClick={downloadAllSvgs} className="gap-2">
          <Package size={16} />
          전체 다운로드
        </Button>
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredDesigns.map(([key, design]) => (
          <Card key={key} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {design.category === 'structure' && <Layout className="h-4 w-4" />}
                    {design.category === 'screens' && <Smartphone className="h-4 w-4" />}
                    {design.category === 'components' && <Layers className="h-4 w-4" />}
                    {design.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{design.description}</p>
                  <Badge variant="secondary" className="text-xs">
                    {categories[design.category as keyof typeof categories]}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 shrink-0"
                  onClick={() => downloadSvg(key, design.svg)}
                >
                  <Download size={14} />
                  다운로드
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-muted/30 p-4 rounded-lg overflow-hidden">
                <div 
                  dangerouslySetInnerHTML={{ __html: design.svg }} 
                  className="w-full h-32 flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="bg-muted/50 p-6 rounded-lg space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <FileImage className="h-4 w-4" />
          피그마에서 활용하는 방법
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">📁 파일 가져오기</h4>
            <ul className="space-y-1">
              <li>• 다운로드한 SVG를 피그마로 드래그 앤 드롭</li>
              <li>• File → Import에서 SVG 파일 선택</li>
              <li>• 각 레이어가 개별적으로 편집 가능</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">🎨 디자인 편집</h4>
            <ul className="space-y-1">
              <li>• 색상, 크기, 위치를 자유롭게 변경</li>
              <li>• 텍스트 내용과 폰트 수정 가능</li>
              <li>• 컴포넌트화하여 재사용</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">📱 프로토타입</h4>
            <ul className="space-y-1">
              <li>• 화면 간 인터랙션 연결</li>
              <li>• 애니메이션과 전환 효과 추가</li>
              <li>• 실제 앱처럼 시연 가능</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-foreground">🚀 개발 연동</h4>
            <ul className="space-y-1">
              <li>• 개발자용 스펙 자동 생성</li>
              <li>• CSS 코드 추출 가능</li>
              <li>• 에셋 Export로 이미지 추출</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip</h4>
        <p className="text-sm text-blue-800">
          전체 앱 구조를 먼저 가져온 후, 각 화면별 레이아웃을 개별 프레임으로 구성하면 
          체계적인 디자인 시스템을 만들 수 있습니다. UI 컴포넌트는 라이브러리로 활용하세요!
        </p>
      </div>
    </div>
  );
};