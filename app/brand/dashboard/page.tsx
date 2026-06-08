"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Users, FileText, CheckCircle, CreditCard } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  status: "recruiting" | "delivering" | "completed";
  applicantsCount: number;
  deadline: string;
}

export default function BrandDashboard() {
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalApplicants: 0,
    completionRate: 0,
    monthlySpend: 0,
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 실제 Firestore 연동을 위한 스냅샷 리스너 예시
    const campaignsRef = collection(db, "campaigns");
    const q = query(campaignsRef, where("brandId", "==", "MOCK_BRAND_ID"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedCampaigns: Campaign[] = [];
      let active = 0;
      let totalApp = 0;

      snapshot.forEach((doc) => {
        const data = doc.data() as Omit<Campaign, "id">;
        loadedCampaigns.push({ id: doc.id, ...data });

        if (data.status === "recruiting" || data.status === "delivering") {
          active++;
        }
        totalApp += data.applicantsCount || 0;
      });

      // 데이터가 없는 경우 임시 데이터 표시 (UI 확인용)
      if (loadedCampaigns.length === 0) {
        setCampaigns([
          { id: "1", title: "여름 시즌 신제품 뷰티 테스터", status: "recruiting", applicantsCount: 124, deadline: "2026-06-15" },
          { id: "2", title: "인스타그램 릴스 챌린지", status: "delivering", applicantsCount: 45, deadline: "2026-06-20" },
          { id: "3", title: "오가닉 스킨케어 런칭", status: "completed", applicantsCount: 200, deadline: "2026-05-30" },
        ]);
        setStats({
          activeCampaigns: 2,
          totalApplicants: 369,
          completionRate: 85,
          monthlySpend: 1500000,
        });
      } else {
        setCampaigns(loadedCampaigns);
        setStats({
          activeCampaigns: active,
          totalApplicants: totalApp,
          completionRate: 85, // MOCK
          monthlySpend: 1500000, // MOCK
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore 조회 오류:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getStatusBadge = (status: Campaign["status"]) => {
    switch (status) {
      case "recruiting":
        return <span className="px-3 py-1 text-xs font-medium bg-olive text-white rounded-full">모집중</span>;
      case "delivering":
        return <span className="px-3 py-1 text-xs font-medium bg-orange-500 text-white rounded-full">배송중</span>;
      case "completed":
        return <span className="px-3 py-1 text-xs font-medium bg-gray-400 text-white rounded-full">완료</span>;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-pretendard text-olive-dark">브랜드 대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-olive-gray">
            <FileText size={20} />
            <h3 className="font-medium">진행 중 캠페인</h3>
          </div>
          <p className="text-3xl font-bold text-olive-dark">{stats.activeCampaigns}건</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-olive-gray">
            <Users size={20} />
            <h3 className="font-medium">총 신청자 수</h3>
          </div>
          <p className="text-3xl font-bold text-olive-dark">{stats.totalApplicants}명</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-olive-gray">
            <CheckCircle size={20} />
            <h3 className="font-medium">콘텐츠 완료율</h3>
          </div>
          <p className="text-3xl font-bold text-olive-dark">{stats.completionRate}%</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 mb-2 text-olive-gray">
            <CreditCard size={20} />
            <h3 className="font-medium">이번 달 지출</h3>
          </div>
          <p className="text-3xl font-bold text-olive-dark">{stats.monthlySpend.toLocaleString()}원</p>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-olive-dark">캠페인 현황</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral text-olive-gray text-sm">
                <th className="px-6 py-4 font-medium">캠페인명</th>
                <th className="px-6 py-4 font-medium">상태</th>
                <th className="px-6 py-4 font-medium">신청현황</th>
                <th className="px-6 py-4 font-medium">마감일</th>
                <th className="px-6 py-4 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-neutral/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-olive-dark">{campaign.title}</td>
                  <td className="px-6 py-4">{getStatusBadge(campaign.status)}</td>
                  <td className="px-6 py-4 text-olive-gray">{campaign.applicantsCount}명 신청</td>
                  <td className="px-6 py-4 text-olive-gray">{campaign.deadline}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="px-4 py-2 text-sm font-medium border border-olive text-olive rounded-full hover:bg-olive hover:text-white transition-colors">
                      관리
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
