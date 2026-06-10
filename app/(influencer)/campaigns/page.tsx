'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Campaign } from '@/types';

export default function InfluencerCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('전체');
  const [region, setRegion] = useState<string>('전체');

  useEffect(() => {
    fetchCampaigns();
  }, [category, region]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      // In a real app, we'd add complex query logic here,
      // but for now, fetch all 'recruiting' and filter locally to keep it simple.
      const q = query(
        collection(db, 'campaigns'),
        where('status', '==', 'recruiting'),
        orderBy('deadline', 'asc')
      );
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));

      if (category !== '전체') {
        data = data.filter(c => c.category === category);
      }
      if (region !== '전체') {
        data = data.filter(c => c.conditions?.regions?.includes(region) || c.conditions?.regions?.length === 0);
      }

      setCampaigns(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getDDay = (deadline: Timestamp) => {
    if (!deadline) return '';
    const diff = deadline.toMillis() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `D-${days}` : '마감';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 font-['Pretendard']">
      <h1 className="text-3xl font-bold mb-6 text-olive-dark">캠페인 탐색</h1>

      <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['전체', '뷰티', '패션', '푸드'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                category === cat ? 'bg-olive text-white' : 'bg-olive-pale text-olive-dark hover:bg-olive hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          className="border-olive rounded-xl p-2 focus:ring-olive border text-sm max-w-[150px]"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        >
          <option value="전체">지역 전체</option>
          <option value="서울">서울</option>
          <option value="부산">부산</option>
          <option value="온라인">온라인</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-olive-gray">로딩 중...</div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 text-olive-gray text-lg">
          아직 내 조건에 맞는 캠페인이 없어요
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map(camp => (
            <div key={camp.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-transform hover:-translate-y-1">
              <div className="h-48 bg-gray-200 relative">
                {camp.productImages && camp.productImages[0] ? (
                  <img src={camp.productImages[0]} alt={camp.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">이미지 없음</div>
                )}
                <div className="absolute top-3 right-3 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
                  {getDDay(camp.deadline)}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs text-olive-gray mb-1">{camp.brandId}</div> {/* Replace with brandName if available */}
                <h3 className="font-semibold text-lg text-olive-dark mb-2 line-clamp-2">{camp.title}</h3>
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-olive-gray">
                    <span className="font-medium text-olive">{camp.currentApplicants || 0}</span> / {camp.recruitCount}명 신청
                  </div>
                  <button className="bg-olive text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-olive-light transition-colors">
                    신청하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
