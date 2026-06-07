"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuizQuestion, UserType, Answer } from "@/types";
import { HelpCircle, Building2, UserCircle2 } from "lucide-react";
import Link from "next/link";

const BRAND_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "마케팅 예산이 생겼을 때 가장 먼저 드는 걱정은?",
    optionA: { label: "이 돈 낭비되면 어떡하지?", typeCode: "A" },
    optionB: { label: "어디에 써야 할지 모르겠다", typeCode: "B" }
  },
  {
    id: 2,
    question: "지금 우리 브랜드 SNS 상황은?",
    optionA: { label: "계정은 있는데 반응이 없다", typeCode: "A" },
    optionB: { label: "SNS 마케팅 자체를 시작 못 했다", typeCode: "B" }
  },
  {
    id: 3,
    question: "인플루언서 마케팅을 생각해봤을 때?",
    optionA: { label: "연락하고 선정하는 과정이 너무 복잡하다", typeCode: "A" },
    optionB: { label: "비용 대비 효과를 모르겠다", typeCode: "B" }
  },
  {
    id: 4,
    question: "캠페인 콘텐츠 관련 가장 큰 고민은?",
    optionA: { label: "가이드를 줘도 원하는 퀄리티가 안 나온다", typeCode: "A" },
    optionB: { label: "콘텐츠 만드는 과정이 번거롭다", typeCode: "B" }
  },
  {
    id: 5,
    question: "마케팅 담당자로서 가장 아쉬운 점은?",
    optionA: { label: "결과가 눈에 보이지 않는다", typeCode: "A" },
    optionB: { label: "혼자 다 해야 해서 지친다", typeCode: "B" }
  }
];

const INFLUENCER_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "SNS 운영하면서 가장 힘든 점은?",
    optionA: { label: "콘텐츠 아이디어가 고갈된다", typeCode: "A" },
    optionB: { label: "열심히 올려도 팔로워가 안 는다", typeCode: "B" }
  },
  {
    id: 2,
    question: "협찬/체험단에 대해 솔직히 어떻게 생각해?",
    optionA: { label: "받고 싶은데 어디서 찾는지 모르겠다", typeCode: "A" },
    optionB: { label: "신청해봤는데 떨어지기만 한다", typeCode: "B" }
  },
  {
    id: 3,
    question: "브랜드 협업 시 가장 불편한 점은?",
    optionA: { label: "요구사항이 너무 많고 복잡하다", typeCode: "A" },
    optionB: { label: "결과물 만드는 게 시간이 오래 걸린다", typeCode: "B" }
  },
  {
    id: 4,
    question: "수익화에 대한 고민이 있다면?",
    optionA: { label: "팔로워는 있는데 수익이 없다", typeCode: "A" },
    optionB: { label: "어떻게 시작해야 할지 막막하다", typeCode: "B" }
  },
  {
    id: 5,
    question: "지금 가장 원하는 것은?",
    optionA: { label: "내 채널에 맞는 브랜드를 만나고 싶다", typeCode: "A" },
    optionB: { label: "콘텐츠 퀄리티를 올리고 싶다", typeCode: "B" }
  }
];

export default function QuizComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Set initial state from query parameter if present
  const typeParam = searchParams.get("type") as UserType | null;
  const [userType, setUserType] = useState<UserType | null>(
    typeParam === "brand" || typeParam === "influencer" ? typeParam : null
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const [animationClass, setAnimationClass] = useState("animate-slide-in");

  const questions = userType === "brand" ? BRAND_QUESTIONS : INFLUENCER_QUESTIONS;
  const currentQuestion = questions[currentIndex];

  const handleSelectType = (type: UserType) => {
    setUserType(type);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (answer: Answer) => {
    if (selectedAnswer) return; // Prevent double clicks
    
    setSelectedAnswer(answer);
    
    // Trigger fadeOut animation after showing selected state briefly
    setTimeout(() => {
      setAnimationClass("animate-fade-out");
      
      setTimeout(() => {
        const newAnswers = [...answers, answer];
        setAnswers(newAnswers);
        setSelectedAnswer(null);

        if (currentIndex < 4) {
          setCurrentIndex(currentIndex + 1);
          setAnimationClass("animate-slide-in");
        } else {
          // Quiz completed -> Analyze and Redirect
          const answersString = newAnswers.join("");
          router.push(`/result?type=${userType}&answers=${answersString}`);
        }
      }, 300); // Wait for fade-out to complete
    }, 400); // Show selected state for 400ms
  };

  // If userType is not selected, show the selection screen
  if (!userType) {
    return (
      <div className="max-w-xl mx-auto w-full bg-white p-8 md:p-12 rounded-[24px] shadow-[0_4px_24px_rgba(107,124,63,0.12)] border border-olive/10 space-y-8 my-auto">
        <div className="space-y-3 text-center">
          <div className="w-14 h-14 bg-olive/10 text-olive flex items-center justify-center rounded-full mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-olive-dark">페인포인트 진단 시작하기</h2>
          <p className="text-sm text-olive-gray max-w-sm mx-auto font-light">
            정확한 진단을 위해 먼저 본인의 회원 유형을 선택해 주세요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleSelectType("brand")}
            className="group p-6 rounded-2xl border-2 border-olive/20 hover:border-olive hover:bg-olive/5 transition-all text-left flex flex-col justify-between h-48"
          >
            <div className="w-12 h-12 bg-olive/10 text-olive group-hover:bg-olive group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-accent font-serifDisplay text-lg font-bold block mb-1">Brand</span>
              <h3 className="text-lg font-bold text-olive-dark">광고주로 시작하기</h3>
              <p className="text-xs text-olive-gray mt-1">마케팅이 막막한 브랜드/기업</p>
            </div>
          </button>

          <button
            onClick={() => handleSelectType("influencer")}
            className="group p-6 rounded-2xl border-2 border-olive/20 hover:border-olive hover:bg-olive/5 transition-all text-left flex flex-col justify-between h-48"
          >
            <div className="w-12 h-12 bg-olive/10 text-olive group-hover:bg-olive group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
              <UserCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-accent font-serifDisplay text-lg font-bold block mb-1">Influencer</span>
              <h3 className="text-lg font-bold text-olive-dark">인플루언서로 시작하기</h3>
              <p className="text-xs text-olive-gray mt-1">팔로워를 수익으로 바꾸고픈 크리에이터</p>
            </div>
          </button>
        </div>

        <div className="text-center">
          <Link href="/landing" className="text-xs text-olive hover:underline font-medium">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / 5) * 100;

  return (
    <div className="max-w-xl mx-auto w-full space-y-6 my-auto">
      {/* Styles for balance game animation */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeOutLeft {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(-30px);
          }
        }
        .animate-slide-in {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-out {
          animation: fadeOutLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      {/* Progress Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-semibold text-olive/80 uppercase tracking-widest">
            {userType === "brand" ? "Brand Diagnosis" : "Influencer Diagnosis"}
          </span>
          <span className="text-sm font-bold text-olive-dark font-serifDisplay">
            {currentIndex + 1}/5
          </span>
        </div>
        <div className="h-2 w-full bg-olive-pale/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-olive transition-all duration-300 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div 
        className={`bg-white p-8 md:p-10 rounded-[24px] shadow-[0_4px_24px_rgba(107,124,63,0.12)] border border-olive/10 space-y-8 min-h-[180px] flex flex-col justify-center transition-all ${animationClass}`}
      >
        <div>
          <span className="text-accent font-serifDisplay text-2xl font-black block mb-3">
            Q{currentQuestion.id}
          </span>
          <h2 className="text-lg md:text-xl font-bold text-olive-dark leading-snug">
            {currentQuestion.question}
          </h2>
        </div>
      </div>

      {/* A/B Option Buttons */}
      <div className="space-y-4 pt-2">
        {/* Option A */}
        <button
          onClick={() => handleAnswerSelect("A")}
          disabled={selectedAnswer !== null}
          className={`w-full text-left p-5 px-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
            selectedAnswer === "A"
              ? "bg-olive border-olive text-white"
              : "bg-white border-olive text-olive-dark hover:bg-olive-pale/30"
          }`}
        >
          <span className="flex items-center text-sm md:text-base font-semibold leading-relaxed">
            <span className={`font-serifDisplay text-2xl font-bold mr-4 ${
              selectedAnswer === "A" ? "text-white" : "text-accent group-hover:scale-110 transition-transform"
            }`}>
              A
            </span>
            {currentQuestion.optionA.label}
          </span>
        </button>

        {/* Option B */}
        <button
          onClick={() => handleAnswerSelect("B")}
          disabled={selectedAnswer !== null}
          className={`w-full text-left p-5 px-6 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group ${
            selectedAnswer === "B"
              ? "bg-olive border-olive text-white"
              : "bg-white border-olive text-olive-dark hover:bg-olive-pale/30"
          }`}
        >
          <span className="flex items-center text-sm md:text-base font-semibold leading-relaxed">
            <span className={`font-serifDisplay text-2xl font-bold mr-4 ${
              selectedAnswer === "B" ? "text-white" : "text-accent group-hover:scale-110 transition-transform"
            }`}>
              B
            </span>
            {currentQuestion.optionB.label}
          </span>
        </button>
      </div>

      <div className="flex justify-between items-center px-2 pt-4">
        <button
          onClick={() => handleSelectType(userType === "brand" ? "influencer" : "brand")}
          className="text-xs text-olive-gray hover:text-olive-dark transition-colors"
        >
          {userType === "brand" ? "인플루언서 진단으로 변경" : "광고주 진단으로 변경"}
        </button>
        <button
          onClick={() => {
            setUserType(null);
            setCurrentIndex(0);
            setAnswers([]);
            setSelectedAnswer(null);
          }}
          className="text-xs text-olive-gray hover:text-olive-dark transition-colors"
        >
          진단 초기화
        </button>
      </div>
    </div>
  );
}
