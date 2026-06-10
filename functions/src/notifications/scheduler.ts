import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { sendTelegramMessage } from "../utils/telegram";

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
