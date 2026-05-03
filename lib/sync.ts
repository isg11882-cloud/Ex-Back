import { supabase } from './supabase'
import { useAppStore } from './store'

/**
 * 로컬 데이터를 Supabase DB로 마이그레이션하는 유틸리티
 */
export async function syncLocalDataToSupabase(userId: string) {
  const state = useAppStore.getState()
  
  try {
    // 1. 프로필 업데이트 (닉네임, 포인트 등)
    if (state.nickname || state.totalPoints > 0) {
      await supabase.from('profiles').upsert({
        id: userId,
        nickname: state.nickname,
        total_points: state.totalPoints,
        chat_count: state.chatCount,
        current_phase: state.diagnosis?.phase || 1,
        updated_at: new Date().toISOString()
      })
    }

    // 2. 진단 결과 업로드
    if (state.diagnosis) {
      await supabase.from('diagnosis_results').insert({
        user_id: userId,
        breakup_type: state.diagnosis.breakupType,
        phase: state.diagnosis.phase,
        title: state.diagnosis.title,
        summary: state.diagnosis.summary,
        success_rate: state.diagnosis.successRate,
        days_since_breakup: state.diagnosis.daysSinceBreakup
      })
    }

    // 3. 채팅 내역 업로드
    if (state.chatHistory.length > 0) {
      const historyToUpload = state.chatHistory.map(msg => ({
        user_id: userId,
        role: msg.role,
        content: msg.content,
        is_error: msg.isError || false,
        created_at: new Date().toISOString() // 실제 시간은 정확하지 않을 수 있음
      }))
      await supabase.from('chat_history').insert(historyToUpload)
    }

    // 4. 진행 중인 미션 업로드
    if (state.activeMissions.length > 0) {
      const missionsToUpload = state.activeMissions.map(m => ({
        user_id: userId,
        mission_id: m.missionId,
        title: m.title,
        status: 'active'
      }))
      await supabase.from('user_missions').insert(missionsToUpload)
    }

    console.log('[Sync Success] Local data migrated to Supabase.')
    return true
  } catch (error) {
    console.error('[Sync Error] Failed to migrate data:', error)
    return false
  }
}

/**
 * 서버 데이터를 로컬 스토리지로 불러오는 유틸리티 (로그인 시)
 */
export async function fetchUserDataToLocal(userId: string) {
  try {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (profile) {
      useAppStore.setState({
        nickname: profile.nickname || '',
        totalPoints: profile.total_points || 0,
        chatCount: profile.chat_count || 0
      })
    }
    // 추가적인 데이터(진단, 미션 등)도 필요시 여기서 fetch
  } catch (err) {
    console.error('[Fetch Error] Failed to load user data:', err)
  }
}
