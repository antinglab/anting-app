import { auth } from "./firebase";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";

export interface AdminLoginForm {
  email: string;
  password: string;
}

/**
 * Log in as admin and verify if user has admin claim.
 * Throws an error if not an admin.
 */
export async function signInAsAdmin({ email, password }: AdminLoginForm): Promise<User> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Force refresh token to get the latest custom claims
    const tokenResult = await user.getIdTokenResult(true);
    
    if (tokenResult.claims.admin !== true) {
      await signOut(auth);
      throw new Error("어드민 권한이 없습니다.");
    }
    
    return user;
  } catch (error) {
    console.error("Admin sign-in failed:", error);
    throw error;
  }
}
