import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";

// 매일 자정(KST)에 실행
export const collectInsights = onSchedule("0 0 * * *", async (event) => {
  const db = getFirestore();
  const now = new Date();
  
  try {
    const campaignsRef = db.collection("campaigns");
    const snapshot = await campaignsRef.where("status", "==", "completed").get();

    for (const doc of snapshot.docs) {
      const campaign = doc.data();
      const campaignId = doc.id;
      
      // 캠페인 완료일 확인 (deadline 또는 completedAt 등을 기준)
      // 여기서는 deadline 기준으로 D+3, D+7을 체크한다고 가정
      if (!campaign.deadline) continue;
      
      const deadlineDate = campaign.deadline.toDate();
      const diffTime = Math.abs(now.getTime() - deadlineDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // D+3 또는 D+7 인 경우 성과 집계 (Mock)
      if (diffDays === 3 || diffDays === 7) {
        console.log(`Collecting insights for campaign ${campaignId} (D+${diffDays})`);
        
        // 참여한 인플루언서 목록 조회 (선발완료, 리뷰중, 완료 상태 등)
        const applicationsRef = db.collection("applications");
        const appsSnapshot = await applicationsRef.where("campaignId", "==", campaignId).get();
        
        for (const appDoc of appsSnapshot.docs) {
          const app = appDoc.data();
          if (app.status === 'delivered' || app.status === 'submitted' || app.status === 'approved' || app.status === 'selected') {
            const influencerId = app.influencerId;
            
            // Mock Data
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
