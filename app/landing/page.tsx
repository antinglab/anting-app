"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  PenTool, 
  BarChart3, 
  ChevronRight 
} from "lucide-react";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-neutral font-pretendard selection:bg-olive/20 selection:text-olive-dark">
      {/* Header */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-olive-dark/90 backdrop-blur-md py-4 shadow-lg border-b border-white/10" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/landing" className="font-serifDisplay text-3xl tracking-wide text-white hover:opacity-90 transition-opacity">
            anting
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/quiz" 
              className="text-white hover:text-accent text-sm font-semibold transition-colors hidden sm:block"
            >
              자가진단
            </Link>
            <Link 
              href="/quiz?type=brand" 
              className="bg-accent text-olive-dark text-xs font-bold px-5 py-2.5 rounded-full hover:bg-white hover:text-olive transition-all duration-300 shadow-sm"
            >
              시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-olive to-olive-dark text-white pt-36 pb-24 md:pt-48 md:pb-36 overflow-hidden">
        {/* Subtle Decorative Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,184,74,0.15),transparent_45%)]" />
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-olive-light/10 blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-accent text-xs md:text-sm font-semibold mb-8 animate-fade-in backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            <span>AI 원스톱 마케팅 플랫폼</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
            광고주엔 고객을,<br />
            인플루언서엔 수익을.
          </h1>

          <p className="text-xl md:text-2xl font-medium mt-4 leading-relaxed text-white">
            체험단, SNS 브랜딩, 쇼핑커머스,<br />
            콘텐츠 자동 생성까지 한곳에서.
          </p>

          <p className="text-sm md:text-base mt-6 leading-relaxed text-white/80">
            어떤 마케팅 고민을 가지고 계신가요?<br />
            1분 만에 맞춤 솔루션과 가이드를 추천받아 보세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto mt-8">
            <Link 
              href="/quiz?type=brand" 
              className="w-full sm:w-auto bg-accent text-olive-dark font-bold rounded-full h-14 px-8 flex items-center justify-center gap-2 hover:bg-white hover:text-olive-dark transition-all duration-300 shadow-md group"
            >
              광고주로 시작하기 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/quiz?type=influencer" 
              className="w-full sm:w-auto border-2 border-white text-white font-bold rounded-full h-14 px-8 flex items-center justify-center hover:bg-white hover:text-olive-dark transition-all duration-300"
            >
              인플루언서로 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* Service Introduction Section */}
      <section className="bg-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
            <h2 className="text-3xl md:text-4xl font-extrabold text-olive-dark mb-4 tracking-tight">
              앤팅이 해결합니다
            </h2>
            <p className="text-base md:text-lg text-olive-gray font-light">
              합리적인 비용으로 성공적인 마케팅을,<br />
              팔로워 수가 적어도 안정적인 수익을.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Card 1 */}
            <div className="bg-olive-pale rounded-[24px] p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-olive/10 group">
              <div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-olive" />
                </div>
                <h3 className="text-xl font-bold text-olive-dark mb-1">광고주 마케팅 솔루션</h3>
                <div className="text-xs text-olive/80 font-bold mb-4">🎯 마케팅 원스톱 AI 자동화 플랫폼</div>
                <p className="text-sm md:text-base text-olive-dark/85 leading-relaxed font-light">
                  체험단·SNS·콘텐츠·CS·쇼핑을<br />
                  1개 플랫폼에서.<br />
                  마케팅 비용 최대 80% 절감.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-olive/10 flex items-center text-xs font-semibold text-olive-dark/70">
                자세히 알아보기 <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-olive-pale rounded-[24px] p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-olive/10 group">
              <div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <PenTool className="w-7 h-7 text-olive" />
                </div>
                <h3 className="text-xl font-bold text-olive-dark mb-1">인플루언서 수익 솔루션</h3>
                <div className="text-xs text-olive/80 font-bold mb-4">✍️ 팔로워 무관 안정적인 수익 시스템</div>
                <p className="text-sm md:text-base text-olive-dark/85 leading-relaxed font-light">
                  팔로워 수 제한 없이 캠페인 참여,<br />
                  AI 콘텐츠 생성으로 제작 시간 80% 단축,<br />
                  판매자 코드로 구매 시 자동 페이백.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-olive/10 flex items-center text-xs font-semibold text-olive-dark/70">
                자세히 알아보기 <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-olive-pale rounded-[24px] p-8 md:p-10 flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-olive/10 group">
              <div>
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-7 h-7 text-olive" />
                </div>
                <h3 className="text-xl font-bold text-olive-dark mb-1">앤팅 클래스</h3>
                <div className="text-xs text-olive/80 font-bold mb-4">📊 전 과정 무료</div>
                <p className="text-sm md:text-base text-olive-dark/85 leading-relaxed font-light">
                  네이버·인스타 상단 노출 노하우,<br />
                  단계별 캠페인 활동 가이드,<br />
                  AI 툴 활용법.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-olive/10 flex items-center text-xs font-semibold text-olive-dark/70">
                자세히 알아보기 <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Diagnosis CTA Section */}
      <section className="bg-olive-pale py-20 md:py-28 relative overflow-hidden">
        {/* Subtle Decorative elements for the CTA section */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-olive-light/20 blur-2xl" />
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-white/20 blur-2xl" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-olive-dark mb-6 tracking-tight leading-tight">
            당신의 상황을 진단해드릴게요
          </h2>
          <p className="text-base md:text-lg text-olive-dark/85 max-w-xl mx-auto mb-10 leading-relaxed font-light">
            어떤 마케팅 고민을 가지고 계신가요?<br />
            1분 만에 맞춤 솔루션과 가이드를 추천받아 보세요.
          </p>
          <Link 
            href="/quiz" 
            className="inline-flex bg-olive text-white font-bold rounded-full h-14 px-10 items-center justify-center hover:bg-olive-dark transition-all duration-300 shadow-md group"
          >
            지금 진단받기 
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-olive-dark text-white py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="text-center md:text-left">
              <span className="font-serifDisplay text-3xl tracking-wide block mb-3">anting</span>
              <p className="text-xs md:text-sm text-neutral/60 font-light">
                마케팅의 내일을 여는 올인원 브랜드-인플루언서 매칭 플랫폼
              </p>
            </div>
            <div className="flex gap-6 text-xs md:text-sm text-neutral/50 font-light">
              <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
              <span className="text-neutral/20">|</span>
              <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
              <span className="text-neutral/20">|</span>
              <Link href="/contact" className="hover:text-white transition-colors">고객지원</Link>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral/40 font-light">
            <p>© 2025 Anting. All rights reserved.</p>
            <p className="text-center md:text-right">
              주식회사 앤팅 | 대표이사: 홍길동 | 사업자등록번호: 123-45-67890 | 서울시 강남구 테헤란로 123
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
