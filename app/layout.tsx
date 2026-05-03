import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '재회 컨설팅 | AI 재회 전문 상담',
  description: '이별 후 재회를 위한 AI 전문 상담 서비스. 이별 유형 진단부터 단계별 미션까지.',
  openGraph: {
    title: '재회 컨설팅',
    description: 'AI 재회 전문 상담 서비스',
    type: 'website',
  },
}

import BottomNav from '@/components/layout/BottomNav'
import AuthObserver from '@/components/auth/AuthObserver'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`bg-gray-950 text-white min-h-screen`}>
        <AuthObserver />
        <main className="pb-24"> {/* 내비게이션 바 공간 확보 */}
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
