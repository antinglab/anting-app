"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getApp } from "firebase/app";

export default function CreateImagePage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [productName, setProductName] = useState("");
  const [theme, setTheme] = useState("자연스러운");
  const [platform, setPlatform] = useState("인스타 정방형");
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

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
      // The background is removed, we can theoretically use it as baseImage for Vertex AI 
      // if Vertex AI ImageGeneration supported editing directly with this prompt format.
      // But based on user requirements, we just call generateProductImage.
      
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
      setLoadingStep("");
    } catch (error: unknown) {
      console.error(error);
      const e = error as Error;
      alert("이미지 생성 중 오류가 발생했습니다: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral p-4 md:p-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-[24px] shadow-sm p-6">
        <h1 className="text-2xl font-bold text-olive-dark mb-6">AI 제품 이미지 생성기</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-olive-dark mb-2">1. 제품 이미지 업로드</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-olive-gray
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-olive-pale file:text-olive-dark
                hover:file:bg-olive-light cursor-pointer"
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
                  <input 
                    type="radio" 
                    name="theme" 
                    value={t} 
                    checked={theme === t}
                    onChange={(e) => setTheme(e.target.value)}
                    className="text-olive focus:ring-olive"
                  />
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
                  <input 
                    type="radio" 
                    name="platform" 
                    value={p} 
                    checked={platform === p}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="text-olive focus:ring-olive"
                  />
                  <span className="text-olive-dark">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full h-12 rounded-full font-bold text-white transition-colors ${
              isLoading ? "bg-olive-gray cursor-not-allowed" : "bg-olive hover:bg-olive-light"
            }`}
          >
            {isLoading ? loadingStep : "AI 썸네일 생성하기"}
          </button>
        </div>

        {generatedImageUrl && (
          <div className="mt-10 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-bold text-olive-dark mb-4">생성 완료!</h2>
            <div className="rounded-[12px] overflow-hidden mb-4 border border-gray-200">
              <img src={generatedImageUrl} alt="Generated Product" className="w-full h-auto" />
            </div>
            <div className="flex gap-4">
              <a 
                href={generatedImageUrl}
                download="generated_thumbnail.png"
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center border border-olive text-olive font-bold py-3 rounded-full hover:bg-olive-pale transition-colors"
              >
                이미지 다운로드
              </a>
              <button 
                onClick={() => router.back()}
                className="flex-1 bg-olive text-white font-bold py-3 rounded-full hover:bg-olive-light transition-colors"
              >
                캠페인으로 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
