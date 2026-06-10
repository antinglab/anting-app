import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { sendTelegramMessage } from "./utils/telegram";

const db = getFirestore();

export const onApplicationApproved = onDocumentUpdated("applications/{applicationId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  if (before.status !== "approved" && after.status === "approved") {
    const campaignId = after.campaignId;
    const influencerId = after.influencerId;

    const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
    if (!campaignDoc.exists) return;

    const campaignData = campaignDoc.data();
    // Use pointReward if exists, otherwise fallback to parsing benefit or default 10000
    let amount = campaignData?.pointReward;
    if (typeof amount !== 'number') {
      const benefitStr = campaignData?.benefit || "";
      const parsed = parseInt(benefitStr.replace(/[^0-9]/g, ''));
      amount = isNaN(parsed) || parsed === 0 ? 10000 : parsed;
    }

    const pointsRef = db.collection("points").doc(influencerId);
    
    await db.runTransaction(async (transaction) => {
      const pointsDoc = await transaction.get(pointsRef);
      let currentBalance = 0;
      if (pointsDoc.exists) {
        currentBalance = pointsDoc.data()?.balance || 0;
      }
      
      const newBalance = currentBalance + amount;
      
      transaction.set(pointsRef, { balance: newBalance }, { merge: true });
      
      const historyRef = pointsRef.collection("history").doc();
      transaction.set(historyRef, {
        id: historyRef.id,
        uid: influencerId,
        type: 'earn',
        amount: amount,
        balance: newBalance,
        description: `${campaignData?.title || '캠페인'} 포인트 적립`,
        campaignId: campaignId,
        createdAt: FieldValue.serverTimestamp()
      });
    });

    const userDoc = await db.collection("users").doc(influencerId).get();
    const userName = userDoc.exists ? userDoc.data()?.name || userDoc.data()?.nickname || "인플루언서" : "인플루언서";

    // Send Telegram
    const msg = `🎉 [앤팅 포인트] ${userName}님에게 ${amount.toLocaleString()}P 적립되었습니다! (${campaignData?.title || '캠페인'})`;
    await sendTelegramMessage(msg);

    // Send FCM if token exists
    const fcmToken = userDoc.data()?.fcmToken;
    if (fcmToken) {
      try {
        await getMessaging().send({
          token: fcmToken,
          notification: {
            title: "포인트 적립 완료",
            body: `${amount.toLocaleString()}P가 적립되었습니다.`
          }
        });
      } catch (err) {
        console.error("FCM 전송 실패:", err);
      }
    }
  }
});

import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onWithdrawRequestCreated = onDocumentCreated("withdraw_requests/{requestId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const { uid, amount, bankName, accountHolder } = data;
  
  const userDoc = await db.collection("users").doc(uid).get();
  const userName = userDoc.exists ? userDoc.data()?.name || userDoc.data()?.nickname || "인플루언서" : "인플루언서";

  const msg = `💸 [앤팅 출금요청]
- 이름: ${userName}
- 금액: ${amount.toLocaleString()}P
- 계좌: ${bankName} (${accountHolder})`;
  
  await sendTelegramMessage(msg);
});
