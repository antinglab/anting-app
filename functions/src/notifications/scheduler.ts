import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { sendTelegramMessage } from "../utils/telegram";
import { sendEmailJSNudge } from "../utils/emailjs";

const db = getFirestore();

// 1. 마감 D-3 (매일 오전 9시)
export const deadlineReminder = onSchedule("0 9 * * *", async (event) => {
  const now = new Date();
  
  // 3 days from now
  const targetDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  
  // Format for comparison if deadlines are stored as timestamps
  // Assuming deadline is a Timestamp. We need to find campaigns where deadline is on targetDate (ignoring time).
  // A simple way is to find campaigns with deadline between targetDate start of day and end of day.
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const campaignsSnapshot = await db.collection("campaigns")
    .where("deadline", ">=", startOfDay)
    .where("deadline", "<=", endOfDay)
    .get();

  for (const campaignDoc of campaignsSnapshot.docs) {
    const campaignId = campaignDoc.id;
    const campaignData = campaignDoc.data();
    
    // Find unsubmitted applications (e.g. selected, delivered)
    const applicationsSnapshot = await db.collection("applications")
      .where("campaignId", "==", campaignId)
      .where("status", "in", ["selected", "delivered"])
      .get();

    for (const _appDoc of applicationsSnapshot.docs) {
      const msg = `⚠️ [앤팅] ${campaignData.title || '캠페인'} 마감 3일 전`;
      // Here we send to the team (admin), or if there was a way, to the influencer.
      // Based on the prompt, we send to the Telegram bot.
      await sendTelegramMessage(msg);
    }
  }
});

// 2. 브랜드 신규 신청 알림 (6시간마다 배치)
export const newApplicantsBatch = onSchedule("0 */6 * * *", async (event) => {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

  // Find all applications created in the last 6 hours
  const applicationsSnapshot = await db.collection("applications")
    .where("createdAt", ">=", sixHoursAgo)
    .get();

  const campaignCounts: Record<string, number> = {};

  for (const appDoc of applicationsSnapshot.docs) {
    const data = appDoc.data();
    if (data.campaignId) {
      campaignCounts[data.campaignId] = (campaignCounts[data.campaignId] || 0) + 1;
    }
  }

  for (const [campaignId, count] of Object.entries(campaignCounts)) {
    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    const campaignTitle = campaignDoc.exists ? campaignDoc.data()?.title || "알 수 없는 캠페인" : "알 수 없는 캠페인";

    const msg = `📋 [앤팅] ${campaignTitle}에 새 신청자 ${count}명`;
    await sendTelegramMessage(msg);
  }
});

// 3. 자정 캠페인 자동 마감 (매일 자정)
export const autoCampaignClose = onSchedule("0 0 * * *", async (event) => {
  const now = new Date();
  
  const campaignsSnapshot = await db.collection("campaigns")
    .where("status", "==", "recruiting")
    .where("deadline", "<=", now)
    .get();

  for (const campaignDoc of campaignsSnapshot.docs) {
    const campaignData = campaignDoc.data();
    
    await campaignDoc.ref.update({ status: "selection_pending" });
    
    const msg = `📋 [앤팅] ${campaignData.title || '캠페인'} 모집 마감. 선발을 시작하세요!`;
    await sendTelegramMessage(msg);
  }
});

// 4. 온보딩 넛지 발송 (매 2시간)
export const onboardingNudge = onSchedule("0 */2 * * *", async (event) => {
  const now = new Date();

  // 1) 브랜드 넛지: 가입 48h 초과 + 캠페인 없음
  const brandTargetDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
  const brandsSnap = await db.collection("users")
    .where("role", "==", "brand")
    .where("createdAt", "<=", brandTargetDate)
    .get();

  for (const userDoc of brandsSnap.docs) {
    const data = userDoc.data();
    if (data.sentNudge) continue;

    const campaignsSnap = await db.collection("campaigns")
      .where("brandId", "==", userDoc.id)
      .limit(1)
      .get();
      
    if (campaignsSnap.empty) {
      await sendEmailJSNudge("nudge_brand", data.email, "첫 캠페인을 등록해보세요!");
      await userDoc.ref.update({ sentNudge: true });
    }
  }

  // 2) 인플루언서 넛지: 가입 24h 초과 + 팔로워 0명
  const inf24TargetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const inf24Snap = await db.collection("users")
    .where("role", "==", "influencer")
    .where("createdAt", "<=", inf24TargetDate)
    .get();

  for (const userDoc of inf24Snap.docs) {
    const data = userDoc.data();
    if (data.sentNudge) continue;

    if (data.followerCount === 0) {
      await sendEmailJSNudge("nudge_influencer", data.email, "채널 연동만 하면 신청 가능해요!");
      await userDoc.ref.update({ sentNudge: true });
    } else {
      // 3) 인플루언서 넛지: 가입 48h 초과 + 지원내역 없음
      const createdAt = data.createdAt?.toDate?.() || new Date();
      if (now.getTime() - createdAt.getTime() > 48 * 60 * 60 * 1000) {
        const appsSnap = await db.collection("applications")
          .where("influencerId", "==", userDoc.id)
          .limit(1)
          .get();
          
        if (appsSnap.empty) {
          // 캠페인 추천 수량 계산을 위해 임의로 recruiting 캠페인 조회
          const recruitingSnap = await db.collection("campaigns")
            .where("status", "==", "recruiting")
            .get();
          const n = recruitingSnap.size;
          await sendEmailJSNudge("nudge_influencer", data.email, `조건에 맞는 캠페인 ${n}개가 기다리고 있어요!`);
          await userDoc.ref.update({ sentNudge: true });
        }
      }
    }
  }
});
