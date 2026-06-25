'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { db, storage, functions } from '@/lib/firebase';
import { CampaignStatus } from '@/types';
import { TipTapEditor } from '@/components/ui/TipTapEditor';

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [productImages, setProductImages] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [benefit, setBenefit] = useState('');

  const [recruitCount, setRecruitCount] = useState(10);
  const [minFollowers, setMinFollowers] = useState(1000);
  const [regions, setRegions] = useState<string[]>([]);
  const [genders, setGenders] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');

  const [guidelines, setGuidelines] = useState('');
  const [requiredPhrases, setRequiredPhrases] = useState<string[]>([]);
  const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
  const [requiredHashtags, setRequiredHashtags] = useState<string[]>([]);

  // AI Brief Modal State
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [briefTarget, setBriefTarget] = useState('');
  const [briefHighlights, setBriefHighlights] = useState('');
  const [briefLoading, setBriefLoading] = useState(false);

  // Helpers
  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleTags = (e: React.KeyboardEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = e.currentTarget.value.trim();
      if (val) {
        setter((prev) => [...prev, val]);
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (idx: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (productImages.length + filesArray.length > 5) {
        alert('최대 5장까지 업로드 가능합니다.');
        return;
      }
      setProductImages((prev) => [...prev, ...filesArray]);
    }
  };

  const handleGenerateBrief = async () => {
    if (!productName || !category || !briefTarget || !briefHighlights) {
      alert('제품명, 카테고리, 타겟 고객, 강조 포인트를 모두 입력해주세요.');
      return;
    }
    setBriefLoading(true);
    try {
      const generateBriefCallable = httpsCallable(functions, 'generateBrief');
      const result = await generateBriefCallable({
        productName,
        category,
        target: briefTarget,
        highlights: briefHighlights,
      });
      const data = result.data as { success?: boolean; data?: { editorHtml?: string; requiredPhrases?: string[]; forbiddenWords?: string[]; requiredHashtags?: string[] }; error?: string };
      if (data.success && data.data) {
        const generated = data.data;
        if (generated.editorHtml) setGuidelines(generated.editorHtml);
        if (generated.requiredPhrases) setRequiredPhrases(generated.requiredPhrases);
        if (generated.forbiddenWords) setForbiddenWords(generated.forbiddenWords);
        if (generated.requiredHashtags) setRequiredHashtags(generated.requiredHashtags);
        setIsBriefModalOpen(false);
        alert('AI 브리프 작성이 완료되었습니다!');
      } else {
        alert('AI 생성 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (err: unknown) {
      console.error(err);
      const error = err as Error;
      alert('AI 생성 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setBriefLoading(false);
    }
  };

  const handleSubmit = async (status: CampaignStatus) => {
    setLoading(true);
    try {
      const imageUrls = [];
      for (const file of productImages) {
        const storageRef = ref(storage, `campaigns/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      const campaignData = {
        brandId: 'dummy-brand-id', // TODO: auth.currentUser?.uid
        title,
        productName,
        category,
        productImages: imageUrls,
        description,
        benefit,
        recruitCount,
        currentApplicants: 0,
        conditions: {
          minFollowers,
          regions,
          genders,
        },
        guidelines,
        requiredPhrases,
        forbiddenWords,
        requiredHashtags,
        status,
        deadline: deadline ? Timestamp.fromDate(new Date(deadline)) : Timestamp.now(),
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'campaigns'), campaignData);
      alert('저장되었습니다.');
      router.push('/brand/campaigns');
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-[24px] shadow-sm border border-gray-100 my-10">
      <h1 className="text-2xl font-bold mb-6 font-['Pretendard']">캠페인 등록</h1>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-olive">단계 1 — 기본 정보</h2>
          <div>
            <label className="block text-sm font-medium mb-1">캠페인 제목</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">제품명</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" value={productName} onChange={(e) => setProductName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">카테고리</label>
            <select className="w-full border-olive rounded-xl p-2 focus:ring-olive border" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">선택</option>
              <option value="뷰티">뷰티</option>
              <option value="패션">패션</option>
              <option value="푸드">푸드</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">제품 이미지 업로드 (최대 5장)</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mb-2 block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-olive file:text-white hover:file:bg-olive-light" />
            <div className="flex gap-2">
              {productImages.map((file, i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs overflow-hidden">
                  {file.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">캠페인 설명</label>
            <textarea className="w-full border-olive rounded-xl p-2 focus:ring-olive border h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">제공 혜택</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" value={benefit} onChange={(e) => setBenefit(e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-olive">단계 2 — 모집 조건</h2>
          <div>
            <label className="block text-sm font-medium mb-1">모집 인원 ({recruitCount}명)</label>
            <input type="range" min="1" max="100" className="w-full" value={recruitCount} onChange={(e) => setRecruitCount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">최소 팔로워 수 ({minFollowers}명)</label>
            <input type="range" min="0" max="100000" step="1000" className="w-full" value={minFollowers} onChange={(e) => setMinFollowers(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">대상 지역 (쉼표 구분)</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" placeholder="서울, 부산" value={regions.join(', ')} onChange={(e) => setRegions(e.target.value.split(',').map(s => s.trim()))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">대상 성별 (쉼표 구분)</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" placeholder="여성, 남성" value={genders.join(', ')} onChange={(e) => setGenders(e.target.value.split(',').map(s => s.trim()))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">모집 마감일</label>
            <input type="date" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-olive">단계 3 — 원고 가이드</h2>
            <button
              onClick={() => setIsBriefModalOpen(true)}
              className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-opacity-90"
            >
              ✨ AI 브리프 작성 도움받기
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">가이드라인 상세</label>
            <TipTapEditor value={guidelines} onChange={setGuidelines} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">필수 포함 문구 (Enter로 추가)</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border mb-2" onKeyDown={(e) => handleTags(e, setRequiredPhrases)} />
            <div className="flex flex-wrap gap-2">
              {requiredPhrases.map((t, i) => (
                <span key={i} className="bg-olive-pale px-2 py-1 rounded-md text-sm">{t} <button onClick={() => removeTag(i, setRequiredPhrases)}>x</button></span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">금지어 (Enter로 추가)</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border mb-2" onKeyDown={(e) => handleTags(e, setForbiddenWords)} />
            <div className="flex flex-wrap gap-2">
              {forbiddenWords.map((t, i) => (
                <span key={i} className="bg-red-100 px-2 py-1 rounded-md text-sm">{t} <button onClick={() => removeTag(i, setForbiddenWords)}>x</button></span>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">필수 해시태그 (Enter로 추가, #포함)</label>
            <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border mb-2" onKeyDown={(e) => handleTags(e, setRequiredHashtags)} />
            <div className="flex flex-wrap gap-2">
              {requiredHashtags.map((t, i) => (
                <span key={i} className="bg-gray-200 px-2 py-1 rounded-md text-sm">{t} <button onClick={() => removeTag(i, setRequiredHashtags)}>x</button></span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">광고 표시 (#광고 #협찬) 필수 권장</p>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        {step > 1 && <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-olive text-olive h-12">이전</button>}
        {step < 3 && <button onClick={handleNext} className="px-6 py-2 rounded-full bg-olive text-white h-12 ml-auto">다음</button>}
        {step === 3 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => handleSubmit('draft')} disabled={loading} className="px-6 py-2 rounded-full border border-olive text-olive h-12">임시저장</button>
            <button onClick={() => handleSubmit('recruiting')} disabled={loading} className="px-6 py-2 rounded-full bg-olive text-white h-12">정식 등록</button>
          </div>
        )}
      </div>

      {isBriefModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 font-['Pretendard']">✨ AI 브리프 작성 도우미</h3>
            <p className="text-sm text-gray-500 mb-4">타겟 고객과 강조 포인트를 입력하시면, Gemini AI가 나노인플루언서 맞춤형 원고 가이드를 작성해 드립니다.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">타겟 고객 (예: 20대 여성, 민감성 피부)</label>
                <input type="text" className="w-full border-olive rounded-xl p-2 focus:ring-olive border" value={briefTarget} onChange={(e) => setBriefTarget(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">강조 포인트 3가지 (예: 비건 인증, 끈적임 없음, 촉촉함)</label>
                <textarea className="w-full border-olive rounded-xl p-2 focus:ring-olive border h-20" value={briefHighlights} onChange={(e) => setBriefHighlights(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setIsBriefModalOpen(false)} className="px-4 py-2 rounded-full border border-gray-300 text-gray-700">취소</button>
              <button onClick={handleGenerateBrief} disabled={briefLoading} className="px-4 py-2 rounded-full bg-olive text-white disabled:bg-opacity-50">
                {briefLoading ? '생성 중...' : '생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
