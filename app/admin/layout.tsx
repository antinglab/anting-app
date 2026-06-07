'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('anting-admin');
    const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login/';
    if (!isAdmin && !isLoginPage) {
      router.push('/admin/login/');
    } else {
      setChecked(true);
    }
  }, [pathname, router]);

  if (!checked) return null;
  return <>{children}</>;
}
