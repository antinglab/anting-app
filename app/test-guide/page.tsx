"use client";

import React, { useState } from "react";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Sparkles, Loader2, CheckSquare } from "lucide-react";

interface ParsedGuide {
  required_phrases: string[];
  forbidden_words: string[];
  required_hashtags: string[];
  must_include: string[];
  must_not_include: string[];
  ad_disclosure: string;
}

export default function TestGuidePage() {
  const [guidelines, setGuidelines] = useState(
    "1. 제형과 발림성이 잘 보이도록 손등이나 얼굴에 바르는 짧은 영상이나 움짤을 필수로 넣어주세요.\n2. '올리브영 1위', '인생 수분크림' 이라는 단어를 본문에 2회 이상 꼭 적어주세요.\n3. 피부과 시술과 관련된 언급이나 타사 브랜드명은 절대 금지합니다.\n4. #앤팅 #수분크림추천 #올영세일 해시태그를 달아주세요.\n5. 첫 댓글과 제목에 협찬 받았음을 명시하는 공정위 문구를 꼭 달아주세요."
  );
  
  const [parsedGuide, setParsedGuide] = useState<ParsedGuide | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isParsing, setIsParsing] = useState(false);

  const handleParseGuide = async () => {
    if (!guidelines.trim()) {
      alert("테스트할 가이드라인 원문을 입력해주세요.");
      return;
    }

    try {
      setIsParsing(true);
      const app = getApp();
      const functions = getFunctions(app, "us-central1");
      const parseGuidelines = httpsCallable(functions, "parseGuidelines");
      const res = await parseGuidelines({ guidelineText: guidelines });
      const data = res.data as { success: boolean; data: ParsedGuide };
      
      if (data.success && data.data) {
        setParsedGuide(data.data);
        setCheckedItems(new Set());
      } else {
        alert("분석 실패: 데이터를 가져오지 못했습니다.");
      }
    } catch (error: unknown) {
      console.error(error);
      const err = error as Error;
      alert("가이드 분석 중 오류가 발생했습니다: " + err.message);
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

  return (
    <div className="min-h-screen bg-neutral p-4 md:p-8 font-sans pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="bg-olive-pale text-olive-dark px-4 py-2 rounded-full inline-block font-bold mb-4">
          테스트 전용 페이지
        </div>
        <h1 className="text-3xl font-bold text-olive-dark mb-8">AI 가이드라인 파서 & 체크리스트 테스트</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* 입력 및 원문 영역 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-olive-dark mb-4">가이드라인 원문 입력 (브랜드 시점)</h2>
            <textarea
              className="w-full h-64 border border-gray-300 rounded-xl p-4 focus:ring-olive focus:border-olive outline-none text-sm mb-4"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="여기에 테스트할 가이드라인을 붙여넣으세요..."
            />
            <button 
              onClick={handleParseGuide}
              disabled={isParsing || !guidelines}
              className="w-full bg-olive text-white font-bold py-4 rounded-xl hover:bg-olive-dark transition-colors flex justify-center items-center gap-2 disabled:bg-gray-300"
            >
              {isParsing ? <><Loader2 className="w-5 h-5 animate-spin" /> 분석 중...</> : <><Sparkles className="w-5 h-5" /> 가이드 요약 보기 (Gemini 실행)</>}
            </button>
          </div>

          {/* 파싱 결과 및 체크리스트 영역 (인플루언서 시점) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-bold text-olive-dark mb-4">가이드 필수 체크리스트 (인플루언서 뷰)</h2>
            
            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 p-4 overflow-y-auto">
              {!parsedGuide ? (
                <div className="text-center text-gray-400 py-10">
                  <p>좌측에서 [가이드 요약 보기]를 눌러</p>
                  <p className="mt-1">체크리스트를 생성해보세요.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckSquare className="w-5 h-5 text-olive" />
                    <h3 className="font-bold text-olive-dark">가이드 필수 체크리스트</h3>
                  </div>

                  {parsedGuide.must_include && parsedGuide.must_include.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gray-500 mb-2">꼭 포함해야 할 내용</h4>
                      {parsedGuide.must_include.map((item, i) => (
                        <label key={`must_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                          <input type="checkbox" checked={checkedItems.has(`must_${i}`)} onChange={() => toggleCheck(`must_${i}`)} className="mt-1 accent-olive w-4 h-4" />
                          <span className="text-sm text-gray-700 leading-snug">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {parsedGuide.must_not_include && parsedGuide.must_not_include.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">주의/금지 사항</h4>
                      {parsedGuide.must_not_include.map((item, i) => (
                        <label key={`mustnot_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                          <input type="checkbox" checked={checkedItems.has(`mustnot_${i}`)} onChange={() => toggleCheck(`mustnot_${i}`)} className="mt-1 accent-red-500 w-4 h-4" />
                          <span className="text-sm text-red-600 font-medium leading-snug">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {parsedGuide.required_phrases && parsedGuide.required_phrases.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">필수 포함 문구</h4>
                      {parsedGuide.required_phrases.map((item, i) => (
                        <label key={`phrase_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                          <input type="checkbox" checked={checkedItems.has(`phrase_${i}`)} onChange={() => toggleCheck(`phrase_${i}`)} className="mt-1 accent-olive w-4 h-4" />
                          <span className="text-sm text-gray-700 leading-snug">&quot;{item}&quot;</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {parsedGuide.forbidden_words && parsedGuide.forbidden_words.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">사용 금지 단어</h4>
                      {parsedGuide.forbidden_words.map((item, i) => (
                        <label key={`forbid_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                          <input type="checkbox" checked={checkedItems.has(`forbid_${i}`)} onChange={() => toggleCheck(`forbid_${i}`)} className="mt-1 accent-red-500 w-4 h-4" />
                          <span className="text-sm text-gray-700 leading-snug">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {parsedGuide.required_hashtags && parsedGuide.required_hashtags.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">필수 해시태그</h4>
                      {parsedGuide.required_hashtags.map((item, i) => (
                        <label key={`tag_${i}`} className="flex items-start gap-2 mb-2 cursor-pointer">
                          <input type="checkbox" checked={checkedItems.has(`tag_${i}`)} onChange={() => toggleCheck(`tag_${i}`)} className="mt-1 accent-olive w-4 h-4" />
                          <span className="text-sm text-gray-700 leading-snug">{item}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {parsedGuide.ad_disclosure && (
                    <div className="mt-4">
                      <h4 className="text-xs font-bold text-gray-500 mb-2">공정위 문구 (협찬 명시)</h4>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={checkedItems.has('ad_disclosure')} onChange={() => toggleCheck('ad_disclosure')} className="mt-1 accent-olive w-4 h-4" />
                        <span className="text-sm text-gray-700 font-bold leading-snug">{parsedGuide.ad_disclosure}</span>
                      </label>
                    </div>
                  )}
                  
                  <div className="mt-6 pt-4 border-t border-gray-200 text-right">
                    <span className="text-sm font-bold text-olive-dark">
                      체크 진행률: {checkedItems.size} / {getTotalCheckItems()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button 
                disabled={!parsedGuide || !isAllChecked}
                className="w-full bg-olive text-white font-bold py-4 rounded-xl hover:bg-olive-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                onClick={() => alert('가이드 점검을 완수하여 성공적으로 제출되었습니다!')}
              >
                {!parsedGuide 
                  ? '가이드를 먼저 확인해주세요'
                  : (!isAllChecked ? '모든 항목을 체크해야 제출 가능합니다' : '콘텐츠 제출하기 (테스트 완료)')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
