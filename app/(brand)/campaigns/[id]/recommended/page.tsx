'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { CheckCircle2, UserCircle2, X } from 'lucide-react';

interface ScoreBreakdown {
  category: number;
  followerCount: number;
  region: number;
  completionRate: number;
  engagementRate: number;
  toneFit: number;
}

interface InfluencerInfo {
  nickname: string;
  followerCount: number;
  categories: string[];
  region: string;
  profileImageUrl: string;
}

interface RecommendedInfluencer {
  influencerId: string;
  score: number;
  breakdown: ScoreBreakdown;
  influencerInfo: InfluencerInfo;
}

export default function RecommendedPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [influencers, setInfluencers] = useState<RecommendedInfluencer[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Modal State
  const [selectedProfile, setSelectedProfile] = useState<RecommendedInfluencer | null>(null);

  useEffect(() => {
    if (!campaignId) return;
    
    const fetchRecommendations = async () => {
      try {
        const scoreInfluencerMatch = httpsCallable(functions, 'scoreInfluencerMatch');
        const res = await scoreInfluencerMatch({ campaignId });
        const data = res.data as { success?: boolean; data?: RecommendedInfluencer[] };
        if (data.success) {
          setInfluencers(data.data || []);
        } else {
          alert('추천 인플루언서를 불러오지 못했습니다.');
        }
      } catch (err) {
        console.error(err);
        alert('추천 로직 실행 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecommendations();
  }, [campaignId]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchSelect = async () => {
    if (selectedIds.size === 0) {
      alert('선발할 인플루언서를 선택해주세요.');
      return;
    }
    
    // Here we would create applications or mark them as selected in Firestore
    alert(`${selectedIds.size}명의 인플루언서가 일괄 선발 처리되었습니다. (임시 메시지)`);
    router.push(`/brand/campaigns/${campaignId}`);
  };

  if (loading) {
    return <div className="p-8 text-center text-olive">AI 기반 매칭 점수를 분석 중입니다...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 my-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-['Pretendard'] text-gray-900 mb-2">✨ AI 추천 인플루언서</h1>
          <p className="text-gray-500">현재 캠페인과 가장 잘 맞는 인플루언서를 점수순으로 보여드립니다.</p>
        </div>
        <button
          onClick={handleBatchSelect}
          className="bg-olive text-white px-6 py-3 rounded-full font-semibold shadow-sm hover:bg-olive-light transition-colors"
        >
          선택 인원 일괄 선발 ({selectedIds.size}명)
        </button>
      </div>

      <div className="space-y-4">
        {influencers.map((inf) => {
          const isSelected = selectedIds.has(inf.influencerId);
          return (
            <div key={inf.influencerId} className={`p-6 rounded-[24px] border transition-all ${isSelected ? 'border-olive bg-olive-pale bg-opacity-20' : 'border-gray-100 bg-white'}`}>
              <div className="flex items-center gap-6">
                <button onClick={() => toggleSelect(inf.influencerId)} className="text-olive">
                  {isSelected ? <CheckCircle2 size={28} className="fill-olive text-white" /> : <div className="w-7 h-7 rounded-full border-2 border-gray-300" />}
                </button>
                
                <div 
                  className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 cursor-pointer"
                  onClick={() => setSelectedProfile(inf)}
                >
                  {inf.influencerInfo.profileImageUrl ? (
                    <img src={inf.influencerInfo.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="w-full h-full text-gray-400" />
                  )}
                </div>

                <div className="flex-1 cursor-pointer" onClick={() => setSelectedProfile(inf)}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{inf.influencerInfo.nickname}</span>
                    <span className="text-sm text-gray-500">팔로워 {(inf.influencerInfo.followerCount / 1000).toFixed(1)}k</span>
                  </div>
                  <div className="flex gap-2">
                    {inf.influencerInfo.categories.map((c, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{c}</span>
                    ))}
                    <span className="text-xs bg-blue-50 px-2 py-1 rounded-full text-blue-600">{inf.influencerInfo.region}</span>
                  </div>
                </div>

                <div className="w-48">
                  <div className="flex justify-between text-sm mb-1 font-semibold">
                    <span className="text-gray-600">적합도 점수</span>
                    <span className="text-olive">{inf.score}점</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-olive h-2.5 rounded-full" style={{ width: `${inf.score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {influencers.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[24px] border border-gray-100">
            <p className="text-gray-500">추천할 인플루언서가 없습니다.</p>
          </div>
        )}
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 max-w-lg w-full relative">
            <button onClick={() => setSelectedProfile(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
              <X size={24} />
            </button>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 mx-auto mb-4 overflow-hidden">
                {selectedProfile.influencerInfo.profileImageUrl ? (
                  <img src={selectedProfile.influencerInfo.profileImageUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-full h-full text-gray-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold">{selectedProfile.influencerInfo.nickname}</h2>
              <p className="text-gray-500">팔로워 {selectedProfile.influencerInfo.followerCount.toLocaleString()}명</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3 border-b pb-2">점수 상세 내역 (총 {selectedProfile.score}점)</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between"><span>카테고리 매칭</span><span className="font-medium text-olive">{selectedProfile.breakdown.category}점 / 30점</span></li>
                <li className="flex justify-between"><span>팔로워 조건</span><span className="font-medium text-olive">{selectedProfile.breakdown.followerCount}점 / 20점</span></li>
                <li className="flex justify-between"><span>활동 지역</span><span className="font-medium text-olive">{selectedProfile.breakdown.region}점 / 15점</span></li>
                <li className="flex justify-between"><span>캠페인 완료율</span><span className="font-medium text-olive">{selectedProfile.breakdown.completionRate}점 / 20점</span></li>
                <li className="flex justify-between"><span>인게이지먼트</span><span className="font-medium text-olive">{selectedProfile.breakdown.engagementRate}점 / 15점</span></li>
                <li className="flex justify-between"><span>브랜드 톤 핏 (AI)</span><span className="font-medium text-accent">{selectedProfile.breakdown.toneFit}점 / 10점 (가산점)</span></li>
              </ul>
            </div>
            
            <button 
              onClick={() => setSelectedProfile(null)}
              className="w-full py-3 rounded-full bg-gray-900 text-white font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
