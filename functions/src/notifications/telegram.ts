import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore } from "firebase-admin/firestore";



import { sendTelegramMessage } from "../utils/telegram";
import { onRequest } from "firebase-functions/v2/https";

export const handleTelegramCommand = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const update = req.body;
  if (!update || !update.message || !update.message.text) {
    res.status(200).send("OK");
    return;
  }


  const text = update.message.text.trim();
  const db = getFirestore();

  try {
    if (text.startsWith("/stats")) {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const snapUsers = await db.collection("crew_members").get();
      const todayUsers = snapUsers.docs.filter(d => {
        const cDate = d.data().createdAt?.toDate?.();
        return cDate && cDate >= today;
      }).length;

      const snapCamps = await db.collection("campaigns").get();
      const activeCamps = snapCamps.docs.filter(d => ["recruiting", "delivering"].includes(d.data().status)).length;

      const snapWithdraws = await db.collection("withdraw_requests").where("status", "==", "pending").get();
      const pendingWithdraws = snapWithdraws.size;

      const reply = `📊 [오늘의 통계]\n- 오늘 가입자: ${todayUsers}명\n- 활성 캠페인: ${activeCamps}개\n- 출금 대기: ${pendingWithdraws}건`;
      await sendTelegramMessage(reply);

    } else if (text.startsWith("/crew")) {
      const snapUsers = await db.collection("crew_members")
        .orderBy("createdAt", "desc").limit(5).get();
      
      const lines = snapUsers.docs.map(d => {
        const u = d.data();
        const t = u.userType === "brand" ? "브랜드" : "인플루언서";
        return `- ${u.name || u.nickname} (${t})`;
      });
      const reply = `👥 [최신 가입자 5명]\n${lines.join("\\n")}`;
      await sendTelegramMessage(reply);

    } else if (text.startsWith("/pending")) {
      const snapWithdraws = await db.collection("withdraw_requests")
        .where("status", "==", "pending").orderBy("createdAt", "desc").limit(10).get();
      
      if (snapWithdraws.empty) {
        await sendTelegramMessage(`💸 [출금 대기 목록]\n현재 대기 중인 출금 요청이 없습니다.`);
      } else {
        const lines = snapWithdraws.docs.map(d => {
          const w = d.data();
          return `- ${w.uid}: ${w.amount?.toLocaleString()}P`;
        });
        const reply = `💸 [출금 대기 목록 (최대 10건)]\n${lines.join("\\n")}`;
        await sendTelegramMessage(reply);
      }
    }
    
    res.status(200).send("OK");
  } catch (error) {
    console.error("Telegram Webhook Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

export const onApplicationUpdated = onDocumentUpdated("applications/{applicationId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  const campaignId = after.campaignId;
  const influencerId = after.influencerId;

  const db = getFirestore();
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
