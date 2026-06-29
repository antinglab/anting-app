import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { sendTelegramMessage } from "./utils/telegram";

const db = getFirestore();

// 포인트를 적립하는 공통 헬퍼
async function addPoints(uid: string, amount: number, description: string) {
  const pointsRef = db.collection("points").doc(uid);
  
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
      uid,
      type: 'earn',
      amount,
      balance: newBalance,
      description,
      createdAt: FieldValue.serverTimestamp()
    });
  });

  const userDoc = await db.collection("users").doc(uid).get();
  const userName = userDoc.exists ? userDoc.data()?.name || userDoc.data()?.nickname || "인플루언서" : "인플루언서";
  
  const msg = `🎉 [앤팅 미션] ${userName}님, '${description}' 미션 달성으로 ${amount}P가 적립되었습니다!`;
  await sendTelegramMessage(msg);

  const fcmToken = userDoc.data()?.fcmToken;
  if (fcmToken) {
    try {
      await getMessaging().send({
        token: fcmToken,
        notification: {
          title: "미션 달성 포인트 적립",
          body: `${description} 미션 완료로 ${amount}P 적립!`
        }
      });
    } catch (err) {}
  }
}

export const checkMissions = onCall({ region: "asia-northeast3" }, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError("unauthenticated", "인증이 필요합니다.");
  
  const uid = auth.uid;
  const action = data.action; // 'login', 'apply_campaign', 'share_code', 'submit_content', 'write_review', 'check_badges'

  const todayStr = new Date().toISOString().slice(0, 10);
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  const weekStr = `${d.getUTCFullYear()}-W${weekNo}`;

  const missionLogRef = db.collection("users").doc(uid).collection("mission_logs");
  let pointsToGive = 0;
  let missionName = "";

  if (action === "login") {
    const docId = `login_${todayStr}`;
    const docRef = missionLogRef.doc(docId);
    if (!(await docRef.get()).exists) {
      await docRef.set({ action: "login", date: todayStr, createdAt: FieldValue.serverTimestamp() });
      pointsToGive = 10;
      missionName = "일일 로그인";
    }
  } else if (action === "apply_campaign") {
    const docId = `apply_${todayStr}`;
    const docRef = missionLogRef.doc(docId);
    if (!(await docRef.get()).exists) {
      await docRef.set({ action: "apply_campaign", date: todayStr, createdAt: FieldValue.serverTimestamp() });
      pointsToGive = 20;
      missionName = "캠페인 신청";
    }
  } else if (action === "share_code") {
    const docId = `share_${todayStr}`;
    const docRef = missionLogRef.doc(docId);
    if (!(await docRef.get()).exists) {
      await docRef.set({ action: "share_code", date: todayStr, createdAt: FieldValue.serverTimestamp() });
      pointsToGive = 30;
      missionName = "내 코드 공유";
    }
  } else if (action === "submit_content") {
    const docId = `submit_${weekStr}`;
    const docRef = missionLogRef.doc(docId);
    if (!(await docRef.get()).exists) {
      await docRef.set({ action: "submit_content", week: weekStr, createdAt: FieldValue.serverTimestamp() });
      pointsToGive = 50;
      missionName = "콘텐츠 제출 완료 (주간)";
    }
  } else if (action === "write_review") {
    const docId = `review_${weekStr}`;
    const docRef = missionLogRef.doc(docId);
    if (!(await docRef.get()).exists) {
      await docRef.set({ action: "write_review", week: weekStr, createdAt: FieldValue.serverTimestamp() });
      pointsToGive = 30;
      missionName = "리뷰 작성 (주간)";
    }
  }

  if (pointsToGive > 0) {
    await addPoints(uid, pointsToGive, missionName);
  }

  const userDoc = await db.collection("users").doc(uid).get();
  const userData = userDoc.data() || {};
  const completedCount = userData.campaignCompleteCount || 0;
  const hasPayback = userData.hasFirstPayback || false;
  
  let newBadges: string[] = [];
  const currentBadges = userData.badges || [];

  if (completedCount >= 1 && !currentBadges.includes("Bronze")) newBadges.push("Bronze");
  if (completedCount >= 10 && !currentBadges.includes("Silver")) newBadges.push("Silver");
  if (hasPayback && !currentBadges.includes("Code Master")) newBadges.push("Code Master");
  if (completedCount >= 30 && !currentBadges.includes("Gold")) newBadges.push("Gold");

  if (newBadges.length > 0) {
    const updatedBadges = [...currentBadges, ...newBadges];
    await db.collection("users").doc(uid).update({ badges: updatedBadges });
    for (const badge of newBadges) {
      await sendTelegramMessage(`🏆 [업적 달성] ${userData.name || '인플루언서'}님이 '${badge}' 배지를 획득했습니다!`);
    }
    return { success: true, pointsAwarded: pointsToGive, newBadges };
  }

  return { success: true, pointsAwarded: pointsToGive, newBadges: [] };
});
