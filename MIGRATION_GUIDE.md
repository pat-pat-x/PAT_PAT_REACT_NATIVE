# PAT PAT React Native 마이그레이션 가이드

## 작업 일자: 2026-04-15

---

## 1. 왜 마이그레이션 했는가

### 기존 문제점
- **기술 스택**: Next.js 15 + Capacitor 6 (웹앱을 네이티브 래퍼로 감싼 구조)
- **핵심 문제**: `capacitor.config.ts`에서 `server.url: 'https://pat-pat.vercel.app'`로 원격 URL을 WebView로 로드
- **Apple Guideline 4.2 / 4.7 위반**: "웹사이트를 그대로 래핑한 앱"으로 판단 → iOS 심사 리젝 가능성 90% 이상
- **네이티브 기능 부재**: Capacitor Browser(OAuth), App(딥링크) 2개뿐 → Safari 홈 화면 추가(PWA)와 차이 없음

### 마이그레이션 결정
- **React Native (Expo)** 선택 → 기존 React/TypeScript 코드 자산 최대 활용
- Flutter 대비 장점: 같은 React 생태계, 기존 훅/로직/스키마 60~70% 재사용 가능

---

## 2. 아키텍처 변경 요약

```
[기존]                              [신규]
Next.js (SSR + API Routes)          Expo React Native (클라이언트 전용)
     ↓                                   ↓
Capacitor WebView                   네이티브 앱 (iOS/Android)
     ↓                                   ↓
Vercel 원격 URL 로드                Supabase 직접 호출 (API Routes 제거)
     ↓                                   ↓
네이티브 기능 0개                    푸시알림 + Face ID + 햅틱
```

### 주요 기술 변환

| 기존 (Next.js + Capacitor) | 신규 (Expo RN) |
|---|---|
| Next.js App Router (`/app`) | Expo Router (`/app`) |
| Tailwind CSS | StyleSheet (NativeWind 준비됨) |
| Framer Motion | Reanimated |
| Three.js (3D 배경) | 제거 (정적 배경) |
| SVG (웹 `<svg>`) | `react-native-svg` |
| `localStorage` | `expo-secure-store` |
| Next.js API Routes → Supabase | Supabase JS SDK 직접 호출 |
| Capacitor Browser | `expo-web-browser` |
| Capacitor App (딥링크) | `expo-linking` + `expo-auth-session` |
| CSS `safe-area-inset` | `SafeAreaView` |
| `next/navigation` | `expo-router` |
| `@supabase/ssr` (서버 클라이언트) | `@supabase/supabase-js` (클라이언트) |

---

## 3. 프로젝트 구조

```
C:\Users\user\PAT_PAT_REACT_NATIVE\
│
├── app/                              # Expo Router 파일 기반 라우팅
│   ├── _layout.tsx                   # Root: QueryClientProvider + AuthGate
│   ├── index.tsx                     # 시작 화면 (OAuth 로그인)
│   │
│   ├── (auth)/                       # 인증 그룹 (Stack Navigator)
│   │   ├── _layout.tsx
│   │   ├── signin.tsx                # 이메일 로그인
│   │   ├── signup.tsx                # 회원가입 (닉네임 → OTP → 비밀번호)
│   │   └── terms.tsx                 # 약관 동의
│   │
│   └── (main)/                       # 메인 그룹 (Bottom Tab Navigator)
│       ├── _layout.tsx               # 탭: 홈 / 기록 / 프로필
│       ├── home.tsx                  # 홈 화면
│       ├── profile.tsx               # 프로필 화면
│       ├── diary/
│       │   └── editor.tsx            # 일기 작성/수정
│       └── diary-archive/
│           ├── index.tsx             # 월별 일기 목록
│           └── [diaryId].tsx         # 일기 상세
│
├── src/
│   ├── features/                     # 기능별 모듈 (기존 구조 유지)
│   │   ├── auth/
│   │   │   └── hooks/useAuth.ts      # Supabase 세션 관리
│   │   ├── home/
│   │   │   ├── hooks/useHomeSummary.ts   # 홈 데이터 (Supabase 직접 쿼리)
│   │   │   ├── schemas/home.schema.ts
│   │   │   └── queries/summary.ts
│   │   ├── diary/
│   │   │   ├── hooks/
│   │   │   │   ├── useTags.ts
│   │   │   │   ├── useDiaryDetail.ts
│   │   │   │   ├── useDiaryList.ts
│   │   │   │   └── useUpsertDiaryMutation.ts
│   │   │   ├── schemas/
│   │   │   │   ├── diaryDetail.schema.ts
│   │   │   │   └── tag.schema.ts
│   │   │   └── queries/
│   │   │       ├── diaries.ts
│   │   │       └── tags.ts
│   │   └── profile/
│   │       ├── hooks/useUserProfile.ts
│   │       ├── schemas/profile.schema.ts
│   │       └── queries/profile.ts
│   │
│   ├── shared/
│   │   └── components/
│   │       └── ConstellationSvg.tsx   # react-native-svg 버전
│   │
│   ├── lib/
│   │   ├── zodiac.ts                 # 별자리 계산 (loadTemplates → Supabase 직접)
│   │   ├── query-client.ts           # TanStack Query 클라이언트
│   │   ├── errors/
│   │   │   ├── AppError.ts
│   │   │   └── Errors.ts
│   │   └── result/
│   │       └── result.ts
│   │
│   ├── data/
│   │   └── zodiacMessages.ts         # 12별자리 × 7요일 인사말
│   │
│   └── utils/
│       ├── supabase.ts               # Supabase 클라이언트 (SecureStore 세션)
│       ├── notifications.ts          # 푸시 알림 유틸
│       └── biometrics.ts             # Face ID / Touch ID 유틸
│
├── assets/                           # 아이콘, 스플래시 (교체 필요)
├── app.json                          # Expo 설정 (번들 ID, 플러그인)
├── tsconfig.json                     # @/* 경로 별칭 포함
├── package.json
└── .env.example                      # 환경변수 템플릿
```

---

## 4. 파일별 변환 방식 설명

### 4-1. Supabase 클라이언트 (`src/utils/supabase.ts`)

**기존**: `@supabase/ssr`의 `createBrowserClient()` → 쿠키 기반 세션
**신규**: `@supabase/supabase-js`의 `createClient()` → `expo-secure-store` 기반 세션

```
기존: 쿠키 → 미들웨어에서 세션 체크 → API Route에서 서버 클라이언트 사용
신규: SecureStore → useAuth() 훅에서 세션 체크 → 클라이언트에서 직접 Supabase 호출
```

### 4-2. 인증 (`app/_layout.tsx` AuthGate)

**기존**: Next.js 미들웨어 (`middleware.ts`) → 서버에서 세션 체크 후 리다이렉트
**신규**: `AuthGate` 컴포넌트 → `useAuth()` 훅으로 세션 확인 → `expo-router`로 리다이렉트

```
인증 안됨 + 보호 페이지 → "/" (시작 화면)으로 리다이렉트
인증됨 + 인증 페이지 → "/(main)/home"으로 리다이렉트
```

### 4-3. 데이터 페칭 (훅들)

**기존**: 서버 컴포넌트 → `prefetchQuery()` → API Route → Supabase
**신규**: 클라이언트 훅 → `useQuery()` → Supabase 직접 호출

예시 (`useHomeSummary.ts`):
```
기존: page.tsx (서버) → home.actions.ts → home.server.ts → API → Supabase
신규: home.tsx → useHomeSummary() → supabase.from('users').select() 직접
```

RPC 함수(create_diary_entry, update_diary_entry 등)는 `supabase.rpc()` 직접 호출로 변환.

### 4-4. 화면 UI

**기존**: JSX + Tailwind CSS 클래스 (`className="text-white/85 text-[17px]"`)
**신규**: JSX + StyleSheet (`style={styles.nickname}`)

변환 패턴:
```
Tailwind: className="text-white/85 text-[17px] font-light"
     ↓
StyleSheet: { color: 'rgba(255,255,255,0.85)', fontSize: 17, fontWeight: '300' }
```

HTML 태그 변환:
```
<div>       → <View>
<p>/<span>  → <Text>
<button>    → <TouchableOpacity>
<input>     → <TextInput>
<img>       → <Image>
```

### 4-5. 별자리 SVG (`src/shared/components/ConstellationSvg.tsx`)

**기존**: 웹 `<svg>`, `<circle>`, `<line>` + CSS filter (glow)
**신규**: `react-native-svg`의 `<Svg>`, `<Circle>`, `<Line>` + `<RadialGradient>`

- SVG filter (`feGaussianBlur`, `feFlood`) → RadialGradient로 대체
- CSS animation (`@keyframes`) → 추후 Reanimated로 대체 가능

### 4-6. 네비게이션

**기존**: Next.js 파일 기반 라우팅 + `useRouter().push()`
**신규**: Expo Router 파일 기반 라우팅 + `router.push()`

```
기존: /home                → 신규: /(main)/home
기존: /diary/editor        → 신규: /(main)/diary/editor
기존: /diary-archive       → 신규: /(main)/diary-archive
기존: /diary-archive/[id]  → 신규: /(main)/diary-archive/[diaryId]
기존: /profile             → 신규: /(main)/profile
기존: /start               → 신규: / (index)
기존: /auth/signin         → 신규: /(auth)/signin
기존: /auth/signup         → 신규: /(auth)/signup
기존: /auth/terms          → 신규: /(auth)/terms
```

---

## 5. 기존 코드에서 그대로 복사한 것들

| 파일 | 변경 내용 |
|------|----------|
| `zodiacMessages.ts` | import 경로만 변경 (`@/lib/zodiac`) |
| `errors/AppError.ts` | 그대로 복사 |
| `errors/Errors.ts` | 그대로 복사 |
| `result/result.ts` | 그대로 복사 |
| `diaryDetail.schema.ts` | 그대로 복사 |
| `tag.schema.ts` | 그대로 복사 |
| `home.schema.ts` | 그대로 복사 |
| `profile.schema.ts` | 그대로 복사 |
| `diaries.ts` (query key) | 그대로 복사 |
| `tags.ts` (query key) | 그대로 복사 |
| `summary.ts` (query key) | 그대로 복사 |
| `profile.ts` (query key) | 그대로 복사 |

---

## 6. 남은 작업 (내일 이어서)

### 필수 (앱 실행에 필요)
- [ ] `.env` 파일 생성 (Supabase URL/Key 입력)
- [ ] `npx expo start`로 실행 테스트
- [ ] 실기기/시뮬레이터에서 화면 확인
- [ ] OAuth 콜백 URL 설정 확인 (Supabase Dashboard → Auth → URL Configuration)
- [ ] `assets/` 폴더에 실제 앱 아이콘/스플래시 이미지 교체

### 기능 보완
- [ ] 홈 화면 루미 이미지 추가 (현재 제거됨 — 이미지 에셋 필요)
- [ ] 생일 오버레이 (`BirthdayOverlay`) RN 버전 구현
- [ ] 별 애니메이션 (Reanimated로 반짝임 효과)
- [ ] 프로필 → 알림 설정 토글 UI 추가 (`notifications.ts` 연동)
- [ ] 프로필 → Face ID 잠금 토글 UI 추가 (`biometrics.ts` 연동)
- [ ] `_layout.tsx`에 앱 포그라운드 복귀시 생체인증 체크 로직 추가
- [ ] 다이어리 아카이브 → 별자리 시각화 뷰 (ConstellationSvg 연동)
- [ ] Slider 패키지 임포트 경로 확인 (`@react-native-community/slider`)

### iOS 출시 준비
- [ ] EAS Build 설정 (`npx eas-cli init && eas build:configure`)
- [ ] `eas.json` 생성
- [ ] iOS 개발자 인증서 & 프로비저닝 프로파일
- [ ] App Store Connect 메타데이터 (스크린샷, 설명, 키워드)
- [ ] TestFlight 내부 테스트
- [ ] App Store 심사 제출

### 선택 (MVP 이후)
- [ ] NativeWind 스타일링 전환 (현재 StyleSheet, NativeWind 패키지는 설치됨)
- [ ] 앱 위젯 (WidgetKit 연동 — 복잡도 높음)
- [ ] 다크모드/라이트모드 전환
- [ ] 데이터 내보내기 기능

---

## 7. 실행 방법

```bash
# 프로젝트 이동
cd C:\Users\user\PAT_PAT_REACT_NATIVE

# 환경변수 설정
cp .env.example .env
# .env 파일에 실제 Supabase URL/Key 입력

# 개발 서버 시작
npx expo start

# iOS 시뮬레이터
npx expo start --ios

# Android 에뮬레이터
npx expo start --android
```

---

## 8. 참조: 기존 프로젝트 위치

- 기존 Next.js + Capacitor: `C:\Users\user\PAT_PAT`
- 신규 Expo React Native: `C:\Users\user\PAT_PAT_REACT_NATIVE`
- Supabase 마이그레이션: `C:\Users\user\PAT_PAT\supabase\migrations\`
