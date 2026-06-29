import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendTelegramMessage } from "./utils/telegram";

const db = getFirestore();

export const onReferralComplete = onDocumentUpdated("applications/{appId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // 상태가 completed로 변경된 경우
  if (before.status !== "completed" && after.status === "completed") {
    const influencerId = after.influencerId;
    
    // 해당 인플루언서의 완료된 캠페인 수 확인 (1개일 때만 보상)
    const appsSnap = await db.collection("applications")
      .where("influencerId", "==", influencerId)
      .where("status", "==", "completed")
      .get();
    
    // 본 이벤트로 인해 방금 완료된 것 1개인지 확인 (비동기 특성상 1개인 경우 첫 완료로 간주)
    if (appsSnap.size === 1) {
      const userDoc = await db.collection("users").doc(influencerId).get();
      if (!userDoc.exists) return;
      
      const userData = userDoc.data() || {};
      const referrerId = userData.referredBy;
      
      if (referrerId) {
        // 추천인에게 5000P 지급
        const pointsRef = db.collection("points").doc(referrerId);
        
        await db.runTransaction(async (transaction) => {
          const pointsDoc = await transaction.get(pointsRef);
          let currentBalance = 0;
          if (pointsDoc.exists) {
            currentBalance = pointsDoc.data()?.balance || 0;
          }
          const newBalance = currentBalance + 5000;
          transaction.set(pointsRef, { balance: newBalance }, { merge: true });
          
          const historyRef = pointsRef.collection("history").doc();
          transaction.set(historyRef, {
            id: historyRef.id,
            uid: referrerId,
            type: 'earn',
            amount: 5000,
            balance: newBalance,
            description: `추천인 첫 캠페인 완료 보상 (${userData.name || '친구'})`,
            createdAt: FieldValue.serverTimestamp()
          });
        });

        // 추천인 이름 가져와서 알림 발송
        const referrerDoc = await db.collection("users").doc(referrerId).get();
        const referrerName = referrerDoc.data()?.name || "추천인";
        await sendTelegramMessage(`🎁 [추천인 보상] ${referrerName}님에게 친구(${userData.name}) 캠페인 완료 보상 5,000P 적립!`);
      }
    }
  }
});
