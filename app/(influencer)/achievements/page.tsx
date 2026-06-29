"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

// Firebase App is initialized in another module, but we can access default instance
// Assuming firebase config is injected or we just import from lib/firebase
import { app } from "@/lib/firebase"; 

const db = getFirestore(app);
const auth = getAuth(app);

const BADGES = [
  { id: "Bronze", name: "Bronze", description: "첫 캠페인 완료", reqCount: 1 },
  { id: "Silver", name: "Silver", description: "10회 완료", reqCount: 10 },
  { id: "Code Master", name: "Code Master", description: "첫 페이백 발생", reqCount: 0 }, // Special condition
  { id: "Gold", name: "Gold", description: "30회 완료", reqCount: 30 },
];

export default function AchievementsPage() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            setUserData(data);
            
            // Trigger confetti if they have newly acquired badges
            // For demo, we just trigger it once if they have any badge
            if (data.badges && data.badges.length > 0) {
              const hasSeenConfetti = localStorage.getItem(`confetti_${user.uid}_${data.badges.length}`);
              if (!hasSeenConfetti) {
                confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 }
                });
                localStorage.setItem(`confetti_${user.uid}_${data.badges.length}`, 'true');
              }
            }
          }
        }
        setLoading(false);
      });
    };
    fetchUserData();
  }, []);

  if (loading) return <div className="p-8 text-center text-olive-gray">로딩 중...</div>;
  if (!userData) return <div className="p-8 text-center text-olive-gray">로그인이 필요합니다.</div>;

  const currentBadges = userData.badges || [];
  const completedCount = userData.campaignCompleteCount || 0;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-olive-dark mb-2 font-['Pretendard']">나의 업적</h1>
      <p className="text-olive-gray mb-8">캠페인을 완료하고 배지를 획득해 보세요!</p>

      {/* 진행률 바 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm mb-10 border border-neutral">
        <h2 className="text-lg font-bold text-olive-dark mb-4">다음 배지까지 남은 캠페인</h2>
        <div className="w-full bg-neutral rounded-full h-4 mb-2 overflow-hidden relative">
          <div 
            className="bg-olive h-4 rounded-full transition-all duration-1000"
            style={{ width: \`\${Math.min((completedCount / 30) * 100, 100)}%\` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-olive-gray font-medium">
          <span>{completedCount} 완료</span>
          <span>목표 30 (Gold)</span>
        </div>
      </div>

      {/* 배지 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {BADGES.map((badge) => {
          const isAchieved = currentBadges.includes(badge.id);
          return (
            <div 
              key={badge.id}
              className={\`p-6 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-300 \${
                isAchieved 
                  ? "bg-olive-pale border-2 border-olive shadow-sm" 
                  : "bg-white border-2 border-dashed border-gray-200 opacity-60 grayscale"
              }\`}
            >
              <div className={\`w-20 h-20 rounded-full flex items-center justify-center mb-4 \${
                isAchieved ? "bg-accent text-white" : "bg-gray-100 text-gray-400"
              }\`}>
                <span className="font-['DM_Serif_Display'] text-2xl">{badge.name[0]}</span>
              </div>
              <h3 className={\`font-bold text-lg mb-1 \${isAchieved ? "text-olive-dark" : "text-gray-500"}\`}>
                {badge.name}
              </h3>
              <p className="text-xs text-olive-gray">{badge.description}</p>
              
              {isAchieved && (
                <span className="mt-3 bg-white text-olive text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  획득 완료
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
