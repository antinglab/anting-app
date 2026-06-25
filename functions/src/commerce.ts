import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * 1. 트래킹 클릭 이벤트 기록 (HTTP Callable)
 * 프론트엔드에서 ?ref=CODE 로 접근 시 호출.
 */
export const trackProductClick = onCall({ region: "asia-northeast3" }, async (request) => {
  const { code, productId } = request.data;
  if (!code || !productId) {
    throw new HttpsError('invalid-argument', 'Missing code or productId');
  }

  const db = getFirestore();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // referral_clicks/{date}/clicks/{code} 형식으로 기록
  const clickRef = db.collection('referral_clicks').doc(today).collection('clicks').doc(code);
  
  try {
    await clickRef.set({
      code,
      productId,
      clickCount: FieldValue.increment(1),
      lastClickedAt: FieldValue.serverTimestamp()
    }, { merge: true });
    
    return { success: true };
  } catch (err) {
    console.error('trackProductClick error:', err);
    throw new HttpsError('internal', 'Failed to track click');
  }
});

/**
 * 2. 리뷰 수집 (주문 완료 D+14) (Scheduler)
 * EmailJS 등으로 이메일을 발송하는 목업 로직 포함.
 */
export const sendReviewRequests = onSchedule({
  schedule: "0 9 * * *", // 매일 오전 9시
  timeZone: "Asia/Seoul",
  region: "asia-northeast3",
}, async (event) => {
  const db = getFirestore();
  
  // 기준 시간: 14일 전
  const dMinus14Start = new Date();
  dMinus14Start.setDate(dMinus14Start.getDate() - 14);
  dMinus14Start.setHours(0, 0, 0, 0);

  const dMinus14End = new Date(dMinus14Start);
  dMinus14End.setHours(23, 59, 59, 999);

  try {
    // orders 컬렉션이 없지만, 있다면 이렇게 조회
    const ordersSnap = await db.collection('orders')
      .where('status', '==', 'completed')
      .where('createdAt', '>=', dMinus14Start)
      .where('createdAt', '<=', dMinus14End)
      .get();

    console.log(`[sendReviewRequests] Found ${ordersSnap.size} orders completed 14 days ago.`);

    for (const doc of ordersSnap.docs) {
      const order = doc.data();
      // EmailJS 연동이 없으므로 Mock으로 로깅만 남김
      console.log(`[Email Mock] 리뷰 요청 메일 발송 - 대상: ${order.userId}, 상품: ${order.sellerId}`);
      
      // 발송 기록 플래그 등 업데이트 (옵션)
      // await doc.ref.update({ reviewRequestSent: true });
    }
  } catch (error) {
    console.error('Error sending review requests:', error);
  }
});
