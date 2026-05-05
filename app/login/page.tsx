'use client'

import { createSupabaseBrowser, isSupabaseConfigured } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

const VALUE_CARDS = [
  { icon: '📊', title: '진단 리포트', desc: '내 이별 유형과 PHASE를 언제든 다시 확인' },
  { icon: '💬', title: 'AI 상담 내역', desc: '재이와 나눈 대화가 기기 변경에도 사라지지 않음' },
  { icon: '🎯', title: '미션 진행도', desc: '쌓아 올린 포인트와 완료 미션 영구 보관' },
  { icon: '📈', title: '감정 회복 그래프', desc: '주차별 회복 흐름을 잃어버리지 않도록' },
]

function LoginPageContent() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createSupabaseBrowser()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)

  // 로그인 완료 후 돌아갈 경로 (없으면 /dashboard)
  const next = params.get('next') || '/dashboard'
  const reason = params.get('reason') // 'save-report' | 'chat-backup' | 'community-write' 등
  const oauthError = params.get('error') // 'auth_failed' 등 — auth/callback 에서 redirect

  // 환경변수 누락 — 운영에 NEXT_PUBLIC_SUPABASE_URL 안 박혔을 때
  const supabaseReady = isSupabaseConfigured()

  const handleLogin = async (provider: 'google' | 'kakao' | 'email') => {
    if (!supabaseReady) {
      alert(
        '서비스 설정에 문제가 있어 로그인할 수 없습니다.\n관리자에게 알려주세요.\n(Supabase 환경변수 누락)',
      )
      return
    }
    setLoading(provider)

    if (provider === 'email') {
      if (!email) {
        alert('이메일 주소를 입력해주세요.')
        setLoading(null)
        return
      }
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      })
      if (error) {
        console.error('[Login Error]', error)
        alert('로그인 오류가 발생했습니다.\n' + error.message)
      } else {
        setIsSent(true)
      }
      setLoading(null)
      return
    }

    // Google / Kakao 공통 OAuth
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        queryParams:
          provider === 'kakao'
            ? { scope: 'profile_nickname,profile_image' }
            : undefined,
      },
    })

    if (error) {
      alert(`로그인 오류: ${error.message}`)
      setLoading(null)
    }
  }

  // 메일 전송 성공 화면
  if (isSent) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm space-y-12">
          <div className="w-24 h-24 bg-blue-600/20 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl animate-bounce">
            📧
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-white">메일을 확인해주세요!</h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="text-blue-400 font-bold underline">{email}</span> 주소로
              <br />
              로그인 링크를 보냈습니다.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">
              Quick Open
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noreferrer"
                className="py-5 bg-gray-900 border border-white/5 rounded-2xl text-xs font-black hover:bg-gray-800 transition-all shadow-xl"
              >
                지메일 바로가기
              </a>
              <a
                href="https://mail.naver.com"
                target="_blank"
                rel="noreferrer"
                className="py-5 bg-gray-900 border border-white/5 rounded-2xl text-xs font-black hover:bg-gray-800 transition-all shadow-xl"
              >
                네이버 메일 바로가기
              </a>
            </div>
            <a
              href="https://mail.kakao.com"
              target="_blank"
              rel="noreferrer"
              className="w-full block py-5 bg-gray-900 border border-white/5 rounded-2xl text-xs font-black hover:bg-gray-800 transition-all shadow-xl mt-3"
            >
              카카오 메일 바로가기
            </a>
          </div>

          <button
            onClick={() => setIsSent(false)}
            className="text-gray-500 text-xs hover:text-white transition-colors underline pt-4"
          >
            다른 이메일 주소 사용하기
          </button>
        </div>
      </div>
    )
  }

  // 로그인 사유 헤드라인 (트리거별 컨텍스트 메시지)
  const reasonHeadline: Record<string, { title: string; sub: string }> = {
    'save-report': {
      title: '진단 리포트를 안전하게 보관할까요?',
      sub: '로그인하면 지금의 분석 결과가 평생 사라지지 않아요.',
    },
    'chat-backup': {
      title: '지금까지의 상담을 잃지 않으려면',
      sub: '계정에 연결하면 기기를 바꿔도 대화가 그대로 따라옵니다.',
    },
    'community-write': {
      title: '글을 남기려면 로그인이 필요해요',
      sub: '익명 글쓰기는 계정 인증 후에 가능합니다.',
    },
  }
  const headline: { title: string; sub: string } | null = reason ? reasonHeadline[reason] ?? null : null

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">
            🤝
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">
            {headline?.title ?? '내 데이터를 안전하게 저장하기'}
          </h1>
          <p className="text-gray-400 text-xs leading-relaxed">
            {headline?.sub ?? '로그인하면 지금까지의 진행을 계정에 연결해 보관합니다.'}
          </p>
        </div>

        {/* OAuth 콜백 실패 시 안내 */}
        {oauthError && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-left">
            <div className="text-[11px] font-black text-red-400 uppercase tracking-widest mb-1">
              로그인 실패
            </div>
            <p className="text-xs text-red-200 leading-relaxed">
              인증 도중 문제가 발생했어요. 잠시 후 다시 시도해 주세요. 같은 문제가 반복되면 시크릿 창이나 다른 브라우저로 시도해 보세요.
            </p>
          </div>
        )}

        {/* Supabase 환경변수 누락 시 운영자 경고 */}
        {!supabaseReady && (
          <div className="p-4 rounded-2xl bg-yellow-950/40 border border-yellow-500/30 text-left">
            <div className="text-[11px] font-black text-yellow-400 uppercase tracking-widest mb-1">
              서비스 설정 점검 중
            </div>
            <p className="text-xs text-yellow-200 leading-relaxed">
              현재 로그인 서비스 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.
            </p>
          </div>
        )}

        {/* 가치 4카드 — 무엇이 저장되는지 명시 */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {VALUE_CARDS.map((card) => (
            <div
              key={card.title}
              className="bg-gray-900/60 border border-white/5 rounded-2xl p-4 backdrop-blur"
            >
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className="text-[11px] font-black text-white mb-1">{card.title}</div>
              <div className="text-[10px] text-gray-400 leading-tight">{card.desc}</div>
            </div>
          ))}
        </div>

        {/* 카카오 — 한국 사용자 1순위 */}
        <div className="space-y-4">
          <button
            onClick={() => handleLogin('kakao')}
            disabled={!!loading}
            className="w-full transition-all active:scale-[0.98] flex justify-center hover:opacity-90 disabled:opacity-50"
          >
            <img
              src="/images/kakao_login/ko/kakao_login_large_wide.png"
              alt="카카오로 시작하기"
              className="w-full h-auto object-contain"
            />
          </button>

          <button
            onClick={() => handleLogin('google')}
            disabled={!!loading}
            className="w-full h-[54px] bg-white text-gray-900 font-bold rounded-[12px] flex items-center justify-center gap-3 transition-all border border-gray-200 active:scale-[0.98] hover:bg-gray-50 disabled:opacity-50"
          >
            <span className="text-lg font-black">G</span>
            {loading === 'google' ? '연결 중...' : '구글 계정으로 시작하기'}
          </button>
        </div>

        {/* 이메일 OTP — Fallback */}
        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/5" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-gray-950 px-2 text-gray-500 font-bold tracking-widest">또는</span>
          </div>
        </div>

        <div className="space-y-3 p-5 bg-gray-900/40 rounded-2xl border border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest text-left px-1">
            이메일 매직 링크
          </p>
          <input
            type="email"
            placeholder="이메일 주소 입력"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 bg-gray-800 rounded-xl px-4 text-sm text-white border border-transparent focus:border-blue-500 transition-all outline-none"
          />
          <button
            onClick={() => handleLogin('email')}
            disabled={!!loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading === 'email' ? '전송 중...' : '로그인 링크 받기'}
          </button>
        </div>

        <button
          onClick={() => router.push(next === '/dashboard' ? '/' : next)}
          className="text-gray-500 text-xs hover:text-white transition-colors underline pt-2"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">
          로그인 준비 중...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
