import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { sendTelegramMessage } from "./utils/telegram";

export const onCampaignUpdated = onDocumentUpdated("campaigns/{campaignId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // 모집 중인 캠페인의 지원자 수가 증가하여 모집 인원을 달성한 경우 즉시 마감
  if (
    after.status === "recruiting" &&
    after.currentApplicants !== before.currentApplicants &&
    after.currentApplicants >= after.recruitCount
  ) {
    const campaignRef = event.data?.after.ref;
    if (campaignRef) {
      await campaignRef.update({ status: "selection_pending" });
      
      const msg = `📋 [앤팅] ${after.title || '캠페인'} 모집 마감. 선발을 시작하세요!`;
      await sendTelegramMessage(msg);
    }
  }
});
