import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

// 이메일 발송 헬퍼 (EmailJS REST API 사용)
async function sendReactivationEmail(brandEmail: string, brandName: string, type: '30days' | '60days') {
  const serviceId = process.env.EMAILJS_SERVICE_ID || "default_service";
  const templateId = type === '30days' ? "template_30days" : "template_60days";
  const userId = process.env.EMAILJS_USER_ID || "default_user";

  const templateParams = type === '30days' 
    ? { 
        to_email: brandEmail, 
        brand_name: brandName, 
        subject: `${brandName}, 새로운 인플루언서들이 기다리고 있어요` 
      }
    : { 
        to_email: brandEmail, 
        brand_name: brandName, 
        subject: `복귀 혜택: 다음 캠페인 수수료 20% 할인`,
        discount_code: `WELCOMEBACK20_${Date.now()}`
      };

  const data = {
    service_id: serviceId,
    template_id: templateId,
    user_id: userId,
    template_params: templateParams
  };

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(`EmailJS 발송 실패 (${type}):`, await response.text());
    } else {
      console.log(`EmailJS 발송 성공 (${type}) to ${brandEmail}`);
    }
  } catch (error) {
    console.error(`EmailJS API 에러 (${type}):`, error);
  }
}

export const checkBrandRetention = onSchedule({
  schedule: "0 9 * * *", // 매일 오전 9시
  timeZone: "Asia/Seoul",
  region: "asia-northeast3",
}, async (event) => {
  try {
    // brand 유저 목록 조회
    const brandsSnap = await db.collection("users").where("userType", "==", "brand").get();
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;

    for (const doc of brandsSnap.docs) {
      const brand = doc.data();
      const lastCampaignTime = brand.lastCampaignCreatedAt?.toDate()?.getTime();
      
      if (!lastCampaignTime) continue; // 캠페인을 등록한 적 없는 경우 스킵

      const diffDays = Math.floor((now - lastCampaignTime) / msPerDay);
      
      if (diffDays === 30) {
        await sendReactivationEmail(brand.email, brand.name || "브랜드", "30days");
      } else if (diffDays === 60) {
        await sendReactivationEmail(brand.email, brand.name || "브랜드", "60days");
      } else if (diffDays === 90) {
        // 어드민 수동 연락 큐에 추가
        await db.collection("admin_contact_queue").add({
          brandId: doc.id,
          brandName: brand.name,
          brandEmail: brand.email,
          reason: "90일 미접속/캠페인 미등록",
          createdAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error("checkBrandRetention 실패:", error);
  }
});
