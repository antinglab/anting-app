"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import { UploadCloud, CheckCircle, Play, Download, Loader2 } from "lucide-react";

interface Scene {
  second: string;
  visual: string;
  text: string;
}

interface ScriptData {
  slogan: string;
  scenes: Scene[];
  hashtags: string[];
}

interface JobStatus {
  status: string;
  progress?: number;
  videoUrl?: string;
  error?: string;
}

export default function CreateVideoPage() {
  const params = useParams();
  const campaignId = params.id as string;

  // State
  const [step, setStep] = useState(1);
  const [images, setImages] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [theme, setTheme] = useState("");
  
  const [script, setScript] = useState<ScriptData | null>(null);
  const [bgmStyle, setBgmStyle] = useState("upbeat");
  const [duration, setDuration] = useState(15);
  
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (images.length + newFiles.length > 5) {
        alert("최대 5장까지만 업로드 가능합니다.");
        return;
      }
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // Step 2: Gemini 스크립트 생성
  const handleGenerateScript = async () => {
    if (images.length === 0) {
      alert("최소 1장의 이미지를 업로드해주세요.");
      return;
    }
    if (!productName || !theme) {
      alert("제품명과 캠페인 분위기를 입력해주세요.");
      return;
    }

    try {
      setIsGeneratingScript(true);
      
      // Upload images first
      const app = getApp();
      const storage = getStorage(app);
      const urls: string[] = [];
      
      for (const file of images) {
        const fileRef = ref(storage, `campaigns/${campaignId}/video-source/${Date.now()}_${file.name}`);
        await uploadBytes(fileRef, file);
        const url = await getDownloadURL(fileRef);
        urls.push(url);
      }
      setUploadedUrls(urls);

      // Call Gemini
      const functions = getFunctions(app, "us-central1");
      const generateVideoScript = httpsCallable(functions, "generateVideoScript");
      const res = await generateVideoScript({ productName, theme });
      const data = res.data as { success: boolean; script: ScriptData; error?: string };
      
      if (data.success && data.script) {
        setScript(data.script);
        setStep(3);
      } else {
        throw new Error(data.error || "스크립트 생성 실패");
      }
    } catch (e: unknown) {
      const err = e as Error;
      alert("스크립트 생성 중 오류가 발생했습니다: " + err.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Step 5: 영상 생성하기
  const handleGenerateVideo = async () => {
    try {
      setIsGeneratingVideo(true);
      
      const app = getApp();
      const functions = getFunctions(app, "us-central1");
      const generateVideo = httpsCallable(functions, "generateVideo");
      
      const res = await generateVideo({
        productImages: uploadedUrls,
        script,
        bgmStyle,
        duration,
        campaignId
      });
      
      const data = res.data as { success: boolean; jobId: string; error?: string };
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        setStep(5);
      } else {
        throw new Error(data.error || "영상 생성 요청 실패");
      }
    } catch (e: unknown) {
      const err = e as Error;
      alert("영상 생성 중 오류가 발생했습니다: " + err.message);
      setIsGeneratingVideo(false);
    }
  };

  // Listen to job status
  useEffect(() => {
    if (!jobId) return;
    
    const app = getApp();
    const db = getFirestore(app);
    const jobRef = doc(db, "video_jobs", jobId);
    
    const unsubscribe = onSnapshot(jobRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as JobStatus;
        setJobStatus(data);
        
        if (data.status === "succeeded") {
          setStep(6);
          setIsGeneratingVideo(false);
        } else if (data.status === "failed") {
          alert("영상 생성에 실패했습니다: " + data.error);
          setIsGeneratingVideo(false);
        }
      }
    });
    
    return () => unsubscribe();
  }, [jobId]);

  return (
    <div className="min-h-screen bg-neutral p-4 md:p-8 font-sans pb-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-olive-dark mb-8">AI 릴스/쇼츠 영상 생성기</h1>
        
        {/* Step Indicator */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`flex-1 h-2 rounded-full ${step >= i ? "bg-olive" : "bg-gray-200"}`} />
          ))}
        </div>

        {step <= 2 && (
          <div className="bg-white rounded-[24px] shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-olive-dark mb-4">1단계: 정보 및 이미지 업로드</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-olive-dark mb-2">제품명</label>
                <input 
                  type="text" 
                  value={productName} 
                  onChange={e => setProductName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-olive focus:border-olive outline-none"
                  placeholder="예: 앤팅 수분 크림"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-olive-dark mb-2">캠페인 분위기</label>
                <input 
                  type="text" 
                  value={theme} 
                  onChange={e => setTheme(e.target.value)} 
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-olive focus:border-olive outline-none"
                  placeholder="예: 자연스럽고 생기있는"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-olive-dark mb-2">제품 이미지 (최대 5장)</label>
                <div className="border-2 border-dashed border-olive-pale rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
                  <UploadCloud className="mx-auto h-12 w-12 text-olive-pale mb-4" />
                  <p className="text-gray-500 mb-4">이미지를 드래그하거나 클릭하여 업로드하세요</p>
                  <label className="bg-olive text-white px-6 py-2 rounded-full cursor-pointer hover:bg-olive-light">
                    파일 선택
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                  </label>
                </div>
                
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-4 mt-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 border rounded-xl overflow-hidden">
                        <img src={URL.createObjectURL(img)} alt="preview" className="w-full h-full object-cover" />
                        <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="w-full bg-olive text-white font-bold py-4 rounded-full mt-6 hover:bg-olive-light disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {isGeneratingScript ? <><Loader2 className="animate-spin" /> 스크립트 생성 중...</> : "Gemini 스크립트 생성"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && script && (
          <div className="bg-white rounded-[24px] shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-olive-dark mb-4">3단계: 스크립트 확인 및 수정</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-olive-dark mb-2">메인 슬로건</label>
                <input 
                  type="text" 
                  value={script.slogan} 
                  onChange={e => setScript({...script, slogan: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-olive outline-none"
                />
              </div>
              
              <div className="space-y-4">
                <label className="block text-sm font-bold text-olive-dark">씬(Scene) 구성</label>
                {script.scenes.map((scene: Scene, idx: number) => (
                  <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex gap-4">
                    <div className="w-20 font-bold text-olive pt-3">{scene.second}초</div>
                    <div className="flex-1 space-y-2">
                      <input 
                        type="text" 
                        value={scene.text}
                        onChange={e => {
                          const newScenes = [...script.scenes];
                          newScenes[idx].text = e.target.value;
                          setScript({...script, scenes: newScenes});
                        }}
                        className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                        placeholder="자막 입력"
                      />
                      <div className="text-xs text-gray-500">시각 요소: {scene.visual}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-bold text-olive-dark mb-2">해시태그</label>
                <input 
                  type="text" 
                  value={script.hashtags.join(" ")} 
                  onChange={e => setScript({...script, hashtags: e.target.value.split(" ")})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-olive outline-none text-sm"
                />
              </div>

              <button 
                onClick={() => setStep(4)}
                className="w-full bg-olive text-white font-bold py-4 rounded-full mt-6 hover:bg-olive-light"
              >
                다음 단계로
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="bg-white rounded-[24px] shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-olive-dark mb-4">4단계: 연출 옵션 선택</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-olive-dark mb-4">BGM 스타일</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "upbeat", label: "발랄한 (Upbeat)" },
                    { id: "calm", label: "차분한 (Calm)" },
                    { id: "trendy", label: "트렌디 (Trendy)" }
                  ].map(bgm => (
                    <button 
                      key={bgm.id}
                      onClick={() => setBgmStyle(bgm.id)}
                      className={`py-3 rounded-xl border-2 font-bold transition-colors ${bgmStyle === bgm.id ? "border-olive bg-olive-pale text-olive-dark" : "border-gray-100 text-gray-400 hover:border-gray-200"}`}
                    >
                      {bgm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-olive-dark mb-4">영상 길이</label>
                <div className="grid grid-cols-2 gap-4">
                  {[15, 30].map(dur => (
                    <button 
                      key={dur}
                      onClick={() => setDuration(dur)}
                      className={`py-3 rounded-xl border-2 font-bold transition-colors ${duration === dur ? "border-olive bg-olive-pale text-olive-dark" : "border-gray-100 text-gray-400 hover:border-gray-200"}`}
                    >
                      {dur}초
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerateVideo}
                disabled={isGeneratingVideo}
                className="w-full bg-olive text-white font-bold py-4 rounded-full mt-6 hover:bg-olive-light flex items-center justify-center gap-2"
              >
                {isGeneratingVideo ? <><Loader2 className="animate-spin" /> 요청 중...</> : <><Play size={20} /> 영상 생성하기</>}
              </button>
            </div>
          </div>
        )}

        {step === 5 && jobStatus && (
          <div className="bg-white rounded-[24px] shadow-sm p-8 text-center">
            <Loader2 className="animate-spin h-16 w-16 text-olive mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-olive-dark mb-2">영상을 렌더링하고 있습니다...</h2>
            <p className="text-gray-500 mb-8">Creatomate 엔진이 영상을 합성하고 있습니다. 잠시만 기다려주세요.</p>
            
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-olive h-full transition-all duration-500 ease-out" 
                style={{ width: `${jobStatus.progress || 0}%` }}
              />
            </div>
            <p className="text-sm font-bold text-olive mt-2">{jobStatus.progress || 0}%</p>
          </div>
        )}

        {step === 6 && jobStatus?.videoUrl && (
          <div className="bg-white rounded-[24px] shadow-sm p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-olive-dark mb-6">영상이 완성되었습니다! 🎉</h2>
            
            <div className="max-w-sm mx-auto rounded-2xl overflow-hidden shadow-lg border border-gray-100 mb-8">
              <video 
                src={jobStatus.videoUrl} 
                controls 
                autoPlay 
                loop 
                className="w-full aspect-[9/16] object-cover bg-black"
              />
            </div>

            <div className="flex gap-4 max-w-sm mx-auto">
              <a 
                href={jobStatus.videoUrl} 
                download="reel_video.mp4" 
                target="_blank" 
                rel="noreferrer"
                className="flex-1 bg-olive text-white font-bold py-4 rounded-full hover:bg-olive-light flex items-center justify-center gap-2"
              >
                <Download size={20} /> 영상 다운로드
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
