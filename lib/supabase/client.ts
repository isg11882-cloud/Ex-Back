/**
 * 브라우저(Client Component)용 Supabase 클라이언트
 *
 * - createBrowserClient: 자동으로 document.cookie 를 읽고 써서
 *   Supabase 인증 세션을 동기화합니다. 이 클라이언트로 호출하면
 *   RLS 정책의 auth.uid() 가 정상 동작합니다.
 * - 싱글톤: 한 탭에 1개만 유지하여 onAuthStateChange 리스너 중복을 방지.
 *
 * 사용처: 'use client' 컴포넌트, 클라이언트 측 모듈(zustand, hooks).
 * 절대 Server Component / Route Handler 에서 사용하지 마세요 → server.ts 사용.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let _client: SupabaseClient<Database> | null = null

export function createSupabaseBrowser(): SupabaseClient<Database> {
  if (_client) return _client

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // 빌드 타임 falls-through 방지: 명확한 런타임 에러로
    throw new Error(
      '[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다.',
    )
  }

  _client = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
  return _client
}
