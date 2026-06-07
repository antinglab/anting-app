import React, { Suspense } from "react";
import Link from "next/link";
import QuizComponent from "@/components/quiz/QuizComponent";

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-neutral flex flex-col justify-between py-8 px-6 font-pretendard">
      {/* Top Header */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 border-b border-olive/10">
        <Link href="/landing" className="font-serifDisplay text-3xl tracking-wide text-olive hover:opacity-80 transition-opacity">
          anting
        </Link>
        <Link href="/landing" className="text-xs text-olive-gray hover:text-olive-dark transition-colors font-medium">
          진단 종료
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col justify-center py-8">
        <Suspense 
          fallback={
            <div className="max-w-xl mx-auto w-full bg-white p-8 rounded-[24px] shadow-[0_4px_24px_rgba(107,124,63,0.12)] border border-olive/10 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-10 h-10 border-4 border-olive border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-olive-gray font-light">진단 문항을 불러오는 중입니다...</p>
            </div>
          }
        >
          <QuizComponent />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-olive-gray/60 py-4">
        © 2025 Anting. All rights reserved.
      </footer>
    </div>
  );
}
