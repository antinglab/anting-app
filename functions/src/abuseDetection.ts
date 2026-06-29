import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { sendTelegramMessage } from "./utils/telegram";

const db = getFirestore();

export const detectInfluencerAbuse = onSchedule({
  schedule: "0 2 * * *",
  timeZone: "Asia/Seoul",
  region: "asia-northeast3",
}, async (event) => {
  try {
    const influencersSnap = await db.collection("influencers").get();
    
    for (const doc of influencersSnap.docs) {
      const data = doc.data();
      const { followerCount, engagementRate, uid, nickname } = data;
      const influencerId = uid || doc.id;
      const name = nickname || "알 수 없는 인플루언서";

      let isSuspicious = false;
      let reason = "";

      // 조건 1: 허위 팔로워 탐지 (10000명 이상이면서 인게이지먼트 0.005 미만)
      if (followerCount >= 10000 && engagementRate < 0.005) {
        isSuspicious = true;
        reason = "허위 팔로워 의심 (팔로워 수 대비 인게이지먼트 저조)";
      }

      // 조건 2: 팔로워 1주 내 10% 급증 (이전 기록이 history 필드나 객체에 있다고 가정, 없으면 스킵)
      if (data.followerHistory && data.followerHistory.oneWeekAgo) {
        const lastWeek = data.followerHistory.oneWeekAgo;
        if (lastWeek > 0 && ((followerCount - lastWeek) / lastWeek) >= 0.1) {
          isSuspicious = true;
          reason = reason ? reason + ", 팔로워 단기 급증" : "팔로워 단기 급증";
        }
      }

      // 조건 3: Gemini 댓글 품질 분석
      // 댓글 목록 가져오기 (comments 컬렉션 가정)
      const commentsSnap = await db.collection("comments").where("influencerId", "==", influencerId).limit(20).get();
      const commentsText = commentsSnap.docs.map(c => c.data().text || c.data().content).filter(Boolean).join("\n");

      let spamRate = 0;
      let geminiSuspicious = false;

      if (commentsText) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash-lite",
          generationConfig: { responseMimeType: "application/json" },
        });

        const prompt = `아래 댓글 목록을 분석해서 스팸/어뷰징 여부를 판단하세요.
댓글: ${commentsText}
JSON: { "spam_rate": 0~100, "is_suspicious": true/false }`;

        try {
          const result = await model.generateContent(prompt);
          const responseText = result.response.text();
          const parsed = JSON.parse(responseText);
          spamRate = parsed.spam_rate || 0;
          geminiSuspicious = parsed.is_suspicious || false;

          if (geminiSuspicious) {
            isSuspicious = true;
            reason = reason ? reason + ", 댓글 스팸/어뷰징 의심" : "댓글 스팸/어뷰징 의심";
          }
        } catch (error) {
          console.error(`[${influencerId}] Gemini 분석 실패:`, error);
        }
      }

      // 의심 플래그 처리
      if (isSuspicious) {
        await db.collection("influencers").doc(influencerId).update({
          abuseFlag: true,
          abuseReason: reason,
          spamRate: spamRate,
          abuseDetectedAt: FieldValue.serverTimestamp()
        });

        await sendTelegramMessage(`⚠️ 어뷰징 의심: ${name}\n사유: ${reason}\n스팸률: ${spamRate}%`);
      }
    }
    console.log("어뷰징 인플루언서 탐지 완료");
  } catch (error) {
    console.error("detectInfluencerAbuse 실패:", error);
  }
});

export const detectFraudOrder = onDocumentCreated({
  document: "orders/{orderId}",
  region: "asia-northeast3"
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const orderId = event.params.orderId;
  const data = snapshot.data();
  const { ip, referralCode, userId, createdAt } = data;

  if (!ip || !userId) return;

  let isFraud = false;
  let reason = "";

  // 조건 1: 동일 IP + 동일 코드 + 24h 내 3회 이상
  if (referralCode) {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentOrdersSnap = await db.collection("orders")
      .where("ip", "==", ip)
      .where("referralCode", "==", referralCode)
      .where("createdAt", ">=", yesterday)
      .get();
    
    if (recentOrdersSnap.size >= 3) {
      isFraud = true;
      reason = "동일 IP 및 동일 추천코드 다중 사용";
    }
  }

  // 조건 2: 가입 후 1분 내 코드 사용 구매
  const userDoc = await db.collection("users").doc(userId).get();
  if (userDoc.exists) {
    const userCreatedAt = userDoc.data()?.createdAt?.toDate() || new Date();
    const orderCreatedAt = createdAt?.toDate() || new Date();
    const diffMs = orderCreatedAt.getTime() - userCreatedAt.getTime();
    
    if (referralCode && diffMs >= 0 && diffMs <= 60 * 1000) {
      isFraud = true;
      reason = reason ? reason + ", 가입 직후 구매" : "가입 직후 추천코드 구매";
    }
  }

  if (isFraud) {
    await db.collection("orders").doc(orderId).update({
      status: "fraud_review",
      fraudReason: reason,
      fraudDetectedAt: FieldValue.serverTimestamp()
    });

    await sendTelegramMessage(`🚨 이상 주문 감지!\n주문번호: ${orderId}\n사유: ${reason}`);
  }
});
