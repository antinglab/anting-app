"use client";

import React, { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

export default function TestAIImagePage() {
  // 테스트용 고정 캠페인 ID
  const campaignId = "test-campaign-123";

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [productName, setProductName] = useState("");
  const [theme, setTheme] = useState("자연스러운");
  const [platform, setPlatform] = useState("인스타 정방형");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{
    hasRequiredHashtags?: boolean;
    missingHashtags?: string[];
    hasAdIndication?: boolean;
    adIndicationText?: string;
    reason?: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile) {
      alert("제품 이미지를 업로드해주세요.");
      return;
    }
    if (!productName) {
      alert("제품명을 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setAnalysisResult(null);
      
      const app = getApp();
      const storage = getStorage(app);
      const functions = getFunctions(app, "us-central1");

      setLoadingStep("이미지 업로드 중...");
      const originalRef = ref(storage, `campaigns/${campaignId}/original-images/${Date.now()}_${selectedFile.name}`);
      await uploadBytes(originalRef, selectedFile);
      const originalUrl = await getDownloadURL(originalRef);

      setLoadingStep("배경 제거 중...");
      const removeBackground = httpsCallable(functions, "removeBackground");
      await removeBackground({ imageUrl: originalUrl, campaignId });
      
      setLoadingStep("AI 이미지 생성 중...");
      const generateProductImage = httpsCallable(functions, "generateProductImage");
      const generateResult = await generateProductImage({
        productName,
        theme,
        platform,
        campaignId,
      });
      const data = generateResult.data as { url: string };
      const genUrl = data.url;

      setGeneratedImageUrl(genUrl);

      // (선택) 기능 3 테스트: Gemini Vision 콘텐츠 검수
      setLoadingStep("생성된 이미지 내용 검수 중...");
      const analyzeContentImage = httpsCallable(functions, "analyzeContentImage");
      const analysisResponse = await analyzeContentImage({
        imageUrl: genUrl,
        requiredHashtags: ["#앤팅", "#제품테스트"]
      });
      const analysisData = analysisResponse.data as { analysis: Record<string, unknown> };
      setAnalysisResult(analysisData.analysis);

      setLoadingStep("");
    } catch (error: unknown) {
      console.error(error);
      const e = error as Error;
      alert("작업 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-[24px] shadow-sm p-6 border-4 border-olive">
        <div className="bg-olive-pale text-olive-dark px-4 py-2 rounded-full inline-block font-bold mb-4">
          테스트 전용 페이지
        </div>
        <h1 className="text-2xl font-bold text-olive-dark mb-6">AI 기능 통합 테스트</h1>
        <p className="text-olive-gray mb-8">
          이 페이지는 백엔드(Remove.bg, Vertex AI, Gemini Vision) 연결을 확인하기 위한 임시 테스트 페이지입니다.
        </p>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">1. 테스트용 원본 이미지 업로드</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-olive-gray file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-olive-pale file:text-olive-dark hover:file:bg-olive-light cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">2. 제품명</label>
            <input 
              type="text" 
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="예: 앤팅 수분 크림"
              className="w-full border border-olive rounded-[12px] p-3 focus:ring-olive focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">3. 분위기 선택</label>
            <div className="flex gap-4">
              {["자연스러운", "고급스러운", "트렌디한"].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="theme" value={t} checked={theme === t} onChange={(e) => setTheme(e.target.value)} className="text-olive focus:ring-olive" />
                  <span className="text-olive-dark">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">4. 플랫폼 (비율)</label>
            <div className="flex gap-4">
              {["인스타 정방형", "스토리", "블로그"].map(p => (
                <label key={p} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="platform" value={p} checked={platform === p} onChange={(e) => setPlatform(e.target.value)} className="text-olive focus:ring-olive" />
                  <span className="text-olive-dark">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full h-12 rounded-full font-bold text-white transition-colors ${isLoading ? "bg-olive-gray cursor-not-allowed" : "bg-olive hover:bg-olive-light"}`}
          >
            {isLoading ? loadingStep : "테스트 시작 (배경제거 → 생성 → 검수)"}
          </button>
        </div>

        {generatedImageUrl && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-bold text-olive-dark mb-4">테스트 결과</h2>
            <div className="rounded-[12px] overflow-hidden mb-4 border border-gray-200">
              <img src={generatedImageUrl} alt="Generated Product" className="w-full h-auto" />
            </div>
            
            {analysisResult && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-sm">
                <h3 className="font-bold text-gray-700 mb-2">Gemini Vision 검수 결과</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>필수 해시태그 포함: <span className="font-bold">{analysisResult.hasRequiredHashtags ? "✅ 예" : "❌ 아니오"}</span></li>
                  {!analysisResult.hasRequiredHashtags && <li>누락된 해시태그: {analysisResult.missingHashtags?.join(", ")}</li>}
                  <li>광고 표시 포함: <span className="font-bold">{analysisResult.hasAdIndication ? "✅ 예" : "❌ 아니오"}</span></li>
                  {analysisResult.hasAdIndication && <li>검출된 텍스트: {analysisResult.adIndicationText}</li>}
                  <li className="mt-2 text-xs text-gray-400">사유: {analysisResult.reason}</li>
                </ul>
              </div>
            )}

            <div className="flex gap-4">
              <a href={generatedImageUrl} download="generated_thumbnail.png" target="_blank" rel="noreferrer" className="flex-1 text-center border border-olive text-olive font-bold py-3 rounded-full hover:bg-olive-pale transition-colors">
                이미지 다운로드
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
