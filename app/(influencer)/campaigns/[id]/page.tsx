'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Campaign, Application } from '@/types';
import { logEvent } from '@/lib/analytics';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  // MOCK INFLUENCER DATA
  const MOCK_INFLUENCER_ID = 'mock-influencer-id';
  const MOCK_FOLLOWER_COUNT = 5000;
  const MOCK_REGION = '서울';
  const MOCK_GENDER = '여성';

  useEffect(() => {
    if (campaignId) {
      fetchCampaignAndStatus();
    }
  }, [campaignId]);

  const fetchCampaignAndStatus = async () => {
    try {
      // 1. Fetch Campaign
      const docRef = doc(db, 'campaigns', campaignId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCampaign({ id: docSnap.id, ...docSnap.data() } as Campaign);
      }

      // 2. Check if already applied
      const q = query(
        collection(db, 'applications'),
        where('campaignId', '==', campaignId),
        where('influencerId', '==', MOCK_INFLUENCER_ID)
      );
      const appSnap = await getDocs(q);
      if (!appSnap.empty) {
        setHasApplied(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkConditions = () => {
    if (!campaign) return false;
    const { conditions } = campaign;
    if (conditions.minFollowers > MOCK_FOLLOWER_COUNT) return false;
    if (conditions.regions.length > 0 && !conditions.regions.includes(MOCK_REGION)) return false;
    if (conditions.genders.length > 0 && !conditions.genders.includes(MOCK_GENDER)) return false;
    return true;
  };

  const handleApply = async () => {
    if (!campaign) return;
    if (hasApplied) {
      alert('이미 신청한 캠페인입니다.');
      return;
    }
    if (!checkConditions()) {
      alert('신청 조건을 충족하지 않습니다.');
      return;
    }

    setApplying(true);
    try {
      const applicationData: Omit<Application, 'id'> = {
        campaignId,
        influencerId: MOCK_INFLUENCER_ID,
        brandId: campaign.brandId,
        status: 'pending',
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'applications'), applicationData);
      setHasApplied(true);
      
      logEvent('campaign_apply', {
        campaignId,
        brandId: campaign.brandId,
        influencerId: MOCK_INFLUENCER_ID
      });

      alert('신청이 완료되었습니다!');
      router.push('/influencer/dashboard');
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) return <div className="text-center py-20">로딩 중...</div>;
  if (!campaign) return <div className="text-center py-20">캠페인을 찾을 수 없습니다.</div>;

  const isEligible = checkConditions();

  return (
    <div className="max-w-4xl mx-auto p-6 font-pretendard">
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="h-64 bg-gray-200">
          {campaign.productImages?.[0] ? (
            <img src={campaign.productImages[0]} alt={campaign.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">이미지 없음</div>
          )}
        </div>
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block px-3 py-1 bg-olive-pale text-olive-dark rounded-full text-xs font-bold mb-2">
                {campaign.category}
              </span>
              <h1 className="text-3xl font-bold text-olive-dark">{campaign.title}</h1>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">{campaign.currentApplicants || 0} / {campaign.recruitCount}명</div>
              <div className="text-sm text-olive-gray">현재 신청 인원</div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-8 whitespace-pre-wrap">{campaign.description}</p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-neutral p-6 rounded-2xl">
              <h3 className="font-bold text-lg mb-4">모집 조건</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="text-olive-gray inline-block w-24">최소 팔로워</span> {campaign.conditions?.minFollowers}명 이상</li>
                <li><span className="text-olive-gray inline-block w-24">대상 지역</span> {campaign.conditions?.regions?.join(', ') || '무관'}</li>
                <li><span className="text-olive-gray inline-block w-24">대상 성별</span> {campaign.conditions?.genders?.join(', ') || '무관'}</li>
              </ul>
              {!isEligible && (
                <div className="mt-4 text-red-500 text-xs font-semibold bg-red-50 p-2 rounded">
                  회원님은 신청 조건을 충족하지 않습니다.
                </div>
              )}
            </div>
            <div className="bg-neutral p-6 rounded-2xl">
              <h3 className="font-bold text-lg mb-4">제공 혜택</h3>
              <p className="text-sm">{campaign.benefit}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h3 className="font-bold text-lg mb-4">원고 가이드</h3>
            <div className="space-y-4 text-sm">
              <div>
                <strong className="block text-olive-gray mb-1">상세 가이드</strong>
                <p className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">{campaign.guidelines}</p>
              </div>
              <div>
                <strong className="block text-olive-gray mb-1">필수 해시태그</strong>
                <div className="flex flex-wrap gap-2">
                  {campaign.requiredHashtags?.map(tag => (
                    <span key={tag} className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{tag}</span>
                  ))}
                </div>
              </div>
              {campaign.forbiddenWords && campaign.forbiddenWords.length > 0 && (
                <div>
                  <strong className="block text-red-400 mb-1">금지어</strong>
                  <div className="flex flex-wrap gap-2">
                    {campaign.forbiddenWords.map(word => (
                      <span key={word} className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs">{word}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-center z-50">
        <button
          onClick={handleApply}
          disabled={applying || hasApplied || !isEligible}
          className={`w-full max-w-md h-14 rounded-full font-bold text-lg transition-colors ${
            hasApplied
              ? 'bg-gray-300 text-white cursor-not-allowed'
              : !isEligible
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-olive text-white hover:bg-olive-dark shadow-lg'
          }`}
        >
          {hasApplied ? '신청 완료' : applying ? '처리 중...' : '체험 신청하기'}
        </button>
      </div>
      <div className="h-20"></div>
    </div>
  );
}


