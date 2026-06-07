import { Suspense } from 'react';
import JoinForm from '@/components/JoinForm';

export default function JoinPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <JoinForm />
    </Suspense>
  );
}
