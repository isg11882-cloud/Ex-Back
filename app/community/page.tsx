'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'

const SUCCESS_STORIES = [
  {
    id: 1,
    title: "권태기 장기 연애, 3개월 만에 다시 잡았습니다.",
    category: "고프레임/신뢰감 하락",
    content: "처음에는 지침을 믿지 못했어요. 하지만 재이가 알려준 대로 침묵을 지키자 먼저 연락이 왔습니다...",
    author: "익명12",
    likes: 128,
    date: "2024.04.25"
  },
  {
    id: 2,
    title: "환승 이별인 줄 알았는데, 사실은 리바운드였습니다.",
    category: "환승이별/리바운드",
    content: "상대방의 SNS를 보며 매일 울던 제게 재이는 '기다림'이라는 전략을 주었습니다. 결과는 대성공!",
    author: "재회성공자",
    likes: 85,
    date: "2024.04.22"
  },
  {
    id: 3,
    title: "단호한 거절을 극복한 마법의 지침 문자 한 통",
    category: "저프레임/의지부족",
    content: "절대 안 돌아올 것 같던 그 사람. 지침 문자를 보내고 3일 뒤에 '보고 싶어'라고 답장이 왔어요.",
    author: "기적의주인공",
    likes: 210,
    date: "2024.04.20"
  }
]

const FORUM_POSTS = [
  { id: 1, title: "지금 1주일째 공백기인데 너무 힘들어요..", comments: 12, author: "미련곰탱이" },
  { id: 2, title: "상대방 프사가 바뀌었는데 의미 부여 안 해도 되겠죠?", comments: 45, author: "상상왕" },
  { id: 3, title: "지침 문자 보낸 후 반응 공유합니다 (스압)", comments: 31, author: "전략가" }
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'stories' | 'forum'>('stories')
  const router = useRouter()
  const { user } = useAppStore()

  const handleWriteClick = () => {
    if (!user) {
      if (confirm('로그인이 필요한 기능입니다. 로그인 페이지로 이동하시겠습니까?')) {
        router.push('/login')
      }
      return
    }
    alert('글쓰기 모달이 열립니다. (준비중)')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col max-w-md mx-auto pb-24 text-white">
      
      {/* Header */}
      <header className="px-6 pt-12 pb-6 border-b border-white/5 bg-gray-950/50 backdrop-blur-xl sticky top-0 z-50">
        <h1 className="text-2xl font-black italic mb-6">Community</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('stories')}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'stories' ? 'text-blue-400' : 'text-gray-500'}`}
          >
            성공 후기
            {activeTab === 'stories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
          </button>
          <button 
            onClick={() => setActiveTab('forum')}
            className={`pb-3 text-sm font-bold transition-all relative ${activeTab === 'forum' ? 'text-blue-400' : 'text-gray-500'}`}
          >
            익명 고민 광장
            {activeTab === 'forum' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
          </button>
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'stories' ? (
          <div className="space-y-6">
            <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4">
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-1">Success Archive</p>
              <p className="text-xs text-gray-300 leading-tight">검증된 재회 성공 사례를 읽고 희망을 얻으세요.</p>
            </div>

            {SUCCESS_STORIES.map(story => (
              <div key={story.id} className="group bg-gray-900 rounded-[2rem] p-6 border border-white/5 hover:border-blue-500/30 transition-all shadow-xl active:scale-[0.98]">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-white/5 text-gray-400 text-[10px] font-black rounded-full border border-white/5">
                    {story.category}
                  </span>
                  <span className="text-[10px] text-gray-600 font-medium">{story.date}</span>
                </div>
                <h3 className="text-lg font-black mb-3 leading-tight group-hover:text-blue-400 transition-colors">
                  {story.title}
                </h3>
                <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed">
                  {story.content}
                </p>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">👤</div>
                    <span className="text-xs text-gray-500 font-bold">{story.author}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-pink-500 font-bold">
                    <span>❤️</span> {story.likes}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-gray-400">최근 올라온 고민</h2>
              <button 
                onClick={handleWriteClick}
                className="px-4 py-2 bg-white hover:bg-gray-200 transition-colors text-black text-[10px] font-black rounded-full"
              >
                글쓰기
              </button>
            </div>

            {FORUM_POSTS.map(post => (
              <div key={post.id} className="bg-gray-900/50 rounded-2xl p-5 border border-white/5 flex justify-between items-center active:bg-gray-900 transition-all">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-200">{post.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-600 font-bold">{post.author}</span>
                    <span className="text-[10px] text-blue-500 font-black">💬 {post.comments}</span>
                  </div>
                </div>
                <div className="text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                </div>
              </div>
            ))}

            <div className="mt-12 p-8 text-center bg-gray-900/20 rounded-[2rem] border border-dashed border-white/10">
              <p className="text-gray-500 text-xs font-medium italic">
                당신의 고민을 익명으로 털어놓으세요.<br/>
                수많은 재회 동료들이 당신을 응원합니다.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
