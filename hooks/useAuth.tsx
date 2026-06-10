'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getUserRole } from '@/lib/auth';
import { UserRole } from '@/types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  role: null,
  loading: true,
});

import { useFCM } from './useFCM';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
  });

  useFCM(state.user?.uid || null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // 유저 롤 가져오기
        try {
          const role = await getUserRole(firebaseUser.uid);
          setState({ user: firebaseUser, role, loading: false });
          
          // Next.js middleware와 통신하기 위해 쿠키에 토큰 및 역할 저장
          const token = await firebaseUser.getIdToken();
          document.cookie = `firebaseToken=${token}; path=/`;
          if (role) {
            document.cookie = `userRole=${role}; path=/`;
          } else {
            document.cookie = `userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
          }
        } catch (error) {
          console.error("Failed to fetch user role", error);
          setState({ user: firebaseUser, role: null, loading: false });
        }
      } else {
        setState({ user: null, role: null, loading: false });
        document.cookie = `firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        document.cookie = `userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
