'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithEmail, getUserRole } from '@/lib/auth';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginWithEmail(email, password);
      const role = await getUserRole(user.uid);
      
      if (role === 'brand') {
        router.push('/brand/dashboard');
      } else if (role === 'influencer') {
        router.push('/influencer/dashboard');
      } else {
        router.push('/');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('로그인에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-olive-dark">로그인</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
            required
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-olive rounded-xl p-3 focus:ring-olive outline-none"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-olive text-white rounded-full h-12 mt-4 hover:bg-olive-light transition disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-olive-gray">
          계정이 없으신가요?{' '}
          <Link href="/register" className="text-olive font-bold hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
