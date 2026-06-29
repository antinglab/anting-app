import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendTelegramMessage } from "./utils/telegram";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 매일 자정(KST)에 실행 (기존)
export const collectInsights = onSchedule("0 0 * * *", async (event) => {
  const db = getFirestore();
  const now = new Date();
  
  try {
    const campaignsRef = db.collection("campaigns");
    const snapshot = await campaignsRef.where("status", "==", "completed").get();

    for (const doc of snapshot.docs) {
      const campaign = doc.data();
      const campaignId = doc.id;
      
      if (!campaign.deadline) continue;
      
      const deadlineDate = campaign.deadline.toDate();
      const diffTime = Math.abs(now.getTime() - deadlineDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 3 || diffDays === 7) {
        console.log(`Collecting insights for campaign ${campaignId} (D+${diffDays})`);
        
        const applicationsRef = db.collection("applications");
        const appsSnapshot = await applicationsRef.where("campaignId", "==", campaignId).get();
        
        for (const appDoc of appsSnapshot.docs) {
          const app = appDoc.data();
          if (app.status === 'delivered' || app.status === 'submitted' || app.status === 'approved' || app.status === 'selected') {
            const influencerId = app.influencerId;
            
            const mockInsights = {
              impressions: Math.floor(Math.random() * 5000) + 500,
              likes: Math.floor(Math.random() * 500) + 50,
              comments: Math.floor(Math.random() * 50) + 5,
              saves: Math.floor(Math.random() * 30) + 2,
              reach: Math.floor(Math.random() * 4000) + 400,
              collectedAt: new Date().toISOString(),
              diffDays,
            };

            await db.collection(`campaign_insights/${campaignId}/influencers`).doc(influencerId).set(mockInsights, { merge: true });
          }
        }
      }
    }
    console.log("Insight collection completed.");
  } catch (error) {
    console.error("Error collecting insights:", error);
  }
});

// 매주 월요일 00:00 품질 점수 계산
export const calculateQualityScore = onSchedule(
  {
    schedule: "0 0 * * 1",
    timeZone: "Asia/Seoul",
  },
  async (event) => {
    const db = getFirestore();
    const now = new Date();
    
    // 3개월 전 날짜
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    try {
      const influencersSnapshot = await db.collection("users").where("role", "==", "influencer").get();
      
      for (const userDoc of influencersSnapshot.docs) {
        const uid = userDoc.id;
        const influencerData = userDoc.data();
        const nickname = influencerData.nickname || influencerData.name || "인플루언서";

        // 기존 등급
        const influencerDocRef = db.collection("influencers").doc(uid);
        const influencerDocSnap = await influencerDocRef.get();
        const currentTier = influencerDocSnap.exists ? (influencerDocSnap.data()?.tier || "Bronze") : "Bronze";

        // 1. 애플리케이션 통계
        const appsSnapshot = await db.collection("applications").where("influencerId", "==", uid).get();
        const totalApps = appsSnapshot.size;
        
        let completedApps = 0;
        let onTimeApps = 0;
        
        appsSnapshot.forEach((doc) => {
          const app = doc.data();
          if (app.status === "approved" || app.status === "completed") {
            completedApps++;
            // 기한 준수 여부 (단순 모의 로직)
            if (!app.revisionReason) {
              onTimeApps++;
            }
          }
        });

        const completionRate = totalApps > 0 ? completedApps / totalApps : 1; // 내역 없으면 100%
        const onTimeRate = completedApps > 0 ? onTimeApps / completedApps : 1;
        
        // 2. 브랜드 재요청률, 인게이지먼트율 (모의 데이터로 처리)
        const reRequestRate = 0.8; 
        const engagementRate = 0.9; 

        // 점수 계산
        // 캠페인 완료율: 30점
        const scoreCompletion = Math.round(completionRate * 30);
        // 기한 준수율: 20점
        const scoreDeadline = Math.round(onTimeRate * 20);
        // 브랜드 재요청률: 15점
        const scoreReRequest = Math.round(reRequestRate * 15);
        // 인게이지먼트율: 10점
        const scoreEngagement = Math.round(engagementRate * 10);
        
        // 가이드 준수율 기본 점수: 15점 (최대 25점)
        let scoreGuide = 15;
        let improvementPoints: string[] = [];

        // 3. Gemini 최근 3개월 텍스트 분석
        if (genAI) {
          try {
            const postsSnapshot = await db.collection("tagged_posts")
              .where("influencerId", "==", uid)
              .where("createdAt", ">=", threeMonthsAgo)
              .get();

            if (!postsSnapshot.empty) {
              const contents = postsSnapshot.docs.map(d => d.data().content).filter(Boolean).slice(0, 5); // 최대 5개 샘플링
              if (contents.length > 0) {
                const prompt = `다음은 특정 인플루언서가 작성한 리뷰 게시물들의 내용입니다.
이 내용들을 분석하여 가이드라인 준수도 점수를 0점에서 10점 사이로 평가하고, 개선 포인트를 작성해주세요.
내용:
${contents.map((c, i) => `[${i+1}] ${c}`).join('\n')}

반드시 아래 JSON 포맷으로만 응답해야 합니다.
{
  "guideBonusScore": 0~10 사이 정수,
  "improvementPoints": ["개선포인트1", "개선포인트2"]
}`;

                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                const responseText = result.response.text();
                const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const analysis = JSON.parse(jsonStr);
                
                scoreGuide += (analysis.guideBonusScore || 0);
                improvementPoints = analysis.improvementPoints || [];
              }
            }
          } catch (e) {
            console.error("Gemini analysis error:", e);
          }
        }

        const totalScore = Math.min(100, scoreCompletion + scoreDeadline + scoreReRequest + scoreEngagement + scoreGuide);
        
        // 등급 산정
        let newTier: "Bronze" | "Silver" | "Gold" | "Platinum" = "Bronze";
        if (totalScore >= 85) newTier = "Platinum";
        else if (totalScore >= 70) newTier = "Gold";
        else if (totalScore >= 50) newTier = "Silver";
        else newTier = "Bronze";

        // 등급 상승 시 텔레그램 알림
        const tiers = { "Bronze": 1, "Silver": 2, "Gold": 3, "Platinum": 4 };
        if (tiers[newTier] > tiers[currentTier as "Bronze" | "Silver" | "Gold" | "Platinum"]) {
          await sendTelegramMessage(`🏅 ${nickname}님 ${newTier} 달성!`);
        }

        // 업데이트
        await influencerDocRef.set({
          qualityScore: totalScore,
          tier: newTier,
          improvementPoints,
          lastScoredAt: FieldValue.serverTimestamp()
        }, { merge: true });
        
        // users 컬렉션에도 정보 저장 (필요한 경우)
        await userDoc.ref.update({
          qualityScore: totalScore,
          tier: newTier
        });

      }
      console.log("Quality scoring completed.");
    } catch (error) {
      console.error("Error calculating quality score:", error);
    }
  }
);
