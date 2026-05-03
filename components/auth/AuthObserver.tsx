'use client'

import { useEffect } from 'react'
import { createClientSideClient } from '@/lib/supabase'
import { syncLocalDataToSupabase, fetchUserDataToLocal } from '@/lib/sync'
import { useAppStore } from '@/lib/store'

export default function AuthObserver() {
  const supabase = createClientSideClient()
  const { setUser } = useAppStore()

  useEffect(() => {
    // 1. 현재 세션 확인 및 감시
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] User signed in:', session.user.id)
        
        // 로그인 성공 시 데이터 마이그레이션 실행
        await syncLocalDataToSupabase(session.user.id)
        // 서버에서 최신 프로필 정보 불러오기
        await fetchUserDataToLocal(session.user.id)
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out')
        // 필요 시 로그아웃 처리 (로컬 스토리지 비우기는 선택)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return null // 화면에 보이지 않는 로직 전용 컴포넌트
}
