import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

export const setAdminRole = onCall(async (request) => {
  const { uid, secretKey } = request.data || {};
  
  // Retrieve config secret (defaults to "앤팅어드민2025" if not set via environment variable)
  const adminSecret = process.env.ADMIN_SECRET || "앤팅어드민2025";
  
  if (!uid || !secretKey) {
    throw new HttpsError("invalid-argument", "UID와 secretKey는 필수 입력 값입니다.");
  }
  
  if (secretKey !== adminSecret) {
    throw new HttpsError("permission-denied", "인증에 실패하였습니다. secretKey가 잘못되었습니다.");
  }
  
  try {
    // 1. Set Custom User Claims
    await getAuth().setCustomUserClaims(uid, { admin: true });
    
    // 2. Create admins/{uid} document in Firestore
    const db = getFirestore();
    await db.collection("admins").doc(uid).set({
      uid: uid,
      role: "admin",
      createdAt: new Date().toISOString()
    });
    
    return { success: true, message: `사용자 ${uid}에 어드민 권한이 성공적으로 부여되었습니다.` };
  } catch (error: any) {
    throw new HttpsError("internal", "어드민 권한 부여 중 오류가 발생했습니다: " + error.message);
  }
});

// Export notifications
export * from "./notifications/telegram";
export * from "./notifications/scheduler";

// Export points logic
export * from "./points";
