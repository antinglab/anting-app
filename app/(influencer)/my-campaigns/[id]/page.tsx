'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, Loader2, CheckSquare } from 'lucide-react';
import { doc, getDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';
import { Campaign, Application } from '@/types';

const STEPS = ['신청', '선발', '수령', '작성', '제출', '승인', '정산'];

interface ParsedGuide {
  required_phrases: string[];
  forbidden_words: string[];
  required_hashtags: string[];
  must_include: string[];
  must_not_include: string[];
  ad_disclosure: string;
}

export default function InfluencerCampaignStatusPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const MOCK_INFLUENCER_ID = 'mock-influencer-id';

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [contentUrl, setContentUrl] = useState('');
  const [platform, setPlatform] = useState<'instagram' | 'blog' | 'tiktok'>('instagram');

  // Guide Parsing State
  const [parsedGuide, setParsedGuide] = useState<ParsedGuide | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isParsing, setIsParsing] = useState(false);

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

  const handleParseGuide = async () => {
    if (!campaign?.guidelines) return;
    try {
      setIsParsing(true);
      const app = getApp();
      const functions = getFunctions(app, "us-central1");
      const parseGuidelines = httpsCallable(functions, "parseGuidelines");
      const res = await parseGuidelines({ guidelineText: campaign.guidelines });
      const data = res.data as { success: boolean; data: ParsedGuide };
      if (data.success && data.data) {
        setParsedGuide(data.data);
        setCheckedItems(new Set());
      }
    } catch (error) {
      console.error(error);
      alert("가이드 분석 중 오류가 발생했습니다.");
    } finally {
      setIsParsing(false);
    }
  };

  const toggleCheck = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) newChecked.delete(id);
    else newChecked.add(id);
    setCheckedItems(newChecked);
  };

  const getTotalCheckItems = () => {
    if (!parsedGuide) return 0;
    return (parsedGuide.required_phrases?.length || 0) +
           (parsedGuide.forbidden_words?.length || 0) +
           (parsedGuide.required_hashtags?.length || 0) +
           (parsedGuide.must_include?.length || 0) +
           (parsedGuide.must_not_include?.length || 0) +
           (parsedGuide.ad_disclosure ? 1 : 0);
  };
  
  const isAllChecked = parsedGuide ? checkedItems.size === getTotalCheckItems() : false;

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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-olive-dark">콘텐츠 작성 가이드라인</h2>
            <button 
              onClick={handleParseGuide}
              disabled={isParsing || !campaign.guidelines}
              className="text-xs bg-olive-pale text-olive-dark px-3 py-1.5 rounded-full font-bold hover:bg-olive hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {isParsing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              가이드 요약 보기
            </button>
          </div>
          
          <div className="space-y-4">
            {!parsedGuide && (
              <>
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
              </>
            )}

            {parsedGuide && (
              <div className="bg-neutral p-4 rounded-xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare className="w-5 h-5 text-olive" />
                  <h3 className="font-bold text-olive-dark">가이드 필수 체크리스트</h3>
                </div>
                
                {parsedGuide.must_include && parsedGuide.must_include.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2">꼭 포함해야 할 내용</h4>
                    {parsedGuide.must_include.map((item, i) => (
                      <label key={`must_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={checkedItems.has(`must_${i}`)} onChange={() => toggleCheck(`must_${i}`)} className="mt-1 accent-olive" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                )}

                {parsedGuide.must_not_include && parsedGuide.must_not_include.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2">주의/금지 사항</h4>
                    {parsedGuide.must_not_include.map((item, i) => (
                      <label key={`mustnot_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={checkedItems.has(`mustnot_${i}`)} onChange={() => toggleCheck(`mustnot_${i}`)} className="mt-1 accent-red-500" />
                        <span className="text-sm text-red-600 font-medium">{item}</span>
                      </label>
                    ))}
                  </div>
                )}

                {parsedGuide.required_phrases && parsedGuide.required_phrases.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2">필수 포함 문구</h4>
                    {parsedGuide.required_phrases.map((item, i) => (
                      <label key={`phrase_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={checkedItems.has(`phrase_${i}`)} onChange={() => toggleCheck(`phrase_${i}`)} className="mt-1 accent-olive" />
                        <span className="text-sm text-gray-700">&quot;{item}&quot;</span>
                      </label>
                    ))}
                  </div>
                )}

                {parsedGuide.forbidden_words && parsedGuide.forbidden_words.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2">사용 금지 단어</h4>
                    {parsedGuide.forbidden_words.map((item, i) => (
                      <label key={`forbid_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={checkedItems.has(`forbid_${i}`)} onChange={() => toggleCheck(`forbid_${i}`)} className="mt-1 accent-red-500" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                )}

                {parsedGuide.required_hashtags && parsedGuide.required_hashtags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2">필수 해시태그</h4>
                    {parsedGuide.required_hashtags.map((item, i) => (
                      <label key={`tag_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                        <input type="checkbox" checked={checkedItems.has(`tag_${i}`)} onChange={() => toggleCheck(`tag_${i}`)} className="mt-1 accent-olive" />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                )}

                {parsedGuide.ad_disclosure && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 mb-2">공정위 문구 (협찬 명시)</h4>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={checkedItems.has('ad_disclosure')} onChange={() => toggleCheck('ad_disclosure')} className="mt-1 accent-olive" />
                      <span className="text-sm text-gray-700 font-bold">{parsedGuide.ad_disclosure}</span>
                    </label>
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-200 text-right">
                  <span className="text-xs font-bold text-olive-dark">체크 진행률: {checkedItems.size} / {getTotalCheckItems()}</span>
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
                
                <button
                  onClick={() => router.push(`/my-campaigns/${campaignId}/create-post`)}
                  className="w-full bg-olive-pale text-olive-dark border border-olive hover:bg-olive hover:text-white font-bold py-3 rounded-xl mb-4 transition-colors flex justify-center items-center"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI 포스팅 초안 생성기 열기 ✨
                </button>
                
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
                  disabled={parsedGuide ? !isAllChecked : false}
                  className="w-full bg-olive text-white font-bold py-3 rounded-xl mt-4 hover:bg-olive-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {parsedGuide && !isAllChecked 
                    ? '가이드 체크리스트를 모두 확인해주세요' 
                    : (application.status === 'revision_requested' ? '수정된 콘텐츠 제출' : '콘텐츠 제출하기')}
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
