'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Campaign, Application } from '@/types';

const STEPS = ['신청', '선발', '수령', '작성', '제출', '승인', '정산'];

export default function InfluencerCampaignStatusPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const MOCK_INFLUENCER_ID = 'mock-influencer-id';

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [contentUrl, setContentUrl] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'blog' | 'tiktok'>('instagram');

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId]);

  const fetchData = async () => {
    try {
      // 1. Fetch Campaign
      const campRef = doc(db, 'campaigns', campaignId);
      const campSnap = await getDoc(campRef);
      if (campSnap.exists()) {
        setCampaign({ id: campSnap.id, ...campSnap.data() } as Campaign);
      }

      // 2. Fetch Application
      const q = query(
        collection(db, 'applications'),
        where('campaignId', '==', campaignId),
        where('influencerId', '==', MOCK_INFLUENCER_ID)
      );
      const appSnap = await getDocs(q);
      if (!appSnap.empty) {
        setApplication({ id: appSnap.docs[0].id, ...appSnap.docs[0].data() } as Application);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status?: string) => {
    switch (status) {
      case 'pending': return 0;
      case 'selected': return 1;
      case 'delivered': return 2; // 수령 후 작성 대기 상태
      case 'revision_requested': return 3; // 수정 요청 시 작성 단계로 표시
      case 'submitted': return 4;
      case 'approved': return 5;
      default: return 0;
    }
  };

  const handleSubmitContent = async () => {
    if (!application) return;
    if (!contentUrl.trim()) {
      alert('콘텐츠 URL을 입력해주세요.');
      return;
    }
    
    try {
      await updateDoc(doc(db, 'applications', application.id), {
        status: 'submitted',
        contentUrl,
        contentPlatform: platform,
        submittedAt: Timestamp.now()
      });
      alert('콘텐츠 제출이 완료되었습니다!');
      fetchData(); // reload
    } catch (error) {
      console.error(error);
      alert('제출 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className="text-center py-20">로딩 중...</div>;
  if (!campaign || !application) return <div className="text-center py-20">진행 중인 캠페인을 찾을 수 없습니다.</div>;

  const currentStep = getStepIndex(application.status);

  return (
    <div className="max-w-4xl mx-auto p-6 font-pretendard">
      <h1 className="text-2xl font-bold text-olive-dark mb-8">캠페인 진행 현황</h1>

      {/* Step Indicator */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
          <div 
            className="absolute left-0 top-1/2 h-1 bg-olive -z-10 -translate-y-1/2 transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          ></div>
          
          {STEPS.map((step, index) => {
            const isCompleted = index <= currentStep;
            const isCurrent = index === currentStep;
            return (
              <div key={step} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  isCompleted ? 'bg-olive text-white' : 'bg-gray-200 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-olive-light ring-opacity-50' : ''}`}>
                  {index + 1}
                </div>
                <div className={`mt-2 text-xs font-semibold ${isCompleted ? 'text-olive-dark' : 'text-gray-400'}`}>
                  {step}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Guide Checklist */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-olive-dark mb-4">콘텐츠 작성 가이드라인</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap bg-neutral p-4 rounded-xl">{campaign.guidelines}</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-sm mb-2 text-olive">필수 해시태그</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.requiredHashtags?.map(tag => (
                  <span key={tag} className="bg-gray-100 px-2 py-1 rounded-md text-xs font-medium text-gray-700">{tag}</span>
                ))}
              </div>
            </div>

            {campaign.forbiddenWords && campaign.forbiddenWords.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm mb-2 text-red-500">금지어 (절대 사용 금지)</h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.forbiddenWords.map(word => (
                    <span key={word} className="bg-red-50 px-2 py-1 rounded-md text-xs font-medium text-red-600">{word}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Area based on status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-olive-dark mb-4">현재 단계</h2>
          
          <div className="flex-1 flex flex-col justify-center">
            {application.status === 'pending' && (
              <div className="text-center text-olive-gray">
                <p>브랜드 담당자가 신청 내역을 검토 중입니다.</p>
                <p className="text-sm mt-2">결과가 나오면 알림을 보내드릴게요!</p>
              </div>
            )}
            
            {application.status === 'rejected' && (
              <div className="text-center text-red-500 font-medium">
                <p>아쉽게도 이번 캠페인에는 선발되지 않으셨습니다.</p>
                <p className="text-sm mt-2">다른 캠페인에 계속 도전해보세요!</p>
              </div>
            )}
            
            {application.status === 'selected' && (
              <div className="text-center text-olive-dark font-medium">
                <p>축하합니다! 캠페인에 선발되셨습니다.</p>
                <p className="text-sm mt-2 text-olive-gray">곧 제품이 배송될 예정입니다. 조금만 기다려주세요.</p>
              </div>
            )}

            {(application.status === 'delivered' || application.status === 'revision_requested') && (
              <div className="space-y-4">
                {application.status === 'revision_requested' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-4">
                    <strong className="block mb-1">브랜드 수정 요청</strong>
                    {application.revisionReason}
                  </div>
                )}
                {application.status === 'delivered' && (
                  <div className="bg-olive-pale text-olive-dark p-4 rounded-xl text-sm mb-4 text-center">
                    제품 배송이 완료되었습니다. 콘텐츠를 작성하고 아래에 URL을 제출해주세요!
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">플랫폼</label>
                  <select 
                    className="w-full border-olive rounded-xl p-3 focus:ring-olive border"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as 'instagram' | 'blog' | 'tiktok')}
                  >
                    <option value="instagram">Instagram</option>
                    <option value="blog">Naver Blog</option>
                    <option value="tiktok">TikTok</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">콘텐츠 URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    className="w-full border-olive rounded-xl p-3 focus:ring-olive border"
                    value={contentUrl}
                    onChange={(e) => setContentUrl(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleSubmitContent}
                  className="w-full bg-olive text-white font-bold py-3 rounded-xl mt-4 hover:bg-olive-dark transition-colors"
                >
                  {application.status === 'revision_requested' ? '수정된 콘텐츠 제출' : '콘텐츠 제출하기'}
                </button>
              </div>
            )}

            {application.status === 'submitted' && (
              <div className="text-center text-olive-dark font-medium">
                <p>콘텐츠 제출이 완료되었습니다!</p>
                <p className="text-sm mt-2 text-olive-gray">브랜드 담당자가 검수 중입니다. 영업일 기준 1~2일 소요될 수 있습니다.</p>
                <a href={application.contentUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-sm text-olive underline">
                  제출한 링크 확인하기
                </a>
              </div>
            )}

            {application.status === 'approved' && (
              <div className="text-center text-green-600 font-medium">
                <p>🎉 콘텐츠가 최종 승인되었습니다!</p>
                <p className="text-sm mt-2 text-olive-gray">수고하셨습니다. 정산일에 맞춰 리워드가 지급될 예정입니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


