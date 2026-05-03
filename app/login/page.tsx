'use client'

import { createClientSideClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientSideClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [isSent, setIsSent] = useState(false)

  const handleLogin = async (provider: 'google' | 'kakao' | 'email') => {
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
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      if (error) {
        console.error('[Login Error]', error)
        alert('로그인 오류 발생:\n' + JSON.stringify(error, null, 2))
      } else {
        setIsSent(true)
      }
      setLoading(null)
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: provider === 'kakao' ? {
          scope: 'profile_nickname,profile_image'
        } : undefined
      },
    })
    
    if (error) {
      alert('로그인 오류: ' + error.message)
      setLoading(null)
    }
  }

  // 이메일 전송 성공 화면
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
              <span className="text-blue-400 font-bold underline">{email}</span> 주소로<br/>
              로그인 링크를 보냈습니다.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Quick Open</p>
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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-10 text-center">
        
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">
            🤝
          </div>
          <h1 className="text-2xl font-black text-white">반가워요! 다시 시작해볼까요?</h1>
          <p className="text-gray-400 text-xs">안전하게 데이터를 동기화하고 상담을 이어가세요.</p>
        </div>

        {/* Email Login (Quick Test) */}
        <div className="space-y-3 p-6 bg-gray-900/50 rounded-3xl border border-white/5">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 text-left px-1">Email Login</p>
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

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-gray-950 px-2 text-gray-500 font-bold tracking-widest">Social Login</span></div>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4">
          <button 
            onClick={() => handleLogin('kakao')}
            className="w-full transition-all active:scale-95 flex justify-center"
          >
            <img 
              src="/images/kakao_login.png" 
              alt="카카오 로그인" 
              className="w-full h-auto object-contain rounded-xl shadow-lg shadow-yellow-500/10"
            />
          </button>

          <button 
            onClick={() => handleLogin('google')}
            className="w-full h-14 bg-white text-gray-900 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all border border-gray-200 active:scale-95 shadow-sm"
          >
            <span className="text-lg">G</span> 구글 계정으로 로그인
          </button>
        </div>

        <button 
          onClick={() => router.push('/')}
          className="text-gray-500 text-xs hover:text-white transition-colors underline"
        >
          나중에 할게요
        </button>
      </div>
    </div>
  )
}
