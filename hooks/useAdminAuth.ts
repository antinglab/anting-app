"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult();
          if (tokenResult.claims.admin === true) {
            setUser(currentUser);
            setLoading(false);
            if (pathname === "/admin/login") {
              router.push("/admin/dashboard");
            }
          } else {
            // Logged in but not an admin
            await signOut(auth);
            setUser(null);
            setLoading(false);
            if (pathname !== "/admin/login") {
              router.push("/admin/login");
            }
          }
        } catch (error) {
          console.error("Error verifying admin token claims:", error);
          await signOut(auth);
          setUser(null);
          setLoading(false);
          if (pathname !== "/admin/login") {
            router.push("/admin/login");
          }
        }
      } else {
        setUser(null);
        setLoading(false);
        if (pathname !== "/admin/login") {
          router.push("/admin/login");
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  return { user, loading };
}
