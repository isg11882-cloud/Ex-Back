# 재회컨설팅 웹앱

AI 기반 재회 전문 상담 서비스

## 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
```bash
cp .env.example .env.local
# .env.local 파일을 열어 값 입력
```

필요한 키:
- **ANTHROPIC_API_KEY**: [console.anthropic.com](https://console.anthropic.com) → API Keys
- **NEXT_PUBLIC_SUPABASE_URL**: Supabase 프로젝트 URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: Supabase anon key
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase service role key

### 3. Supabase DB 초기화
Supabase Dashboard → SQL Editor에서 `lib/supabase/schema.sql` 실행

### 4. 개발 서버 실행
```bash
npm run dev
# http://localhost:3000
```

## 배포 (Vercel)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel deploy

# 환경변수는 Vercel Dashboard에서 설정
```

## 프로젝트 구조

```
app/
  api/
    chat/route.ts       ← Claude AI 스트리밍 엔드포인트
    diagnosis/route.ts  ← 이별 유형 판별 API
    mission/route.ts    ← 미션 조회/완료 API
    auth/route.ts       ← 인증 API
  chat/page.tsx         ← AI 상담 페이지
  diagnosis/page.tsx    ← 진단 페이지
  mission/page.tsx      ← 미션 센터
  dashboard/page.tsx    ← 홈 대시보드
  page.tsx              ← 랜딩 페이지

components/
  chat/ChatWindow.tsx   ← 스트리밍 채팅 UI
  mission/             ← 미션 카드, 필터
  ui/                  ← 공통 UI 컴포넌트

lib/
  ai-system-prompt.ts  ← Claude 시스템 프롬프트 빌더
  supabase/
    client.ts          ← 브라우저용 Supabase 클라이언트
    server.ts          ← 서버용 Supabase 클라이언트
    schema.sql         ← DB 스키마
```

## AI 모델 선택

`app/api/chat/route.ts`에서 모델 변경:

| 모델 | 비용 | 추천 상황 |
|------|------|-----------|
| `claude-haiku-4-5-20251001` | 저비용 (~₩5/회) | MVP, 초기 테스트 |
| `claude-sonnet-4-6` | 중간 (~₩50/회) | 품질 중시, 정식 서비스 |

## 주요 기능

- ✅ 9문항 이별 유형 진단 (A/B/C/D)
- ✅ 재회 전문가 AI 상담 (스트리밍)
- ✅ PHASE별 미션 108개
- ✅ 포인트·스트릭 게임화
- ✅ Supabase 인증·데이터 저장
- 🔲 푸시 알림 (Firebase FCM)
- 🔲 유료 구독 (토스페이먼츠)
