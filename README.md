# PAT PAT — React Native

별자리 일기 앱. Next.js + Capacitor 기반에서 Expo(React Native)로 마이그레이션.

## Migration Background

기존 앱은 Next.js 15 + Capacitor 6 기반 웹앱 래퍼로,  
Apple App Store Guideline 4.2 / 4.7에 의한 iOS 심사 리젝 가능성이 높은 이유로   
네이티브 앱 전환을 위한 마이그레이션을 진행.

## Tech Stack

| 분류 | 기존 | 신규 |
|---|---|---|
| 프레임워크 | Next.js App Router | Expo Router |
| 스타일링 | Tailwind CSS | NativeWind |
| 애니메이션 | Framer Motion | Reanimated |
| SVG | SVG (웹) | react-native-svg |
| 스토리지 | localStorage | expo-secure-store |
| API | Next.js API Routes | Supabase 직접 호출 |
| 딥링크 | Capacitor | Expo Linking |

## Native Features

- **푸시 알림** — 일기 작성 리마인더 (expo-notifications)
- **생체 인증** — Face ID / Touch ID 앱 잠금 (expo-local-authentication)
- **앱 위젯** — 오늘의 별자리 메시지 (iOS WidgetKit, MVP 이후)

## Project Structure

```text
app/
├── (auth)/         # 로그인, 회원가입, 이메일 OTP, 약관
└── (main)/         # 홈, 일기 에디터, 아카이브, 프로필
src/
├── features/       # auth / home / diary / diary-archive / profile
├── shared/         # 공통 컴포넌트, 훅
├── lib/            # zodiac, errors, result
├── data/           # zodiacMessages
└── utils/          # Supabase 클라이언트
```
## Getting Started

```bash
npm install
npx expo start
```

## Build

```bash  
eas build --platform ios
```
