'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

const QUESTIONS = [
  {
    id: 1,
    text: '이별을 먼저 통보한 사람은 누구인가요?',
    options: [
      { id: 1, text: '상대방이 통보했다' },
      { id: 2, text: '내가 먼저 했다' },
      { id: 3, text: '서로 합의해서 헤어졌다' },
      { id: 4, text: '상황상 어쩔 수 없이 멀어졌다' },
    ]
  },
  {
    id: 2,
    text: '이별의 주된 원인은 무엇인가요?',
    options: [
      { id: 1, text: '감정이 식었다 / 지쳤다' },
      { id: 2, text: '반복되는 다툼과 성격 차이' },
      { id: 3, text: '상대방에게 다른 사람이 생겼다' },
      { id: 4, text: '거리, 환경 등 외부 요인' },
    ]
  },
  {
    id: 3,
    text: '이별 전 분위기는 어땠나요?',
    options: [
      { id: 1, text: '서서히 연락이 줄고 멀어졌다' },
      { id: 2, text: '크게 다투고 갑자기 헤어졌다' },
      { id: 3, text: '상대방이 거짓말이나 잘못을 했다' },
      { id: 4, text: '어쩔 수 없는 상황에 눈물 바다였다' },
    ]
  },
  {
    id: 4,
    text: '현재 상대방과 연락이 되고 있나요?',
    options: [
      { id: 1, text: '완전히 차단되어 있다' },
      { id: 2, text: '가끔 업무적/필수적 연락만 한다' },
      { id: 3, text: '내가 매달려서 가끔 받아준다' },
      { id: 4, text: '안부 정도는 편하게 주고받는다' },
    ]
  },
  {
    id: 5,
    text: '상대방의 SNS 활동은 어떤가요?',
    options: [
      { id: 1, text: '새 연인이나 썸 타는 티가 난다' },
      { id: 2, text: '내 흔적을 다 지우고 잘 지낸다' },
      { id: 3, text: '평소와 다름없이 유지 중이다' },
      { id: 4, text: '힘든 티를 내거나 비공개로 바꿨다' },
    ]
  },
  {
    id: 6,
    text: '연애 중 다툼의 빈도는 어땠나요?',
    options: [
      { id: 1, text: '거의 싸우지 않았다' },
      { id: 2, text: '가끔 크게 싸웠다' },
      { id: 3, text: '사소한 일로 자주 싸웠다' },
      { id: 4, text: '갈등을 회피하고 억누르는 편이었다' },
    ]
  },
  {
    id: 7,
    text: '이별 후 얼마나 지났나요?',
    options: [
      { id: 1, text: '1주일 이내' },
      { id: 2, text: '1주 ~ 1개월' },
      { id: 3, text: '1개월 ~ 3개월' },
      { id: 4, text: '3개월 이상' },
    ]
  },
  {
    id: 8,
    text: '상대방의 현재 감정은 어떨 것 같나요?',
    options: [
      { id: 1, text: '단호하고 냉정하다' },
      { id: 2, text: '짜증과 분노가 남아있다' },
      { id: 3, text: '다른 사람에게 마음이 쏠려 있다' },
      { id: 4, text: '미안함이나 죄책감을 느끼고 있다' },
    ]
  },
  {
    id: 9,
    text: '재회에 대한 나의 의지는 어느 정도인가요?',
    options: [
      { id: 1, text: '무슨 수를 써도 반드시 잡고 싶다' },
      { id: 2, text: '잡아보고 안 되면 포기하려고 한다' },
      { id: 3, text: '내가 너무 힘들어 벗어나고 싶다' },
      { id: 4, text: '객관적인 판단을 받아보고 싶다' },
    ]
  }
]

export default function DiagnosisPage() {
  const router = useRouter()
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const setDiagnosis = useAppStore(s => s.setDiagnosis)
  
  const question = QUESTIONS[currentQ]
  const progress = Math.round(((currentQ + 1) / QUESTIONS.length) * 100)

  const handleSelect = (optionId: number) => {
    setAnswers(prev => ({ ...prev, [question.id]: optionId }))
  }

  const handleNext = async () => {
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      await submitDiagnosis()
    }
  }

  const handlePrev = () => {
    if (currentQ > 0) setCurrentQ(prev => prev - 1)
  }

  const submitDiagnosis = async () => {
    setIsSubmitting(true)
    
    // 이별 후 경과일 근사치 계산 (Q7 기반)
    const daysMap = { 1: 3, 2: 15, 3: 45, 4: 100 }
    const daysSinceBreakup = daysMap[answers[7] as keyof typeof daysMap] || 0

    try {
      const res = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, daysSinceBreakup })
      })

      if (!res.ok) throw new Error('API Error')
      
      const result = await res.json()
      
      // Zustand 스토어에 결과 저장
      setDiagnosis({
        breakupType: result.breakupType,
        scores: result.scores,
        phase: result.phase,
        title: result.title,
        summary: result.summary,
        successRate: result.successRate,
        daysSinceBreakup: result.daysSinceBreakup
      })
      
      // 결과 페이지로 이동
      router.push('/diagnosis/result')
      
    } catch (error) {
      console.error(error)
      alert('진단 중 오류가 발생했습니다. 다시 시도해 주세요.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-md mx-auto">
      
      {/* Top Bar */}
      <div className="flex items-center px-4 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <button onClick={() => router.push('/')} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-full bg-gray-800 transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="ml-3 font-bold text-lg text-white">현황 진단</h2>
      </div>

      {/* Progress */}
      <div className="px-5 py-4 bg-gray-900/30">
        <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
          <span>진단 {currentQ + 1} / {QUESTIONS.length}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="flex-1 p-5 overflow-y-auto">
        <div className="glass p-6 rounded-2xl shadow-lg border border-gray-800/50 fade-in-up" key={currentQ}>
          <div className="text-xs font-bold text-blue-400 mb-3 tracking-widest font-mono">QUESTION {String(currentQ + 1).padStart(2, '0')}</div>
          <h3 className="text-xl font-bold text-white mb-6 leading-relaxed">
            {question.text}
          </h3>

          <div className="space-y-3">
            {question.options.map(opt => {
              const isSelected = answers[question.id] === opt.id
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 text-sm font-medium ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50' 
                      : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800'
                  }`}
                >
                  {opt.text}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="p-5 flex gap-3 bg-gray-900/80 backdrop-blur border-t border-gray-800">
        {currentQ > 0 && (
          <button 
            onClick={handlePrev}
            className="px-6 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white font-medium hover:bg-gray-700 transition w-1/3"
            disabled={isSubmitting}
          >
            이전
          </button>
        )}
        <button 
          onClick={handleNext}
          disabled={!answers[question.id] || isSubmitting}
          className={`py-3 rounded-xl font-bold transition flex-1 flex justify-center items-center ${
            answers[question.id] && !isSubmitting
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : currentQ === QUESTIONS.length - 1 ? (
            '진단 결과 보기 →'
          ) : (
            '다음 →'
          )}
        </button>
      </div>

    </div>
  )
}
