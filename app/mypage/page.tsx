'use client'

import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { clsx } from 'clsx'

export default function MyPage() {
  const router = useRouter()
  const { 
    nickname, 
    diagnosis, 
    totalPoints, 
    chatCount, 
    completedMissions, 
    emotions,
    resetAll 
  } = useAppStore()

  // 레벨 계산 (임시 로직: 200포인트당 1레벨)
  const level = Math.floor(totalPoints / 200) + 1
  const nextLevelProgress = (totalPoints % 200) / 200 * 100

  const recentMissions = [...completedMissions].reverse().slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-md mx-auto pb-24 text-white">
      
      {/* Header & Profile */}
      <div className="px-6 pt-12 pb-8 bg-gradient-to-b from-blue-900/20 to-gray-950 rounded-b-[3rem] border-b border-white/5">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl shadow-xl shadow-blue-500/20">
            👤
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-black">{nickname || '재회 희망자'}</h2>
              <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">LV.{level}</span>
            </div>
            <p className="text-gray-400 text-xs">
              {diagnosis ? `${diagnosis.title} 유형 · PHASE ${diagnosis.phase}` : '진단 전입니다.'}
            </p>
          </div>
        </div>

        {/* Level Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-widest px-1">
            <span>Next Level</span>
            <span>{Math.round(nextLevelProgress)}%</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-1000" 
              style={{ width: `${nextLevelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="px-6 -mt-6 grid grid-cols-3 gap-3 mb-8">
        {[
          { label: '포인트', value: totalPoints, unit: 'pt', icon: '💎' },
          { label: '상담', value: chatCount, unit: '회', icon: '🤖' },
          { label: '미션', value: completedMissions.length, unit: '개', icon: '🎯' },
        ].map(stat => (
          <div key={stat.label} className="bg-gray-900/80 backdrop-blur border border-white/5 p-3 rounded-2xl text-center shadow-lg">
            <div className="text-lg mb-1">{stat.icon}</div>
            <div className="text-sm font-black text-white">{stat.value}<span className="text-[10px] ml-0.5 text-gray-500">{stat.unit}</span></div>
            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Emotion Graph Section */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-end mb-4 px-1">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <span>📈</span> 감정 회복 트래킹
          </h3>
          <span className="text-[10px] text-gray-500 font-medium">최근 7일 기준</span>
        </div>
        <div className="glass p-5 rounded-3xl border border-white/5 min-h-[160px] flex items-end justify-between gap-2">
          {emotions.length > 0 ? (
            emotions.slice(-7).map((e, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-1000"
                  style={{ height: `${e.score * 20}%`, minHeight: '4px' }}
                />
                <span className="text-[8px] text-gray-500 font-bold">{e.date.split('-').slice(1).join('/')}</span>
              </div>
            ))
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center py-4 text-gray-600">
              <span className="text-2xl mb-2">📊</span>
              <p className="text-[10px] text-center">아직 감정 기록이 없습니다.<br/>매일 체크인하여 변화를 확인하세요.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 mb-8">
        <h3 className="font-bold text-sm mb-4 px-1 flex items-center gap-2">
          <span>🔔</span> 최근 완료 미션
        </h3>
        <div className="space-y-3">
          {recentMissions.length > 0 ? (
            recentMissions.map((m, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-900/50 p-3 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 text-sm">✅</div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-white leading-tight">미션 완료</div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{new Date(m.completedAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
              <p className="text-[10px] text-gray-500">완료한 미션이 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings / Danger Zone */}
      <div className="px-6 mt-4">
        <button 
          onClick={() => {
            if (confirm('모든 진단 데이터와 상담 내역이 삭제됩니다. 정말 초기화하시겠습니까?')) {
              resetAll()
              router.push('/')
            }
          }}
          className="w-full py-4 text-xs font-bold text-red-500/70 hover:text-red-500 transition-colors border border-red-500/10 rounded-2xl bg-red-500/5"
        >
          서비스 데이터 초기화
        </button>
      </div>
    </div>
  )
}
