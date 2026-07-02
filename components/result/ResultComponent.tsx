"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { UserType, Answer, ResultType, ResultData } from "@/types";
import { analyzeQuizResult } from "@/lib/quiz-analyzer";
import { logEvent } from "@/lib/analytics";
import { CheckCircle2, ChevronRight, RefreshCw, Share2 } from "lucide-react";
import Link from "next/link";

const RESULT_DATA_MAP: Record<ResultType, ResultData> = {
  roi_anxiety: {
    type: "roi_anxiety",
    userType: "brand",
    emoji: "📊",
    title: "ROI 불안형",
    description: "마케팅 예산 대비 실질적인 성과 측정과 예산 낭비에 대한 걱정이 가장 크신 유형입니다. 정량적인 성과 보고서와 안전한 테스트 모델이 필요합니다.",
    solutions: [
      "캠페인 완료 후 자동으로 제공되는 정밀 성과 리포트",
      "초기 리스크를 최소화하는 소규모 예산 테스트 매칭 패키지",
      "제작된 인플루언서 콘텐츠의 자사 마케팅 2차 재활용 프로세스 제공"
    ]
  },
  operation_burden: {
    type: "operation_burden",
    userType: "brand",
    emoji: "⚙️",
    title: "운영 부담형",
    description: "인플루언서 섭외, 가이드라인 전달, 일정 조율 및 피드백 전달까지의 복잡한 운영 업무에 많은 피로를 느끼고 계신 유형입니다.",
    solutions: [
      "섭외부터 최종 보고까지 웹사이트 내 클릭 몇 번으로 진행되는 원스톱 캠페인 관리",
      "캠페인 가이드라인 미준수 및 누락 사항을 필터링해주는 AI 콘텐츠 자동 검수",
      "일정 리마인드 및 피드백 소통을 대신해주는 카카오 알림톡 자동 안내 솔루션"
    ]
  },
  quality_concern: {
    type: "quality_concern",
    userType: "brand",
    emoji: "✨",
    title: "품질 고민형",
    description: "협업을 진행하는 인플루언서의 콘텐츠 퀄리티 관리와 브랜드 이미지 부합 여부에 가장 깊은 고민이 있는 유형입니다.",
    solutions: [
      "AI 가이드 파싱 기술로 콘텐츠 최종 검사 전 가이드 준수 여부를 자동 체크리스트화",
      "카테고리, 지역, 연령대, 실제 팔로워 반응률을 기반으로 한 초정밀 인플루언서 매칭",
      "수십 건의 성공 캠페인 데이터를 기반으로 설계된 고효율 가이드 템플릿 제공"
    ]
  },
  monetization_ready: {
    type: "monetization_ready",
    userType: "influencer",
    emoji: "💰",
    title: "수익화 준비형",
    description: "SNS 채널에 팔로워나 조회수는 어느 정도 활성화되어 있으나, 실질적인 비즈니스 협업 기회 및 수익화 경로를 찾고 계신 유형입니다.",
    solutions: [
      "팔로워 1,000명 이상이면 누구나 바로 참여할 수 있는 다양한 카테고리의 체험단",
      "본인의 추천 링크/코드를 통한 판매 발생 시 마일리지나 캐시백을 돌려주는 자동 페이백 시스템",
      "수익금을 복잡한 서류 절차 없이 즉각 정산받을 수 있는 간편 포인트 정산 기능"
    ]
  },
  content_growth: {
    type: "content_growth",
    userType: "influencer",
    emoji: "🚀",
    title: "콘텐츠 성장형",
    description: "콘텐츠 제작의 방향성 수립, 기획 아이디어 고갈, 그리고 시선을 끄는 비주얼 제작 등 콘텐츠 자체의 완성도를 높이고자 하는 유형입니다.",
    solutions: [
      "입력한 키워드 기반으로 해시태그와 포스팅 캡션을 자동 제안하는 AI 포스팅 초안 작성기",
      "다양한 브랜드의 실제 트렌디한 제품들을 직접 협찬받고 경험해보며 늘어나는 새로운 콘텐츠 소재",
      "사진 보정 및 시각 디자인이 편리해지는 고품질 AI 이미지/그래픽 추천 기능"
    ]
  },
  beginner: {
    type: "beginner",
    userType: "influencer",
    emoji: "🌱",
    title: "입문 탐색형",
    description: "인플루언서 활동이나 브랜드 협업을 이제 막 시작해 과정이 낯설고, 나에게 잘 맞는 협업 형태를 탐색하고 싶어 하는 유형입니다.",
    solutions: [
      "카테고리 및 내 활동 지역 필터를 통해 초보자도 부담 없이 신청할 수 있는 로컬/제품 캠페인 탐색",
      "본인의 SNS 채널(인스타그램, 블로그 등) 연동 한 번으로 복잡한 절차 없이 간편 매칭 신청",
      "내 채널의 성장 속도와 카테고리에 알맞은 캠페인을 자동으로 골라주는 우선 추천 알고리즘"
    ]
  }
};

export default function ResultComponent() {
  const searchParams = useSearchParams();
  
  const typeParam = searchParams.get("type") as UserType | null;
  const answersParam = searchParams.get("answers");

  // Determine userType and answers
  const userType: UserType = typeParam === "influencer" ? "influencer" : "brand";
  
  let answers: Answer[] = [];
  if (answersParam) {
    answers = answersParam.split("").filter(a => a === "A" || a === "B") as Answer[];
  }

  // Handle case where answers are less than 5 by setting dummy answers to prevent crashes
  while (answers.length < 5) {
    answers.push("A");
  }

  const resultType = analyzeQuizResult(userType, answers);
  const resultData = RESULT_DATA_MAP[resultType];

  React.useEffect(() => {
    logEvent('quiz_complete', {
      userType,
      resultType
    });
  }, [userType, resultType]);

  return (
    <div className="max-w-xl mx-auto w-full space-y-8">
      {/* Dynamic styles for staggered animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          opacity: 0;
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Result Card (Top) */}
      <div className="bg-gradient-to-b from-olive to-olive-dark text-white rounded-[32px] p-8 md:p-10 text-center shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,184,74,0.12),transparent_40%)]" />
        
        <span className="text-[72px] block mb-6 animate-bounce" role="img" aria-label={resultData.title}>
          {resultData.emoji}
        </span>
        
        <span className="text-accent font-semibold tracking-wider text-xs uppercase block mb-2 font-mono">
          {userType === "brand" ? "Brand Solution" : "Influencer Solution"}
        </span>
        
        <h1 className="font-serifDisplay text-3xl md:text-4xl font-extrabold tracking-wide text-white mb-4">
          {resultData.title}
        </h1>
        
        <p className="font-pretendard text-sm md:text-base text-white/80 leading-relaxed max-w-sm mx-auto font-light">
          {resultData.description}
        </p>
      </div>

      {/* Solutions List */}
      <div className="space-y-6">
        <div className="px-1">
          <h3 className="text-sm font-bold text-olive-dark uppercase tracking-wider">
            앤팅이 제시하는 해결책
          </h3>
        </div>
        
        <div className="space-y-4">
          {resultData.solutions.map((solution, index) => (
            <div 
              key={index}
              className="bg-white p-5 rounded-2xl border-l-4 border-olive border border-olive/10 shadow-sm flex gap-4 items-start animate-fade-in-up"
              style={{ animationDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="w-6 h-6 bg-olive-pale/30 rounded-full flex items-center justify-center flex-shrink-0 text-olive mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-sm md:text-base text-olive-dark font-medium leading-relaxed">
                {solution}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Join CTA Section */}
      <div className="bg-olive-pale rounded-[24px] p-8 text-center border border-olive/10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/20 rounded-full blur-xl" />
        
        <h4 className="text-lg md:text-xl font-extrabold text-olive-dark mb-2">
          앤팅 크루에 합류해서 직접 경험해보세요
        </h4>
        <p className="text-xs md:text-sm text-olive-dark/70 mb-6 font-light">
          가입은 1분이면 충분해요 ✓
        </p>
        
        <Link 
          href={`/register?type=${userType}&result=${resultData.type}`}
          className="inline-flex w-full bg-olive text-white font-bold rounded-full h-14 items-center justify-center hover:bg-olive-dark transition-all duration-300 shadow-md group"
        >
          앤팅크루 가입하기 
          <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-4 justify-center items-center pt-2">
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("진단 결과 링크가 복사되었습니다!");
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-olive/20 hover:border-olive text-xs font-semibold text-olive-dark transition-all"
        >
          <Share2 className="w-4 h-4 text-olive" /> 결과 공유하기
        </button>
        <Link 
          href="/quiz"
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-olive/20 hover:border-olive text-xs font-semibold text-olive-dark transition-all"
        >
          <RefreshCw className="w-4 h-4 text-olive" /> 테스트 다시하기
        </Link>
      </div>
    </div>
  );
}
