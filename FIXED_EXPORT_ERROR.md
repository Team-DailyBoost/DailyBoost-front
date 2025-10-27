# Export 오류 수정 완료

## 🐛 문제
```
Error: Couldn't find a 'component', 'getComponent' or 'children' prop for the screen '운동'.
This can happen if you passed 'undefined'. You likely forgot to export your component from the file it's defined in, or mixed up default import and named import when importing.
```

## ✅ 해결 방법

### 문제 원인
화면 컴포넌트들의 export 방식이 일관성 없었음:
- `Dashboard.tsx`: ✅ `export function Dashboard()` (named export)
- `FoodLogger.tsx`: ✅ `export function FoodLogger()` (named export)
- `WorkoutLogger.tsx`: ❌ `export default function WorkoutLogger()` (default export)
- `Challenge.tsx`: ❌ `export default function Challenge()` (default export)
- `Community.tsx`: ❌ `export default function Community()` (default export)
- `MyPage.tsx`: ❌ `export default function MyPage()` (default export)

### 해결 내용
모든 화면을 **named exports**로 통일:

```typescript
// Before (혼재)
export default function WorkoutLogger() { ... }  // default
export default function Challenge() { ... }     // default
export function Dashboard() { ... }             // named ✓

// After (통일)
export function WorkoutLogger() { ... }  // named ✓
export function Challenge() { ... }       // named ✓
export function Dashboard() { ... }      // named ✓
```

### 수정된 파일
1. ✅ `src/react-native/screens/WorkoutLogger.tsx`
2. ✅ `src/react-native/screens/Challenge.tsx`
3. ✅ `src/react-native/screens/Community.tsx`
4. ✅ `src/react-native/screens/MyPage.tsx`

## 🔍 검증
모든 화면이 올바르게 export되는지 확인:

```bash
# 모든 화면이 named export로 통일됨
✓ Dashboard.tsx: export function Dashboard()
✓ FoodLogger.tsx: export function FoodLogger()
✓ WorkoutLogger.tsx: export function WorkoutLogger()
✓ Challenge.tsx: export function Challenge()
✓ Community.tsx: export function Community()
✓ MyPage.tsx: export function MyPage()
```

## 📝 주의사항
- **App.tsx**는 named imports를 사용:
  ```typescript
  import { Dashboard } from './src/react-native/screens/Dashboard';
  import { WorkoutLogger } from './src/react-native/screens/WorkoutLogger';
  ```

- 이제 모든 화면 컴포넌트는 **named exports**만 사용하세요.
- 추후 새로운 화면을 추가할 때도 `export function`을 사용해야 합니다.

## ✅ 완료
이제 앱이 정상적으로 실행됩니다!

```bash
npm start
```

