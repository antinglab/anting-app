import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const checkFreeLimitOnCampaignCreate = onDocumentCreated("campaigns/{campaignId}", async (event) => {
  const campaign = event.data?.data();
  if (!campaign) return;
  
  const brandId = campaign.brandId;
  if (!brandId) return;

  const db = getFirestore();
  const brandRef = db.collection("users").doc(brandId);
  const brandDoc = await brandRef.get();
  
  if (!brandDoc.exists) return;
  
  const brandData = brandDoc.data();
  const plan = brandData?.plan || "Free";
  
  if (plan === "Free") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const campaignsSnapshot = await db.collection("campaigns")
      .where("brandId", "==", brandId)
      .where("createdAt", ">=", startOfMonth)
      .get();
    
    if (campaignsSnapshot.size > 1) {
      await db.collection("notifications").add({
        userId: brandId,
        title: "Pro 플랜 업그레이드 안내",
        message: "Free 플랜의 월 1회 캠페인 생성 한도를 초과했습니다. Pro 플랜으로 업그레이드하여 더 많은 혜택을 누리세요!",
        type: "upsell",
        createdAt: FieldValue.serverTimestamp(),
        read: false
      });
    }
  }
});

export const checkCampaignCompletionUpsell = onDocumentUpdated("campaigns/{campaignId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after) return;
  
  if (before.status !== "completed" && after.status === "completed") {
    const brandId = after.brandId;
    if (!brandId) return;

    const db = getFirestore();
    const brandRef = db.collection("users").doc(brandId);
    
    const completedSnapshot = await db.collection("campaigns")
      .where("brandId", "==", brandId)
      .where("status", "==", "completed")
      .get();
      
    if (completedSnapshot.size === 3) {
      const brandDoc = await brandRef.get();
      const plan = brandDoc.data()?.plan || "Free";
      
      if (plan !== "Business") {
        await db.collection("notifications").add({
          userId: brandId,
          title: "Business 플랜 할인 안내",
          message: "축하합니다! 3개의 캠페인을 성공적으로 완료하셨습니다. 무제한 캠페인 생성이 가능한 Business 플랜 특별 할인 혜택을 확인해보세요.",
          type: "upsell",
          createdAt: FieldValue.serverTimestamp(),
          read: false
        });
      }
    }
  }
});
