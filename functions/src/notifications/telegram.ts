import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

import { sendTelegramMessage } from "../utils/telegram";

export const onApplicationUpdated = onDocumentUpdated("applications/{applicationId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  const campaignId = after.campaignId;
  const influencerId = after.influencerId;

  // Fetch related data
  const [campaignDoc, userDoc] = await Promise.all([
    db.collection("campaigns").doc(campaignId).get(),
    db.collection("users").doc(influencerId).get()
  ]);

  const campaignTitle = campaignDoc.exists ? campaignDoc.data()?.title || "알 수 없는 캠페인" : "알 수 없는 캠페인";
  const productName = campaignDoc.exists ? campaignDoc.data()?.productName || "상품" : "상품";
  const benefit = campaignDoc.exists ? campaignDoc.data()?.benefit || "포인트" : "포인트";
  
  const userName = userDoc.exists ? userDoc.data()?.name || userDoc.data()?.nickname || "인플루언서" : "인플루언서";

  // 1. applications.status → 'selected'
  if (before.status !== "selected" && after.status === "selected") {
    const msg = `✅ [앤팅] ${userName}님이 ${campaignTitle}에 선발됐습니다.`;
    await sendTelegramMessage(msg);
  }

  // 2. applications.trackingNumber 입력
  if (!before.trackingNumber && after.trackingNumber) {
    const msg = `📦 [앤팅] ${productName} 발송완료. 운송장: ${after.trackingNumber}`;
    await sendTelegramMessage(msg);
  }

  // 3. applications.status → 'approved'
  if (before.status !== "approved" && after.status === "approved") {
    // 포인트 부분을 benefit이나 '포인트'로 대체
    const msg = `🎊 [앤팅] 콘텐츠 승인! ${benefit}P 적립됐습니다. (인플루언서: ${userName})`;
    await sendTelegramMessage(msg);
  }
});
