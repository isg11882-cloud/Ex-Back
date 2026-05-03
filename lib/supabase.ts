import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 브라우저용 클라이언트 (클라이언트 컴포넌트에서 사용)
export const createClientSideClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('[CRITICAL] Supabase URL or Anon Key is missing!')
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// 범용 클라이언트 (서버 사이드에서도 안전하게 초기화)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 유저 데이터 테이블 타입 정의 (필요 시 확장)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      diagnosis_results: {
        Row: {
          id: string
          user_id: string
          breakup_type: string
          phase: number
          summary: string
          created_at: string
        }
      }
    }
  }
}
