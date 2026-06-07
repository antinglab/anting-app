'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_PASSWORD = 'anting2025admin'; // 나중에 환경변수로 이동

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('anting-admin', 'true');
      router.push('/admin/dashboard');
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#3D4A22',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '40px 36px',
        width: 360,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <h1 style={{
          color: '#6B7C3F',
          fontFamily: 'Georgia',
          fontSize: 28,
          marginBottom: 8,
          textAlign: 'center',
        }}>anting</h1>
        <p style={{ color: '#6B6B6B', textAlign: 'center', marginBottom: 32 }}>
          어드민 로그인
        </p>
        <input
          type="password"
          placeholder="어드민 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 12,
            border: '1.5px solid #6B7C3F',
            fontSize: 15,
            marginBottom: 12,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {error && (
          <p style={{ color: '#e53e3e', fontSize: 13, marginBottom: 8 }}>
            {error}
          </p>
        )}
        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '15px',
            background: '#6B7C3F',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          로그인
        </button>
      </div>
    </div>
  );
}
