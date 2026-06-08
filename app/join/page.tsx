import { Suspense } from 'react';
import JoinForm from '@/components/JoinForm';

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-neutral p-4 flex flex-col items-center">
      <div style={{
        background: '#D4DBA8',
        padding: '12px 20px',
        borderRadius: 12,
        marginBottom: 16,
        fontSize: 13,
        color: '#3D4A22',
        textAlign: 'center',
        width: '100%',
        maxWidth: '28rem', // max-w-md
      }}>
        정식 회원가입은 <a href="/register" style={{ color: '#6B7C3F', fontWeight: 700 }}>여기</a>에서 진행해주세요.
      </div>
      <Suspense fallback={<div>로딩 중...</div>}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
