import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AppUser, UserRole } from '@/types';

// 공통 타입: 로그인/가입용
export interface RegisterData {
  email: string;
  password?: string;
  name: string;
  phone: string;
  role: UserRole;
  // 브랜드 추가 정보
  companyName?: string;
  businessNumber?: string;
  categories?: string[];
  // 인플루언서 추가 정보
  nickname?: string;
  instagramHandle?: string;
  followerCount?: number;
  region?: string;
  // 진단 결과 연동
  diagnosisResult?: string;
}

export const registerWithEmail = async (data: RegisterData) => {
  if (!data.password) throw new Error('Password is required');
  
  // 1. Firebase Auth 계정 생성
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = userCredential.user;

  // 2. Base User 데이터 준비
  const baseUserData = {
    uid: user.uid,
    email: data.email,
    name: data.name,
    phone: data.phone,
    role: data.role,
    profileComplete: true,
    diagnosisResult: data.diagnosisResult || null,
    createdAt: serverTimestamp(),
  };

  // 3. users 컬렉션에 기본 정보 저장
  await setDoc(doc(db, 'users', user.uid), baseUserData);

  // 4. 역할별 추가 컬렉션 저장
  if (data.role === 'brand') {
    const brandData = {
      ...baseUserData,
      companyName: data.companyName || '',
      businessNumber: data.businessNumber || '',
      categories: data.categories || [],
    };
    await setDoc(doc(db, 'brands', user.uid), brandData);
  } else if (data.role === 'influencer') {
    const influencerData = {
      ...baseUserData,
      nickname: data.nickname || '',
      channels: {
        instagram: data.instagramHandle ? { handle: data.instagramHandle, followerCount: data.followerCount || 0 } : undefined,
      },
      followerCount: data.followerCount || 0,
      region: data.region || '',
      categories: data.categories || [],
      qualityScore: 0,
      tier: 'Bronze',
      totalEarnings: 0,
    };
    await setDoc(doc(db, 'influencers', user.uid), influencerData);
  }

  return user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export const getUserRole = async (uid: string): Promise<UserRole | null> => {
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    const data = userDoc.data() as AppUser;
    return data.role;
  }
  return null;
};
