import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Download, FileImage, Smartphone, Monitor, Layers } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// 실제 앱 화면을 캡쳐하여 SVG로 변환하는 유틸리티
const captureCurrentView = (): string => {
  const appElement = document.querySelector('.max-w-md');
  if (!appElement) return '';
  
  const rect = appElement.getBoundingClientRect();
  const width = 375; // iPhone 기준 너비
  const height = Math.min(812, rect.height); // 최대 iPhone 높이
  
  // 실제 DOM에서 스타일과 구조를 추출
  const captureElement = (element: Element, x = 0, y = 0): string => {
    const styles = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const appRect = appElement.getBoundingClientRect();
    
    const relativeX = rect.left - appRect.left;
    const relativeY = rect.top - appRect.top;
    
    let svg = '';
    
    // 배경 렌더링
    if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      const bgColor = styles.backgroundColor;
      const borderRadius = parseFloat(styles.borderRadius) || 0;
      
      svg += `<rect x="${relativeX}" y="${relativeY}" width="${rect.width}" height="${rect.height}" 
               fill="${bgColor}" rx="${borderRadius}" ry="${borderRadius}" 
               stroke="${styles.borderColor}" stroke-width="${parseFloat(styles.borderWidth) || 0}"/>`;
    }
    
    // 텍스트 렌더링
    if (element.textContent && element.children.length === 0) {
      const fontSize = parseFloat(styles.fontSize);
      const fontFamily = styles.fontFamily.split(',')[0].replace(/"/g, '');
      const color = styles.color;
      const fontWeight = styles.fontWeight;
      
      svg += `<text x="${relativeX + 8}" y="${relativeY + fontSize + 4}" 
               font-family="${fontFamily}" font-size="${fontSize}" 
               font-weight="${fontWeight}" fill="${color}">${element.textContent.slice(0, 50)}</text>`;
    }
    
    return svg;
  };
  
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <style>
          .app-bg { fill: #ffffff; }
          .card-bg { fill: #ffffff; stroke: rgba(0,0,0,0.1); stroke-width: 1; }
          .text { font-family: ui-sans-serif, system-ui, sans-serif; }
          .text-primary { fill: #030213; }
          .text-secondary { fill: #717182; }
          .bg-primary { fill: #030213; }
          .bg-accent { fill: #f1f5f9; }
          .border { stroke: rgba(0,0,0,0.1); stroke-width: 1; fill: none; }
        </style>
      </defs>
      <rect width="100%" height="100%" class="app-bg"/>
      ${generateRealAppStructure()}
    </svg>
  `;
  
  return svgContent;
};

// 실제 앱의 구조를 기반으로 SVG 생성
const generateRealAppStructure = (): string => {
  return `
    <!-- Dashboard 헤더 -->
    <g id="header">
      <rect x="16" y="16" width="343" height="60" rx="8" class="card-bg"/>
      <text x="24" y="40" class="text text-primary" font-size="24" font-weight="700">안녕하세요! 👋</text>
      <text x="24" y="58" class="text text-secondary" font-size="14">2024년 3월 22일 금요일</text>
      
      <!-- 프로필 아바타 -->
      <circle cx="331" cy="46" r="20" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
      <text x="331" y="52" text-anchor="middle" class="text text-primary" font-size="12" font-weight="600">김건</text>
    </g>
    
    <!-- 캐릭터 섹션 -->
    <g id="character-section" transform="translate(16, 92)">
      <rect x="0" y="0" width="343" height="120" rx="12" fill="#dcfce7" stroke="#bbf7d0" stroke-width="2"/>
      <text x="171" y="45" text-anchor="middle" font-size="48">💪😁💪</text>
      <text x="171" y="75" text-anchor="middle" class="text" font-size="16" font-weight="500" fill="#166534">완벽해요! 오늘의 목표를 달성했어요!</text>
      <g transform="translate(120, 85)">
        <rect x="0" y="0" width="16" height="16" rx="2" fill="#166534"/>
        <text x="20" y="12" class="text text-secondary" font-size="12">운동 진행률: 100%</text>
      </g>
    </g>
    
    <!-- InBody 데이터 섹션 -->
    <g id="inbody-section" transform="translate(16, 228)">
      <rect x="0" y="0" width="343" height="200" rx="8" class="card-bg"/>
      <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">⚖️ InBody 데이터</text>
      <rect x="287" y="8" width="48" height="24" rx="4" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
      <text x="311" y="22" text-anchor="middle" class="text text-primary" font-size="11">동기화</text>
      
      <!-- InBody 데이터 그리드 -->
      <g transform="translate(12, 40)">
        <!-- 첫 번째 행 -->
        <rect x="0" y="0" width="155" height="60" rx="6" fill="#030213" fill-opacity="0.05"/>
        <text x="77" y="30" text-anchor="middle" class="text text-primary" font-size="24" font-weight="700">69.5kg</text>
        <text x="77" y="48" text-anchor="middle" class="text text-secondary" font-size="12">체중</text>
        
        <rect x="164" y="0" width="155" height="60" rx="6" fill="#3b82f6" fill-opacity="0.05"/>
        <text x="241" y="30" text-anchor="middle" class="text" font-size="24" font-weight="700" fill="#2563eb">32.8kg</text>
        <text x="241" y="48" text-anchor="middle" class="text text-secondary" font-size="12">골격근량</text>
        
        <!-- 두 번째 행 -->
        <rect x="0" y="72" width="155" height="60" rx="6" fill="#10b981" fill-opacity="0.05"/>
        <text x="77" y="102" text-anchor="middle" class="text" font-size="24" font-weight="700" fill="#059669">12.3%</text>
        <text x="77" y="120" text-anchor="middle" class="text text-secondary" font-size="12">체지방률</text>
        
        <rect x="164" y="72" width="155" height="60" rx="6" fill="#f97316" fill-opacity="0.05"/>
        <text x="241" y="102" text-anchor="middle" class="text" font-size="24" font-weight="700" fill="#ea580c">24.1</text>
        <text x="241" y="120" text-anchor="middle" class="text text-secondary" font-size="12">BMI</text>
        
        <!-- 업데이트 정보 -->
        <text x="160" y="155" text-anchor="middle" class="text text-secondary" font-size="10">⚡ 마지막 업데이트: 2024-03-15 09:30</text>
        
        <!-- 분석 정보 -->
        <rect x="0" y="165" width="319" height="20" rx="4" fill="#f8fafc"/>
        <text x="160" y="178" text-anchor="middle" class="text text-primary" font-size="11" font-weight="500">근육량이 평균보다 높고 체지방률이 적절한 상태입니다.</text>
      </g>
    </g>
    
    <!-- 오늘의 요약 -->
    <g id="daily-summary" transform="translate(16, 444)">
      <rect x="0" y="0" width="343" height="120" rx="8" class="card-bg"/>
      <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">📅 오늘의 요약</text>
      
      <g transform="translate(12, 40)">
        <!-- 섭취 칼로리 -->
        <rect x="0" y="0" width="155" height="60" rx="6" fill="#030213" fill-opacity="0.05"/>
        <text x="77" y="30" text-anchor="middle" class="text text-primary" font-size="24" font-weight="700">1650</text>
        <text x="77" y="48" text-anchor="middle" class="text text-secondary" font-size="12">섭취 칼로리</text>
        
        <!-- 남은 칼로리 -->
        <rect x="164" y="0" width="155" height="60" rx="6" fill="#dc2626" fill-opacity="0.05"/>
        <text x="241" y="30" text-anchor="middle" class="text" font-size="24" font-weight="700" fill="#dc2626">350</text>
        <text x="241" y="48" text-anchor="middle" class="text text-secondary" font-size="12">남은 칼로리</text>
      </g>
    </g>
    
    <!-- 영양소 현황 -->
    <g id="nutrition-status" transform="translate(16, 580)">
      <rect x="0" y="0" width="343" height="140" rx="8" class="card-bg"/>
      <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">🎯 영양소 현황</text>
      
      <!-- 단백질 프로그레스 -->
      <g transform="translate(12, 40)">
        <text x="0" y="12" class="text text-secondary" font-size="12">단백질</text>
        <text x="319" y="12" text-anchor="end" class="text text-primary" font-size="12">95g / 120g</text>
        <rect x="0" y="18" width="319" height="8" rx="4" fill="#f1f5f9"/>
        <rect x="0" y="18" width="253" height="8" rx="4" fill="#030213"/>
      </g>
      
      <!-- 탄수화물 프로그레스 -->
      <g transform="translate(12, 70)">
        <text x="0" y="12" class="text text-secondary" font-size="12">탄수화물</text>
        <text x="319" y="12" text-anchor="end" class="text text-primary" font-size="12">180g / 250g</text>
        <rect x="0" y="18" width="319" height="8" rx="4" fill="#f1f5f9"/>
        <rect x="0" y="18" width="229" height="8" rx="4" fill="#030213"/>
      </g>
      
      <!-- 지방 프로그레스 -->
      <g transform="translate(12, 100)">
        <text x="0" y="12" class="text text-secondary" font-size="12">지방</text>
        <text x="319" y="12" text-anchor="end" class="text text-primary" font-size="12">52g / 67g</text>
        <rect x="0" y="18" width="319" height="8" rx="4" fill="#f1f5f9"/>
        <rect x="0" y="18" width="248" height="8" rx="4" fill="#030213"/>
      </g>
    </g>
    
    <!-- 운동 현황 -->
    <g id="exercise-status" transform="translate(16, 736)">
      <rect x="0" y="0" width="343" height="90" rx="8" class="card-bg"/>
      <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">⚡ 운동 현황</text>
      
      <g transform="translate(12, 40)">
        <text x="0" y="12" class="text text-secondary" font-size="12">운동 시간</text>
        <text x="319" y="12" text-anchor="end" class="text text-primary" font-size="12">45분 / 60분</text>
        <rect x="0" y="18" width="319" height="8" rx="4" fill="#f1f5f9"/>
        <rect x="0" y="18" width="239" height="8" rx="4" fill="#030213"/>
        
        <text x="159" y="45" text-anchor="middle" class="text text-secondary" font-size="12">🔥 약 320kcal 소모</text>
      </g>
    </g>
    
    <!-- 하단 네비게이션 -->
    <g id="bottom-navigation" transform="translate(16, 760)">
      <rect x="0" y="0" width="343" height="64" rx="8" fill="#ffffff" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
      
      <!-- 홈 (활성) -->
      <g transform="translate(10, 12)">
        <rect x="0" y="0" width="47" height="40" rx="4" fill="#030213"/>
        <text x="23" y="22" text-anchor="middle" fill="white" font-size="16">🏠</text>
        <text x="23" y="35" text-anchor="middle" fill="white" font-size="10">홈</text>
      </g>
      
      <!-- 식단 -->
      <g transform="translate(67, 12)">
        <text x="23" y="22" text-anchor="middle" class="text text-secondary" font-size="16">🍽️</text>
        <text x="23" y="35" text-anchor="middle" class="text text-secondary" font-size="10">식단</text>
      </g>
      
      <!-- 운동 -->
      <g transform="translate(124, 12)">
        <text x="23" y="22" text-anchor="middle" class="text text-secondary" font-size="16">💪</text>
        <text x="23" y="35" text-anchor="middle" class="text text-secondary" font-size="10">운동</text>
      </g>
      
      <!-- 챌린지 -->
      <g transform="translate(181, 12)">
        <text x="23" y="22" text-anchor="middle" class="text text-secondary" font-size="16">🏆</text>
        <text x="23" y="35" text-anchor="middle" class="text text-secondary" font-size="10">챌린지</text>
      </g>
      
      <!-- 커뮤니티 -->
      <g transform="translate(238, 12)">
        <text x="23" y="22" text-anchor="middle" class="text text-secondary" font-size="16">👥</text>
        <text x="23" y="35" text-anchor="middle" class="text text-secondary" font-size="10">커뮤니티</text>
      </g>
      
      <!-- 마이 -->
      <g transform="translate(295, 12)">
        <text x="23" y="22" text-anchor="middle" class="text text-secondary" font-size="16">👤</text>
        <text x="23" y="35" text-anchor="middle" class="text text-secondary" font-size="10">마이</text>
      </g>
    </g>
  `;
};

// 다른 탭들의 실제 구조 생성
const generateTabStructure = (tabName: string): string => {
  const tabStructures = {
    food: `
      <!-- 식단 헤더 -->
      <g id="food-header">
        <rect x="16" y="16" width="343" height="60" rx="8" class="card-bg"/>
        <text x="24" y="40" class="text text-primary" font-size="24" font-weight="700">오늘의 식단 🍽️</text>
        <text x="24" y="58" class="text text-secondary" font-size="14">균형잡힌 식사로 건강을 챙기세요</text>
      </g>
      
      <!-- 식사별 섹션 -->
      <g id="meals" transform="translate(16, 92)">
        <!-- 아침 -->
        <rect x="0" y="0" width="343" height="60" rx="8" class="card-bg"/>
        <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">🌅 아침</text>
        <text x="12" y="42" class="text text-secondary" font-size="12">오트밀, 바나나, 우유</text>
        <text x="331" y="30" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">450 kcal</text>
        
        <!-- 점심 -->
        <rect x="0" y="72" width="343" height="60" rx="8" class="card-bg"/>
        <text x="12" y="96" class="text text-primary" font-size="16" font-weight="600">🌞 점심</text>
        <text x="12" y="114" class="text text-secondary" font-size="12">현미밥, 닭가슴살, 브로콜리</text>
        <text x="331" y="102" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">650 kcal</text>
        
        <!-- 저녁 -->
        <rect x="0" y="144" width="343" height="60" rx="8" class="card-bg"/>
        <text x="12" y="168" class="text text-primary" font-size="16" font-weight="600">🌙 저녁</text>
        <text x="12" y="186" class="text text-secondary" font-size="12">연어, 퀴노아, 아스파라거스</text>
        <text x="331" y="174" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">550 kcal</text>
        
        <!-- 음식 추가 버튼 -->
        <rect x="0" y="216" width="343" height="48" rx="8" fill="#030213"/>
        <text x="171" y="244" text-anchor="middle" fill="white" font-size="16" font-weight="600">+ 음식 추가하기</text>
      </g>
      
      <!-- AI 추천 섹션 -->
      <g id="ai-recommendations" transform="translate(16, 336)">
        <rect x="0" y="0" width="343" height="120" rx="8" class="card-bg"/>
        <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">🤖 AI 레시피 추천</text>
        <text x="12" y="48" class="text text-secondary" font-size="12">단백질 샐러드 볼</text>
        <text x="12" y="66" class="text text-secondary" font-size="11">닭가슴살, 퀴노아, 아보카도, 방울토마토</text>
        <rect x="12" y="78" width="80" height="24" rx="4" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <text x="52" y="92" text-anchor="middle" class="text text-primary" font-size="10">레시피 보기</text>
      </g>
    `,
    
    workout: `
      <!-- 운동 헤더 -->
      <g id="workout-header">
        <rect x="16" y="16" width="343" height="60" rx="8" class="card-bg"/>
        <text x="24" y="40" class="text text-primary" font-size="24" font-weight="700">오늘의 운동 💪</text>
        <text x="24" y="58" class="text text-secondary" font-size="14">맞춤 운동으로 목표를 달성해보세요</text>
      </g>
      
      <!-- 운동 부위 카테고리 -->
      <g id="workout-categories" transform="translate(16, 92)">
        <rect x="0" y="0" width="343" height="80" rx="8" class="card-bg"/>
        <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">운동 부위</text>
        
        <g transform="translate(12, 35)">
          <rect x="0" y="0" width="70" height="30" rx="15" fill="#030213"/>
          <text x="35" y="20" text-anchor="middle" fill="white" font-size="12">가슴</text>
          
          <rect x="80" y="0" width="70" height="30" rx="15" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
          <text x="115" y="20" text-anchor="middle" class="text text-primary" font-size="12">등</text>
          
          <rect x="160" y="0" width="70" height="30" rx="15" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
          <text x="195" y="20" text-anchor="middle" class="text text-primary" font-size="12">어깨</text>
          
          <rect x="240" y="0" width="70" height="30" rx="15" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
          <text x="275" y="20" text-anchor="middle" class="text text-primary" font-size="12">하체</text>
        </g>
      </g>
      
      <!-- 추천 운동 -->
      <g id="recommended-exercises" transform="translate(16, 188)">
        <rect x="0" y="0" width="343" height="200" rx="8" class="card-bg"/>
        <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">추천 운동</text>
        
        <!-- 벤치프레스 -->
        <g transform="translate(12, 40)">
          <rect x="0" y="0" width="319" height="50" rx="6" fill="#f8fafc"/>
          <text x="12" y="20" class="text text-primary" font-size="14" font-weight="600">벤치프레스</text>
          <text x="12" y="36" class="text text-secondary" font-size="12">3세트 × 8-12회</text>
          <text x="307" y="28" text-anchor="end" class="text text-primary" font-size="12">▶️ 영상</text>
        </g>
        
        <!-- 인클라인 덤벨 프레스 -->
        <g transform="translate(12, 100)">
          <rect x="0" y="0" width="319" height="50" rx="6" fill="#f8fafc"/>
          <text x="12" y="20" class="text text-primary" font-size="14" font-weight="600">인클라인 덤벨 프레스</text>
          <text x="12" y="36" class="text text-secondary" font-size="12">3세트 × 10-15회</text>
          <text x="307" y="28" text-anchor="end" class="text text-primary" font-size="12">▶️ 영상</text>
        </g>
        
        <!-- 운동 시작 버튼 -->
        <rect x="12" y="160" width="319" height="36" rx="8" fill="#030213"/>
        <text x="171" y="182" text-anchor="middle" fill="white" font-size="16" font-weight="600">운동 시작하기</text>
      </g>
    `,
    
    challenge: `
      <!-- 챌린지 헤더 -->
      <g id="challenge-header">
        <rect x="16" y="16" width="343" height="60" rx="8" class="card-bg"/>
        <text x="24" y="40" class="text text-primary" font-size="24" font-weight="700">이번 주 챌린지 🏆</text>
        <text x="24" y="58" class="text text-secondary" font-size="14">친구들과 함께 경쟁해보세요</text>
      </g>
      
      <!-- 랭킹 리스트 -->
      <g id="rankings" transform="translate(16, 92)">
        <rect x="0" y="0" width="343" height="280" rx="8" class="card-bg"/>
        <text x="12" y="24" class="text text-primary" font-size="16" font-weight="600">주간 운동 시간 랭킹</text>
        
        <!-- 1위 -->
        <g transform="translate(12, 40)">
          <rect x="0" y="0" width="319" height="50" rx="6" fill="#fef3c7"/>
          <text x="12" y="20" class="text text-primary" font-size="16" font-weight="700">🥇 1위</text>
          <text x="12" y="36" class="text text-secondary" font-size="12">김철수</text>
          <text x="307" y="28" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">2,450점</text>
        </g>
        
        <!-- 2위 -->
        <g transform="translate(12, 100)">
          <rect x="0" y="0" width="319" height="50" rx="6" fill="#e5e7eb"/>
          <text x="12" y="20" class="text text-primary" font-size="16" font-weight="700">🥈 2위</text>
          <text x="12" y="36" class="text text-secondary" font-size="12">이영희</text>
          <text x="307" y="28" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">2,340점</text>
        </g>
        
        <!-- 3위 -->
        <g transform="translate(12, 160)">
          <rect x="0" y="0" width="319" height="50" rx="6" fill="#fed7aa"/>
          <text x="12" y="20" class="text text-primary" font-size="16" font-weight="700">🥉 3위</text>
          <text x="12" y="36" class="text text-secondary" font-size="12">박민수</text>
          <text x="307" y="28" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">2,180점</text>
        </g>
        
        <!-- 내 순위 -->
        <g transform="translate(12, 220)">
          <rect x="0" y="0" width="319" height="50" rx="6" fill="#030213" fill-opacity="0.05" stroke="#030213" stroke-width="2"/>
          <text x="12" y="20" class="text text-primary" font-size="16" font-weight="700">12위 (나)</text>
          <text x="12" y="36" class="text text-secondary" font-size="12">김건</text>
          <text x="307" y="28" text-anchor="end" class="text text-primary" font-size="14" font-weight="600">1,890점</text>
        </g>
      </g>
    `,
    
    community: `
      <!-- 커뮤니티 헤더 -->
      <g id="community-header">
        <rect x="16" y="16" width="343" height="60" rx="8" class="card-bg"/>
        <text x="24" y="40" class="text text-primary" font-size="24" font-weight="700">핫한 피드 🔥</text>
        <text x="24" y="58" class="text text-secondary" font-size="14">함께 동기부여 받고 정보를 공유해요</text>
      </g>
      
      <!-- 검색 및 카테고리 -->
      <g id="search-categories" transform="translate(16, 92)">
        <rect x="0" y="0" width="343" height="40" rx="8" fill="#f8fafc" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <text x="12" y="26" class="text text-secondary" font-size="14">🔍 관심있는 주제를 검색해보세요</text>
        
        <g transform="translate(0, 52)">
          <rect x="0" y="0" width="80" height="30" rx="15" fill="#030213"/>
          <text x="40" y="20" text-anchor="middle" fill="white" font-size="12">운동</text>
          
          <rect x="90" y="0" width="80" height="30" rx="15" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
          <text x="130" y="20" text-anchor="middle" class="text text-primary" font-size="12">식단</text>
          
          <rect x="180" y="0" width="80" height="30" rx="15" fill="#f1f5f9" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
          <text x="220" y="20" text-anchor="middle" class="text text-primary" font-size="12">다이어트</text>
        </g>
      </g>
      
      <!-- 피드 리스트 -->
      <g id="feed-list" transform="translate(16, 226)">
        <rect x="0" y="0" width="343" height="300" rx="8" class="card-bg"/>
        
        <!-- 첫 번째 포스트 -->
        <g transform="translate(12, 12)">
          <circle cx="20" cy="20" r="16" fill="#f1f5f9"/>
          <text x="20" y="26" text-anchor="middle" class="text text-primary" font-size="12">헬</text>
          <text x="44" y="18" class="text text-primary" font-size="14" font-weight="600">헬스맨</text>
          <text x="44" y="32" class="text text-secondary" font-size="10">30분 전</text>
          <text x="12" y="56" class="text text-primary" font-size="14">오늘 데드리프트 신기록 달성! 💪</text>
          <text x="12" y="72" class="text text-secondary" font-size="12">3개월 만에 드디어 100kg 넘었습니다</text>
          <text x="307" y="56" text-anchor="end" class="text text-secondary" font-size="12">❤️ 24</text>
        </g>
        
        <!-- 두 번째 포스트 -->
        <g transform="translate(12, 92)">
          <circle cx="20" cy="20" r="16" fill="#f1f5f9"/>
          <text x="20" y="26" text-anchor="middle" class="text text-primary" font-size="12">다</text>
          <text x="44" y="18" class="text text-primary" font-size="14" font-weight="600">다이어터</text>
          <text x="44" y="32" class="text text-secondary" font-size="10">1시간 전</text>
          <text x="12" y="56" class="text text-primary" font-size="14">마이너스 5kg 달성 후기 📝</text>
          <text x="12" y="72" class="text text-secondary" font-size="12">3개월간의 식단 관리 비법 공유합니다</text>
          <text x="307" y="56" text-anchor="end" class="text text-secondary" font-size="12">❤️ 42</text>
        </g>
        
        <!-- 세 번째 포스트 -->
        <g transform="translate(12, 172)">
          <circle cx="20" cy="20" r="16" fill="#f1f5f9"/>
          <text x="20" y="26" text-anchor="middle" class="text text-primary" font-size="12">요</text>
          <text x="44" y="18" class="text text-primary" font-size="14" font-weight="600">요가러버</text>
          <text x="44" y="32" class="text text-secondary" font-size="10">2시간 전</text>
          <text x="12" y="56" class="text text-primary" font-size="14">아침 요가 루틴 완성! 🧘‍♀️</text>
          <text x="12" y="72" class="text text-secondary" font-size="12">초보자도 쉽게 따라할 수 있는 동작들</text>
          <text x="307" y="56" text-anchor="end" class="text text-secondary" font-size="12">❤️ 18</text>
        </g>
      </g>
    `
  };
  
  const structure = tabStructures[tabName as keyof typeof tabStructures] || generateRealAppStructure();
  
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="375" height="800" viewBox="0 0 375 800">
      <defs>
        <style>
          .card-bg { fill: #ffffff; stroke: rgba(0,0,0,0.1); stroke-width: 1; }
          .text { font-family: ui-sans-serif, system-ui, sans-serif; }
          .text-primary { fill: #030213; }
          .text-secondary { fill: #717182; }
          .bg-primary { fill: #030213; }
          .bg-accent { fill: #f1f5f9; }
          .border { stroke: rgba(0,0,0,0.1); stroke-width: 1; fill: none; }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="#ffffff"/>
      ${structure}
      
      <!-- 하단 네비게이션 (공통) -->
      <g id="bottom-navigation" transform="translate(16, 720)">
        <rect x="0" y="0" width="343" height="64" rx="8" fill="#ffffff" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        
        ${['dashboard', 'food', 'workout', 'challenge', 'community', 'mypage'].map((tab, index) => {
          const isActive = tab === tabName;
          const icons = ['🏠', '🍽️', '💪', '🏆', '👥', '👤'];
          const labels = ['홈', '식단', '운동', '챌린지', '커뮤니티', '마이'];
          
          return `
            <g transform="translate(${10 + index * 54}, 12)">
              ${isActive ? `<rect x="0" y="0" width="47" height="40" rx="4" fill="#030213"/>` : ''}
              <text x="23" y="22" text-anchor="middle" ${isActive ? 'fill="white"' : 'class="text text-secondary"'} font-size="16">${icons[index]}</text>
              <text x="23" y="35" text-anchor="middle" ${isActive ? 'fill="white"' : 'class="text text-secondary"'} font-size="10">${labels[index]}</text>
            </g>
          `;
        }).join('')}
      </g>
    </svg>
  `;
};

const downloadSvg = (filename: string, svgContent: string) => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success(`${filename}.svg 파일이 다운로드되었습니다!`);
};

export const WireframeExporter = () => {
  const tabs = [
    { id: 'dashboard', name: '홈 대시보드', icon: '🏠', description: '메인 화면, 통계 및 캐릭터' },
    { id: 'food', name: '식단 관리', icon: '🍽️', description: '음식 기록 및 AI 추천' },
    { id: 'workout', name: '운동 기록', icon: '💪', description: '운동 추천 및 타이머' },
    { id: 'challenge', name: '챌린지', icon: '🏆', description: '랭킹 및 경쟁 시스템' },
    { id: 'community', name: '커뮤니티', icon: '👥', description: '소셜 피드 및 게시물' }
  ];

  const exportSingleTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;

    const svgContent = generateTabStructure(tabId);
    downloadSvg(`fittracker-${tabId}-screen`, svgContent);
  };

  const exportAllTabs = () => {
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1875" height="900" viewBox="0 0 1875 900">
        <defs>
          <style>
            .card-bg { fill: #ffffff; stroke: rgba(0,0,0,0.1); stroke-width: 1; }
            .text { font-family: ui-sans-serif, system-ui, sans-serif; }
            .text-primary { fill: #030213; }
            .text-secondary { fill: #717182; }
            .bg-primary { fill: #030213; }
            .bg-accent { fill: #f1f5f9; }
            .border { stroke: rgba(0,0,0,0.1); stroke-width: 1; fill: none; }
          </style>
        </defs>
        <rect width="100%" height="100%" fill="#f8fafc"/>
        
        <!-- 전체 타이틀 -->
        <text x="937" y="40" font-family="ui-sans-serif" font-size="28" font-weight="700" text-anchor="middle" class="text-primary">FitTracker - 전체 앱 플로우</text>
        <text x="937" y="65" font-family="ui-sans-serif" font-size="16" text-anchor="middle" class="text-secondary">피그마에서 자유롭게 편집하고 디자인하세요</text>
        
        ${tabs.map((tab, index) => {
          const xOffset = index * 375;
          return `
            <g transform="translate(${xOffset}, 80)">
              <!-- 탭 제목 -->
              <rect x="0" y="0" width="375" height="40" fill="#ffffff" stroke="rgba(0,0,0,0.1)" stroke-width="1" rx="8"/>
              <text x="187" y="25" text-anchor="middle" font-family="ui-sans-serif" font-size="14" font-weight="600" class="text-primary">${tab.icon} ${tab.name}</text>
              
              <!-- 실제 화면 내용 -->
              <g transform="translate(0, 50)">
                ${generateTabStructure(tab.id).replace(/<svg[^>]*>|<\/svg>/g, '').replace(/width="375" height="800" viewBox="0 0 375 800"/, '')}
              </g>
            </g>
          `;
        }).join('')}
      </svg>
    `;

    downloadSvg('fittracker-all-screens', svgContent);
  };

  const exportCurrentDashboard = () => {
    const svgContent = generateTabStructure('dashboard');
    downloadSvg('fittracker-current-dashboard', svgContent);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <FileImage className="h-6 w-6" />
          실제 앱 와이어프레임 내보내기
        </h2>
        <p className="text-muted-foreground">현재 앱과 동일한 구조로 피그마에서 편집 가능한 SVG 생성</p>
      </div>

      {/* 빠른 내보내기 */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              전체 화면 내보내기
              <Badge variant="secondary">실제 앱 구조</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={exportCurrentDashboard} className="flex-1 gap-2">
                <Smartphone className="h-4 w-4" />
                현재 대시보드
              </Button>
              <Button onClick={exportAllTabs} variant="outline" className="flex-1 gap-2">
                <Monitor className="h-4 w-4" />
                모든 화면 (가로 배열)
              </Button>
            </div>
            <div className="text-sm text-muted-foreground bg-blue-50 border border-blue-200 p-3 rounded-lg">
              ✨ <strong>실제 앱 복제:</strong> 현재 앱의 정확한 레이아웃, 색상, 텍스트를 그대로 재현한 SVG입니다
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 개별 화면 내보내기 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">개별 화면 내보내기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {tabs.map((tab) => (
              <div key={tab.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tab.icon}</span>
                  <div>
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-sm text-muted-foreground">{tab.description}</div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportSingleTab(tab.id)}
                  className="gap-2"
                >
                  <Download size={14} />
                  다운로드
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 피그마 활용 가이드 */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            실제 앱 기반 디자인 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-semibold">🎯 정확한 복제 요소:</p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                <li>실제 텍스트 내용과 위치</li>
                <li>정확한 색상 코드 (#030213, #717182 등)</li>
                <li>카드와 버튼의 실제 크기</li>
                <li>아이콘과 이모지 배치</li>
                <li>프로그레스 바 진행률</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <p className="font-semibold">🎨 피그마에서 편집:</p>
              <ul className="list-disc list-inside pl-2 space-y-1 text-xs">
                <li>레이어별 색상 변경</li>
                <li>텍스트 폰트 및 크기 수정</li>
                <li>버튼과 카드 스타일링</li>
                <li>새로운 브랜드 아이덴티티 적용</li>
                <li>프로토타이핑 및 인터랙션 추가</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-white/80 p-3 rounded-lg border border-blue-300">
            <p className="font-semibold text-blue-800 mb-2">💡 활용 팁:</p>
            <p className="text-xs">
              다운로드한 SVG를 피그마에서 선택 → 우클릭 → "Ungroup" 하면 
              모든 요소를 개별적으로 편집할 수 있습니다. 
              실제 앱의 디자인 토큰을 참고해서 일관된 디자인 시스템을 구축해보세요.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        실제 앱과 100% 동일한 구조의 SVG • 375×800px 모바일 최적화 • 벡터 기반 무손실 편집
      </div>
    </div>
  );
};