'use client';

import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { TipTapEditor } from '@/components/ui/TipTapEditor';

export default function TestPage() {
  const [productName, setProductName] = useState('비건 수분 크림');
  const [category, setCategory] = useState('뷰티');
  const [target, setTarget] = useState('20대 여성, 민감성 피부');
  const [highlights, setHighlights] = useState('비건 인증, 끈적임 없음, 24시간 보습');
  const [briefResult, setBriefResult] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  const [campaignId, setCampaignId] = useState('');
  const [matchResult, setMatchResult] = useState<Record<string, unknown> | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const testBrief = async () => {
    setBriefLoading(true);
    try {
      const generateBrief = httpsCallable(functions, 'generateBrief');
      const res = await generateBrief({ productName, category, target, highlights });
      setBriefResult(JSON.stringify(res.data, null, 2));
    } catch (err: unknown) {
      const e = err as Error;
      setBriefResult('Error: ' + e.message);
    } finally {
      setBriefLoading(false);
    }
  };

  const testMatch = async () => {
    if (!campaignId) {
      alert('캠페인 ID를 입력해주세요.');
      return;
    }
    setMatchLoading(true);
    try {
      const scoreInfluencerMatch = httpsCallable(functions, 'scoreInfluencerMatch');
      const res = await scoreInfluencerMatch({ campaignId });
      setMatchResult(res.data as Record<string, unknown>);
    } catch (err: unknown) {
      const e = err as Error;
      setMatchResult({ error: e.message });
    } finally {
      setMatchLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <h1 className="text-3xl font-bold font-['Pretendard']">개발자 테스트 페이지</h1>

      {/* AI Brief Test */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-olive">1. AI 브리프 생성 테스트</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input className="border p-2 rounded" value={productName} onChange={e => setProductName(e.target.value)} placeholder="제품명" />
          <input className="border p-2 rounded" value={category} onChange={e => setCategory(e.target.value)} placeholder="카테고리" />
          <input className="border p-2 rounded" value={target} onChange={e => setTarget(e.target.value)} placeholder="타겟 고객" />
          <input className="border p-2 rounded" value={highlights} onChange={e => setHighlights(e.target.value)} placeholder="강조 포인트" />
        </div>
        <button 
          onClick={testBrief} 
          disabled={briefLoading}
          className="bg-olive text-white px-6 py-2 rounded-full mb-4"
        >
          {briefLoading ? '생성 중...' : '브리프 생성 API 호출'}
        </button>
        
        {briefResult && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap font-mono">
              {briefResult}
            </div>
            
            <h3 className="font-bold">TipTap 에디터 연동 결과 (미리보기)</h3>
            <TipTapEditor 
              value={(() => {
                try {
                  return JSON.parse(briefResult).data.editorHtml || '';
                } catch { return ''; }
              })()} 
              onChange={() => {}} 
            />
          </div>
        )}
      </section>

      {/* Match Test */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-olive">2. 인플루언서 추천 매칭 테스트</h2>
        <div className="flex gap-2 mb-4">
          <input 
            className="border p-2 rounded flex-1" 
            value={campaignId} 
            onChange={e => setCampaignId(e.target.value)} 
            placeholder="Firebase에 등록된 캠페인 문서 ID 입력" 
          />
          <button 
            onClick={testMatch} 
            disabled={matchLoading}
            className="bg-olive text-white px-6 py-2 rounded-full"
          >
            {matchLoading ? '분석 중...' : '매칭 API 호출'}
          </button>
        </div>
        
        {matchResult && (
          <div className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap font-mono overflow-auto max-h-96">
            {JSON.stringify(matchResult, null, 2)}
          </div>
        )}
      </section>
    </div>
  );
}
