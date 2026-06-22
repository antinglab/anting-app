import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { sendTelegramMessage } from "../utils/telegram";

interface AppUser {
  role?: string;
  name?: string;
  email?: string;
  referralCode?: string;
  referredBy?: string;
}

interface ReferralCode {
  code: string;
  influencerId: string;
  totalEarnings: number;
  totalOrders: number;
  referredUsers: number;
  createdAt: any;
}

interface Order {
  userId: string;
  totalAmount: number;
  status: string;
}

interface ReferralEarnings {
  id: string;
  orderId: string;
  influencerId: string;
  amount: number;
  buyerId: string;
  createdAt: any;
}


// 1. autoGenerateReferralCodeOnCreate
export const autoGenerateReferralCodeOnCreate = onDocumentCreated({ document: "users/{uid}", region: "asia-northeast3" }, async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const db = getFirestore();

  const userData = snapshot.data() as AppUser;
  if (userData.role !== 'influencer') return;

  const uid = event.params.uid;
  const name = userData.name || userData.email || "AT";
  
  // Extract initials
  let initials = (name.match(/[a-zA-Z]/g)?.join('').substring(0, 2) || "AT").toUpperCase();
  if (initials.length < 2) initials = "AT";

  let code = "";
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 5) {
    const randomNums = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
    code = `AT-${initials}-${randomNums}`;

    const codeDoc = await db.collection("referral_codes").doc(code).get();
    if (!codeDoc.exists) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    console.error(`Failed to generate a unique referral code for user ${uid} after 5 attempts.`);
    return;
  }

  const referralCodeData: Partial<ReferralCode> = {
    code,
    influencerId: uid,
    totalEarnings: 0,
    totalOrders: 0,
    referredUsers: 0,
    createdAt: FieldValue.serverTimestamp() as any
  };

  const batch = db.batch();
  batch.set(db.collection("referral_codes").doc(code), referralCodeData);
  batch.update(db.collection("users").doc(uid), { referralCode: code });

  await batch.commit();
});

// 2. trackReferralSignup
export const trackReferralSignup = onCall({ region: "us-central1" }, async (request) => {
  const { referredByCode, uid } = request.data || {};

  if (!referredByCode || !uid) {
    throw new HttpsError("invalid-argument", "referredByCode and uid are required.");
  }

  try {
    const db = getFirestore();
    await db.runTransaction(async (transaction) => {
      const codeRef = db.collection("referral_codes").doc(referredByCode);
      const codeDoc = await transaction.get(codeRef);

      if (!codeDoc.exists) {
        throw new HttpsError("not-found", "Invalid referral code.");
      }

      const codeData = codeDoc.data() as ReferralCode;
      const influencerId = codeData.influencerId;

      const userRef = db.collection("users").doc(uid);

      transaction.update(codeRef, { referredUsers: FieldValue.increment(1) });
      transaction.update(userRef, { referredBy: influencerId });
    });

    return { success: true };
  } catch (error: any) {
    throw new HttpsError("internal", error.message);
  }
});

// 3. processPayback
export const processPayback = onDocumentUpdated({ document: "orders/{orderId}", region: "asia-northeast3" }, async (event) => {
  const before = event.data?.before.data() as Order;
  const after = event.data?.after.data() as Order;

  if (!before || !after) return;
  if (before.status === 'completed' || after.status !== 'completed') return;

  const orderId = event.params.orderId;
  const userId = after.userId;
  const totalAmount = after.totalAmount;

  if (!userId || !totalAmount) return;

  try {
    const db = getFirestore();
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) return;

      const userData = userDoc.data() as AppUser;
      const influencerId = userData.referredBy;

      if (!influencerId) return;

      // 5% payback
      const paybackAmount = Math.floor(totalAmount * 0.05);

      const influencerRef = db.collection("users").doc(influencerId);
      const influencerDoc = await transaction.get(influencerRef);

      if (!influencerDoc.exists) return;

      const influencerData = influencerDoc.data() as AppUser;
      const referralCode = influencerData.referralCode;

      // Create earnings history
      const earningsRef = db.collection("referral_earnings").doc();
      const earningsData: Partial<ReferralEarnings> = {
        id: earningsRef.id,
        orderId,
        influencerId,
        amount: paybackAmount,
        buyerId: userId,
        createdAt: FieldValue.serverTimestamp() as any
      };

      transaction.set(earningsRef, earningsData);
      transaction.update(influencerRef, {
        paybackBalance: FieldValue.increment(paybackAmount)
      });

      if (referralCode) {
        const codeRef = db.collection("referral_codes").doc(referralCode);
        transaction.update(codeRef, {
          totalEarnings: FieldValue.increment(paybackAmount),
          totalOrders: FieldValue.increment(1)
        });
      }
    });

    // We send telegram outside the transaction so it doesn't fire multiple times if transaction retries
    const paybackAmount = Math.floor(totalAmount * 0.05);
    const msg = `💰 [앤팅] 페이백 ${paybackAmount.toLocaleString()}원 적립 완료! (주문번호: ${orderId})`;
    await sendTelegramMessage(msg);

  } catch (error) {
    console.error(`Failed to process payback for order ${orderId}:`, error);
  }
});
