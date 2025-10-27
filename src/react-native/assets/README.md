# 📱 Assets 폴더 - 앱 아이콘 및 스플래시 이미지

## 필요한 파일들

이 폴더에는 다음 이미지 파일들이 필요합니다:

```
assets/
├── icon.png           (1024x1024 PNG) - 앱 아이콘
├── splash.png         (1284x2778 PNG) - 스플래시 화면
└── adaptive-icon.png  (1024x1024 PNG) - Android 적응형 아이콘
```

---

## 🎨 방법 1: 무료 온라인 도구 사용 (추천)

### 1. AppIcon.co 사용
1. https://www.appicon.co/ 접속
2. 1024x1024 이미지 업로드 (또는 생성)
3. 모든 플랫폼용 아이콘 자동 생성
4. 다운로드 후 이 폴더에 저장

### 2. MakeAppIcon 사용
1. https://makeappicon.com/ 접속
2. 이미지 업로드
3. iOS와 Android 아이콘 생성
4. 다운로드

### 3. Canva 사용 (디자인부터)
1. https://www.canva.com/ 접속
2. "App Icon" 검색
3. 1024x1024 사이즈로 디자인
4. PNG로 다운로드

---

## 🚀 방법 2: 임시 placeholder 사용 (빠른 테스트용)

개발 중에는 아이콘 없이도 실행 가능합니다!

### app.json 간소화 (이미 적용됨)

```json
{
  "expo": {
    "name": "피트니스 앱",
    "slug": "fitness-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light"
  }
}
```

**아이콘 참조를 제거하면 기본 Expo 아이콘이 사용됩니다.**

---

## 💡 방법 3: 간단한 아이콘 직접 만들기

### Figma/Photoshop에서:
1. **1024x1024 캔버스 생성**
2. **배경색**: #6366f1 (보라색) 또는 원하는 색
3. **아이콘/텍스트 추가**:
   - 중앙에 "💪" 이모지 또는
   - "FITNESS" 텍스트 또는
   - 덤벨 아이콘
4. **PNG로 저장**: `icon.png`

### 스플래시 이미지:
1. **1284x2778 캔버스 생성** (iPhone 14 Pro Max 크기)
2. **배경색**: #ffffff (흰색)
3. **중앙에 로고/아이콘 배치**
4. **PNG로 저장**: `splash.png`

### Adaptive Icon (Android):
- `icon.png`와 동일하게 생성
- 다른 이름으로 저장: `adaptive-icon.png`

---

## 📦 방법 4: 기본 Expo 템플릿 assets 복사

새 Expo 프로젝트를 만들고 assets 복사:

```bash
# 임시 폴더 생성
cd C:\VSCode\React
npx create-expo-app temp-app

# assets 폴더 복사
# temp-app/assets/ → MealPlan/react-native/assets/

# temp-app 삭제
rmdir /s /q temp-app
```

---

## 🎯 빠른 다운로드 링크

### 무료 피트니스 아이콘:

1. **Flaticon**: https://www.flaticon.com/
   - 검색: "fitness app icon"
   - 1024x1024 PNG 다운로드

2. **Icons8**: https://icons8.com/
   - 검색: "workout icon"
   - PNG 형식, 1024px 다운로드

3. **Freepik**: https://www.freepik.com/
   - 검색: "fitness logo"
   - 무료 벡터 다운로드 후 PNG 변환

---

## 📋 이미지 크기 요약

| 파일명 | 크기 | 용도 |
|--------|------|------|
| `icon.png` | 1024x1024 | iOS/Android 앱 아이콘 |
| `splash.png` | 1284x2778 | 앱 시작 화면 |
| `adaptive-icon.png` | 1024x1024 | Android 적응형 아이콘 |

---

## ✅ 파일 추가 후 할 일

### 1. app.json 업데이트

이미지를 추가한 후 `app.json`에 추가:

```json
{
  "expo": {
    "name": "피트니스 앱",
    "slug": "fitness-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#ffffff",
      "resizeMode": "contain"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.fitnessapp"
    }
  }
}
```

### 2. 캐시 삭제 후 재시작

```bash
npx expo start -c
```

---

## 🎨 추천 디자인 스타일

피트니스 앱에 어울리는 아이콘 스타일:

### 색상:
- 주 색상: `#6366f1` (보라/남색)
- 보조 색상: `#10b981` (초록)
- 강조 색상: `#f59e0b` (오렌지)

### 아이콘 요소:
- 💪 덤벨
- 🏃 러닝하는 사람
- 📊 그래프/차트
- ❤️ 하트 (건강)
- 🎯 타겟 (목표)
- 🔥 불꽃 (칼로리)

---

## ⚠️ 중요 사항

### 지금 당장 앱을 실행하려면:
**아이콘 없이도 실행 가능합니다!**

1. app.json에서 icon/splash 참조 제거 (✅ 이미 완료)
2. `npx expo start -c` 실행
3. 앱 테스트
4. 나중에 아이콘 추가

### 배포 전에는:
- 반드시 정식 아이콘 추가 필요
- Apple App Store: 고해상도 아이콘 필수
- Google Play Store: 적응형 아이콘 권장

---

## 📞 도움이 필요하면

아이콘을 직접 만들기 어렵다면:

1. **Fiverr**: 저렴한 아이콘 디자인 (5-20달러)
2. **99designs**: 전문 디자이너
3. **ChatGPT/DALL-E**: AI로 아이콘 생성 후 PNG 변환

---

## ✨ 완성된 폴더 구조

```
react-native/
├── assets/
│   ├── icon.png           ← 1024x1024
│   ├── splash.png         ← 1284x2778
│   ├── adaptive-icon.png  ← 1024x1024
│   └── README.md          ← 이 파일
├── App.tsx
├── app.json
└── ...
```

---

**지금은 아이콘 없이 앱을 실행하세요!**
**배포 전에 정식 아이콘을 추가하면 됩니다.** ✅
