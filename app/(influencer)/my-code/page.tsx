"use client";

import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Copy, Share2 } from "lucide-react";
import { ReferralCode, AppUser } from "@/types";

export default function MyCodePage() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        // Fetch user data
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data() as AppUser;
          
          if (userData.referralCode) {
            // Listen to referral code data
            const codeRef = doc(db, "referral_codes", userData.referralCode);
            const unsubCode = onSnapshot(codeRef, (codeSnap) => {
              if (codeSnap.exists()) {
                setReferralCode(codeSnap.data() as ReferralCode);
              }
              setLoading(false);
            });
            
            return () => unsubCode();
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode.code);
      alert("추천 코드가 복사되었습니다.");
    }
  };

  const handleKakaoShare = () => {
    if (referralCode) {
      const shareUrl = "https://anting-app-0001.web.app"; // Update when production domain is ready
      const text = `앤팅 코드 ${referralCode.code} 입력하면 혜택받아요! → ${shareUrl}`;
      navigator.clipboard.writeText(text);
      alert("공유 텍스트가 복사되었습니다. 카카오톡 등에서 붙여넣기 해보세요!");
      // Ideally Kakao SDK is used here, but copying text is a safe fallback.
    }
  };

  if (loading) {
    return <div className="p-8 text-center">로딩 중...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: 'Pretendard, sans-serif' }}>내 추천 코드</h1>
      
      {referralCode ? (
        <>
          <div className="bg-olive-pale rounded-[24px] p-8 text-center shadow-sm">
            <p className="text-olive-dark mb-2 font-medium">나만의 고유 추천 코드</p>
            <div className="text-4xl md:text-5xl font-bold text-olive-dark mb-6 tracking-wider" style={{ fontFamily: 'DM Serif Display, serif' }}>
              {referralCode.code}
            </div>
            
            <div className="flex gap-4 justify-center">
              <button 
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-olive text-white rounded-full h-12 px-6 hover:bg-olive-light transition-colors"
              >
                <Copy size={20} />
                복사하기
              </button>
              <button 
                onClick={handleKakaoShare}
                className="flex items-center justify-center gap-2 border border-olive text-olive rounded-full h-12 px-6 hover:bg-olive-pale transition-colors"
              >
                <Share2 size={20} />
                카톡 공유
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">실시간 통계</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-neutral rounded-2xl">
                <p className="text-olive-gray mb-1 text-sm">누적 가입자 수</p>
                <p className="text-2xl font-bold text-olive-dark">{referralCode.referredUsers}명</p>
              </div>
              <div className="text-center p-4 bg-neutral rounded-2xl">
                <p className="text-olive-gray mb-1 text-sm">총 주문 수</p>
                <p className="text-2xl font-bold text-olive-dark">{referralCode.totalOrders}건</p>
              </div>
              <div className="text-center p-4 bg-neutral rounded-2xl">
                <p className="text-olive-gray mb-1 text-sm">총 발생 수익</p>
                <p className="text-2xl font-bold text-accent">{referralCode.totalEarnings.toLocaleString()}원</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[24px] p-8 text-center shadow-sm border border-gray-100">
          <p className="text-olive-gray">아직 발급된 추천 코드가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
