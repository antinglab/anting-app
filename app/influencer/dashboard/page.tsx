"use client";

import { useState } from "react";
import { ChevronRight, Clock, Star, MapPin } from "lucide-react";

export default function InfluencerDashboard() {
  const [earnings] = useState({
    balance: 125000,
    monthly: 45000,
  });

  const steps = [
    { label: "신청", active: true, completed: true },
    { label: "선발", active: true, completed: true },
    { label: "수령", active: true, completed: false, current: true },
    { label: "작성", active: false, completed: false },
    { label: "제출", active: false, completed: false },
    { label: "승인", active: false, completed: false },
    { label: "정산", active: false, completed: false },
  ];

  const recommendedCampaigns = [
    { id: 1, title: "강남역 신상 카페 리뷰", category: "카페", reward: "50,000P", location: "서울 강남구" },
    { id: 2, title: "비건 화장품 1주일 체험단", category: "뷰티", reward: "제품제공", location: "온라인" },
    { id: 3, title: "성수동 팝업스토어 방문", category: "문화/전시", reward: "30,000P", location: "서울 성동구" },
    { id: 4, title: "프리미엄 요가복 착용샷", category: "패션", reward: "100,000P", location: "온라인" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold font-pretendard text-olive-dark">내 대시보드</h1>

      {/* Earnings Card */}
      <div className="bg-olive-dark text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-olive/20 rounded-bl-full"></div>
        <div className="relative z-10">
          <p className="text-white/80 text-sm font-medium mb-1">포인트 잔액</p>
          <div className="flex items-end gap-2 mb-6">
            <h2 className="text-4xl font-bold font-serifDisplay text-accent">{earnings.balance.toLocaleString()}</h2>
            <span className="text-accent font-medium pb-1">P</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60 mb-1">이번 달 획득</p>
              <p className="text-lg font-medium">+{earnings.monthly.toLocaleString()}P</p>
            </div>
            <button className="bg-accent text-olive-dark px-6 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition-opacity">
              출금 신청
            </button>
          </div>
        </div>
      </div>

      {/* My Campaign Status */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-olive-dark">내 캠페인 현황</h2>
          <button className="text-sm font-medium text-olive flex items-center">
            전체보기 <ChevronRight size={16} />
          </button>
        </div>

        {/* Current Task Badge */}
        <div className="bg-olive-pale border border-olive-light rounded-xl p-4 flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-olive text-white p-2 rounded-full">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-olive-gray font-medium">지금 해야 할 일</p>
              <p className="text-sm font-bold text-olive-dark">제품을 수령하고 리뷰 작성을 준비해주세요!</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-white text-olive border border-olive rounded-full text-sm font-medium hover:bg-neutral">
            가이드 보기
          </button>
        </div>

        {/* Step Indicator */}
        <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto px-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 z-0"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-olive z-0 transition-all duration-500"
            style={{ width: '40%' }} // 신청, 선발 완료 상태 (2/5)
          ></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  step.completed 
                    ? "bg-olive border-olive text-white" 
                    : step.current
                    ? "bg-white border-olive text-olive"
                    : "bg-white border-gray-200 text-gray-300"
                }`}
              >
                {step.completed ? "✓" : index + 1}
              </div>
              <span className={`text-xs font-medium ${
                step.current ? "text-olive font-bold" : step.completed ? "text-olive-dark" : "text-gray-400"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-olive-dark">추천 캠페인</h2>
          <button className="text-sm font-medium text-olive-gray flex items-center">
            더보기 <ChevronRight size={16} />
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
          {recommendedCampaigns.map((camp) => (
            <div key={camp.id} className="min-w-[280px] bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex-shrink-0 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-1 bg-neutral text-olive-gray text-xs font-medium rounded-full">
                  {camp.category}
                </span>
                <button className="text-gray-300 hover:text-accent transition-colors">
                  <Star size={20} />
                </button>
              </div>
              <h3 className="font-bold text-olive-dark text-lg mb-2 truncate">{camp.title}</h3>
              <div className="flex items-center gap-1 text-xs text-olive-gray mb-4">
                <MapPin size={14} />
                <span>{camp.location}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-olive-gray">리워드</span>
                <span className="font-bold text-olive">{camp.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
